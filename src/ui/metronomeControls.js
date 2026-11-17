// Controles do metrônomo na tela de jogo: liga/desliga, BPM - e +, e quatro pontos
// que acendem no tempo. Camada fina sobre audio/metronome.js.
import { clampBpm, startMetronome } from '../audio/metronome.js';
import { METRONOME } from '../config.js';
import { load, save } from '../storage.js';

/**
 * @param {HTMLElement} root elemento com #metro-toggle, #bpm-down, #bpm-up, #bpm-value e #beat-dots
 * @param {() => ReturnType<typeof import('../audio/engine.js').createAudioEngine> | null} getEngine
 */
export function createMetronomeControls(root, getEngine) {
  const toggle = /** @type {HTMLButtonElement} */ (root.querySelector('#metro-toggle'));
  const value = /** @type {HTMLElement} */ (root.querySelector('#bpm-value'));
  const dots = [.../** @type {HTMLElement} */ (root.querySelector('#beat-dots')).children];
  let bpm = clampBpm(load('bpm', METRONOME.defaultBpm));
  /** @type {null | ReturnType<typeof startMetronome>} */
  let metro = null;
  let litBeat = -1;

  const render = () => {
    value.textContent = String(bpm);
    toggle.setAttribute('aria-pressed', String(metro !== null));
    toggle.textContent = metro ? 'Parar metrônomo' : 'Metrônomo';
  };

  const setBpm = (/** @type {number} */ next) => {
    bpm = clampBpm(next);
    metro?.setBpm(bpm);
    save('bpm', bpm);
    render();
  };

  const stop = () => {
    metro?.stop();
    metro = null;
    light(-1);
    render();
  };

  const start = () => {
    const engine = getEngine();
    if (!engine) return;
    engine.resume();
    metro = startMetronome(engine, { bpm });
    render();
  };

  /** @param {number} beat */
  const light = (beat) => {
    if (beat === litBeat) return;
    litBeat = beat;
    dots.forEach((d, i) => d.classList.toggle('on', i === beat));
  };

  toggle.addEventListener('click', () => (metro ? stop() : start()));
  root.querySelector('#bpm-down').addEventListener('click', () => setBpm(bpm - METRONOME.bpmStep));
  root.querySelector('#bpm-up').addEventListener('click', () => setBpm(bpm + METRONOME.bpmStep));
  render();

  return {
    /** Chamado a cada quadro: acende o ponto da batida que está saindo no alto-falante. */
    update() {
      const engine = getEngine();
      if (!metro || !engine) return;
      // A batida é ouvida depois da latência de saída; o ponto acende junto com o som.
      const heardNow = engine.now() - engine.outputLatencyMs() / 1000;
      light(metro.beatAt(heardNow)?.beat ?? -1);
    },
    /** Teclas: M liga/desliga, + e - mudam o andamento. */
    handleKey(/** @type {string} */ key) {
      if (key === 'm') (metro ? stop : start)();
      else if (key === '+' || key === '=') setBpm(bpm + METRONOME.bpmStep);
      else if (key === '-') setBpm(bpm - METRONOME.bpmStep);
      else return false;
      return true;
    },
    stop,
    get running() {
      return metro !== null;
    },
  };
}
