// Inicialização e fluxo de telas do AirBeat.
import './style.css';
import { createAudioEngine } from './audio/engine.js';
import { CameraError, startCamera } from './camera.js';
import { HIT, VIDEO_FIT } from './config.js';
import { createDebugPanel, createReplaySource, downloadJson, pickJsonFile } from './debug.js';
import { layoutKit, pieceAt } from './drumKit.js';
import { createMonotonicClock, startFrameLoop } from './frameLoop.js';
import { createHandPipeline } from './handPipeline.js';
import { createHandTracker } from './handTracker.js';
import { createLandmarkRecorder, parseRecording } from './landmarkRecording.js';
import { clear, drawHands, drawKit, drawSticks, fitCanvas } from './render.js';
import { createHandsHint } from './ui/handsHint.js';
import { createMetronomeControls } from './ui/metronomeControls.js';
import { showError, showLoading, showScreen } from './ui/screens.js';

const stage = document.getElementById('stage');
const video = /** @type {HTMLVideoElement} */ (document.getElementById('camera'));
const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('overlay'));
const ctx = canvas.getContext('2d');
const hint = createHandsHint(document.getElementById('hint'));
const debugPanel = createDebugPanel(document.getElementById('debug'), {
  onRecordToggle: toggleRecording,
  onReplayRequest: startReplay,
  onResetCounters: resetCounters,
});

const metronome = createMetronomeControls(document.getElementById('toolbar'), () => audio);
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || stage.hidden) return;
  // Tecla de atalho não pode disparar junto com o clique num botão focado.
  if (metronome.handleKey(e.key.toLowerCase())) e.preventDefault();
});

// O relógio vive fora da sessão: ao tentar de novo, o timestamp continua crescendo.
const clock = createMonotonicClock();
video.style.objectFit = VIDEO_FIT;

/** @type {null | Awaited<ReturnType<typeof createHandTracker>>} */
let tracker = null;
/** @type {null | { stop: () => void }} */
let camera = null;
/** @type {null | (() => void)} */
let stopLoop = null;
/** @type {null | ReturnType<typeof createAudioEngine>} */
let audio = null;

/** Peças posicionadas para o tamanho atual do palco; refeitas quando a tela muda. */
/** @type {import('./drumKit.js').KitPiece[]} */
let pieces = [];
let piecesFor = '';
/** @type {Record<string, number>} ms do último golpe em cada peça (para o brilho) */
const lastHitAt = {};
const pipeline = createHandPipeline({ pieceAt: (p) => pieceAt(pieces, p) });

// Debug: gravação, reprodução e contagem de golpes (teste informal "20 golpes de cada mão").
const recorder = createLandmarkRecorder();
/** @type {null | ReturnType<typeof createReplaySource>} */
let replay = null;
/** @type {null | { t: number, view: import('./render.js').View }} */
let lastFrame = null;
const counters = { left: 0, right: 0, /** @type {Record<string, number>} */ byPiece: {} };

/**
 * Cria o áudio. Tem que rodar de forma síncrona dentro do clique (antes de qualquer
 * await), senão o navegador mantém o AudioContext suspenso.
 */
function ensureAudio() {
  try {
    if (audio) audio.resume();
    else audio = createAudioEngine();
  } catch (err) {
    // Sem áudio o app ainda mostra as mãos e as peças; o aviso fica no console.
    console.warn('Áudio indisponível', err);
  }
}

async function start() {
  ensureAudio();
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
  pipeline.reset();
  stopLoop = startFrameLoop(video, onFrame, clock);
}

/**
 * Mãos deste quadro: da gravação em reprodução (debug) ou do rastreador.
 * @param {number} timestampMs
 */
function readHands(timestampMs) {
  if (replay) {
    const hands = replay.handsAt(timestampMs);
    if (hands) return { hands, detectMs: 0 };
    replay = null;
    pipeline.reset();
  }
  const t0 = performance.now();
  const hands = tracker.detect(video, timestampMs);
  return { hands, detectMs: performance.now() - t0 };
}

/** @param {number} timestampMs */
function onFrame(timestampMs) {
  let frame;
  try {
    frame = readHands(timestampMs);
  } catch (err) {
    console.error(err);
    fail('O rastreamento das mãos parou. Tente de novo.');
    return;
  }
  const { hands, detectMs } = frame;

  /** @type {import('./render.js').View} */
  const view = {
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    ...fitCanvas(canvas, ctx),
    fit: VIDEO_FIT,
    mirrored: video.classList.contains('mirrored'),
  };
  const size = `${view.width}x${view.height}`;
  if (size !== piecesFor) {
    pieces = layoutKit(view.width, view.height);
    piecesFor = size;
  }
  lastFrame = { t: timestampMs, view };
  if (recorder.recording && !recorder.add(timestampMs, hands)) toggleRecording();

  const { tracked, hits, states } = pipeline.process(timestampMs, hands, view);
  for (const hit of hits) onHit(hit, tracked);

  clear(ctx, view);
  drawKit(ctx, pieces, view, lastHitAt, timestampMs);
  if (debugPanel.visible) drawHands(ctx, hands, view);
  drawSticks(ctx, tracked, view);

  metronome.update();
  hint.update(hands.length, timestampMs);
  debugPanel.update(timestampMs, detectMs, {
    hands: hands.length,
    delegate: replay ? 'gravação' : tracker.delegate,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    extra: debugLines(states, timestampMs),
  });
}

/**
 * @param {import('./hitDetector.js').HitEvent} hit
 * @param {{ id: number, point: { x: number } }[]} tracked
 */
function onHit(hit, tracked) {
  const piece = pieces.find((p) => p.id === hit.pieceId);
  if (!piece) return;
  // Tocar já, sem agendar: cada ms aqui é latência que o usuário sente.
  audio?.play(/** @type {any} */ (piece.sound));
  lastHitAt[piece.id] = hit.t;
  const x = tracked.find((h) => h.id === hit.handId)?.point.x ?? 0.5;
  if (x < 0.5) counters.left++;
  else counters.right++;
  counters.byPiece[piece.id] = (counters.byPiece[piece.id] ?? 0) + 1;
}

/**
 * @param {import('./hitDetector.js').HandState[]} states
 * @param {number} now
 */
function debugLines(states, now) {
  const lines = [
    `golpe: ${HIT.mode} · ${HIT.controlPoint} · limiar ${HIT.downVelocity}/s · ${HIT.minIntervalMs} ms`,
    ...states.map(
      (s) =>
        `mão ${s.id}: vy ${s.vy.toFixed(2)}/s · ${s.pieceId ?? '-'}${s.armed ? '' : ' · desarmada'}`,
    ),
    `golpes: esq ${counters.left} · dir ${counters.right} · ` +
      (pieces.map((p) => `${p.label} ${counters.byPiece[p.id] ?? 0}`).join(' ') || '-'),
  ];
  if (audio) {
    lines.push(`áudio: ${audio.ctx.state} · saída ~${audio.outputLatencyMs().toFixed(0)} ms`);
  } else {
    lines.push('áudio: indisponível');
  }
  if (recorder.recording) lines.push(`● gravando ${(recorder.elapsed(now) / 1000).toFixed(1)} s`);
  if (replay) lines.push('▶ reproduzindo gravação');
  return lines;
}

function resetCounters() {
  counters.left = 0;
  counters.right = 0;
  counters.byPiece = {};
}

function toggleRecording() {
  if (!lastFrame) return;
  if (!recorder.recording) {
    recorder.start(lastFrame.t, lastFrame.view);
    return;
  }
  const rec = recorder.stop();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  if (rec) downloadJson(`airbeat-landmarks-${stamp}.json`, rec);
}

async function startReplay() {
  try {
    const data = await pickJsonFile();
    if (!data) return;
    replay = createReplaySource(parseRecording(data).frames);
    pipeline.reset();
  } catch (err) {
    console.warn(err);
    alert(err instanceof Error ? err.message : 'Não foi possível ler a gravação.');
  }
}

/** @param {string} message */
function fail(message) {
  stopSession();
  showError(message);
}

function stopSession() {
  metronome.stop();
  stopLoop?.();
  stopLoop = null;
  camera?.stop();
  camera = null;
  video.srcObject = null;
  replay = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stage.hidden = true;
}

document.getElementById('start').addEventListener('click', start);
document.getElementById('retry').addEventListener('click', start);
// O navegador suspende o áudio em segundo plano; ao voltar, retoma.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') audio?.resume();
});
// Voltando pelo histórico (bfcache) a sessão já foi encerrada no pagehide: volta à intro.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) showScreen('intro');
});
// Libera câmera, modelo e áudio ao fechar ou trocar de página (inclusive no bfcache).
window.addEventListener('pagehide', () => {
  stopSession();
  tracker?.close();
  tracker = null;
  audio?.close();
  audio = null;
});
