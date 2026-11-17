import { describe, expect, it } from 'vitest';
import { createHitDetector } from '../src/hitDetector.js';
import { sample, stroke, strokes } from './helpers/trajectories.js';

// Duas peças de teste: caixa no meio-esquerda, prato à direita.
const pieceAt = ({ x, y }) => {
  if (x >= 0.3 && x <= 0.5 && y >= 0.5 && y <= 0.7) return 'snare';
  if (x >= 0.6 && x <= 0.8 && y >= 0.5 && y <= 0.7) return 'crash';
  return null;
};

/** Roda uma mão (id 1) pela sequência e devolve os golpes. */
function run(frames, config) {
  const det = createHitDetector({ pieceAt, config });
  return frames.flatMap(({ t, point }) => det.update(t, point ? [{ id: 1, point }] : []));
}

describe('hitDetector: uma mão', () => {
  it('descida rápida sobre a peça gera exatamente um golpe', () => {
    const hits = run(sample(stroke({ at: 100 }), { durationMs: 800 }));
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ handId: 1, pieceId: 'snare' });
    expect(hits[0].velocity).toBeGreaterThan(1.2);
  });

  it('descida lenta não dispara', () => {
    const hits = run(sample(stroke({ at: 100, downMs: 900, upMs: 900 }), { durationMs: 2500 }));
    expect(hits).toHaveLength(0);
  });

  it('tremor parado dentro da peça não dispara', () => {
    const tremor = (t) => ({ x: 0.4, y: 0.6 + 0.01 * Math.sin((2 * Math.PI * 8 * t) / 1000) });
    expect(run(sample(tremor, { durationMs: 3000 }))).toHaveLength(0);
  });

  it('descida rápida fora de qualquer peça não dispara', () => {
    expect(run(sample(stroke({ x: 0.1, at: 100 }), { durationMs: 800 }))).toHaveLength(0);
  });

  it('dois golpes separados geram dois eventos', () => {
    const pos = strokes([{ at: 100 }, { at: 600 }]);
    const hits = run(sample(pos, { durationMs: 1200 }));
    expect(hits.map((h) => h.pieceId)).toEqual(['snare', 'snare']);
    expect(hits[1].t - hits[0].t).toBeGreaterThan(400);
  });

  it('não dispara duas vezes num golpe que atravessa a peça inteira', () => {
    // Desce de 0.3 até 0.95, passando por toda a zona da caixa (0.5 a 0.7).
    const hits = run(sample(stroke({ at: 100, bottom: 0.95, downMs: 200 }), { durationMs: 800 }));
    expect(hits).toHaveLength(1);
  });

  it('respeita o intervalo mínimo entre golpes da mesma mão', () => {
    // Segundo golpe começa 60 ms depois do primeiro: rápido demais.
    const pos = strokes([
      { at: 100, top: 0.45, downMs: 40, upMs: 20 },
      { at: 160, top: 0.45, downMs: 40, upMs: 20 },
    ]);
    const hits = run(sample(pos, { fps: 120, durationMs: 400 }));
    expect(hits).toHaveLength(1);
  });

  it('usa o tempo dos quadros: o mesmo golpe dispara uma vez a 15, 30 e 60 FPS', () => {
    for (const fps of [15, 30, 60]) {
      expect(run(sample(stroke({ at: 100 }), { fps, durationMs: 800 }))).toHaveLength(1);
      expect(
        run(sample(stroke({ at: 100, downMs: 900, upMs: 900 }), { fps, durationMs: 2500 })),
      ).toHaveLength(0);
    }
  });

  it('mão que some e reaparece mais abaixo dentro da peça não vira golpe falso', () => {
    const pos = (t) => {
      if (t < 300) return { x: 0.4, y: 0.3 };
      if (t < 600) return null;
      return { x: 0.4, y: 0.6 };
    };
    expect(run(sample(pos, { durationMs: 1000 }))).toHaveLength(0);
  });

  it('pega golpe rápido que atravessa a peça entre dois quadros', () => {
    // A 15 FPS, a mão pula de cima para baixo da zona de 0.5 a 0.7 em um quadro.
    const frames = [
      { t: 0, point: { x: 0.4, y: 0.3 } },
      { t: 66, point: { x: 0.4, y: 0.42 } },
      { t: 133, point: { x: 0.4, y: 0.8 } },
    ];
    expect(run(frames)).toHaveLength(1);
  });
});

describe('hitDetector: duas mãos', () => {
  it('cada mão toca a sua peça de forma independente', () => {
    const left = stroke({ x: 0.4, at: 100 });
    const right = stroke({ x: 0.7, at: 110 });
    const det = createHitDetector({ pieceAt });
    const hits = [];
    for (const { t } of sample(() => null, { durationMs: 800 })) {
      hits.push(
        ...det.update(t, [
          { id: 1, point: left(t) },
          { id: 2, point: right(t) },
        ]),
      );
    }
    expect(hits.map((h) => [h.handId, h.pieceId])).toEqual([
      [1, 'snare'],
      [2, 'crash'],
    ]);
  });

  it('o intervalo mínimo é por mão: as duas podem bater juntas', () => {
    const det = createHitDetector({ pieceAt });
    const left = stroke({ x: 0.4, at: 100 });
    const right = stroke({ x: 0.45, at: 100 });
    const hits = [];
    for (const { t } of sample(() => null, { durationMs: 800 })) {
      hits.push(
        ...det.update(t, [
          { id: 1, point: left(t) },
          { id: 2, point: right(t) },
        ]),
      );
    }
    expect(hits).toHaveLength(2);
    expect(new Set(hits.map((h) => h.handId))).toEqual(new Set([1, 2]));
  });
});

describe('hitDetector: modo ponto mais baixo', () => {
  it('dispara uma vez, quando a descida para, depois do modo por velocidade', () => {
    const frames = sample(stroke({ at: 100 }), { fps: 60, durationMs: 800 });
    const byVelocity = run(frames, { mode: 'velocity' });
    const byLowest = run(frames, { mode: 'lowestPoint' });
    expect(byLowest).toHaveLength(1);
    expect(byLowest[0].pieceId).toBe('snare');
    expect(byLowest[0].t).toBeGreaterThan(byVelocity[0].t);
    // O ponto mais baixo do golpe sintético é em 100 + 150 ms.
    expect(byLowest[0].t).toBeGreaterThanOrEqual(230);
    expect(byLowest[0].t).toBeLessThanOrEqual(280);
  });

  it('dois golpes separados geram dois eventos também no modo ponto mais baixo', () => {
    const pos = strokes([{ at: 100 }, { at: 600 }]);
    expect(run(sample(pos, { durationMs: 1200 }), { mode: 'lowestPoint' })).toHaveLength(2);
  });
});

describe('hitDetector: estados', () => {
  it('expõe velocidade e peça de cada mão para o debug', () => {
    const det = createHitDetector({ pieceAt });
    det.update(0, [{ id: 7, point: { x: 0.4, y: 0.5 } }]);
    det.update(100, [{ id: 7, point: { x: 0.4, y: 0.6 } }]);
    const [s] = det.states();
    expect(s.id).toBe(7);
    expect(s.vy).toBeCloseTo(1, 5);
    expect(s.pieceId).toBe('snare');
  });
});
