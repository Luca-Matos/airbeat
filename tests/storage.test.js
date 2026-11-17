import { describe, expect, it } from 'vitest';
import { load, save } from '../src/storage.js';

function memoryStore() {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
}

const broken = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
};

describe('storage', () => {
  it('salva e lê de volta', () => {
    const store = memoryStore();
    expect(save('bpm', 95, store)).toBe(true);
    expect(load('bpm', 80, store)).toBe(95);
  });

  it('usa o padrão quando não há valor, quando o valor está corrompido ou sem storage', () => {
    const store = memoryStore();
    expect(load('nada', 80, store)).toBe(80);
    store.setItem('airbeat:bpm', '{quebrado');
    expect(load('bpm', 80, store)).toBe(80);
    expect(load('bpm', 80, undefined)).toBe(80);
  });

  it('não lança erro quando o navegador bloqueia o localStorage', () => {
    expect(load('bpm', 80, broken)).toBe(80);
    expect(save('bpm', 90, broken)).toBe(false);
  });
});
