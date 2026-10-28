// Camada fina sobre o MediaPipe HandLandmarker: carrega o modelo, detecta as
// mãos num quadro de vídeo e devolve os pontos normalizados (0 a 1).
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { TRACKING } from './config.js';

/** @typedef {{ x: number, y: number, z: number }} Point */

/**
 * Cria o rastreador. Tenta cada delegate de TRACKING.delegates na ordem; a GPU
 * falha em alguns aparelhos e navegadores, e a CPU é a rede de segurança.
 * @returns {Promise<{ delegate: string, detect: (video: HTMLVideoElement, timestampMs: number) => Point[][], close: () => void }>}
 */
export async function createHandTracker() {
  const fileset = await FilesetResolver.forVisionTasks(TRACKING.wasmPath);
  let lastError;
  for (const delegate of TRACKING.delegates) {
    try {
      const landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: TRACKING.modelPath, delegate },
        runningMode: 'VIDEO',
        numHands: TRACKING.numHands,
        minHandDetectionConfidence: TRACKING.minHandDetectionConfidence,
        minHandPresenceConfidence: TRACKING.minHandPresenceConfidence,
        minTrackingConfidence: TRACKING.minTrackingConfidence,
      });
      return {
        delegate,
        // O timestamp precisa ser estritamente crescente entre chamadas (ver frameLoop).
        detect: (video, timestampMs) => landmarker.detectForVideo(video, timestampMs).landmarks,
        close: () => landmarker.close(),
      };
    } catch (err) {
      console.warn(`HandLandmarker não iniciou com ${delegate}`, err);
      lastError = err;
    }
  }
  throw lastError;
}
