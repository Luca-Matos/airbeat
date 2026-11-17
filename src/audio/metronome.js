// Metrônomo com agendamento por antecipação: um timer curto acorda a cada ~25 ms e
// agenda no relógio do áudio as batidas dos próximos ~100 ms. O som sai no instante
// exato mesmo que o timer atrase; nunca um setTimeout por batida (o tempo oscila).
import { METRONOME } from '../config.js';

/** @typedef {{ time: number, beat: number, accent: boolean }} Beat time em segundos do relógio do áudio */

/**
 * Limita e arredonda o andamento. Puro.
 * @param {number} bpm
 */
export function clampBpm(bpm) {
  if (!Number.isFinite(bpm)) return METRONOME.defaultBpm;
  return Math.min(METRONOME.maxBpm, Math.max(METRONOME.minBpm, Math.round(bpm)));
}

/**
 * PURO. Decide quais batidas agendar a cada acordada, a partir do relógio recebido.
 * @param {{ bpm?: number, beatsPerBar?: number, lookaheadSec?: number, startDelaySec?: number }} [options]
 */
export function createBeatScheduler(options = {}) {
  let bpm = clampBpm(options.bpm ?? METRONOME.defaultBpm);
  const beatsPerBar = options.beatsPerBar ?? METRONOME.beatsPerBar;
  const lookahead = options.lookaheadSec ?? METRONOME.lookaheadMs / 1000;
  const startDelay = options.startDelaySec ?? METRONOME.startDelayMs / 1000;
  /** Instante da primeira batida (definido em start). */
  let firstTime = 0;
  /** Instante da última batida já agendada; null antes da primeira. */
  /** @type {number | null} */
  let lastTime = null;
  let index = 0;

  /** A próxima sai um intervalo do andamento ATUAL depois da última agendada. */
  const nextTime = () => (lastTime === null ? firstTime : lastTime + 60 / bpm);

  return {
    get bpm() {
      return bpm;
    },
    /** @param {number} now segundos */
    start(now) {
      firstTime = now + startDelay;
      lastTime = null;
      index = 0;
    },
    /**
     * Vale já para a próxima batida ainda não agendada (as dos próximos ~100 ms
     * já estão no relógio do áudio e ficam como estavam).
     * @param {number} value
     */
    setBpm(value) {
      bpm = clampBpm(value);
    },
    /**
     * Batidas que caem antes de now + lookahead e ainda não foram agendadas.
     * @param {number} now segundos
     * @returns {Beat[]}
     */
    due(now) {
      const spb = 60 / bpm;
      // Aba em segundo plano congela o timer: ao voltar, pula as batidas perdidas
      // mantendo a fase, em vez de tocar todas de uma vez.
      if (nextTime() < now) {
        const missed = Math.ceil((now - nextTime()) / spb);
        lastTime = nextTime() + (missed - 1) * spb;
        index += missed;
      }
      /** @type {Beat[]} */
      const beats = [];
      while (nextTime() < now + lookahead) {
        const time = nextTime();
        const beat = index % beatsPerBar;
        beats.push({ time, beat, accent: beat === 0 });
        lastTime = time;
        index++;
      }
      return beats;
    },
  };
}

/**
 * PURO. Batida que está soando agora, para o indicador visual.
 * @param {Beat[]} scheduled batidas agendadas, em ordem
 * @param {number} now segundos, já descontada a latência de saída
 * @returns {Beat | null}
 */
export function currentBeat(scheduled, now) {
  let current = null;
  for (const b of scheduled) {
    if (b.time <= now) current = b;
    else break;
  }
  return current;
}

/**
 * Liga o agendador ao áudio. Camada fina: o timer é injetável para testes.
 * @param {{ now: () => number, play: (id: any, when?: number) => void }} engine
 * @param {{ bpm?: number, setInterval?: typeof setInterval, clearInterval?: typeof clearInterval }} [options]
 */
export function startMetronome(engine, options = {}) {
  const setTimer = options.setInterval ?? globalThis.setInterval;
  const clearTimer = options.clearInterval ?? globalThis.clearInterval;
  const scheduler = createBeatScheduler({ bpm: options.bpm });
  /** @type {Beat[]} */
  let scheduled = [];

  const tick = () => {
    const now = engine.now();
    for (const beat of scheduler.due(now)) {
      engine.play(beat.accent ? 'clickAccent' : 'click', beat.time);
      scheduled.push(beat);
    }
    // Guarda só o necessário para o indicador visual (as últimas batidas).
    if (scheduled.length > 8) scheduled = scheduled.slice(-8);
  };

  scheduler.start(engine.now());
  tick();
  const timer = setTimer(tick, METRONOME.timerIntervalMs);

  return {
    get bpm() {
      return scheduler.bpm;
    },
    /** @param {number} bpm */
    setBpm: (bpm) => scheduler.setBpm(bpm),
    /** @param {number} audioNow segundos @returns {Beat | null} */
    beatAt: (audioNow) => currentBeat(scheduled, audioNow),
    stop: () => clearTimer(timer),
  };
}
