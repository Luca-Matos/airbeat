// Índices dos 21 pontos da mão no modelo do MediaPipe e as ligações entre eles.
// Ficam fora de render.js para o detector de golpe usar os mesmos índices.

export const LANDMARK = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  RING_MCP: 13,
  PINKY_MCP: 17,
};

/** Pares [de, para] que formam o desenho da mão (mesma topologia do MediaPipe). */
// prettier-ignore
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [9, 10], [10, 11], [11, 12],
  [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

/** Pontos cuja média dá o centro da palma: punho e a base dos quatro dedos. */
const PALM_POINTS = [
  LANDMARK.WRIST,
  LANDMARK.INDEX_MCP,
  LANDMARK.MIDDLE_MCP,
  LANDMARK.RING_MCP,
  LANDMARK.PINKY_MCP,
];

/** Base dos quatro dedos (nós dos dedos). */
const KNUCKLE_POINTS = [
  LANDMARK.INDEX_MCP,
  LANDMARK.MIDDLE_MCP,
  LANDMARK.RING_MCP,
  LANDMARK.PINKY_MCP,
];

/**
 * @param {{ x: number, y: number }[]} hand
 * @param {number[]} ids
 */
function mean(hand, ids) {
  let x = 0;
  let y = 0;
  for (const i of ids) {
    x += hand[i].x;
    y += hand[i].y;
  }
  return { x: x / ids.length, y: y / ids.length };
}

/**
 * Baqueta virtual: sai do centro da palma e termina na ponta da mão, na reta
 * pulso -> nós dos dedos, a `reach` vezes essa distância a partir do pulso. Usa só
 * pulso e nós dos dedos, que o MediaPipe acha bem mesmo com a mão fechada.
 * @param {{ x: number, y: number }[]} hand 21 pontos
 * @param {number} reach
 * @returns {{ base: { x: number, y: number }, tip: { x: number, y: number } }}
 */
export function stickPoints(hand, reach) {
  const wrist = hand[LANDMARK.WRIST];
  const knuckles = mean(hand, KNUCKLE_POINTS);
  return {
    base: mean(hand, PALM_POINTS),
    tip: {
      x: wrist.x + reach * (knuckles.x - wrist.x),
      y: wrist.y + reach * (knuckles.y - wrist.y),
    },
  };
}

/**
 * Ponto de controle da mão: o que bate na peça. Ver HIT.controlPoint.
 * @param {{ x: number, y: number }[]} hand 21 pontos do MediaPipe
 * @param {'stick' | 'knuckles' | 'palm' | 'indexTip'} kind
 * @param {number} [reach] alcance da baqueta (só para 'stick')
 * @returns {{ x: number, y: number }}
 */
export function controlPoint(hand, kind, reach = 1.3) {
  if (kind === 'indexTip') return { x: hand[LANDMARK.INDEX_TIP].x, y: hand[LANDMARK.INDEX_TIP].y };
  if (kind === 'knuckles') return mean(hand, KNUCKLE_POINTS);
  if (kind === 'stick') return stickPoints(hand, reach).tip;
  return mean(hand, PALM_POINTS);
}
