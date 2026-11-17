// PURO. Recebe, a cada quadro, a posição de cada mão (com id estável) e devolve os
// golpes. Não sabe nada de câmera, DOM ou áudio, para ser testado com trajetórias
// sintéticas e com gravações reproduzidas.
//
// Golpe = mão descendo acima do limiar + dentro da zona de uma peça + fora do
// intervalo mínimo daquela mão + mão rearmada (subiu ou saiu da peça desde o último golpe).
import { HIT } from './config.js';

/** @typedef {{ x: number, y: number }} Point2 */
/** @typedef {{ id: number, point: Point2 }} TrackedHand */
/** @typedef {{ handId: number, pieceId: string, t: number, velocity: number }} HitEvent */
/** @typedef {{ id: number, point: Point2, vy: number, armed: boolean, pieceId: string | null }} HandState */

/** Mãos que não aparecem por esse tempo (ms) têm o estado descartado. */
const STATE_TTL_MS = 1000;

/**
 * @param {object} options
 * @param {(p: Point2) => string | null} options.pieceAt devolve o id da peça sob o ponto
 * @param {Partial<typeof HIT>} [options.config] sobrescreve valores de HIT (testes, ajuste)
 */
export function createHitDetector({ pieceAt, config = {} }) {
  const cfg = { ...HIT, ...config };
  /** @type {Map<number, any>} */
  const hands = new Map();

  /**
   * Zona sob a mão. Testa também o meio do caminho desde o quadro anterior, para que
   * um golpe rápido que atravessa uma peça pequena entre dois quadros não se perca.
   * @param {Point2} prev
   * @param {Point2} cur
   */
  function zoneOf(prev, cur) {
    return pieceAt(cur) ?? pieceAt({ x: (prev.x + cur.x) / 2, y: (prev.y + cur.y) / 2 });
  }

  /**
   * @param {any} s estado da mão
   * @param {string} pieceId
   * @param {number} t
   * @param {number} velocity
   * @param {HitEvent[]} out
   */
  function fire(s, pieceId, t, velocity, out) {
    out.push({ handId: s.id, pieceId, t, velocity });
    s.lastHitAt = t;
    s.lastHitPiece = pieceId;
    s.armed = false;
  }

  /**
   * @param {number} t tempo do quadro, em ms (crescente)
   * @param {TrackedHand[]} tracked
   * @returns {HitEvent[]}
   */
  function update(t, tracked) {
    /** @type {HitEvent[]} */
    const hits = [];
    for (const [id, s] of hands) if (t - s.seenAt > STATE_TTL_MS) hands.delete(id);

    for (const { id, point } of tracked) {
      let s = hands.get(id);
      if (!s) {
        s = { id, lastHitAt: -Infinity, lastHitPiece: null, armed: true, pending: null };
        hands.set(id, s);
      }
      const gap = s.point ? t - s.seenAt : Infinity;
      s.seenAt = t;

      if (gap > cfg.maxFrameGapMs || gap <= 0) {
        // Sem quadro anterior confiável: só registra a posição; velocidade zera.
        s.point = { x: point.x, y: point.y };
        s.vy = 0;
        s.pending = null;
        s.pieceId = pieceAt(s.point);
        continue;
      }

      const prev = s.point;
      const a = cfg.smoothingAlpha;
      const cur = { x: prev.x + a * (point.x - prev.x), y: prev.y + a * (point.y - prev.y) };
      s.vy = (cur.y - prev.y) / (gap / 1000);
      s.point = cur;
      s.pieceId = zoneOf(prev, cur);

      if (s.pending) {
        // Modo ponto mais baixo: dispara quando a descida para (ou demora demais).
        if (
          s.vy <= cfg.lowestPointStopVelocity ||
          t - s.pending.since >= cfg.lowestPointMaxWaitMs
        ) {
          fire(s, s.pending.pieceId, t, s.pending.peakVy, hits);
          s.pending = null;
        } else {
          s.pending.peakVy = Math.max(s.pending.peakVy, s.vy);
        }
        continue;
      }

      // Histerese: depois de um golpe, só vale outro se a mão subiu ou saiu da peça.
      if (!s.armed && (s.vy <= -cfg.rearmUpVelocity || s.pieceId !== s.lastHitPiece)) {
        s.armed = true;
      }

      const canHit =
        s.armed &&
        s.pieceId !== null &&
        s.vy >= cfg.downVelocity &&
        t - s.lastHitAt >= cfg.minIntervalMs;
      if (!canHit) continue;

      if (cfg.mode === 'lowestPoint') {
        s.pending = { pieceId: s.pieceId, since: t, peakVy: s.vy };
        s.armed = false;
      } else {
        fire(s, s.pieceId, t, s.vy, hits);
      }
    }
    return hits;
  }

  /** Estado de cada mão vista no último segundo, para debug e desenho. @returns {HandState[]} */
  function states() {
    return [...hands.values()]
      .filter((s) => s.point)
      .map((s) => ({ id: s.id, point: s.point, vy: s.vy, armed: s.armed, pieceId: s.pieceId }));
  }

  return { update, states, reset: () => hands.clear() };
}
