// Aviso quando as mãos não estão no enquadramento.
import { HANDS_HINT } from '../config.js';

/**
 * Texto do aviso para cada contagem de mãos; null quando as duas aparecem.
 * @param {number} count
 */
export function handsHintText(count) {
  if (count === 0) return 'Mostre as duas mãos para a câmera';
  if (count === 1) return 'Só uma mão aparece. Afaste-se um pouco';
  return null;
}

/**
 * Só aceita um valor novo depois que ele se mantém por settleMs. Puro.
 * @template T
 * @param {T} initial
 * @param {number} settleMs
 */
export function createSettledValue(initial, settleMs) {
  let settled = initial;
  let candidate = initial;
  let since = -Infinity;
  /**
   * @param {T} value
   * @param {number} now em ms
   * @returns {T}
   */
  return (value, now) => {
    if (value !== candidate) {
      candidate = value;
      since = now;
    }
    if (candidate !== settled && now - since >= settleMs) settled = candidate;
    return settled;
  };
}

/** @param {HTMLElement} el */
export function createHandsHint(el) {
  const settle = createSettledValue(-1, HANDS_HINT.settleMs);
  let shown = -1;
  return {
    /** @param {number} count @param {number} now */
    update(count, now) {
      const stable = settle(count, now);
      if (stable === shown) return;
      shown = stable;
      const text = handsHintText(stable);
      el.hidden = text === null;
      if (text) el.textContent = text;
    },
  };
}
