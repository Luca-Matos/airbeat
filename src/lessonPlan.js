// PURO. Transforma uma lição (dados) na agenda da sessão: os cliques do metrônomo e os
// alvos, em segundos do relógio do áudio. A calibragem usa o mesmo formato.
import { LESSON } from './config.js';

/**
 * @typedef {object} Target
 * @property {number} id ordem do alvo na sessão
 * @property {number} time s, relógio do áudio: quando o clique deste tempo toca
 * @property {string} pieceId
 * @property {'D' | 'E'} [hand]
 */

/**
 * @typedef {object} SessionPlan
 * @property {{ time: number, accent: boolean, countIn: boolean }[]} clicks
 * @property {Target[]} targets em ordem de tempo
 * @property {number} startTime s, primeira batida da contagem
 * @property {number} firstTargetTime s
 * @property {number} endTime s, um tempo depois do último alvo
 * @property {number} secondsPerBeat
 */

/**
 * @param {import('./lessons/lessons.js').Lesson} lesson
 * @param {number} startTime s, relógio do áudio, da primeira batida da contagem
 * @param {{ bpm?: number, countInBeats?: number }} [options]
 * @returns {SessionPlan}
 */
export function planSession(lesson, startTime, options = {}) {
  const bpm = options.bpm ?? lesson.bpm;
  const countIn = options.countInBeats ?? LESSON.countInBeats;
  const spb = 60 / bpm;
  const totalBeats = countIn + lesson.bars * lesson.beatsPerBar;
  const clicks = [];
  for (let i = 0; i < totalBeats; i++) {
    const inBar = i < countIn ? i : (i - countIn) % lesson.beatsPerBar;
    clicks.push({ time: startTime + i * spb, accent: inBar === 0, countIn: i < countIn });
  }
  const firstTargetTime = startTime + countIn * spb;
  /** @type {Target[]} */
  const targets = [];
  for (let bar = 0; bar < lesson.bars; bar++) {
    for (const note of lesson.pattern) {
      targets.push({
        id: 0,
        time: firstTargetTime + (bar * lesson.beatsPerBar + note.beat) * spb,
        pieceId: note.piece,
        ...(note.hand ? { hand: note.hand } : {}),
      });
    }
  }
  targets.sort((a, b) => a.time - b.time);
  targets.forEach((t, i) => (t.id = i));
  return {
    clicks,
    targets,
    startTime,
    firstTargetTime,
    endTime: startTime + totalBeats * spb,
    secondsPerBeat: spb,
  };
}

/**
 * Número da contagem ("1, 2, 3, 4") que está soando, ou null fora da contagem.
 * @param {SessionPlan} plan
 * @param {number} now s, relógio do áudio já no instante ouvido
 */
export function countInNumber(plan, now) {
  if (now < plan.startTime || now >= plan.firstTargetTime) return null;
  return Math.floor((now - plan.startTime) / plan.secondsPerBeat) + 1;
}

/**
 * Alvos que estão descendo até a peça agora. progress vai de 0 (acabou de aparecer) a 1
 * (no centro da peça, no instante do clique) e fica em 1 até a janela fechar.
 * @param {Target[]} targets
 * @param {number} now s, instante ouvido
 * @param {number} approachSec
 * @param {number} lingerSec quanto o alvo fica na peça depois do clique (janela "bom")
 * @param {(id: number) => boolean} isJudged
 * @returns {{ target: Target, progress: number }[]}
 */
export function approachingTargets(targets, now, approachSec, lingerSec, isJudged) {
  const out = [];
  for (const target of targets) {
    if (target.time - approachSec > now) break;
    if (now > target.time + lingerSec || isJudged(target.id)) continue;
    out.push({ target, progress: Math.min(1, 1 - (target.time - now) / approachSec) });
  }
  return out;
}

/**
 * A lição de calibragem: um alvo por tempo, numa peça só (sem desenho de alvo; guiada pelo som).
 * @param {{ bpm: number, beats: number, piece: string }} cal CALIBRATION
 * @returns {import('./lessons/lessons.js').Lesson}
 */
export function calibrationLesson(cal) {
  return {
    id: 'calibracao',
    number: 0,
    title: 'Calibragem',
    goal: 'Bata na caixa junto com cada clique.',
    bpm: cal.bpm,
    beatsPerBar: 4,
    bars: Math.ceil(cal.beats / 4),
    pattern: [0, 1, 2, 3].map((beat) => ({ beat, piece: cal.piece })),
  };
}
