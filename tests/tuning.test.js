import { describe, expect, it } from 'vitest';
import { HIT } from '../src/config.js';
import { adjustTuning, defaultTuning, describeTuning } from '../src/tuning.js';

describe('tuning', () => {
  it('começa nos valores de config.js', () => {
    expect(defaultTuning()).toMatchObject({ mode: HIT.mode, stickReach: HIT.stickReach });
  });

  it('no dedão, ] sobe o ponto em direção à ponta e [ desce', () => {
    const t = { ...defaultTuning(), controlPoint: 'thumb', thumbOffset: 0.25 };
    expect(adjustTuning(t, ']').thumbOffset).toBe(0.2);
    expect(adjustTuning(t, '[').thumbOffset).toBe(0.3);
  });

  it('9 e 0 mudam a predição em 10 ms, sem ficar negativa', () => {
    const t = { ...defaultTuning(), predictMs: 0 };
    expect(adjustTuning(t, '0').predictMs).toBe(10);
    expect(adjustTuning(t, '9').predictMs).toBe(0);
  });

  it('[ e ] mudam o alcance da baqueta em 0,1 dentro dos limites', () => {
    let t = { ...defaultTuning(), controlPoint: 'stick', stickReach: 1.3 };
    t = adjustTuning(t, ']');
    expect(t.stickReach).toBe(1.4);
    for (let i = 0; i < 30; i++) t = adjustTuning(t, ']');
    expect(t.stickReach).toBe(2.2);
    for (let i = 0; i < 30; i++) t = adjustTuning(t, '[');
    expect(t.stickReach).toBe(0.8);
  });

  it(', e . mudam o limiar; K e O alternam ponto e modo', () => {
    const t = { ...defaultTuning(), mode: 'stroke', controlPoint: 'stick', downVelocity: 1 };
    expect(adjustTuning(t, '.').downVelocity).toBe(1.1);
    expect(adjustTuning(t, ',').downVelocity).toBe(0.9);
    expect(adjustTuning(t, 'k').controlPoint).toBe('knuckles');
    expect(adjustTuning({ ...t, controlPoint: 'indexTip' }, 'k').controlPoint).toBe('thumb');
    expect(adjustTuning(t, 'o').mode).toBe('lowestPoint');
    expect(adjustTuning(t, 'x')).toBeNull();
    expect(describeTuning(t)).toContain('stick 1.3');
  });
});
