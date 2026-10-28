import { describe, expect, it } from 'vitest';
import { createSettledValue, handsHintText } from '../src/ui/handsHint.js';

describe('handsHintText', () => {
  it('avisa com zero ou uma mão e some com duas', () => {
    expect(handsHintText(0)).toMatch(/mãos/);
    expect(handsHintText(1)).toMatch(/uma mão/);
    expect(handsHintText(2)).toBeNull();
  });
});

describe('createSettledValue', () => {
  it('ignora uma perda de mão de poucos quadros', () => {
    const settle = createSettledValue(2, 500);
    expect(settle(2, 0)).toBe(2);
    expect(settle(1, 33)).toBe(2);
    expect(settle(2, 66)).toBe(2);
    expect(settle(2, 1000)).toBe(2);
  });

  it('troca depois que o valor novo se mantém pelo tempo pedido', () => {
    const settle = createSettledValue(2, 500);
    settle(0, 1000);
    expect(settle(0, 1499)).toBe(2);
    expect(settle(0, 1500)).toBe(0);
  });
});
