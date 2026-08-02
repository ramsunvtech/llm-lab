// Small deterministic math toolkit. Everything here is seeded so that the
// same token / model always produces the same numbers across renders.

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 PRNG — fast, tiny, deterministic given a seed.
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededVector(seed: number, dim: number): number[] {
  const rnd = mulberry32(seed);
  const v: number[] = [];
  for (let i = 0; i < dim; i++) v.push(rnd() * 2 - 1);
  return v;
}

export function seededMatrix(seed: number, rows: number, cols: number): number[][] {
  const rnd = mulberry32(seed);
  const m: number[][] = [];
  const scale = Math.sqrt(1 / cols);
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) row.push((rnd() * 2 - 1) * scale);
    m.push(row);
  }
  return m;
}

export function matVec(m: number[][], v: number[]): number[] {
  return m.map((row) => row.reduce((s, val, i) => s + val * v[i], 0));
}

export function addVec(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}

export function scaleVec(a: number[], s: number): number[] {
  return a.map((v) => v * s);
}

export function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

export function softmax(arr: number[], temperature = 1): number[] {
  const t = Math.max(temperature, 1e-6);
  const scaled = arr.map((v) => v / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((v) => v / sum);
}

export function layerNorm(v: number[]): number[] {
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const variance = v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length;
  const std = Math.sqrt(variance + 1e-5);
  return v.map((x) => (x - mean) / std);
}

export function gelu(x: number): number {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
