// PURO. Ajuste ao vivo dos parâmetros de golpe pelo painel de debug, para a equipe
// achar os valores tocando, sem recarregar. O que funcionar vai para config.js (HIT).
import { HIT } from './config.js';

const CONTROL_POINTS = ['thumb', 'stick', 'knuckles', 'palm', 'indexTip'];
const MODES = ['stroke', 'lowestPoint', 'velocity'];
/** Limites dos ajustes por tecla. */
const REACH = { min: 0.8, max: 2.2, step: 0.1 };
const THUMB = { min: -0.5, max: 1, step: 0.05 };
const VELOCITY = { min: 0.3, max: 3, step: 0.1 };
const PREDICT = { min: 0, max: 120, step: 10 };

/**
 * @typedef {{ mode: string, controlPoint: string, stickReach: number, thumbOffset: number,
 *   downVelocity: number, predictMs: number }} Tuning
 */

/** @returns {Tuning} */
export function defaultTuning() {
  return {
    mode: HIT.mode,
    controlPoint: HIT.controlPoint,
    stickReach: HIT.stickReach,
    thumbOffset: HIT.thumbOffset,
    downVelocity: HIT.downVelocity,
    predictMs: HIT.predictMs,
  };
}

/** @param {number} v @param {{ min: number, max: number }} r */
const clamp = (v, r) => Math.round(Math.min(r.max, Math.max(r.min, v)) * 100) / 100;

/** @template T @param {T[]} list @param {T} current */
const next = (list, current) => list[(list.indexOf(current) + 1) % list.length];

/**
 * Teclas: [ e ] ajustam o ponto da mão (no dedão, sobe/desce o ponto; na baqueta, o
 * alcance); , e . o limiar de velocidade; 9 e 0 a predição; K troca o ponto; O o modo.
 * @param {Tuning} t
 * @param {string} key em minúscula
 * @returns {Tuning | null} null se a tecla não é de ajuste
 */
export function adjustTuning(t, key) {
  const thumb = t.controlPoint === 'thumb';
  switch (key) {
    case '[':
      return thumb
        ? { ...t, thumbOffset: clamp(t.thumbOffset + THUMB.step, THUMB) }
        : { ...t, stickReach: clamp(t.stickReach - REACH.step, REACH) };
    case ']':
      return thumb
        ? { ...t, thumbOffset: clamp(t.thumbOffset - THUMB.step, THUMB) }
        : { ...t, stickReach: clamp(t.stickReach + REACH.step, REACH) };
    case ',':
      return { ...t, downVelocity: clamp(t.downVelocity - VELOCITY.step, VELOCITY) };
    case '.':
      return { ...t, downVelocity: clamp(t.downVelocity + VELOCITY.step, VELOCITY) };
    case '9':
      return { ...t, predictMs: clamp(t.predictMs - PREDICT.step, PREDICT) };
    case '0':
      return { ...t, predictMs: clamp(t.predictMs + PREDICT.step, PREDICT) };
    case 'k':
      return { ...t, controlPoint: next(CONTROL_POINTS, t.controlPoint) };
    case 'o':
      return { ...t, mode: next(MODES, t.mode) };
    default:
      return null;
  }
}

/** @param {Tuning} t */
export function describeTuning(t) {
  const point =
    t.controlPoint === 'thumb'
      ? `dedão ${t.thumbOffset}`
      : t.controlPoint === 'stick'
        ? `stick ${t.stickReach}`
        : t.controlPoint;
  return `golpe: ${t.mode} · ${point} · limiar ${t.downVelocity}/s · predição ${t.predictMs} ms`;
}
