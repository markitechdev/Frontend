/**
 * Small fetch-based HTTP client with the parts of the axios API this app uses:
 *   instance.get/delete(url, config) · post/put/patch(url, data, config) · request(config)
 *   interceptors.request.use(fn) · interceptors.response.use(onOk, onError)
 *   baseURL · default headers · timeout · query `params`
 * Responses look like axios responses ({ data, status, headers, config }) and
 * errors carry `response`, `config` and `code` ('ECONNABORTED' on timeout), so
 * the rest of the app works unchanged. It replaces axios (~50 KiB) to keep the
 * first download small.
 */

const buildUrl = (baseURL, url, params) => {
  let full = /^https?:\/\//i.test(url) ? url : `${baseURL || ''}${url.startsWith('/') ? '' : '/'}${url}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
      else qs.append(key, value);
    }
    const query = qs.toString();
    if (query) full += (full.includes('?') ? '&' : '?') + query;
  }
  return full;
};

const send = async (config) => {
  const controller = new AbortController();
  const timer = config.timeout ? setTimeout(() => controller.abort(), config.timeout) : null;
  const headers = { ...config.headers };
  const hasBody = config.data !== undefined && config.data !== null;
  const body = hasBody ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : undefined;
  // Like axios: no Content-Type without a body (avoids needless CORS preflights).
  if (!hasBody) Object.keys(headers).forEach((k) => { if (k.toLowerCase() === 'content-type') delete headers[k]; });

  let res;
  try {
    res = await fetch(buildUrl(config.baseURL, config.url, config.params), {
      method: config.method,
      headers,
      body,
      signal: controller.signal,
    });
  } catch {
    const timedOut = controller.signal.aborted;
    const err = new Error(timedOut ? `timeout of ${config.timeout}ms exceeded` : 'Network Error');
    err.code = timedOut ? 'ECONNABORTED' : 'ERR_NETWORK';
    err.config = config;
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }

  const text = await res.text();
  let data = text;
  if (text && /json/i.test(res.headers.get('content-type') || '')) {
    try { data = JSON.parse(text); } catch { /* keep the raw text */ }
  }
  const response = { data, status: res.status, statusText: res.statusText, headers: res.headers, config };
  if (!res.ok) {
    const err = new Error(`Request failed with status code ${res.status}`);
    err.code = 'ERR_BAD_RESPONSE';
    err.response = response;
    err.config = config;
    throw err;
  }
  return response;
};

export const createHttp = ({ baseURL = '', headers = {}, timeout = 0 } = {}) => {
  const requestHooks = [];
  const responseHooks = [];

  const request = async (cfg = {}) => {
    let config = {
      baseURL,
      timeout,
      ...cfg,
      method: String(cfg.method || 'get').toUpperCase(),
      headers: { ...headers, ...(cfg.headers || {}) },
    };
    for (const hook of requestHooks) config = (await hook(config)) || config;
    let result = send(config);
    for (const [onOk, onError] of responseHooks) result = result.then(onOk || ((r) => r), onError);
    return result;
  };

  return {
    request,
    get: (url, cfg = {}) => request({ ...cfg, url, method: 'get' }),
    delete: (url, cfg = {}) => request({ ...cfg, url, method: 'delete' }),
    post: (url, data, cfg = {}) => request({ ...cfg, url, data, method: 'post' }),
    put: (url, data, cfg = {}) => request({ ...cfg, url, data, method: 'put' }),
    patch: (url, data, cfg = {}) => request({ ...cfg, url, data, method: 'patch' }),
    interceptors: {
      request: { use: (fn) => { requestHooks.push(fn); } },
      response: { use: (onOk, onError) => { responseHooks.push([onOk, onError]); } },
    },
  };
};
