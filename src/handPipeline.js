// PURO. Junta as etapas por quadro: landmarks -> ponto de controle em unidades de
// palco -> id estável por mão -> golpes. O app e os testes de replay usam o mesmo
// caminho, então uma gravação reproduzida passa exatamente pela lógica do app.
import { HIT } from './config.js';
import { createHandAssociation } from './handAssociation.js';
import { createHitDetector } from './hitDetector.js';
import { controlPoint, stickPoints } from './landmarks.js';
import { toStage } from './render.js';

/**
 * @param {object} options
 * @param {(p: { x: number, y: number }) => string | null} options.pieceAt
 * @param {Partial<typeof HIT>} [options.config]
 */
export function createHandPipeline({ pieceAt, config = {} }) {
  const kind = config.controlPoint ?? HIT.controlPoint;
  const reach = config.stickReach ?? HIT.stickReach;
  const params = { stickReach: reach, thumbOffset: config.thumbOffset ?? HIT.thumbOffset };
  let associate = createHandAssociation();
  const detector = createHitDetector({ pieceAt, config });

  return {
    /**
     * @param {number} t ms
     * @param {{ x: number, y: number }[][]} hands landmarks normalizados do MediaPipe
     * @param {import('./render.js').View} view
     */
    process(t, hands, view) {
      const points = hands.map((h) => toStage(controlPoint(h, kind, params), view));
      const tracked = associate(t, points);
      const hits = detector.update(t, tracked);
      // Base da baqueta (centro da palma) para o desenho, na mesma ordem de tracked.
      const bases = hands.map((h) => toStage(stickPoints(h, reach).base, view));
      return { tracked, bases, hits, states: detector.states() };
    },
    reset() {
      associate = createHandAssociation();
      detector.reset();
    },
  };
}
