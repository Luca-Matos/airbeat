import { describe, expect, it } from 'vitest';
import { DRUM_KIT, LESSON } from '../src/config.js';
import { countInNumber, planSession } from '../src/lessonPlan.js';
import { LESSONS } from '../src/lessons/lessons.js';

const pieceIds = new Set(DRUM_KIT.pieces.map((p) => p.id));

describe('lições (dados)', () => {
  it('há as lições 1 a 3, em ordem, com ids únicos', () => {
    expect(LESSONS.map((l) => l.number)).toEqual([1, 2, 3]);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it.each(LESSONS)('lição $number usa só peças que existem e cabe no compasso', (lesson) => {
    expect(lesson.pattern.length).toBeGreaterThan(0);
    for (const note of lesson.pattern) {
      expect(pieceIds.has(note.piece), note.piece).toBe(true);
      expect(note.beat).toBeGreaterThanOrEqual(0);
      expect(note.beat).toBeLessThan(lesson.beatsPerBar);
    }
  });

  it.each(LESSONS)('lição $number dura entre 10 e 60 s (experiência total de 5 a 15 min)', (l) => {
    const plan = planSession(l, 0);
    expect(plan.endTime).toBeGreaterThan(10);
    expect(plan.endTime).toBeLessThan(60);
  });
});

describe('planSession', () => {
  const lesson = LESSONS[0];

  it('conta um compasso e depois põe um alvo por tempo, no relógio do áudio', () => {
    const plan = planSession(lesson, 10, { bpm: 60 });
    expect(plan.clicks).toHaveLength(LESSON.countInBeats + 16);
    expect(plan.clicks.slice(0, LESSON.countInBeats).every((c) => c.countIn)).toBe(true);
    expect(plan.firstTargetTime).toBe(10 + LESSON.countInBeats);
    expect(plan.targets.map((t) => t.time)).toEqual(Array.from({ length: 16 }, (_, i) => 14 + i));
    expect(plan.targets.every((t) => t.pieceId === 'snare')).toBe(true);
    expect(plan.endTime).toBe(10 + 20);
  });

  it('acentua o primeiro tempo de cada compasso', () => {
    const plan = planSession(lesson, 0, { bpm: 60 });
    expect(plan.clicks.filter((c) => c.accent).map((c) => c.time)).toEqual([0, 4, 8, 12, 16]);
  });

  it('colcheias e notas juntas ficam em ordem e com ids sequenciais', () => {
    const plan = planSession(LESSONS[2], 0, { bpm: 60 });
    const times = plan.targets.map((t) => t.time);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(plan.targets.map((t) => t.id)).toEqual(times.map((_, i) => i));
    const atBeat2 = plan.targets.filter((t) => t.time === 5).map((t) => t.pieceId);
    expect(atBeat2.sort()).toEqual(['hihat', 'snare']);
    expect(planSession(LESSONS[1], 0, { bpm: 60 }).targets[1]).toMatchObject({
      time: 4.5,
      hand: 'E',
    });
  });

  it('mostra 1, 2, 3, 4 só durante a contagem', () => {
    const plan = planSession(lesson, 0, { bpm: 60 });
    expect([-0.1, 0, 1.5, 3.9, 4].map((t) => countInNumber(plan, t))).toEqual([
      null,
      1,
      2,
      4,
      null,
    ]);
  });
});
