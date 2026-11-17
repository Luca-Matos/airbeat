// PURO. Gravação de landmarks para o modo debug e para os testes de replay.
// Guarda só números (tempo e pontos x, y), nunca imagem. O arquivo vai para
// tests/fixtures/ e é reproduzido no hitDetector para ver se um ajuste quebrou algo.
import { DEBUG } from './config.js';
import { layoutKit, pieceAt } from './drumKit.js';
import { createHandPipeline } from './handPipeline.js';

export const RECORDING_FORMAT = 'airbeat-landmarks';
export const RECORDING_VERSION = 1;

/**
 * @typedef {object} Recording
 * @property {string} format
 * @property {number} version
 * @property {string} createdAt
 * @property {import('./render.js').View} view tela em que foi gravado
 * @property {string} [note] o que a pessoa fez (ex.: "10 golpes na caixa com a mão direita")
 * @property {{ hits: number, tolerance?: number }} [expected] preenchido à mão por quem gravou
 * @property {{ t: number, hands: number[][][] }[]} frames t em ms desde o início; pontos [x, y]
 */

/** @param {number} decimals */
function rounder(decimals) {
  const f = 10 ** decimals;
  return (/** @type {number} */ v) => Math.round(v * f) / f;
}

/**
 * @param {{ maxMs?: number, decimals?: number }} [options]
 */
export function createLandmarkRecorder(options = {}) {
  const maxMs = options.maxMs ?? DEBUG.recordMaxMs;
  const round = rounder(options.decimals ?? DEBUG.recordDecimals);
  /** @type {null | { t0: number, view: any, frames: Recording['frames'] }} */
  let current = null;

  return {
    get recording() {
      return current !== null;
    },
    /** Duração gravada até agora, em ms. */
    elapsed: (/** @type {number} */ now) => (current ? now - current.t0 : 0),
    /** @param {number} now ms @param {import('./render.js').View} view */
    start(now, view) {
      current = { t0: now, view: { ...view }, frames: [] };
    },
    /**
     * @param {number} t ms
     * @param {{ x: number, y: number }[][]} hands
     * @returns {boolean} false quando passou do tempo máximo (a gravação deve ser parada)
     */
    add(t, hands) {
      if (!current) return false;
      const rel = t - current.t0;
      if (rel > maxMs) return false;
      current.frames.push({
        t: Math.round(rel * 10) / 10,
        hands: hands.map((h) => h.map((p) => [round(p.x), round(p.y)])),
      });
      return true;
    },
    /** @returns {Recording | null} */
    stop() {
      if (!current) return null;
      const rec = {
        format: RECORDING_FORMAT,
        version: RECORDING_VERSION,
        createdAt: new Date().toISOString(),
        view: current.view,
        note: '',
        frames: current.frames,
      };
      current = null;
      return rec;
    },
  };
}

/**
 * Confere o formato e devolve os quadros com pontos no formato do MediaPipe ({x, y}).
 * @param {unknown} data JSON já lido
 * @returns {{ view: any, frames: { t: number, hands: { x: number, y: number }[][] }[] }}
 */
export function parseRecording(data) {
  const rec = /** @type {Recording} */ (data);
  if (!rec || rec.format !== RECORDING_FORMAT || !Array.isArray(rec.frames)) {
    throw new Error('Arquivo não é uma gravação de landmarks do AirBeat.');
  }
  if (rec.version !== RECORDING_VERSION) {
    throw new Error(`Versão de gravação ${rec.version} não suportada.`);
  }
  return {
    view: rec.view,
    frames: rec.frames.map((f) => ({
      t: f.t,
      hands: f.hands.map((h) => h.map(([x, y]) => ({ x, y }))),
    })),
  };
}

/**
 * Reproduz uma gravação pela mesma lógica do app e devolve os golpes. Usa a bateria
 * montada para o tamanho de tela da gravação, que é o que a pessoa via ao gravar.
 * @param {unknown} data
 * @param {{ config?: Partial<typeof import('./config.js').HIT> }} [options]
 */
export function replayRecording(data, options = {}) {
  const { view, frames } = parseRecording(data);
  const pieces = layoutKit(view.width, view.height);
  const pipeline = createHandPipeline({
    pieceAt: (p) => pieceAt(pieces, p),
    config: options.config,
  });
  return frames.flatMap((f) => pipeline.process(f.t, f.hands, view).hits);
}
