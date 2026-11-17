// PURO. Gera as amostras de cada som a partir das receitas de config.js (SOUNDS).
// Roda uma vez no carregamento; tocar depois é só reproduzir o buffer pronto.
// Sem Web Audio aqui, para poder testar em Node.

/** Ataque linear curto em todo som, em ms, para não estalar no início. */
const ATTACK_MS = 0.5;

/**
 * Gerador pseudoaleatório com semente (mulberry32). O ruído sai igual a cada
 * carregamento, então o som da caixa é sempre o mesmo.
 * @param {number} seed
 */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Filtro biquad (fórmulas do "Audio EQ Cookbook", R. Bristow-Johnson), no lugar.
 * @param {Float32Array} x
 * @param {{ type: 'lowpass' | 'highpass' | 'bandpass', freq: number, q: number }} f
 * @param {number} sampleRate
 */
export function biquad(x, f, sampleRate) {
  const w0 = (2 * Math.PI * Math.min(f.freq, sampleRate * 0.45)) / sampleRate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * f.q);
  let b0, b1, b2;
  if (f.type === 'lowpass') [b0, b1, b2] = [(1 - cos) / 2, 1 - cos, (1 - cos) / 2];
  else if (f.type === 'highpass') [b0, b1, b2] = [(1 + cos) / 2, -(1 + cos), (1 + cos) / 2];
  else [b0, b1, b2] = [alpha, 0, -alpha];
  const a0 = 1 + alpha;
  const a1 = -2 * cos;
  const a2 = 1 - alpha;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = (b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
    x[i] = yi;
  }
  return x;
}

/** @param {'sine' | 'triangle'} wave @param {number} phase em ciclos */
function oscillator(wave, phase) {
  const p = phase - Math.floor(phase);
  if (wave === 'triangle') return 4 * Math.abs(p - 0.5) - 1;
  return Math.sin(2 * Math.PI * p);
}

/**
 * @param {any} layer
 * @param {number} n
 * @param {number} sampleRate
 * @param {() => number} random
 */
function renderLayer(layer, n, sampleRate, random) {
  const out = new Float32Array(n);
  const decay = layer.decayMs / 1000;
  if (layer.type === 'tone') {
    const end = layer.freqEnd ?? layer.freq;
    const pitchDecay = (layer.pitchDecayMs ?? 1) / 1000;
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      const freq = end + (layer.freq - end) * Math.exp(-t / pitchDecay);
      phase += freq / sampleRate;
      out[i] = oscillator(layer.wave, phase);
    }
  } else if (layer.type === 'noise') {
    for (let i = 0; i < n; i++) out[i] = random() * 2 - 1;
  } else if (layer.type === 'metal') {
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      let s = 0;
      for (const f of layer.freqs) s += Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1;
      out[i] = s / layer.freqs.length;
    }
  }
  if (layer.filter) biquad(out, layer.filter, sampleRate);
  for (let i = 0; i < n; i++) out[i] *= layer.gain * Math.exp(-i / sampleRate / decay);
  return out;
}

/**
 * Gera o som de uma receita: soma as camadas, aplica ataque, saturação e normaliza
 * o pico em `gain`.
 * @param {(typeof import('../config.js').SOUNDS)[keyof typeof import('../config.js').SOUNDS]} recipe
 * @param {number} sampleRate em Hz
 * @param {number} [seed]
 * @returns {Float32Array}
 */
export function renderSound(recipe, sampleRate, seed = 1) {
  const n = Math.max(1, Math.round((recipe.durationMs / 1000) * sampleRate));
  const random = seededRandom(seed);
  const mix = new Float32Array(n);
  for (const layer of recipe.layers) {
    const data = renderLayer(layer, n, sampleRate, random);
    for (let i = 0; i < n; i++) mix[i] += data[i];
  }
  const attack = Math.max(1, Math.round((ATTACK_MS / 1000) * sampleRate));
  const drive = recipe.drive ?? 1;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    let s = mix[i] * Math.min(1, i / attack);
    if (drive !== 1) s = Math.tanh(drive * s);
    mix[i] = s;
    peak = Math.max(peak, Math.abs(s));
  }
  // Rampa final curta para o som terminar em zero, sem estalo no corte.
  const fade = Math.min(n, attack * 20);
  for (let i = 0; i < fade; i++) mix[n - 1 - i] *= i / fade;
  const scale = peak > 0 ? recipe.gain / peak : 0;
  for (let i = 0; i < n; i++) mix[i] *= scale;
  return mix;
}
