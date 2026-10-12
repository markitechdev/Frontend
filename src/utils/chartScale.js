/**
 * Axis helpers shared by the bar charts.
 *
 * niceScale(max) picks a round step (1, 2, 2.5 or 5 x 10^n) so that about
 * `target` gridlines cover the data, e.g. 47,488 -> 0, 10k, 20k ... 50k
 * instead of 0, 12.5k, 25k, 37.5k, 50k.
 */
export function niceStep(raw) {
  if (!(raw > 0)) return 1;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

export function niceScale(max, target = 5) {
  const top = Math.max(0, Number(max) || 0);
  if (top === 0) return { max: 1, step: 0.25, ticks: [0, 0.25, 0.5, 0.75, 1] };
  const step = niceStep(top / target);
  const axisMax = Math.ceil(top / step - 1e-9) * step;
  const ticks = [];
  for (let v = 0; v <= axisMax + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { max: axisMax, step, ticks };
}

/** 47488 -> "47.5k", 1200000 -> "1.2M", 2.5 -> "2.5" */
export function compactNumber(v) {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  const trim = (x) => String(Number(x.toFixed(1)));
  if (abs >= 1e6) return `${trim(n / 1e6)}M`;
  if (abs >= 1e3) return `${trim(n / 1e3)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
