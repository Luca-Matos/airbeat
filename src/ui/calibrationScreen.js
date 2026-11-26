// Tela da calibragem de latência: explicação antes e resultado depois. Só preenche o DOM.
import { CALIBRATION } from '../config.js';

/** @param {string} id */
const el = (id) => /** @type {HTMLElement} */ (document.getElementById(id));

/**
 * @param {'camera' | 'touch'} input
 * @param {number | undefined} currentMs calibragem já salva
 */
export function fillCalibrationIntro(input, currentMs) {
  const how = input === 'touch' ? 'toque na caixa' : 'bata na caixa';
  el('calibration-text').textContent =
    `Depois da contagem, ${how} junto com cada clique do metrônomo: ${CALIBRATION.beats} vezes, ` +
    'cerca de 15 segundos. Assim o AirBeat mede o atraso do seu aparelho e a nota fica justa.';
  el('calibration-note').textContent =
    currentMs === undefined
      ? 'Siga o som, não a imagem. Leva só uma vez neste aparelho.'
      : `Atraso salvo: ${currentMs} ms. Refaça se trocou de aparelho, fone ou caixa de som.`;
  el('calibration-go').textContent = 'Começar';
  el('calibration-go').hidden = false;
  el('calibration-continue').hidden = true;
  el('calibration-skip').textContent = currentMs === undefined ? 'Pular' : 'Voltar';
}

/**
 * @param {ReturnType<typeof import('../scoring.js').calibrationOffset>} result
 */
export function fillCalibrationResult(result) {
  if (result.ok) {
    el('calibration-text').textContent =
      `Pronto! Atraso medido: ${result.offsetMs} ms ` +
      `(${result.used} de ${CALIBRATION.beats} golpes). A nota das lições já desconta esse valor.`;
    el('calibration-note').textContent = '';
    el('calibration-go').textContent = 'Refazer';
    el('calibration-continue').hidden = false;
    el('calibration-skip').textContent = 'Voltar';
    return;
  }
  el('calibration-text').textContent =
    result.reason === 'fora'
      ? 'Os golpes ficaram muito longe dos cliques. Tente de novo, batendo junto com o som.'
      : `Só ${result.used} golpes caíram junto com o clique (precisa de ${CALIBRATION.minValid}). ` +
        'Tente de novo, batendo junto com o som.';
  el('calibration-note').textContent = '';
  el('calibration-go').textContent = 'Tentar de novo';
  el('calibration-continue').hidden = true;
  el('calibration-skip').textContent = 'Pular';
}
