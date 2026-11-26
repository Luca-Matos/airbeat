import { describe, expect, it } from 'vitest';
import { SCORING } from '../src/config.js';
import {
  calibrationOffset,
  classify,
  createJudge,
  median,
  summarize,
  tendencyText,
  verdict,
} from '../src/scoring.js';

const target = (id, time, pieceId = 'snare') => ({ id, time, pieceId });

describe('classify (fronteiras das janelas)', () => {
  it.each([
    [0, 'perfect'],
    [SCORING.perfectMs, 'perfect'],
    [-SCORING.perfectMs, 'perfect'],
    [SCORING.perfectMs + 1, 'good'],
    [SCORING.goodMs, 'good'],
    [-SCORING.goodMs, 'good'],
    [SCORING.goodMs + 1, 'miss'],
    [-SCORING.goodMs - 1, 'miss'],
  ])('%d ms -> %s', (diff, grade) => {
    expect(classify(diff)).toBe(grade);
  });
});

describe('median', () => {
  it('ignora valores isolados (diferente da média)', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 400])).toBe(2.5);
  });
});

describe('createJudge', () => {
  it('casa cada golpe com o alvo mais próximo da mesma peça', () => {
    const judge = createJudge([target(0, 1), target(1, 2)]);
    expect(judge.hit('snare', 1.03)).toMatchObject({ grade: 'perfect', target: { id: 0 } });
    expect(judge.hit('snare', 1.93)).toMatchObject({ grade: 'good', target: { id: 1 } });
    expect(judge.hit('snare', 1.93)?.diffMs).toBeUndefined();
    expect(judge.summary()).toMatchObject({ perfect: 1, good: 1, miss: 0, extras: 1 });
  });

  it('golpe na peça errada ou fora da janela é extra e não usa o alvo', () => {
    const judge = createJudge([target(0, 1)]);
    expect(judge.hit('tom', 1)).toBeNull();
    expect(judge.hit('snare', 1.2)).toBeNull();
    expect(judge.resultOf(0)).toBeNull();
    expect(judge.hit('snare', 0.98)).toMatchObject({ grade: 'perfect' });
  });

  it('cada alvo aceita um golpe só (toque duplo não conta duas vezes)', () => {
    const judge = createJudge([target(0, 1)]);
    judge.hit('snare', 1);
    expect(judge.hit('snare', 1.04)).toBeNull();
    expect(judge.summary()).toMatchObject({ perfect: 1, extras: 1, total: 1 });
  });

  it('alvos simultâneos em peças diferentes são julgados separados', () => {
    const judge = createJudge([target(0, 1, 'hihat'), target(1, 1, 'snare')]);
    expect(judge.hit('snare', 1.01)?.target.id).toBe(1);
    expect(judge.hit('hihat', 1.02)?.target.id).toBe(0);
  });

  it('alvo sem golpe vira "errou" só depois que a janela fecha', () => {
    const judge = createJudge([target(0, 1), target(1, 2)]);
    expect(judge.expire(1.09)).toEqual([]);
    const missed = judge.expire(1.2);
    expect(missed.map((m) => m.target.id)).toEqual([0]);
    expect(missed[0]).toMatchObject({ grade: 'miss', diffMs: null });
    expect(judge.expire(1.3)).toEqual([]);
  });

  it('desconta o deslocamento da calibragem', () => {
    // A pessoa + o sistema batem 80 ms depois do clique; calibrado, isso é perfeito.
    const judge = createJudge([target(0, 1)], { offsetMs: 80 });
    expect(judge.hit('snare', 1.08)).toMatchObject({ grade: 'perfect' });
    expect(judge.hit('snare', 1.08)).toBeNull();
    const late = createJudge([target(0, 1)], { offsetMs: 80 });
    expect(late.expire(1.15)).toEqual([]);
    expect(late.expire(1.19)).toHaveLength(1);
  });
});

describe('summarize, verdict e tendência', () => {
  it('nota: perfeito vale 1, bom vale meio, errou zero', () => {
    const t = target(0, 0);
    const s = summarize(
      [
        { target: t, grade: 'perfect', diffMs: -10 },
        { target: t, grade: 'good', diffMs: -70 },
        { target: t, grade: 'miss', diffMs: null },
      ],
      4,
      2,
    );
    expect(s).toMatchObject({ total: 4, perfect: 1, good: 1, miss: 2, extras: 2, score: 38 });
    expect(s.tendencyMs).toBe(-40);
    expect(summarize([], 0, 0).score).toBe(0);
  });

  it('frases por faixa de nota e tendência', () => {
    expect(verdict({ score: 95 })).toMatch(/Excelente/);
    expect(verdict({ score: 10 })).toMatch(/praticando/);
    expect(tendencyText(null)).toBeNull();
    expect(tendencyText(10)).toBeNull();
    expect(tendencyText(-45)).toMatch(/antes/);
    expect(tendencyText(45)).toMatch(/45 ms depois/);
  });
});

describe('calibrationOffset', () => {
  const rules = { outlierMs: 150, minValid: 8, maxOffsetMs: 300 };

  it('é a mediana das diferenças, ignorando erros isolados', () => {
    const diffs = [90, 100, 110, 95, 105, 100, 98, 102, 600, -400];
    expect(calibrationOffset(diffs, rules)).toEqual({ ok: true, offsetMs: 100, used: 8 });
  });

  it('recusa com poucos golpes válidos ou deslocamento absurdo', () => {
    expect(calibrationOffset([], rules)).toMatchObject({ ok: false, reason: 'poucos' });
    expect(calibrationOffset([100, 100, 100], rules)).toMatchObject({
      ok: false,
      reason: 'poucos',
    });
    expect(calibrationOffset(Array(10).fill(350), rules)).toMatchObject({
      ok: false,
      reason: 'fora',
    });
  });
});
