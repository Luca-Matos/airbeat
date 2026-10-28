// Painel de debug: FPS do laço de detecção e tempo médio de cada detecção.
// A gravação e reprodução de landmarks entra no cartão de detecção de golpe.
import { DEBUG } from './config.js';

/**
 * Estatísticas numa janela deslizante de tempo. Puro: recebe o relógio de fora.
 * @param {number} windowMs
 */
export function createFrameStats(windowMs) {
  /** @type {{ t: number, ms: number }[]} */
  const samples = [];
  return {
    /**
     * @param {number} now tempo do quadro, em ms
     * @param {number} detectMs quanto a detecção levou nesse quadro, em ms
     */
    add(now, detectMs) {
      samples.push({ t: now, ms: detectMs });
      while (samples.length && samples[0].t < now - windowMs) samples.shift();
    },
    /** @returns {{ fps: number, avgDetectMs: number }} */
    read() {
      if (samples.length < 2) return { fps: 0, avgDetectMs: samples[0]?.ms ?? 0 };
      const span = samples[samples.length - 1].t - samples[0].t;
      const total = samples.reduce((sum, s) => sum + s.ms, 0);
      return {
        fps: span > 0 ? ((samples.length - 1) * 1000) / span : 0,
        avgDetectMs: total / samples.length,
      };
    },
  };
}

/**
 * Lê ?debug=0/1 da URL; sem o parâmetro, usa o padrão do config.
 * @param {string} search
 */
export function debugEnabledFromUrl(search) {
  const value = new URLSearchParams(search).get('debug');
  if (value === null) return DEBUG.panelVisibleByDefault;
  return value !== '0' && value !== 'false';
}

/**
 * Liga o painel a um elemento do DOM. A tecla D mostra e esconde.
 * @param {HTMLElement} el
 */
export function createDebugPanel(el) {
  const stats = createFrameStats(DEBUG.statsWindowMs);
  let lastRefresh = -Infinity;
  el.hidden = !debugEnabledFromUrl(location.search);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') el.hidden = !el.hidden;
  });

  return {
    /**
     * @param {number} now
     * @param {number} detectMs
     * @param {{ hands: number, delegate: string, videoWidth: number, videoHeight: number }} info
     */
    update(now, detectMs, info) {
      stats.add(now, detectMs);
      if (el.hidden || now - lastRefresh < DEBUG.panelRefreshMs) return;
      lastRefresh = now;
      const { fps, avgDetectMs } = stats.read();
      el.textContent =
        `FPS ${fps.toFixed(1)} · detecção ${avgDetectMs.toFixed(1)} ms\n` +
        `${info.delegate} · ${info.videoWidth}x${info.videoHeight} · mãos ${info.hands}`;
    },
  };
}
