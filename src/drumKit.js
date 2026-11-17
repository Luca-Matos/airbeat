// PURO. Geometria da bateria: posição e tamanho de cada peça para o tamanho atual
// do palco, e qual peça está sob um ponto. Tudo em unidades de palco (0 a 1).
import { DRUM_KIT } from './config.js';

/**
 * @typedef {object} KitPiece
 * @property {string} id
 * @property {string} label
 * @property {string} sound id do som em SOUNDS
 * @property {string} color
 * @property {'circle' | 'rect'} shape
 * @property {number} cx centro x, unidades de palco
 * @property {number} cy centro y, unidades de palco
 * @property {number} hw meia largura, unidades de palco (no círculo, o raio em x)
 * @property {number} hh meia altura, unidades de palco (no círculo, o raio em y)
 */

/**
 * Posiciona as peças para um palco de width x height px. O raio vem do menor lado,
 * então o círculo fica redondo na tela; por isso rx e ry diferem em unidades de palco.
 * @param {number} width px
 * @param {number} height px
 * @param {typeof DRUM_KIT} [kit]
 * @returns {KitPiece[]}
 */
export function layoutKit(width, height, kit = DRUM_KIT) {
  const radiusPx = Math.min(kit.radius * Math.min(width, height), kit.maxRadiusOfWidth * width);
  return kit.pieces.map((p) => ({
    id: p.id,
    label: p.label,
    sound: p.sound,
    color: p.color,
    shape: /** @type {'circle' | 'rect'} */ (p.shape),
    cx: p.x,
    cy: p.y,
    // `size` aumenta uma peça redonda em relação às outras (pratos são maiores).
    hw: p.shape === 'rect' ? p.w / 2 : (radiusPx * (p.size ?? 1)) / width,
    hh: p.shape === 'rect' ? p.h / 2 : (radiusPx * (p.size ?? 1)) / height,
  }));
}

/**
 * Distância "normalizada" do ponto à peça: 1 = na borda, menos que 1 = dentro.
 * @param {KitPiece} piece
 * @param {{ x: number, y: number }} p
 */
export function pieceDistance(piece, p) {
  const dx = (p.x - piece.cx) / piece.hw;
  const dy = (p.y - piece.cy) / piece.hh;
  return piece.shape === 'rect' ? Math.max(Math.abs(dx), Math.abs(dy)) : Math.hypot(dx, dy);
}

/**
 * Peça sob o ponto, com a folga de golpe. Se duas zonas se sobrepõem, vence a mais próxima.
 * @param {KitPiece[]} pieces
 * @param {{ x: number, y: number }} p
 * @param {number} [margin]
 * @returns {string | null} id da peça
 */
export function pieceAt(pieces, p, margin = DRUM_KIT.hitMargin) {
  let best = null;
  let bestD = margin;
  for (const piece of pieces) {
    const d = pieceDistance(piece, p);
    if (d <= bestD) {
      best = piece.id;
      bestD = d;
    }
  }
  return best;
}
