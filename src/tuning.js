// PURO. Ajuste ao vivo dos parâmetros de golpe pelo painel de debug, para a equipe
// achar os valores tocando, sem recarregar. O que funcionar vai para config.js (HIT).
import { HIT } from './config.js';

const CONTROL_POINTS = ['stick', 'knuckles', 'palm', 'indexTip'];
const MODES = ['stroke', 'lowestPoint', 'velocity'];
/** Limites dos ajustes por tecla. */
const REACH = { min: 0.8, max: 2.2, step: 0.1 };
const VELOCITY = { min: 0.3, max: 3, step: 0.1 };

/** @typedef {{ mode: string, controlPoint: string, stickReach: number, downVelocity: number }} Tuning */

/** @returns {Tuning} */
export function defaultTuning() {
  return {
    mode: HIT.mode,
    controlPoint: HIT.controlPoint,
    stickReach: HIT.stickReach,
    downVelocity: HIT.downVelocity,
  };
}

/** @param {number} v @param {{ min: number, max: number }} r */
const clamp = (v, r) => Math.round(Math.min(r.max, Math.max(r.min, v)) * 10) / 10;

/** @template T @param {T[]} list @param {T} current */
const next = (list, current) => list[(list.indexOf(current) + 1) % list.length];

/**
 * Teclas: [ e ] alcance da baqueta; , e . limiar de velocidade; K ponto da mão; O modo.
 * @param {Tuning} t
 * @param {string} key em minúscula
 * @returns {Tuning | null} null se a tecla não é de ajuste
 */
export function adjustTuning(t, key) {
  switch (key) {
    case '[':
      return { ...t, stickReach: clamp(t.stickReach - REACH.step, REACH) };
    case ']':
      return { ...t, stickReach: clamp(t.stickReach + REACH.step, REACH) };
    case ',':
      return { ...t, downVelocity: clamp(t.downVelocity - VELOCITY.step, VELOCITY) };
    case '.':
      return { ...t, downVelocity: clamp(t.downVelocity + VELOCITY.step, VELOCITY) };
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
  const point = t.controlPoint === 'stick' ? `stick ${t.stickReach}` : t.controlPoint;
  return `golpe: ${t.mode} · ${point} · limiar ${t.downVelocity}/s`;
}
