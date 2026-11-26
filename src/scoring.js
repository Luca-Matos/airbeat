// PURO. Nota de precisão: compara cada golpe com os alvos da lição e classifica em
// perfeito, bom ou errou. Tempos em segundos do relógio do áudio (instante OUVIDO);
// diferenças em ms. Positivo = golpe atrasado.
import { SCORING } from './config.js';

/** @typedef {'perfect' | 'good' | 'miss'} Grade */

/**
 * @param {number} diffMs golpe - alvo, já descontada a calibragem
 * @param {typeof SCORING} [windows]
 * @returns {Grade}
 */
export function classify(diffMs, windows = SCORING) {
  const abs = Math.abs(diffMs);
  if (abs <= windows.perfectMs) return 'perfect';
  if (abs <= windows.goodMs) return 'good';
  return 'miss';
}

/** @param {number[]} values */
export function median(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * @typedef {object} Judgement
 * @property {import('./lessonPlan.js').Target} target
 * @property {Grade} grade
 * @property {number | null} diffMs null quando o alvo passou sem golpe
 */

/**
 * Juiz da sessão. Cada alvo aceita um golpe só, o mais próximo dentro da janela "bom";
 * golpes que não casam com nenhum alvo contam como "extras" (não tiram nota).
 * @param {import('./lessonPlan.js').Target[]} targets
 * @param {{ offsetMs?: number, windows?: typeof SCORING }} [options] offsetMs: calibragem
 */
export function createJudge(targets, options = {}) {
  const windows = options.windows ?? SCORING;
  const offset = (options.offsetMs ?? 0) / 1000;
  /** @type {Map<number, Judgement>} */
  const judged = new Map();
  let extras = 0;

  return {
    /**
     * @param {string} pieceId
     * @param {number} time s, instante ouvido do golpe
     * @returns {Judgement | null} null = golpe extra
     */
    hit(pieceId, time) {
      const t = time - offset;
      let best = null;
      let bestAbs = windows.goodMs / 1000;
      for (const target of targets) {
        if (target.pieceId !== pieceId || judged.has(target.id)) continue;
        const abs = Math.abs(t - target.time);
        if (abs <= bestAbs) {
          best = target;
          bestAbs = abs;
        }
      }
      if (!best) {
        extras++;
        return null;
      }
      const diffMs = (t - best.time) * 1000;
      const result = { target: best, grade: classify(diffMs, windows), diffMs };
      judged.set(best.id, result);
      return result;
    },
    /**
     * Alvos cuja janela já fechou sem golpe viram "errou".
     * @param {number} now s
     * @returns {Judgement[]} os que acabaram de expirar
     */
    expire(now) {
      const t = now - offset;
      const out = [];
      for (const target of targets) {
        if (judged.has(target.id) || t - target.time <= windows.goodMs / 1000) continue;
        const result = { target, grade: /** @type {Grade} */ ('miss'), diffMs: null };
        judged.set(target.id, result);
        out.push(result);
      }
      return out;
    },
    /** @param {number} id */
    resultOf: (id) => judged.get(id) ?? null,
    summary: () => summarize([...judged.values()], targets.length, extras, windows),
  };
}

/**
 * @param {Judgement[]} results
 * @param {number} total
 * @param {number} extras
 * @param {typeof SCORING} [windows]
 */
export function summarize(results, total, extras, windows = SCORING) {
  const count = (/** @type {Grade} */ g) => results.filter((r) => r.grade === g).length;
  const perfect = count('perfect');
  const good = count('good');
  const miss = total - perfect - good;
  const score = total ? Math.round((100 * (perfect + windows.goodWeight * good)) / total) : 0;
  const diffs = results
    .filter((r) => r.diffMs !== null)
    .map((r) => /** @type {number} */ (r.diffMs));
  const tendencyMs = median(diffs);
  return { total, perfect, good, miss, extras, score, tendencyMs };
}

/**
 * Frase curta para a tela de resultado.
 * @param {ReturnType<typeof summarize>} s
 */
export function verdict(s) {
  if (s.score >= 90) return 'Excelente! Você está no tempo.';
  if (s.score >= 70) return 'Muito bom! Mais uma vez e fica perfeito.';
  if (s.score >= 50) return 'Bom começo. Ouça o clique e tente de novo.';
  return 'Continue praticando: comece tocando só junto com o clique.';
}

/**
 * Dica de tendência: adiantado ou atrasado, ou null se a pessoa está centrada.
 * @param {number | null} tendencyMs
 */
export function tendencyText(tendencyMs, limit = SCORING.tendencyMs) {
  if (tendencyMs === null || Math.abs(tendencyMs) < limit) return null;
  const ms = Math.round(Math.abs(tendencyMs));
  return tendencyMs < 0
    ? `Você costuma bater ~${ms} ms antes do clique.`
    : `Você costuma bater ~${ms} ms depois do clique.`;
}
