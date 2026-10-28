// Inicialização e fluxo de telas do AirBeat.
import './style.css';
import { CameraError, startCamera } from './camera.js';
import { VIDEO_FIT } from './config.js';
import { createDebugPanel } from './debug.js';
import { createMonotonicClock, startFrameLoop } from './frameLoop.js';
import { createHandTracker } from './handTracker.js';
import { drawHands, fitCanvas } from './render.js';
import { createHandsHint } from './ui/handsHint.js';
import { showError, showLoading, showScreen } from './ui/screens.js';

const stage = document.getElementById('stage');
const video = /** @type {HTMLVideoElement} */ (document.getElementById('camera'));
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('overlay'));
const ctx = canvas.getContext('2d');
const debugPanel = createDebugPanel(document.getElementById('debug'));
const hint = createHandsHint(document.getElementById('hint'));

// O relógio vive fora da sessão: ao tentar de novo, o timestamp continua crescendo.
const clock = createMonotonicClock();
video.style.objectFit = VIDEO_FIT;

/** @type {null | Awaited<ReturnType<typeof createHandTracker>>} */
let tracker = null;
/** @type {null | { stop: () => void }} */
let camera = null;
/** @type {null | (() => void)} */
let stopLoop = null;

async function start() {
  stopSession();
  showLoading('Abrindo a câmera e carregando o rastreamento das mãos…');

  // O modelo (~8 MB) e o wasm carregam enquanto o usuário responde à permissão.
  const [cam, trk] = await Promise.allSettled([
    startCamera(video),
    tracker ? Promise.resolve(tracker) : createHandTracker(),
  ]);
  if (trk.status === 'fulfilled') tracker = trk.value;
  if (cam.status === 'fulfilled') camera = cam.value;

  if (cam.status === 'rejected') {
    console.warn(cam.reason);
    stopSession();
    showError(
      cam.reason instanceof CameraError ? cam.reason.message : 'Não foi possível abrir a câmera.',
    );
    return;
  }
  if (trk.status === 'rejected') {
    console.error(trk.reason);
    stopSession();
    showError(
      'Não foi possível carregar o rastreamento das mãos. Confira a conexão e tente de novo.',
    );
    return;
  }

  // Se a câmera for desconectada ou tomada por outro app, a trilha termina.
  for (const track of video.srcObject.getVideoTracks()) {
    track.addEventListener('ended', () => fail('A câmera foi desligada ou desconectada.'), {
      once: true,
    });
  }
  stage.hidden = false;
  showScreen(null);
  stopLoop = startFrameLoop(video, onFrame, clock);
}

/** @param {number} timestampMs */
function onFrame(timestampMs) {
  const t0 = performance.now();
  let hands;
  try {
    hands = tracker.detect(video, timestampMs);
  } catch (err) {
    console.error(err);
    fail('O rastreamento das mãos parou. Tente de novo.');
    return;
  }
  const detectMs = performance.now() - t0;

  const view = {
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    ...fitCanvas(canvas, ctx),
    fit: VIDEO_FIT,
    mirrored: video.classList.contains('mirrored'),
  };
  drawHands(ctx, hands, view);
  hint.update(hands.length, t0);
  debugPanel.update(t0, detectMs, {
    hands: hands.length,
    delegate: tracker.delegate,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
  });
}

/** @param {string} message */
function fail(message) {
  stopSession();
  showError(message);
}

function stopSession() {
  stopLoop?.();
  stopLoop = null;
  camera?.stop();
  camera = null;
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stage.hidden = true;
}

document.getElementById('start').addEventListener('click', start);
document.getElementById('retry').addEventListener('click', start);
// Libera câmera e modelo ao fechar ou trocar de página (inclusive no bfcache).
window.addEventListener('pagehide', () => {
  stopSession();
  tracker?.close();
  tracker = null;
});
