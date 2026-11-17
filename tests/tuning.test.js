import { describe, expect, it } from 'vitest';
import { HIT } from '../src/config.js';
import { adjustTuning, defaultTuning, describeTuning } from '../src/tuning.js';

describe('tuning', () => {
  it('começa nos valores de config.js', () => {
    expect(defaultTuning()).toMatchObject({ mode: HIT.mode, stickReach: HIT.stickReach });
  });

  it('[ e ] mudam o alcance em 0,1 dentro dos limites', () => {
    let t = { ...defaultTuning(), stickReach: 1.3 };
    t = adjustTuning(t, ']');
    expect(t.stickReach).toBe(1.4);
    for (let i = 0; i < 30; i++) t = adjustTuning(t, ']');
    expect(t.stickReach).toBe(2.2);
    for (let i = 0; i < 30; i++) t = adjustTuning(t, '[');
    expect(t.stickReach).toBe(0.8);
  });

  it(', e . mudam o limiar; K e O alternam ponto e modo', () => {
    const t = { mode: 'stroke', controlPoint: 'stick', stickReach: 1.3, downVelocity: 1 };
    expect(adjustTuning(t, '.').downVelocity).toBe(1.1);
    expect(adjustTuning(t, ',').downVelocity).toBe(0.9);
    expect(adjustTuning(t, 'k').controlPoint).toBe('knuckles');
    expect(adjustTuning(t, 'o').mode).toBe('lowestPoint');
    expect(adjustTuning(t, 'x')).toBeNull();
    expect(describeTuning(t)).toContain('stick 1.3');
  });
});
