// Acesso à câmera frontal. Camada fina sobre getUserMedia: abre, liga ao <video>,
// traduz erros para códigos estáveis e libera as trilhas ao sair.
import { CAMERA } from './config.js';

/** @typedef {'insecure' | 'unsupported' | 'denied' | 'not-found' | 'in-use' | 'unknown'} CameraErrorCode */

/** Mensagens mostradas ao usuário para cada falha. */
export const CAMERA_ERROR_MESSAGES = {
  insecure:
    'A câmera só funciona em página segura (https). Abra o link oficial do AirBeat ou use localhost.',
  unsupported: 'Este navegador não dá acesso à câmera. Tente o Chrome ou o Edge atualizados.',
  denied:
    'A permissão da câmera foi negada. Libere a câmera no cadeado ao lado do endereço e tente de novo.',
  'not-found': 'Nenhuma câmera foi encontrada neste dispositivo.',
  'in-use': 'A câmera está sendo usada por outro aplicativo ou aba. Feche-o e tente de novo.',
  unknown: 'Não foi possível abrir a câmera. Tente de novo.',
};

export class CameraError extends Error {
  /**
   * @param {CameraErrorCode} code
   * @param {unknown} [cause]
   */
  constructor(code, cause) {
    super(CAMERA_ERROR_MESSAGES[code], { cause });
    this.name = 'CameraError';
    this.code = code;
  }
}

/**
 * Traduz o erro do getUserMedia. Os nomes variam entre navegadores, por isso
 * mais de um nome cai no mesmo código.
 * @param {unknown} err
 * @returns {CameraErrorCode}
 */
export function classifyCameraError(err) {
  const name = /** @type {{ name?: string }} */ (err)?.name;
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'not-found';
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'in-use';
    default:
      return 'unknown';
  }
}

/**
 * Abre a câmera frontal e mostra no <video>.
 * @param {HTMLVideoElement} video
 * @param {{ mediaDevices?: MediaDevices, secure?: boolean }} [env] injetável para testes
 * @returns {Promise<{ stream: MediaStream, width: number, height: number, stop: () => void }>}
 */
export async function startCamera(video, env = {}) {
  const secure = env.secure ?? globalThis.isSecureContext;
  const mediaDevices = env.mediaDevices ?? globalThis.navigator?.mediaDevices;
  // Fora de https o navegador nem expõe mediaDevices; checar antes dá a mensagem certa.
  if (!secure) throw new CameraError('insecure');
  if (!mediaDevices?.getUserMedia) throw new CameraError('unsupported');

  let stream;
  try {
    stream = await mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: CAMERA.facingMode,
        width: { ideal: CAMERA.idealWidth },
        height: { ideal: CAMERA.idealHeight },
        frameRate: { ideal: CAMERA.idealFrameRate },
      },
    });
  } catch (err) {
    throw new CameraError(classifyCameraError(err), err);
  }

  const stop = () => stopStream(stream);
  try {
    // playsinline e muted são exigidos para o vídeo iniciar sozinho no celular.
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    stop();
    throw new CameraError(classifyCameraError(err), err);
  }

  return { stream, width: video.videoWidth, height: video.videoHeight, stop };
}

/**
 * Para todas as trilhas, o que apaga a luz da câmera.
 * @param {MediaStream | null | undefined} stream
 */
export function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}
