// PURO. Modo alternativo por toque ou clique: converte a posição do ponteiro em
// unidades de palco e diz qual peça foi tocada. Plano B quando não há câmera ou o
// rastreamento falha (XRD, cenários de uso).
import { pieceAt } from './drumKit.js';

/** handId dos golpes por toque (as mãos rastreadas têm id >= 0). */
export const TOUCH_HAND_ID = -1;

/**
 * Ponto do ponteiro em unidades de palco (0 a 1 do canvas). O canvas já é a tela que o
 * usuário vê, sem espelho: as peças estão desenhadas nesse mesmo espaço, então não passa
 * por toScreen (que existe para converter as coordenadas da câmera).
 * @param {number} clientX px
 * @param {number} clientY px
 * @param {{ left: number, top: number, width: number, height: number }} rect retângulo do canvas
 */
export function stagePointFromClient(clientX, clientY, rect) {
  if (!rect.width || !rect.height) return null;
  return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
}

/**
 * Golpe por toque: o mesmo evento que o hitDetector devolve, ou null fora das peças.
 * @param {import('./drumKit.js').KitPiece[]} pieces
 * @param {{ x: number, y: number } | null} point unidades de palco
 * @param {number} t ms, no mesmo relógio dos quadros (performance.now)
 * @returns {import('./hitDetector.js').HitEvent | null}
 */
export function touchHit(pieces, point, t) {
  if (!point) return null;
  const pieceId = pieceAt(pieces, point);
  return pieceId ? { handId: TOUCH_HAND_ID, pieceId, t, velocity: 0 } : null;
}
