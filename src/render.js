// Desenho no canvas sobre o vídeo. toScreen é o ÚNICO lugar que converte
// coordenadas normalizadas da câmera em pixels de tela, incluindo o espelho.
import { HAND_STYLE } from './config.js';
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

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number }[][]} hands
 * @param {View} view
 */
export function drawHands(ctx, hands, view) {
  ctx.clearRect(0, 0, view.width, view.height);
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
