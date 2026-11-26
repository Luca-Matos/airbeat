// Camada fina sobre a Web Audio API: cria o AudioContext, gera os buffers de todos
// os sons no carregamento e toca cada peça com um AudioBufferSourceNode novo.
import { AUDIO, SOUNDS } from '../config.js';
import { LIMITER_HEADROOM, renderSound, softLimiterCurve } from './synth.js';

/** @typedef {keyof typeof SOUNDS} SoundId */

/**
 * PURO. Converte um instante do relógio da página (performance.now, em ms) para o relógio
 * do áudio no instante OUVIDO: um clique agendado para T é ouvido quando este valor é T.
 * Assim golpe e clique ficam na mesma régua, com a latência de saída já descontada.
 * @param {{ contextTime: number, performanceTime: number } | undefined} stamp getOutputTimestamp()
 * @param {number} perfMs
 * @param {{ currentTime: number, outputLatencySec: number, perfNow: number }} fallback sem stamp
 * @returns {number} s
 */
export function heardTime(stamp, perfMs, fallback) {
  if (stamp && stamp.performanceTime > 0) {
    return stamp.contextTime + (perfMs - stamp.performanceTime) / 1000;
  }
  return fallback.currentTime - fallback.outputLatencySec + (perfMs - fallback.perfNow) / 1000;
}

/**
 * Precisa ser chamado DENTRO de um clique do usuário (botão Começar): o navegador
 * só deixa o áudio tocar depois de um gesto, e o iOS exige o resume() no mesmo evento.
 * @param {{ AudioContextClass?: typeof AudioContext }} [env] injetável para testes
 */
export function createAudioEngine(env = {}) {
  const AudioContextClass =
    env.AudioContextClass ?? globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Este navegador não tem Web Audio.');
  const ctx = new AudioContextClass({ latencyHint: AUDIO.latencyHint });
  // resume() logo aqui, ainda dentro do gesto do usuário.
  const ready = Promise.resolve(ctx.resume?.()).catch((err) => console.warn('Áudio suspenso', err));

  const master = ctx.createGain();
  // Dividido pela folga do limitador; a curva devolve o nível original (ver synth.js).
  master.gain.value = AUDIO.masterGain / LIMITER_HEADROOM;
  // WaveShaper não tem atraso de análise, diferente do DynamicsCompressor (~6 ms).
  const limiter = ctx.createWaveShaper();
  limiter.curve = softLimiterCurve(AUDIO.limiterKnee);
  master.connect(limiter);
  limiter.connect(ctx.destination);

  /** @type {Record<string, AudioBuffer>} */
  const buffers = {};
  Object.entries(SOUNDS).forEach(([id, recipe], i) => {
    const data = renderSound(recipe, ctx.sampleRate, i + 1);
    const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
    buffer.copyToChannel(data, 0);
    buffers[id] = buffer;
  });

  return {
    ctx,
    /** Promessa do resume() feito no gesto; aguardar antes de agendar o metrônomo. */
    ready,
    /**
     * Toca um som agora (when = 0) ou num instante do relógio do áudio, em segundos.
     * @param {SoundId} id
     * @param {number} [when]
     * @returns {AudioBufferSourceNode | null} para cancelar um som agendado (stop)
     */
    play(id, when = 0) {
      const buffer = buffers[id];
      if (!buffer) return null;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(master);
      src.start(when);
      return src;
    },
    /**
     * Instante ouvido no relógio do áudio (s) para um instante da página (ms). Ver heardTime.
     * @param {number} perfMs
     */
    heardTimeAt(perfMs) {
      const latency = (ctx.baseLatency ?? 0) + (ctx.outputLatency ?? 0);
      return heardTime(ctx.getOutputTimestamp?.(), perfMs, {
        currentTime: ctx.currentTime,
        outputLatencySec: latency,
        perfNow: performance.now(),
      });
    },
    /** Relógio do áudio, em segundos. */
    now: () => ctx.currentTime,
    /** Atraso estimado entre agendar e o som sair do alto-falante, em ms (o que o navegador informa). */
    outputLatencyMs: () => ((ctx.baseLatency ?? 0) + (ctx.outputLatency ?? 0)) * 1000,
    /** Retoma se o navegador suspendeu (aba em segundo plano, fone desconectado). */
    resume: () => (ctx.state === 'suspended' ? ctx.resume().catch(() => {}) : Promise.resolve()),
    close: () => ctx.close().catch(() => {}),
  };
}
