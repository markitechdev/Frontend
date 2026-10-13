import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';

/**
 * Reads `path` -> lazy view file pairs from the router, e.g.
 *   { path: '/inventory/:id', ... component: () => import('@/views/inventory/ProductDetailView.vue') }
 */
function readRoutes() {
  const src = fs.readFileSync(fileURLToPath(new URL('./src/router/index.js', import.meta.url)), 'utf8');
  const table = src.slice(0, src.indexOf('createRouter('));
  const re = /path:\s*'([^']+)'(?:(?!path:)[\s\S])*?component:\s*\(\)\s*=>\s*import\('@\/([^']+)'\)/g;
  const routes = [];
  for (const m of table.matchAll(re)) {
    if (m[1].includes('(')) continue; // catch-all
    const pattern = '^' + m[1].split('/').map((seg) => (seg.startsWith(':') ? '[^/]+' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('/') + '/?$';
    routes.push({ pattern, file: m[2] });
  }
  return routes;
}

/** All files a chunk needs: itself, its static imports and their CSS (excluding the entry, already loading). */
function chunkFiles(bundle, chunk, seen = new Set()) {
  if (!chunk || chunk.isEntry || seen.has(chunk.fileName)) return [];
  seen.add(chunk.fileName);
  const files = [chunk.fileName, ...(chunk.viteMetadata?.importedCss || [])];
  for (const imp of chunk.imports || []) files.push(...chunkFiles(bundle, bundle[imp], seen));
  return files;
}

/**
 * Production-only tweaks to index.html for a faster first paint:
 *  1. the main stylesheet is inlined, so no request blocks rendering
 *  2. the Latin Inter font file is preloaded, so text doesn't swap fonts late
 *  3. the browser opens the connection to the API server early
 */
function htmlPerformance(apiBase) {
  return {
    name: 'ims-html-performance',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle || {};
        const tags = [];

        const out = html.replace(
          /<link rel="stylesheet"[^>]*href="\/(assets\/index-[^"]+\.css)"[^>]*>/,
          (tag, file) => {
            const asset = bundle[file];
            if (!asset || asset.type !== 'asset') return tag;
            delete bundle[file];
            return `<style>${asset.source}</style>`;
          },
        );

        const font = Object.keys(bundle).find((f) => /inter-latin-wght-normal-[^/]+\.woff2$/.test(f));
        if (font) {
          tags.push({
            tag: 'link',
            attrs: { rel: 'preload', href: `/${font}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head',
          });
        }

        // Route-aware preloading: start downloading the current page's code and
        // layout right away, in parallel with the main script.
        const chunks = Object.values(bundle).filter((c) => c.type === 'chunk');
        const byModule = (suffix) => chunks.find((c) => c.facadeModuleId && c.facadeModuleId.endsWith(suffix));
        const routes = readRoutes()
          .map((r) => [r.pattern, [...new Set(chunkFiles(bundle, byModule('/src/' + r.file)))]])
          .filter(([, files]) => files.length);
        const map = {
          r: routes,
          app: [...new Set(chunkFiles(bundle, byModule('/components/layout/AppLayout.vue')))],
          sa: [...new Set(chunkFiles(bundle, byModule('/components/layout/SuperAdminLayout.vue')))],
        };
        if (routes.length) {
          tags.push({
            tag: 'script',
            injectTo: 'head',
            children: `(function(){var m=${JSON.stringify(map)},p=location.pathname==='/'?'/dashboard':location.pathname,seen={};function add(h){if(seen[h])return;seen[h]=1;var l=document.createElement('link');if(/\\.css$/.test(h)){l.rel='preload';l.as='style';}else{l.rel='modulepreload';}l.href='/'+h;document.head.appendChild(l);}for(var i=0;i<m.r.length;i++){if(new RegExp(m.r[i][0]).test(p)){m.r[i][1].forEach(add);break;}}var sa=p.indexOf('/super-admin')===0,pub=p==='/login'||p==='/super-admin/login';if(!pub)(sa?m.sa:m.app).forEach(add);})();`,
          });
        }

        try {
          const origin = new URL(apiBase).origin;
          tags.push({ tag: 'link', attrs: { rel: 'preconnect', href: origin, crossorigin: '' }, injectTo: 'head' });
        } catch { /* relative or missing API base: same origin, nothing to preconnect */ }

        return { html: out, tags };
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [vue(), htmlPerformance(env.VITE_API_BASE_URL || '')],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173 },
  };
});
