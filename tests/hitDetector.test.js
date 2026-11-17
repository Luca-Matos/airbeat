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

  it('descida muito lenta (pico abaixo de downVelocity) não dispara', () => {
    // Pico = 0,35 * π / (2 * 1,6 s) ≈ 0,34/s: mão sendo reposicionada, não golpe.
    const hits = run(sample(stroke({ at: 100, downMs: 1600, upMs: 1600 }), { durationMs: 3600 }));
    expect(hits).toHaveLength(0);
  });

  it('golpe curto e controlado (lento, mas com curso) toca', () => {
    // Curso de 5% da tela em 130 ms: pico = 0,05 * π / (2 * 0,13 s) ≈ 0,6/s, abaixo de
    // fastVelocity, como os golpes da gravação de precisão de 17/11.
    const hits = run(
      sample(stroke({ at: 100, top: 0.55, bottom: 0.6, downMs: 130, upMs: 200 }), {
        durationMs: 600,
      }),
    );
    expect(hits.map((h) => h.pieceId)).toEqual(['snare']);
  });

  it('tremor com o mesmo pico de velocidade, mas sem curso, não toca', () => {
    // ±0,9% da tela a 12 Hz: pico ≈ 0,5/s medido em quadros de 60 FPS (acima de
    // downVelocity), mas curso de 1,8%, abaixo de minTravel.
    const tremor = (t) => ({ x: 0.4, y: 0.6 + 0.009 * Math.sin((2 * Math.PI * 12 * t) / 1000) });
    expect(run(sample(tremor, { fps: 60, durationMs: 3000 }))).toHaveLength(0);
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
        run(sample(stroke({ at: 100, downMs: 1600, upMs: 1600 }), { fps, durationMs: 3600 })),
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

describe('hitDetector: modo stroke (padrão)', () => {
  // Desce rápido ACIMA da caixa e chega nela já freando: velocidade dentro da zona < limiar.
  const braking = (t) => {
    if (t < 100) return { x: 0.4, y: 0.2 };
    if (t < 200) return { x: 0.4, y: 0.2 + (0.25 * (t - 100)) / 100 }; // 2,5/s, fora da peça
    if (t < 400) return { x: 0.4, y: 0.45 + (0.12 * (t - 200)) / 200 }; // 0,6/s, entra na peça
    return { x: 0.4, y: 0.57 };
  };

  it('toca quando a mão chega à peça já freando (a peça inteira vale)', () => {
    const frames = sample(braking, { durationMs: 700 });
    expect(run(frames, { mode: 'stroke' }).map((h) => h.pieceId)).toEqual(['snare']);
    // A v1 só tocava se a velocidade dentro da peça passasse do limiar: perdia este golpe.
    expect(run(frames, { mode: 'velocity' })).toHaveLength(0);
  });

  it('uma descida toca uma peça só, mesmo atravessando outra embaixo', () => {
    const pieceAt2 = ({ x, y }) => {
      if (x >= 0.3 && x <= 0.5 && y >= 0.4 && y <= 0.55) return 'snare';
      if (x >= 0.3 && x <= 0.5 && y > 0.6 && y <= 0.8) return 'kick';
      return null;
    };
    const det = createHitDetector({ pieceAt: pieceAt2, config: { mode: 'stroke' } });
    const hits = sample(stroke({ at: 100, top: 0.2, bottom: 0.9, downMs: 250 }), {
      durationMs: 900,
    }).flatMap(({ t, point }) => det.update(t, [{ id: 1, point }]));
    expect(hits.map((h) => h.pieceId)).toEqual(['snare']);
  });

  it('golpe que só alcança a peça no fundo do movimento toca quando para', () => {
    // Desce rápido de 0,3 até 0,52 (zona da caixa começa em 0,5) e para ali.
    const frames = [0, 33, 66, 100, 133, 166, 200, 233].map((t, i) => ({
      t,
      point: { x: 0.4, y: [0.3, 0.3, 0.38, 0.46, 0.51, 0.52, 0.52, 0.52][i] },
    }));
    expect(run(frames, { mode: 'stroke', predictMs: 0 }).map((h) => h.pieceId)).toEqual(['snare']);
  });

  it('no ritmo, mão que escorrega depois do golpe e bate de novo sem subir 3% toca', () => {
    // Caso da gravação de precisão (13,1 s): golpe, mão parada escorregando para baixo,
    // sobe só 1% e bate forte de novo 600 ms depois.
    const pos = (t) => {
      if (t < 100) return { x: 0.4, y: 0.3 };
      if (t < 200) return { x: 0.4, y: 0.3 + ((t - 100) / 100) * 0.25 }; // 1º golpe, até 0,55
      if (t < 600) return { x: 0.4, y: 0.55 + ((t - 200) / 400) * 0.02 }; // escorrega até 0,57
      if (t < 680) return { x: 0.4, y: 0.57 - ((t - 600) / 80) * 0.01 }; // sobe 1%
      if (t < 740) return { x: 0.4, y: 0.56 + ((t - 680) / 60) * 0.07 }; // 2º golpe
      return { x: 0.4, y: 0.63 };
    };
    const frames = sample(pos, { durationMs: 1000 });
    expect(run(frames, { mode: 'stroke' })).toHaveLength(2);
    expect(run(frames, { mode: 'stroke', rearmMaxMs: 1e9 })).toHaveLength(1);
  });

  it('não toca com a mão subindo, mesmo dentro da peça', () => {
    // Para no fundo da caixa (sem tocar: entrou devagar) e sobe rápido.
    const pos = (t) => ({ x: 0.4, y: t < 500 ? 0.6 : Math.max(0.2, 0.6 - ((t - 500) / 1000) * 3) });
    expect(run(sample(pos, { durationMs: 900 }), { mode: 'stroke' })).toHaveLength(0);
  });

  it('predição: toca antes de a baqueta entrar na peça, quando ela vai entrar', () => {
    const frames = sample(stroke({ at: 100 }), { durationMs: 800 });
    const [plain] = run(frames, { mode: 'stroke', predictMs: 0 });
    const [early] = run(frames, { mode: 'stroke', predictMs: 40 });
    expect(early.pieceId).toBe('snare');
    expect(early.t).toBeLessThan(plain.t);
  });

  it('rearme: tremor no fundo do golpe não vira segundo golpe', () => {
    // Golpe, depois tremor de 1 cm de tela a 12 Hz parado na caixa.
    const pos = (t) =>
      t < 400
        ? stroke({ at: 100, upMs: 10000 })(t)
        : { x: 0.4, y: 0.64 + 0.01 * Math.sin(t * 0.075) };
    expect(
      run(sample(pos, { durationMs: 2000 }), { mode: 'stroke', downVelocity: 0.5 }),
    ).toHaveLength(1);
  });

  it('mão que desliza devagar para dentro da peça não toca', () => {
    const slide = (t) => ({ x: 0.1 + Math.min(1, t / 1000) * 0.3, y: 0.6 });
    expect(run(sample(slide, { durationMs: 1500 }), { mode: 'stroke' })).toHaveLength(0);
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
