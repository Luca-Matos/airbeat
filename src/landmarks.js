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

/**
 * Ponto de controle da mão, o que faz o papel da baqueta. A palma é mais estável
 * que a ponta do dedo; a ponta do indicador fica como alternativa para comparar.
 * @param {{ x: number, y: number }[]} hand 21 pontos do MediaPipe
 * @param {'palm' | 'indexTip'} kind
 * @returns {{ x: number, y: number }}
 */
export function controlPoint(hand, kind) {
  if (kind === 'indexTip') return { x: hand[LANDMARK.INDEX_TIP].x, y: hand[LANDMARK.INDEX_TIP].y };
  let x = 0;
  let y = 0;
  for (const i of PALM_POINTS) {
    x += hand[i].x;
    y += hand[i].y;
  }
  return { x: x / PALM_POINTS.length, y: y / PALM_POINTS.length };
}
