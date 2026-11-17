import { describe, expect, it } from 'vitest';
import {
  createPositionHold,
  handFullyVisible,
  handSize,
  POSITION_MESSAGES,
  positionStatus,
} from '../src/ui/positioning.js';

describe('positionStatus', () => {
  it('pede as duas mãos, depois que se afaste, depois libera', () => {
    expect(positionStatus(0, true)).toBe('none');
    expect(positionStatus(1, true)).toBe('one');
    expect(positionStatus(2, false)).toBe('cut');
    expect(positionStatus(2, true)).toBe('ok');
    for (const s of ['none', 'one', 'cut', 'close', 'ok'])
      expect(POSITION_MESSAGES[s]).toBeTruthy();
  });
});

describe('perto demais', () => {
  it('pede para se afastar quando a mão está grande demais na tela', () => {
    const view = { width: 1896, height: 926 };
    const hand = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
    hand[0] = { x: 0.5, y: 0.86 };
    hand[9] = { x: 0.5, y: 0.5 };
    expect(handSize(hand, view)).toBeCloseTo(0.36);
    expect(positionStatus(2, true, handSize(hand, view))).toBe('close');
    expect(positionStatus(2, true, 0.15)).toBe('ok');
  });
});

describe('handFullyVisible', () => {
  it('exige todos os pontos longe da borda', () => {
    expect(
      handFullyVisible(
        [
          { x: 0.5, y: 0.5 },
          { x: 0.9, y: 0.9 },
        ],
        0.02,
      ),
    ).toBe(true);
    expect(
      handFullyVisible(
        [
          { x: 0.5, y: 0.5 },
          { x: 0.99, y: 0.5 },
        ],
        0.02,
      ),
    ).toBe(false);
    expect(handFullyVisible([{ x: 0.5, y: 1.1 }], 0.02)).toBe(false);
  });
});

describe('createPositionHold', () => {
  it('fica pronto só depois de holdMs seguidos com status ok', () => {
    const hold = createPositionHold(1000);
    expect(hold('ok', 0)).toEqual({ progress: 0, ready: false });
    expect(hold('ok', 500).progress).toBeCloseTo(0.5);
    expect(hold('cut', 600)).toEqual({ progress: 0, ready: false });
    expect(hold('ok', 700).ready).toBe(false);
    expect(hold('ok', 1700)).toEqual({ progress: 1, ready: true });
  });
});
