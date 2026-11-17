// PURO. Dá um id estável a cada mão entre quadros, pela posição mais próxima do
// quadro anterior. O rótulo esquerda/direita do MediaPipe não serve: fica invertido
// com a imagem espelhada e oscila de um quadro para outro.
import { HAND_MATCH } from './config.js';

/** @typedef {{ x: number, y: number }} Point2 */
/** @typedef {{ id: number, point: Point2 }} TrackedHand */

/**
 * @param {{ maxJump?: number, forgetAfterMs?: number }} [options]
 */
export function createHandAssociation(options = {}) {
  const maxJump = options.maxJump ?? HAND_MATCH.maxJump;
  const forgetAfterMs = options.forgetAfterMs ?? HAND_MATCH.forgetAfterMs;
  /** @type {{ id: number, point: Point2, seenAt: number }[]} */
  let known = [];
  let nextId = 1;

  /**
   * @param {number} t tempo do quadro, em ms
   * @param {Point2[]} points pontos de controle das mãos deste quadro
   * @returns {TrackedHand[]} na mesma ordem de `points`
   */
  return function associate(t, points) {
    known = known.filter((k) => t - k.seenAt <= forgetAfterMs);

    // Com no máximo 2 mãos, guloso pela menor distância dá o mesmo que a busca ótima.
    const pairs = [];
    points.forEach((p, pi) => {
      known.forEach((k, ki) => {
        const d = Math.hypot(p.x - k.point.x, p.y - k.point.y);
        if (d <= maxJump) pairs.push({ pi, ki, d });
      });
    });
    pairs.sort((a, b) => a.d - b.d);

    /** @type {(number | undefined)[]} */
    const idFor = new Array(points.length);
    const usedKnown = new Set();
    for (const { pi, ki } of pairs) {
      if (idFor[pi] !== undefined || usedKnown.has(ki)) continue;
      idFor[pi] = known[ki].id;
      usedKnown.add(ki);
    }

    const result = points.map((point, pi) => ({ id: idFor[pi] ?? nextId++, point }));
    for (const hand of result) {
      const k = known.find((x) => x.id === hand.id);
      if (k) {
        k.point = hand.point;
        k.seenAt = t;
      } else {
        known.push({ id: hand.id, point: hand.point, seenAt: t });
      }
    }
    return result;
  };
}
