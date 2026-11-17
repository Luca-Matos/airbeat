import { describe, expect, it } from 'vitest';
import { DRUM_KIT } from '../src/config.js';
import { layoutKit, pieceAt, pieceDistance } from '../src/drumKit.js';
import { flashLevel } from '../src/render.js';

describe('layoutKit', () => {
  it('monta as 5 peças: chimbal, caixa, tom, prato e bumbo', () => {
    const pieces = layoutKit(1280, 720);
    expect(pieces.map((p) => p.id)).toEqual(['hihat', 'snare', 'tom', 'crash', 'kick']);
  });

  it('peças redondas ficam redondas na tela (mesmo raio em px nos dois eixos)', () => {
    for (const [w, h] of [
      [1280, 720],
      [390, 844],
    ]) {
      for (const p of layoutKit(w, h).filter((x) => x.shape === 'circle')) {
        expect(p.hw * w).toBeCloseTo(p.hh * h, 6);
      }
    }
  });

  it('peças redondas não se sobrepõem em tela larga nem em celular em pé', () => {
    for (const [w, h] of [
      [1280, 720],
      [1920, 1080],
      [390, 844],
      [360, 640],
    ]) {
      const circles = layoutKit(w, h).filter((p) => p.shape === 'circle');
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const a = circles[i];
          const b = circles[j];
          const gap = Math.hypot((a.cx - b.cx) * w, (a.cy - b.cy) * h) - a.hw * w - b.hw * w;
          expect(gap, `${a.id}/${b.id} em ${w}x${h}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('todas as peças cabem inteiras na tela', () => {
    for (const p of layoutKit(1280, 720)) {
      expect(p.cx - p.hw).toBeGreaterThanOrEqual(0);
      expect(p.cx + p.hw).toBeLessThanOrEqual(1);
      expect(p.cy - p.hh).toBeGreaterThanOrEqual(0);
      expect(p.cy + p.hh).toBeLessThanOrEqual(1);
    }
  });
});

describe('pieceAt', () => {
  const pieces = layoutKit(1280, 720);
  const byId = Object.fromEntries(pieces.map((p) => [p.id, p]));

  it('acha a peça pelo centro e devolve null no vazio', () => {
    for (const p of pieces) expect(pieceAt(pieces, { x: p.cx, y: p.cy })).toBe(p.id);
    expect(pieceAt(pieces, { x: 0.5, y: 0.1 })).toBeNull();
  });

  it('aceita a folga de golpe além do desenho', () => {
    const snare = byId.snare;
    // Lado esquerdo: o direito encosta no bumbo e lá vale a peça mais próxima.
    const justOutside = { x: snare.cx - snare.hw * 1.1, y: snare.cy };
    expect(pieceDistance(snare, justOutside)).toBeGreaterThan(1);
    expect(pieceAt(pieces, justOutside)).toBe('snare');
    expect(pieceAt(pieces, justOutside, 1)).toBeNull();
    expect(DRUM_KIT.hitMargin).toBeGreaterThanOrEqual(1);
  });

  it('o bumbo fica no vão entre caixa e tom, abaixo delas, sem encostar nelas', () => {
    for (const [w, h] of [
      [1896, 926],
      [1280, 720],
      [1920, 1080],
    ]) {
      const p = Object.fromEntries(layoutKit(w, h).map((x) => [x.id, x]));
      expect(p.kick.cx).toBeCloseTo(0.5);
      expect(p.kick.cy).toBeGreaterThan(p.snare.cy);
      // Descida vertical até o bumbo não passa pela zona de golpe da caixa nem do tom.
      expect(p.kick.cx - p.kick.hw).toBeGreaterThan(p.snare.cx + p.snare.hw);
      expect(p.kick.cx + p.kick.hw).toBeLessThan(p.tom.cx - p.tom.hw);
      expect(pieceAt(layoutKit(w, h), { x: p.kick.cx, y: p.kick.cy })).toBe('kick');
    }
  });

  it('com a mão em joinha, bater no bumbo não tira o pulso da tela', () => {
    // O pulso fica ~0,26 da altura do palco abaixo do dedão (gravações de 17/11). O golpe
    // dispara ao entrar na peça; batendo até o meio dela, o pulso continua na tela.
    const kick = byId.kick;
    expect(kick.cy + 0.26).toBeLessThanOrEqual(1);
  });

  it('chimbal e prato ficam ao alcance (fora dos 20% das bordas) e são maiores', () => {
    expect(byId.hihat.cx).toBeGreaterThanOrEqual(0.2);
    expect(byId.crash.cx).toBeLessThanOrEqual(0.8);
    expect(byId.hihat.hw).toBeGreaterThan(byId.snare.hw);
    expect(byId.crash.hw).toBeGreaterThan(byId.snare.hw);
  });
});

describe('flashLevel', () => {
  it('vai de 1 no golpe a 0 em flashMs', () => {
    expect(flashLevel(undefined, 100)).toBe(0);
    expect(flashLevel(100, 100, 200)).toBe(1);
    expect(flashLevel(100, 200, 200)).toBeCloseTo(0.5);
    expect(flashLevel(100, 300, 200)).toBe(0);
  });
});
