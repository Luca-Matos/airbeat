import { describe, expect, it } from 'vitest';
import { createFrameStats, debugEnabledFromUrl } from '../src/debug.js';

describe('createFrameStats', () => {
  it('calcula FPS pelo tempo dos quadros, não pela contagem', () => {
    const stats = createFrameStats(1000);
    for (let i = 0; i <= 30; i++) stats.add(i * (1000 / 30), 10);
    expect(stats.read().fps).toBeCloseTo(30, 5);
    expect(stats.read().avgDetectMs).toBe(10);
  });

  it('descarta amostras fora da janela', () => {
    const stats = createFrameStats(1000);
    stats.add(0, 100);
    for (let t = 2000; t <= 3000; t += 50) stats.add(t, 5);
    const { fps, avgDetectMs } = stats.read();
    expect(fps).toBeCloseTo(20, 5);
    expect(avgDetectMs).toBe(5);
  });

  it('retorna zero com menos de dois quadros', () => {
    const stats = createFrameStats(1000);
    expect(stats.read().fps).toBe(0);
    stats.add(0, 7);
    expect(stats.read()).toEqual({ fps: 0, avgDetectMs: 7 });
  });
});

describe('debugEnabledFromUrl', () => {
  it('respeita ?debug=0 e ?debug=1', () => {
    expect(debugEnabledFromUrl('?debug=0')).toBe(false);
    expect(debugEnabledFromUrl('?debug=false')).toBe(false);
    expect(debugEnabledFromUrl('?debug=1')).toBe(true);
  });
});

describe('createRollingMedian', () => {
  it('mediana das últimas amostras, ignorando uma travada isolada', async () => {
    const { createRollingMedian } = await import('../src/debug.js');
    const m = createRollingMedian(5);
    expect(m.read()).toBeNull();
    [40, 42, 300, 41, 43].forEach((v) => m.add(v));
    expect(m.read()).toBe(42);
    m.add(44);
    m.add(45);
    expect(m.read()).toBe(44);
  });
});
