// PURO. Tela de posicionamento: decide a mensagem a partir das mãos visíveis e
// libera o próximo passo quando as duas ficam inteiras na tela por um tempo.
import { POSITIONING } from '../config.js';

/** @typedef {'none' | 'one' | 'cut' | 'close' | 'ok'} PositionStatus */

/**
 * Tamanho da mão: pulso até a base do dedo médio, em fração da altura do palco.
 * Mede a distância da pessoa à câmera sem depender da abertura dos dedos.
 * @param {{ x: number, y: number }[]} stagePoints 21 pontos em unidades de palco
 * @param {{ width: number, height: number }} view
 */
export function handSize(stagePoints, view) {
  const w = stagePoints[0];
  const m = stagePoints[9];
  return Math.hypot((m.x - w.x) * view.width, (m.y - w.y) * view.height) / view.height;
}

/**
 * Todos os pontos da mão dentro da área visível (com margem). Em unidades de palco.
 * @param {{ x: number, y: number }[]} stagePoints
 * @param {number} [margin]
 */
export function handFullyVisible(stagePoints, margin = POSITIONING.edgeMargin) {
  return stagePoints.every(
    (p) => p.x >= margin && p.x <= 1 - margin && p.y >= margin && p.y <= 1 - margin,
  );
}

/**
 * @param {number} handCount
 * @param {boolean} allInside
 * @param {number} [largestHand] maior tamanho de mão (ver handSize)
 * @returns {PositionStatus}
 */
export function positionStatus(handCount, allInside, largestHand = 0) {
  if (handCount === 0) return 'none';
  if (handCount === 1) return 'one';
  if (largestHand > POSITIONING.maxHandSize) return 'close';
  return allInside ? 'ok' : 'cut';
}

export const POSITION_MESSAGES = {
  none: 'Levante as duas mãos na frente do corpo, na altura do peito.',
  one: 'Só uma mão aparece. Afaste-se um pouco da câmera.',
  cut: 'Quase lá: as mãos estão saindo da tela. Afaste-se um pouco.',
  close: 'Você está perto demais da câmera. Dê um ou dois passos para trás.',
  ok: 'Perfeito! Segure assim…',
};

/**
 * Conta quanto tempo seguido o status ficou 'ok'.
 * @param {number} [holdMs]
 */
export function createPositionHold(holdMs = POSITIONING.holdMs) {
  let okSince = null;
  /**
   * @param {PositionStatus} status
   * @param {number} now ms
   * @returns {{ progress: number, ready: boolean }} progress de 0 a 1
   */
  return (status, now) => {
    if (status !== 'ok') {
      okSince = null;
      return { progress: 0, ready: false };
    }
    okSince ??= now;
    const progress = Math.min(1, (now - okSince) / holdMs);
    return { progress, ready: progress >= 1 };
  };
}
