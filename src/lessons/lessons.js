// Lições como DADOS, sem lógica (XRD, Fluxo da Aplicação). O padrão de cada lição vale
// para um compasso e se repete `bars` vezes. `beat` começa em 0 (0,5 = colcheia).
// `hand` é só uma dica na tela ('D' direita, 'E' esquerda); o app não confere a mão.

/**
 * @typedef {object} LessonNote
 * @property {number} beat posição no compasso, em tempos (0 = primeiro tempo)
 * @property {string} piece id da peça em DRUM_KIT
 * @property {'D' | 'E'} [hand]
 */

/**
 * @typedef {object} Lesson
 * @property {string} id
 * @property {number} number
 * @property {string} title
 * @property {string} goal o que fazer, em uma frase, mostrado antes de começar
 * @property {number} bpm
 * @property {number} beatsPerBar
 * @property {number} bars
 * @property {LessonNote[]} pattern
 */

/** @type {Lesson[]} */
export const LESSONS = [
  {
    id: 'pulso',
    number: 1,
    title: 'Pulso',
    goal: 'Bata na caixa uma vez a cada clique, com qualquer mão.',
    bpm: 70,
    beatsPerBar: 4,
    bars: 4,
    pattern: [0, 1, 2, 3].map((beat) => ({ beat, piece: 'snare' })),
  },
  {
    id: 'colcheias',
    number: 2,
    title: 'Colcheias alternadas',
    goal: 'Duas batidas por clique na caixa, alternando as mãos: direita, esquerda.',
    bpm: 60,
    beatsPerBar: 4,
    bars: 4,
    pattern: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((beat, i) => ({
      beat,
      piece: 'snare',
      hand: /** @type {'D' | 'E'} */ (i % 2 === 0 ? 'D' : 'E'),
    })),
  },
  {
    id: 'chimbal-caixa',
    number: 3,
    title: 'Chimbal e caixa',
    goal: 'Chimbal em todos os cliques e, junto com ele, caixa no 2 e no 4.',
    bpm: 65,
    beatsPerBar: 4,
    bars: 4,
    pattern: [
      ...[0, 1, 2, 3].map((beat) => ({ beat, piece: 'hihat' })),
      { beat: 1, piece: 'snare' },
      { beat: 3, piece: 'snare' },
    ],
  },
];
