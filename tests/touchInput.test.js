import { describe, expect, it } from 'vitest';
import { layoutKit } from '../src/drumKit.js';
import { stagePointFromClient, TOUCH_HAND_ID, touchHit } from '../src/touchInput.js';

describe('modo por toque ou clique', () => {
  const rect = { left: 10, top: 20, width: 1280, height: 720 };
  const pieces = layoutKit(rect.width, rect.height);

  it('converte o ponteiro em unidades de palco, sem espelhar', () => {
    expect(stagePointFromClient(10, 20, rect)).toEqual({ x: 0, y: 0 });
    expect(stagePointFromClient(650, 380, rect)).toEqual({ x: 0.5, y: 0.5 });
    expect(stagePointFromClient(0, 0, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });

  it('tocar no centro de cada peça gera o golpe dela', () => {
    for (const p of pieces) {
      const x = rect.left + p.cx * rect.width;
      const y = rect.top + p.cy * rect.height;
      const hit = touchHit(pieces, stagePointFromClient(x, y, rect), 1234);
      expect(hit).toEqual({ handId: TOUCH_HAND_ID, pieceId: p.id, t: 1234, velocity: 0 });
    }
  });

  it('tocar fora das peças não toca nada', () => {
    expect(touchHit(pieces, { x: 0.5, y: 0.05 }, 0)).toBeNull();
    expect(touchHit(pieces, null, 0)).toBeNull();
  });
});
