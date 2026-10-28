// Laço por quadro de vídeo. Usa requestVideoFrameCallback quando existe, porque
// ele só dispara quando a câmera entrega um quadro novo; senão requestAnimationFrame,
// pulando os quadros em que o vídeo não avançou.
//
// Como a detecção é síncrona e só o quadro mais recente é processado, um aparelho
// lento perde quadros em vez de acumular atraso.

/**
 * Garante timestamps estritamente crescentes. O detectForVideo do MediaPipe dá erro
 * se o tempo repete ou volta, o que acontece ao reabrir a câmera ou trocar de laço.
 * @param {number} [minStepMs] avanço mínimo entre dois timestamps, em ms
 */
export function createMonotonicClock(minStepMs = 1) {
  let last = -Infinity;
  /** @param {number} nowMs */
  return (nowMs) => {
    last = Math.max(nowMs, last + minStepMs);
    return last;
  };
}

/**
 * Chama onFrame(timestampMs) uma vez por quadro novo do vídeo, até stop().
 * @param {HTMLVideoElement} video
 * @param {(timestampMs: number) => void} onFrame
 * @param {(nowMs: number) => number} clock
 * @returns {() => void} stop
 */
export function startFrameLoop(video, onFrame, clock) {
  let running = true;
  let handle = 0;
  const useVideoCallback = 'requestVideoFrameCallback' in video;
  let lastVideoTime = -1;

  const tick = (now) => {
    if (!running) return;
    if (useVideoCallback || video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      onFrame(clock(now));
    }
    schedule();
  };
  const schedule = () => {
    handle = useVideoCallback ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
  };

  schedule();
  return () => {
    running = false;
    if (useVideoCallback) video.cancelVideoFrameCallback(handle);
    else cancelAnimationFrame(handle);
  };
}
