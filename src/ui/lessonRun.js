// Camada fina: roda uma sessão (lição ou calibragem) no áudio. Agenda todos os cliques
// de uma vez no relógio do áudio (a sessão é curta e finita), converte os golpes para o
// instante ouvido e repassa ao juiz puro (scoring.js).
import { LESSON } from '../config.js';
import { planSession } from '../lessonPlan.js';
import { createJudge } from '../scoring.js';

/** @typedef {{ pieceId: string, grade: import('../scoring.js').Grade, at: number }} Feedback at em ms da página */

/**
 * @param {ReturnType<typeof import('../audio/engine.js').createAudioEngine>} engine
 * @param {import('../lessons/lessons.js').Lesson} lesson
 * @param {{ offsetMs?: number, windows?: typeof import('../config.js').SCORING }} [options]
 */
export function startLessonRun(engine, lesson, options = {}) {
  const plan = planSession(lesson, engine.now() + LESSON.leadInMs / 1000);
  const sources = plan.clicks.map((c) => engine.play(c.accent ? 'clickAccent' : 'click', c.time));
  const judge = createJudge(plan.targets, options);
  /** @type {Feedback[]} */
  const feedback = [];
  /** Diferenças sem calibragem (golpe - clique ouvido), para a calibragem. */
  /** @type {number[]} */
  const rawDiffs = [];
  const offsetMs = options.offsetMs ?? 0;

  return {
    plan,
    judge,
    feedback,
    rawDiffs,
    /**
     * @param {string} pieceId
     * @param {number} perfMs instante do golpe no relógio da página
     */
    hit(pieceId, perfMs) {
      const result = judge.hit(pieceId, engine.heardTimeAt(perfMs));
      if (!result) return null;
      feedback.push({ pieceId, grade: result.grade, at: perfMs });
      if (result.diffMs !== null) rawDiffs.push(result.diffMs + offsetMs);
      return result;
    },
    /**
     * Fecha os alvos vencidos. Devolve o instante ouvido e se a sessão acabou.
     * @param {number} perfNow ms
     */
    update(perfNow) {
      const now = engine.heardTimeAt(perfNow);
      for (const m of judge.expire(now)) {
        feedback.push({ pieceId: m.target.pieceId, grade: 'miss', at: perfNow });
      }
      // Acaba depois do último clique e da janela do último alvo.
      return { now, done: now > plan.endTime };
    },
    /** Cancela os cliques que ainda não tocaram (sair no meio da lição). */
    stop() {
      for (const s of sources) {
        try {
          s?.stop();
        } catch {
          // Já tocou: nada a cancelar.
        }
      }
    },
  };
}
