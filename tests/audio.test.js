import { describe, expect, it, vi } from 'vitest';
import { SOUNDS } from '../src/config.js';
import { createAudioEngine } from '../src/audio/engine.js';
import {
  biquad,
  LIMITER_HEADROOM,
  renderSound,
  seededRandom,
  softLimiterCurve,
} from '../src/audio/synth.js';

const SR = 48000;

/** Energia média (RMS) de um trecho. */
function rms(data, from, to) {
  let s = 0;
  for (let i = from; i < to; i++) s += data[i] * data[i];
  return Math.sqrt(s / (to - from));
}

describe('renderSound', () => {
  it.each(Object.keys(SOUNDS))('%s: duração certa, sem NaN, pico no volume da receita', (id) => {
    const recipe = SOUNDS[id];
    const data = renderSound(recipe, SR);
    expect(data.length).toBe(Math.round((recipe.durationMs / 1000) * SR));
    expect(data.every(Number.isFinite)).toBe(true);
    const peak = data.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeCloseTo(recipe.gain, 5);
  });

  it.each(Object.keys(SOUNDS))('%s: começa forte e termina em silêncio', (id) => {
    const data = renderSound(SOUNDS[id], SR);
    const tenth = Math.floor(data.length / 10);
    expect(rms(data, data.length - tenth, data.length)).toBeLessThan(rms(data, 0, tenth) / 4);
    expect(Math.abs(data[data.length - 1])).toBeLessThan(1e-3);
    // Ataque: sem salto no primeiro sample.
    expect(Math.abs(data[0])).toBeLessThan(1e-3);
  });

  it('timbres em ordem de altura: bumbo < tom < caixa < prato < chimbal', () => {
    // Taxa de cruzamentos por zero como estimativa grosseira da frequência dominante.
    const zcr = (d) => {
      let c = 0;
      for (let i = 1; i < d.length; i++) if (d[i - 1] < 0 !== d[i] < 0) c++;
      return (c / d.length) * SR;
    };
    const order = ['kick', 'tom', 'snare', 'crash', 'hihat'].map((id) =>
      zcr(renderSound(SOUNDS[id], SR)),
    );
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
  });

  it('é determinístico: mesma receita e semente dão o mesmo som', () => {
    expect(renderSound(SOUNDS.snare, SR, 3)).toEqual(renderSound(SOUNDS.snare, SR, 3));
  });

  it('funciona também a 44,1 kHz', () => {
    expect(renderSound(SOUNDS.kick, 44100).length).toBe(Math.round(0.5 * 44100));
  });
});

describe('softLimiterCurve', () => {
  // Simula o WaveShaper: entrada já dividida pela folga, índice linear em [-1, 1].
  const shape = (curve, signal) => {
    const input = Math.max(-1, Math.min(1, signal / LIMITER_HEADROOM));
    return curve[Math.round(((input + 1) / 2) * (curve.length - 1))];
  };
  const curve = softLimiterCurve(0.7);

  it('não muda o volume de um golpe sozinho abaixo do joelho', () => {
    for (const v of [0.1, 0.5, 0.69, -0.4]) expect(shape(curve, v)).toBeCloseTo(v, 2);
  });

  it('vários golpes juntos (soma até 2) nunca passam de 1 e continuam crescendo', () => {
    let prev = 0;
    for (const v of [0.8, 1, 1.4, 1.9]) {
      const y = shape(curve, v);
      expect(y).toBeLessThan(1);
      expect(y).toBeGreaterThan(prev);
      prev = y;
    }
  });
});

describe('synth: peças auxiliares', () => {
  it('seededRandom fica entre 0 e 1', () => {
    const r = seededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('passa-altas corta grave e passa-baixas corta agudo', () => {
    const tone = (f) =>
      Float32Array.from({ length: SR / 10 }, (_, i) => Math.sin((2 * Math.PI * f * i) / SR));
    const tail = (d) => rms(d, d.length / 2, d.length);
    expect(tail(biquad(tone(100), { type: 'highpass', freq: 5000, q: 0.7 }, SR))).toBeLessThan(
      0.01,
    );
    expect(tail(biquad(tone(10000), { type: 'lowpass', freq: 500, q: 0.7 }, SR))).toBeLessThan(
      0.01,
    );
    expect(tail(biquad(tone(10000), { type: 'highpass', freq: 500, q: 0.7 }, SR))).toBeGreaterThan(
      0.6,
    );
  });
});

function fakeAudioContext() {
  const started = [];
  class FakeContext {
    constructor(opts) {
      this.opts = opts;
      this.sampleRate = 48000;
      this.currentTime = 1.5;
      this.baseLatency = 0.01;
      this.outputLatency = 0.02;
      this.state = 'suspended';
      this.destination = {};
      this.resume = vi.fn(async () => {
        this.state = 'running';
      });
    }
    createGain() {
      return { gain: { value: 0 }, connect: vi.fn() };
    }
    createWaveShaper() {
      return { curve: null, connect: vi.fn() };
    }
    createBuffer(channels, length, rate) {
      return { channels, length, rate, copyToChannel: vi.fn() };
    }
    createBufferSource() {
      const src = {
        buffer: null,
        connect: vi.fn(),
        start: vi.fn((when) => started.push([src.buffer, when])),
      };
      return src;
    }
  }
  return { FakeContext, started };
}

describe('createAudioEngine', () => {
  it('pede latência interativa e chama resume() já na criação (dentro do clique)', () => {
    const { FakeContext } = fakeAudioContext();
    const engine = createAudioEngine({ AudioContextClass: FakeContext });
    expect(engine.ctx.opts.latencyHint).toBe('interactive');
    expect(engine.ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('cria um buffer por som e toca com uma fonte nova a cada golpe', () => {
    const { FakeContext, started } = fakeAudioContext();
    const engine = createAudioEngine({ AudioContextClass: FakeContext });
    engine.play('snare');
    engine.play('snare', 2.25);
    engine.play('naoExiste');
    expect(started).toHaveLength(2);
    expect(started[0][0]).toBe(started[1][0]);
    expect(started[0][1]).toBe(0);
    expect(started[1][1]).toBe(2.25);
  });

  it('informa a latência de saída em ms', () => {
    const { FakeContext } = fakeAudioContext();
    const engine = createAudioEngine({ AudioContextClass: FakeContext });
    expect(engine.outputLatencyMs()).toBeCloseTo(30);
    expect(engine.now()).toBe(1.5);
  });
});
