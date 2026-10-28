// Inicialização e fluxo de telas do AirBeat.
import './style.css';
import { CameraError, startCamera } from './camera.js';
import { showError, showLoading, showScreen } from './ui/screens.js';

const stage = document.getElementById('stage');
const video = /** @type {HTMLVideoElement} */ (document.getElementById('camera'));

/** @type {null | { stop: () => void }} */
let camera = null;

async function start() {
  stopAll();
  showLoading('Abrindo a câmera…');
  try {
    camera = await startCamera(video);
  } catch (err) {
    console.warn(err);
    stopAll();
    showError(err instanceof CameraError ? err.message : 'Não foi possível abrir a câmera.');
    return;
  }
  // Se a câmera for desconectada ou tomada por outro app, a trilha termina.
  for (const track of video.srcObject.getVideoTracks()) {
    track.addEventListener('ended', onCameraLost, { once: true });
  }
  stage.hidden = false;
  showScreen(null);
}

function onCameraLost() {
  stopAll();
  showError('A câmera foi desligada ou desconectada.');
}

function stopAll() {
  camera?.stop();
  camera = null;
  video.srcObject = null;
  stage.hidden = true;
}

document.getElementById('start').addEventListener('click', start);
document.getElementById('retry').addEventListener('click', start);
// Libera a câmera ao fechar ou trocar de página (inclusive no bfcache).
window.addEventListener('pagehide', stopAll);
