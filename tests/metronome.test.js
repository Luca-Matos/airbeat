import { describe, expect, it, vi } from 'vitest';
import { METRONOME } from '../src/config.js';
import {
  clampBpm,
  createBeatScheduler,
  currentBeat,
  startMetronome,
} from '../src/audio/metronome.js';

/** Simula o timer acordando a cada `step` s de `from` a `to` e junta as batidas. */
function runScheduler(s, from, to, step = 0.025) {
  const beats = [];
  for (let now = from; now <= to + 1e-9; now += step) beats.push(...s.due(now));
  return beats;
}

describe('createBeatScheduler', () => {
  it('agenda as batidas espaçadas exatamente por 60/BPM, sem repetir', () => {
    const s = createBeatScheduler({
      bpm: 120,
      beatsPerBar: 4,
      lookaheadSec: 0.1,
      startDelaySec: 0.1,
    });
    s.start(10);
    const beats = runScheduler(s, 10, 12.05);
    expect(beats.map((b) => b.time)).toEqual(
      [10.1, 10.6, 11.1, 11.6, 12.1].map((t) => expect.closeTo(t, 9)),
    );
    expect(beats.map((b) => b.beat)).toEqual([0, 1, 2, 3, 0]);
    expect(beats.map((b) => b.accent)).toEqual([true, false, false, false, true]);
  });

  it('agenda com antecedência: a batida sai antes de chegar a hora dela', () => {
    const s = createBeatScheduler({ bpm: 60, lookaheadSec: 0.1, startDelaySec: 0.5 });
    s.start(0);
    expect(s.due(0.3)).toEqual([]);
    const [beat] = s.due(0.41);
    expect(beat.time).toBeCloseTo(0.5);
  });

  it('timer atrasado não muda o tempo das batidas (o relógio do áudio manda)', () => {
    const regular = createBeatScheduler({ bpm: 100 });
    const jittery = createBeatScheduler({ bpm: 100 });
    regular.start(0);
    jittery.start(0);
    const a = runScheduler(regular, 0, 5, 0.025);
    // Acordadas irregulares, entre 5 e 60 ms.
    const b = [];
    let now = 0;
    let i = 0;
    while (now <= 5) {
      b.push(...jittery.due(now));
      now += [0.005, 0.06, 0.03, 0.045][i++ % 4];
    }
    expect(b.map((x) => x.time).slice(0, a.length - 1)).toEqual(
      a.map((x) => x.time).slice(0, a.length - 1),
    );
  });

  it('mudar o BPM vale a partir da próxima batida ainda não agendada', () => {
    const s = createBeatScheduler({ bpm: 60, lookaheadSec: 0.1, startDelaySec: 0 });
    s.start(0);
    const first = runScheduler(s, 0, 1.0);
    expect(first.map((b) => b.time)).toEqual([0, 1].map((t) => expect.closeTo(t, 9)));
    s.setBpm(120);
    const next = runScheduler(s, 1.025, 3);
    // A batida em 1 s já estava agendada; a próxima vem 0,5 s depois dela.
    expect(next.map((b) => b.time)).toEqual([1.5, 2, 2.5, 3].map((t) => expect.closeTo(t, 9)));
  });

  it('depois de a aba congelar, pula as batidas perdidas em vez de tocar todas juntas', () => {
    const s = createBeatScheduler({ bpm: 120, lookaheadSec: 0.1, startDelaySec: 0 });
    s.start(0);
    s.due(0);
    // Volta em 10,02 s: as batidas de 0,5 a 10 s se perderam e não devem tocar.
    expect(s.due(10.02)).toEqual([]);
    const beats = s.due(10.45);
    expect(beats).toHaveLength(1);
    // Mantém a fase (múltiplo de 0,5 s) e a contagem do compasso (21ª batida = tempo 2).
    expect(beats[0].time).toBeCloseTo(10.5, 9);
    expect(beats[0].beat).toBe(1);
  });
});

describe('clampBpm', () => {
  it('limita à faixa e arredonda', () => {
    expect(clampBpm(10)).toBe(METRONOME.minBpm);
    expect(clampBpm(1000)).toBe(METRONOME.maxBpm);
    expect(clampBpm(92.6)).toBe(93);
    expect(clampBpm(NaN)).toBe(METRONOME.defaultBpm);
  });
});

describe('currentBeat', () => {
  it('devolve a última batida que já soou', () => {
    const beats = [
      { time: 1, beat: 0, accent: true },
      { time: 2, beat: 1, accent: false },
    ];
    expect(currentBeat(beats, 0.5)).toBeNull();
    expect(currentBeat(beats, 1.5)?.beat).toBe(0);
    expect(currentBeat(beats, 2)?.beat).toBe(1);
  });
});

describe('startMetronome', () => {
  it('toca clique acentuado no tempo 1 e normal nos outros, no instante agendado', () => {
    let audioNow = 5;
    let tick;
    const engine = { now: () => audioNow, play: vi.fn() };
    const m = startMetronome(engine, {
      bpm: 120,
      setInterval: (fn) => {
        tick = fn;
        return 1;
      },
      clearInterval: vi.fn(),
    });
    for (; audioNow < 7.2; audioNow += 0.025) tick();
    const calls = engine.play.mock.calls;
    expect(calls[0][0]).toBe('clickAccent');
    expect(calls[1][0]).toBe('click');
    expect(calls[4][0]).toBe('clickAccent');
    expect(calls[1][1] - calls[0][1]).toBeCloseTo(0.5, 9);
    expect(m.beatAt(calls[1][1] + 0.01)?.beat).toBe(1);
    m.stop();
  });
});
