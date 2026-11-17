// PURO. Recebe, a cada quadro, a posição de cada mão (com id estável) e devolve os
// golpes. Não sabe nada de câmera, DOM ou áudio, para ser testado com trajetórias
// sintéticas e com gravações reproduzidas.
//
// Um golpe é uma DESCIDA: começa quando a mão desce mais rápido que o limiar e termina
// quando ela para ou sobe. Cada descida toca no máximo uma peça.
// - 'stroke' (padrão): toca assim que a baqueta está sobre uma peça durante a descida.
//   A peça inteira vale, inclusive a parte de baixo, onde a mão já está freando.
// - 'velocity': só toca se a velocidade no próprio quadro dentro da peça passar do
//   limiar (versão 1; na gravação de 17/11 só a parte de cima das peças funcionava).
// - 'lowestPoint': toca no fim da descida, na peça sob o ponto mais baixo.
import { HIT } from './config.js';

/** @typedef {{ x: number, y: number }} Point2 */
/** @typedef {{ id: number, point: Point2 }} TrackedHand */
/** @typedef {{ handId: number, pieceId: string, t: number, velocity: number }} HitEvent */
/** @typedef {{ id: number, point: Point2, vy: number, armed: boolean, pieceId: string | null }} HandState */

/** Mãos que não aparecem por esse tempo (ms) têm o estado descartado. */
const STATE_TTL_MS = 1000;
/** Quanto do passado de cada mão fica guardado (ms); bem maior que velocityWindowMs. */
const HISTORY_MS = 200;

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
   * @param {HitEvent[]} out
   */
  function fire(s, pieceId, t, out) {
    out.push({ handId: s.id, pieceId, t, velocity: s.stroke?.peakVy ?? s.vy });
    s.lastHitAt = t;
    if (s.stroke) s.stroke.used = true;
    // Rearme: o próximo golpe só começa depois que a baqueta subir rearmRise acima do
    // ponto mais baixo alcançado depois deste. Tremor no fundo do golpe não sobe tanto.
    s.lowestSinceHit = s.point.y;
    s.needsRise = true;
  }

  /** @param {any} s */
  function predictedZone(s) {
    if (cfg.predictMs <= 0 || s.vy <= 0) return null;
    const lead = cfg.predictMs / 1000;
    return pieceAt({ x: s.point.x + s.vx * lead, y: s.point.y + s.vy * lead });
  }

  /**
   * Golpe de verdade, e não tremor: rápido (fastVelocity) OU com curso suficiente desde o
   * topo da descida (minTravel). Golpes curtos e controlados, de quem toca preciso no
   * ritmo, são lentos (pico ~0,6/s na gravação de 17/11) mas descem 4 a 5% da tela.
   * @param {any} s
   */
  function deliberate(s) {
    return s.stroke.peakVy >= cfg.fastVelocity || s.point.y - s.stroke.topY >= cfg.minTravel;
  }

  /**
   * Velocidade contra a amostra mais recente com pelo menos velocityWindowMs de idade.
   * Quadros que chegam colados (16 ms) inflavam a velocidade de uma tremida.
   * @param {any} s
   * @param {number} t
   */
  function velocity(s, t) {
    let ref = s.hist[0];
    for (const h of s.hist) if (t - h.t >= cfg.velocityWindowMs) ref = h;
    const dt = (t - ref.t) / 1000;
    return { vx: (s.point.x - ref.x) / dt, vy: (s.point.y - ref.y) / dt };
  }

  /**
   * @param {any} s
   * @param {{ x: number, y: number }} prev posição no quadro anterior
   * @param {number} t
   * @param {HitEvent[]} hits
   */
  function step(s, prev, t, hits) {
    const cooled = t - s.lastHitAt >= cfg.minIntervalMs;

    if (cfg.mode === 'velocity') {
      // v1: velocidade alta no próprio quadro dentro da peça. Rearme ao subir ou sair da peça.
      if (!s.armed && (s.vy <= -cfg.rearmUpVelocity || s.pieceId !== s.lastHitPiece))
        s.armed = true;
      if (s.armed && s.pieceId && s.vy >= cfg.fastVelocity && cooled) {
        fire(s, s.pieceId, t, hits);
        s.lastHitPiece = s.pieceId;
        s.armed = false;
      }
      return;
    }

    if (s.needsRise) {
      s.lowestSinceHit = Math.max(s.lowestSinceHit, s.point.y);
      // Rearma ao subir rearmRise OU depois de rearmMaxMs. O prazo cobre quem toca no ritmo
      // a partir da mão parada: ela escorrega devagar depois do golpe e sobe pouco antes do
      // próximo (gravação de precisão de 17/11). Tremor continua barrado por minTravel.
      if (s.point.y <= s.lowestSinceHit - cfg.rearmRise || t - s.lastHitAt >= cfg.rearmMaxMs) {
        s.needsRise = false;
      }
    }

    // Começo e fim da descida. O fim usa um limiar baixo (histerese): a mão freando
    // dentro da peça ainda é a mesma descida.
    if (!s.stroke && !s.needsRise && s.vy >= cfg.downVelocity) {
      s.stroke = {
        since: t,
        peakVy: s.vy,
        used: false,
        lastPiece: null,
        topY: prev.y,
      };
    }
    if (!s.stroke) return;
    s.stroke.peakVy = Math.max(s.stroke.peakVy, s.vy);
    if (s.pieceId) s.stroke.lastPiece = s.pieceId;
    const ended = s.vy <= cfg.strokeEndVelocity || t - s.stroke.since >= cfg.strokeMaxMs;

    if (cfg.mode === 'lowestPoint') {
      if (ended) {
        const piece = s.pieceId ?? s.stroke.lastPiece;
        if (piece && cooled && deliberate(s)) fire(s, piece, t, hits);
        s.stroke = null;
      }
      return;
    }

    // 'stroke': primeira peça tocada durante a descida. Com predição, vale também a peça
    // onde a baqueta vai estar daqui a predictMs, seguindo a velocidade atual: o som sai
    // antes, compensando parte do atraso da câmera.
    // Só enquanto desce: no quadro em que a descida acabou a mão já pode estar subindo.
    const target = s.pieceId ?? predictedZone(s);
    // Barrado pelo intervalo mínimo com a peça sob a baqueta: não toca atrasado ao parar.
    if (!ended && target && !cooled) s.stroke.blocked = true;
    if (!ended && !s.stroke.used && target && cooled && deliberate(s)) fire(s, target, t, hits);
    // A descida parou dentro de uma peça sem ter tocado: golpe curto que só chega à peça
    // no fundo do movimento (gravação de precisão de 17/11, bumbo). Se foi barrado pelo
    // intervalo mínimo, não toca atrasado.
    if (ended && !s.stroke.used && !s.stroke.blocked && s.pieceId && cooled && deliberate(s)) {
      fire(s, s.pieceId, t, hits);
    }
    if (ended) s.stroke = null;
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
        s = {
          id,
          lastHitAt: -Infinity,
          lastHitPiece: null,
          armed: true,
          stroke: null,
          needsRise: false,
          lowestSinceHit: 0,
          /** @type {{ t: number, x: number, y: number }[]} posições recentes */
          hist: [],
        };
        hands.set(id, s);
      }
      const gap = s.point ? t - s.seenAt : Infinity;
      s.seenAt = t;

      if (gap > cfg.maxFrameGapMs || gap <= 0) {
        // Sem quadro anterior confiável: só registra a posição; velocidade zera.
        s.point = { x: point.x, y: point.y };
        s.vx = 0;
        s.vy = 0;
        s.stroke = null;
        s.hist = [{ t, x: s.point.x, y: s.point.y }];
        s.pieceId = pieceAt(s.point);
        continue;
      }

      const prev = s.point;
      const a = cfg.smoothingAlpha;
      const cur = { x: prev.x + a * (point.x - prev.x), y: prev.y + a * (point.y - prev.y) };
      s.point = cur;
      ({ vx: s.vx, vy: s.vy } = velocity(s, t));
      s.hist.push({ t, x: cur.x, y: cur.y });
      while (s.hist.length && t - s.hist[0].t > HISTORY_MS) s.hist.shift();
      s.pieceId = zoneOf(prev, cur);
      step(s, prev, t, hits);
    }
    return hits;
  }

  /** Estado de cada mão vista no último segundo, para debug e desenho. @returns {HandState[]} */
  function states() {
    return [...hands.values()]
      .filter((s) => s.point)
      .map((s) => ({
        id: s.id,
        point: s.point,
        vy: s.vy,
        armed: cfg.mode === 'velocity' ? s.armed : !s.needsRise,
        pieceId: s.pieceId,
      }));
  }

  return { update, states, reset: () => hands.clear() };
}
