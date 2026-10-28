import { describe, expect, it } from 'vitest';
import { createMonotonicClock } from '../src/frameLoop.js';

describe('createMonotonicClock', () => {
  it('repassa tempos que já crescem', () => {
    const clock = createMonotonicClock();
    expect([10, 43, 76].map(clock)).toEqual([10, 43, 76]);
  });

  it('nunca repete nem volta, mesmo com tempo repetido ou recuando', () => {
    const clock = createMonotonicClock(1);
    const out = [100, 100, 99, 50, 200].map(clock);
    expect(out).toEqual([100, 101, 102, 103, 200]);
    for (let i = 1; i < out.length; i++) expect(out[i]).toBeGreaterThan(out[i - 1]);
  });
});
