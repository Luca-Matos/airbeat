import { describe, expect, it } from 'vitest';
import { createHandAssociation } from '../src/handAssociation.js';
import { controlPoint, stickPoints } from '../src/landmarks.js';
import { toStage } from '../src/render.js';

describe('createHandAssociation', () => {
  it('mantém o id de cada mão mesmo se o MediaPipe trocar a ordem', () => {
    const associate = createHandAssociation();
    const a = associate(0, [
      { x: 0.2, y: 0.5 },
      { x: 0.8, y: 0.5 },
    ]);
    const b = associate(33, [
      { x: 0.79, y: 0.52 },
      { x: 0.21, y: 0.49 },
    ]);
    expect(b[0].id).toBe(a[1].id);
    expect(b[1].id).toBe(a[0].id);
  });

  it('dá id novo a uma mão que aparece longe ou depois de muito tempo', () => {
    const associate = createHandAssociation({ maxJump: 0.25, forgetAfterMs: 300 });
    const [first] = associate(0, [{ x: 0.2, y: 0.5 }]);
    const [far] = associate(33, [{ x: 0.9, y: 0.5 }]);
    expect(far.id).not.toBe(first.id);
    const [late] = associate(1000, [{ x: 0.9, y: 0.5 }]);
    expect(late.id).not.toBe(far.id);
  });

  it('golpe rápido a 15 FPS continua sendo a mesma mão (o detector não perde a velocidade)', () => {
    const associate = createHandAssociation();
    const [a] = associate(0, [{ x: 0.4, y: 0.3 }]);
    // Pico do golpe sintético padrão (3,7 alturas/s) em 66 ms: ~0,25 de deslocamento.
    const [b] = associate(66, [{ x: 0.4, y: 0.55 }]);
    expect(b.id).toBe(a.id);
  });

  it('lembra a mão durante uma perda curta', () => {
    const associate = createHandAssociation({ forgetAfterMs: 300 });
    const [a] = associate(0, [{ x: 0.5, y: 0.5 }]);
    associate(33, []);
    const [b] = associate(200, [{ x: 0.52, y: 0.5 }]);
    expect(b.id).toBe(a.id);
  });
});

describe('controlPoint', () => {
  const hand = Array.from({ length: 21 }, (_, i) => ({ x: i / 100, y: i / 50 }));

  it('palma = média do punho e da base dos quatro dedos', () => {
    const p = controlPoint(hand, 'palm');
    const ids = [0, 5, 9, 13, 17];
    expect(p.x).toBeCloseTo(ids.reduce((s, i) => s + i / 100, 0) / 5);
    expect(p.y).toBeCloseTo(ids.reduce((s, i) => s + i / 50, 0) / 5);
  });

  it('baqueta: ponta na reta pulso -> nós dos dedos, proporcional ao tamanho da mão', () => {
    // Pulso em (0.5, 0.8), nós dos dedos em (0.5, 0.6): mão "de pé", dedos para cima.
    const h = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.6 }));
    h[0] = { x: 0.5, y: 0.8 };
    const { base, tip } = stickPoints(h, 1.3);
    expect(tip.x).toBeCloseTo(0.5);
    expect(tip.y).toBeCloseTo(0.8 - 1.3 * 0.2);
    // A base é o centro da palma (inclui o pulso), abaixo da ponta.
    expect(base.y).toBeGreaterThan(tip.y);
    expect(controlPoint(h, 'stick', 1.3)).toEqual(tip);
    expect(controlPoint(h, 'knuckles').y).toBeCloseTo(0.6);
  });

  it('ponta do indicador = ponto 8', () => {
    expect(controlPoint(hand, 'indexTip')).toEqual({ x: 0.08, y: 0.16 });
  });
});

describe('toStage', () => {
  it('normaliza pela área visível e respeita o espelho', () => {
    const view = {
      videoWidth: 640,
      videoHeight: 480,
      width: 1280,
      height: 960,
      fit: 'cover',
      mirrored: true,
    };
    expect(toStage({ x: 0.25, y: 0.5 }, view)).toEqual({ x: 0.75, y: 0.5 });
  });
});
