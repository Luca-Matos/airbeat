// Trajetórias sintéticas de uma mão, em unidades de palco, para testar o detector.

/**
 * Amostra y(t) em quadros de tempo regular.
 * @param {(tMs: number) => { x: number, y: number } | null} pos null = mão fora do quadro
 * @param {{ fps?: number, durationMs: number, startMs?: number }} opts
 * @returns {{ t: number, point: { x: number, y: number } | null }[]}
 */
export function sample(pos, { fps = 30, durationMs, startMs = 0 }) {
  const frames = [];
  const step = 1000 / fps;
  for (let t = startMs; t <= startMs + durationMs + 1e-9; t += step) {
    frames.push({ t, point: pos(t) });
  }
  return frames;
}

/**
 * Golpe em forma de cosseno: desce de `top` a `bottom` em `downMs`, volta em `upMs`.
 * Velocidade de pico na descida = (bottom - top) * π / (2 * downMs/1000).
 * @param {{ x?: number, top?: number, bottom?: number, downMs?: number, upMs?: number, at?: number }} opts
 */
export function stroke({ x = 0.4, top = 0.3, bottom = 0.65, downMs = 150, upMs = 250, at = 0 }) {
  return (/** @type {number} */ t) => {
    const u = t - at;
    if (u <= 0) return { x, y: top };
    if (u <= downMs)
      return { x, y: top + ((bottom - top) * (1 - Math.cos((Math.PI * u) / downMs))) / 2 };
    const v = u - downMs;
    if (v <= upMs)
      return { x, y: bottom - ((bottom - top) * (1 - Math.cos((Math.PI * v) / upMs))) / 2 };
    return { x, y: top };
  };
}

/** Soma de vários golpes da mesma mão, cada um no seu tempo. */
export function strokes(/** @type {Parameters<typeof stroke>[0][]} */ list) {
  const fns = list.map(stroke);
  return (/** @type {number} */ t) => {
    // Vale o golpe mais recente que já começou.
    let current = fns[0];
    list.forEach((s, i) => {
      if (t >= (s.at ?? 0)) current = fns[i];
    });
    return current(t);
  };
}
