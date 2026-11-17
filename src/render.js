// Desenho no canvas sobre o vídeo. toScreen é o ÚNICO lugar que converte
// coordenadas normalizadas da câmera em pixels de tela, incluindo o espelho.
import { HAND_STYLE, KIT_STYLE } from './config.js';
import { HAND_CONNECTIONS } from './landmarks.js';

/**
 * @typedef {object} View
 * @property {number} videoWidth  largura do quadro da câmera, em px
 * @property {number} videoHeight altura do quadro da câmera, em px
 * @property {number} width       largura do canvas, em px CSS
 * @property {number} height      altura do canvas, em px CSS
 * @property {'cover' | 'contain'} fit mesmo object-fit do <video>
 * @property {boolean} mirrored   se o vídeo é mostrado espelhado
 */

/**
 * Converte um ponto normalizado (0 a 1, no quadro original da câmera) para px de tela.
 * Reproduz o object-fit do <video> (escala e corte centralizado) e o scaleX(-1).
 * @param {{ x: number, y: number }} point
 * @param {View} view
 * @returns {{ x: number, y: number }}
 */
export function toScreen(point, view) {
  const sx = view.width / view.videoWidth;
  const sy = view.height / view.videoHeight;
  const scale = view.fit === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy);
  const shownWidth = view.videoWidth * scale;
  const shownHeight = view.videoHeight * scale;
  const nx = view.mirrored ? 1 - point.x : point.x;
  return {
    x: (view.width - shownWidth) / 2 + nx * shownWidth,
    y: (view.height - shownHeight) / 2 + point.y * shownHeight,
  };
}

/**
 * Mesmo ponto em unidades de palco: 0 a 1 da área visível (largura e altura do
 * canvas). É o espaço em que a bateria e a detecção de golpe trabalham, para que
 * a zona da peça seja exatamente o que o usuário vê. Passa por toScreen.
 * @param {{ x: number, y: number }} point
 * @param {View} view
 * @returns {{ x: number, y: number }}
 */
export function toStage(point, view) {
  const p = toScreen(point, view);
  return { x: p.x / view.width, y: p.y / view.height };
}

/**
 * Ajusta o canvas ao tamanho exibido, com nitidez em telas de alta densidade.
 * O contexto fica em px CSS depois disso.
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 */
export function fitCanvas(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

/** @param {CanvasRenderingContext2D} ctx @param {View} view */
export function clear(ctx, view) {
  ctx.clearRect(0, 0, view.width, view.height);
}

/**
 * Esqueleto das mãos (21 pontos). Fica para o debug: no jogo só a baqueta aparece.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number }[][]} hands
 * @param {View} view
 */
export function drawHands(ctx, hands, view) {
  hands.forEach((hand, i) => {
    const color = HAND_STYLE.colors[i % HAND_STYLE.colors.length];
    const pts = hand.map((p) => toScreen(p, view));
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = HAND_STYLE.lineWidth;
    ctx.beginPath();
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
    }
    ctx.stroke();
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, HAND_STYLE.pointRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/**
 * Brilho de 0 a 1 que some linearmente em flashMs depois do golpe. Puro.
 * @param {number | undefined} hitAt ms
 * @param {number} now ms
 * @param {number} [flashMs]
 */
export function flashLevel(hitAt, now, flashMs = KIT_STYLE.flashMs) {
  if (hitAt === undefined) return 0;
  const age = now - hitAt;
  return age < 0 || age >= flashMs ? 0 : 1 - age / flashMs;
}

/** @param {string} hex '#rrggbb' @param {number} alpha */
function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`;
}

/**
 * As peças da bateria, semitransparentes, com brilho e leve aumento no golpe.
 * As peças estão em unidades de palco (já espelhadas), então basta escalar.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./drumKit.js').KitPiece[]} pieces
 * @param {View} view
 * @param {Record<string, number>} lastHitAt ms do último golpe em cada peça
 * @param {number} now ms
 */
export function drawKit(ctx, pieces, view, lastHitAt, now) {
  for (const piece of pieces) {
    const glow = flashLevel(lastHitAt[piece.id], now);
    const scale = 1 + (KIT_STYLE.hitScale - 1) * glow;
    const cx = piece.cx * view.width;
    const cy = piece.cy * view.height;
    const hw = piece.hw * view.width * scale;
    const hh = piece.hh * view.height * scale;

    ctx.save();
    ctx.beginPath();
    // roundRect falta em navegadores antigos (Safari < 16); cai para retângulo reto.
    if (piece.shape === 'rect' && ctx.roundRect)
      ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, Math.min(hw, hh) * 0.35);
    else if (piece.shape === 'rect') ctx.rect(cx - hw, cy - hh, hw * 2, hh * 2);
    else ctx.ellipse(cx, cy, hw, hh, 0, 0, Math.PI * 2);
    ctx.shadowColor = piece.color;
    ctx.shadowBlur = KIT_STYLE.glowBlur * glow;
    ctx.fillStyle = rgba(
      piece.color,
      KIT_STYLE.fillAlpha + (KIT_STYLE.hitFillAlpha - KIT_STYLE.fillAlpha) * glow,
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = KIT_STYLE.lineWidth;
    ctx.strokeStyle = rgba(piece.color, KIT_STYLE.strokeAlpha);
    ctx.stroke();

    ctx.font = KIT_STYLE.labelFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgb(0 0 0 / 0.6)';
    ctx.strokeText(piece.label, cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(piece.label, cx, cy);
    ctx.restore();
  }
}

/**
 * A baqueta de cada mão: uma haste do centro da palma até a ponta, que é o ponto
 * que bate na peça. Assim o usuário vê exatamente o que conta como golpe.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ point: { x: number, y: number } }[]} hands ponta de cada mão, em unidades de palco
 * @param {{ x: number, y: number }[]} bases centro da palma de cada mão, mesma ordem
 * @param {View} view
 */
export function drawSticks(ctx, hands, bases, view) {
  ctx.save();
  ctx.lineCap = 'round';
  hands.forEach(({ point }, i) => {
    const base = bases[i];
    if (base) {
      ctx.beginPath();
      ctx.moveTo(base.x * view.width, base.y * view.height);
      ctx.lineTo(point.x * view.width, point.y * view.height);
      ctx.lineWidth = HAND_STYLE.stickWidth + 4;
      ctx.strokeStyle = 'rgb(0 0 0 / 0.45)';
      ctx.stroke();
      ctx.lineWidth = HAND_STYLE.stickWidth;
      ctx.strokeStyle = rgba(HAND_STYLE.stickColor, 0.8);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(point.x * view.width, point.y * view.height, HAND_STYLE.stickRadius, 0, Math.PI * 2);
    ctx.fillStyle = rgba(HAND_STYLE.stickColor, 0.85);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgb(0 0 0 / 0.5)';
    ctx.stroke();
  });
  ctx.restore();
}
