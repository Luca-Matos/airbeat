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
 * Mediana das últimas `size` amostras. Puro. Mediana e não média: uma travada
 * isolada não distorce a medida de atraso.
 * @param {number} size
 */
export function createRollingMedian(size) {
  /** @type {number[]} */
  const values = [];
  return {
    /** @param {number} v */
    add(v) {
      values.push(v);
      if (values.length > size) values.shift();
    },
    /** @returns {number | null} */
    read() {
      if (!values.length) return null;
      const s = [...values].sort((a, b) => a - b);
      const m = s.length >> 1;
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
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
 * Liga o painel a um elemento do DOM. Teclas (com o foco na página):
 * D mostra/esconde; com o painel visível, R grava/para landmarks, P reproduz
 * uma gravação e Z zera o contador de golpes.
 * @param {HTMLElement} el
 * @param {{ onRecordToggle?: () => void, onReplayRequest?: () => void, onResetCounters?: () => void, onKey?: (key: string) => void }} [handlers]
 */
export function createDebugPanel(el, handlers = {}) {
  const stats = createFrameStats(DEBUG.statsWindowMs);
  let lastRefresh = -Infinity;
  el.hidden = !debugEnabledFromUrl(location.search);
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'd') el.hidden = !el.hidden;
    if (el.hidden) return;
    if (key === 'r') handlers.onRecordToggle?.();
    if (key === 'p') handlers.onReplayRequest?.();
    if (key === 'z') handlers.onResetCounters?.();
    handlers.onKey?.(key);
  });

  return {
    get visible() {
      return !el.hidden;
    },
    /**
     * @param {number} now
     * @param {number} detectMs
     * @param {{ hands: number, delegate: string, videoWidth: number, videoHeight: number, extra?: string[] }} info
     */
    update(now, detectMs, info) {
      stats.add(now, detectMs);
      if (el.hidden || now - lastRefresh < DEBUG.panelRefreshMs) return;
      lastRefresh = now;
      const { fps, avgDetectMs } = stats.read();
      el.textContent = [
        `FPS ${fps.toFixed(1)} · detecção ${avgDetectMs.toFixed(1)} ms`,
        `${info.delegate} · ${info.videoWidth}x${info.videoHeight} · mãos ${info.hands}`,
        ...(info.extra ?? []),
        'teclas: D painel · R gravar · P reproduzir · Z zerar',
        'ajuste: [ ] ponto · , . limiar · 9 0 predição · K ponto da mão · O modo',
      ].join('\n');
    },
  };
}

/**
 * Baixa um objeto como arquivo .json no próprio aparelho (nada é enviado).
 * @param {string} filename
 * @param {unknown} data
 */
export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Abre o seletor de arquivos e devolve o JSON escolhido (ou null se cancelar). */
export function pickJsonFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve(JSON.parse(await file.text()));
      } catch (err) {
        reject(err);
      }
    });
    input.click();
  });
}

/**
 * Fonte de mãos vinda de uma gravação: devolve, para cada instante, o último quadro
 * gravado até ali. Começa a contar no primeiro pedido. Puro.
 * @param {{ t: number, hands: { x: number, y: number }[][] }[]} frames
 */
export function createReplaySource(frames) {
  let t0 = null;
  let i = 0;
  return {
    /** @param {number} now ms @returns {{ x: number, y: number }[][] | null} null quando acabou */
    handsAt(now) {
      if (t0 === null) t0 = now;
      const rel = now - t0;
      while (i + 1 < frames.length && frames[i + 1].t <= rel) i++;
      if (i >= frames.length - 1 && rel > frames[frames.length - 1].t) return null;
      return frames[i]?.hands ?? null;
    },
  };
}
