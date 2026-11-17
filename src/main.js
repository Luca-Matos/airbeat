// Inicialização e fluxo de telas do AirBeat.
import './style.css';
import { createAudioEngine } from './audio/engine.js';
import { CameraError, startCamera } from './camera.js';
import { CAMERA, DEBUG, HIT, POSITIONING, VIDEO_FIT } from './config.js';
import {
  createDebugPanel,
  createReplaySource,
  createRollingMedian,
  downloadJson,
  pickJsonFile,
} from './debug.js';
import { layoutKit, pieceAt } from './drumKit.js';
import { createMonotonicClock, startFrameLoop } from './frameLoop.js';
import { createHandPipeline } from './handPipeline.js';
import { createHandTracker } from './handTracker.js';
import { createLandmarkRecorder, parseRecording } from './landmarkRecording.js';
import { clear, drawHands, drawKit, drawSticks, fitCanvas, toStage } from './render.js';
import { adjustTuning, defaultTuning, describeTuning } from './tuning.js';
import { createHandsHint } from './ui/handsHint.js';
import { createMetronomeControls } from './ui/metronomeControls.js';
import {
  createPositionHold,
  handFullyVisible,
  handSize,
  POSITION_MESSAGES,
  positionStatus,
} from './ui/positioning.js';
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
  onKey: retune,
});

const toolbar = document.getElementById('toolbar');
const positionText = document.getElementById('position-text');
const positionProgress = document.getElementById('position-progress');
const metronome = createMetronomeControls(toolbar, () => audio);
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || mode !== 'free') return;
  if (e.key === 'Escape') {
    enterMenu();
    return;
  }
  // Tecla de atalho não pode disparar junto com o clique num botão focado.
  if (metronome.handleKey(e.key.toLowerCase())) e.preventDefault();
});

/**
 * Tela atual enquanto a câmera está aberta. A câmera e o rastreamento seguem ligados
 * nas três; só o modo livre desenha a bateria e toca.
 * @type {'off' | 'position' | 'menu' | 'free'}
 */
let mode = 'off';
const positionHold = createPositionHold();

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
// Parâmetros de golpe em uso; o painel de debug muda ao vivo (ver tuning.js).
let tuning = defaultTuning();
let pipeline = createPipeline();

function createPipeline() {
  return createHandPipeline({ pieceAt: (p) => pieceAt(pieces, p), config: tuning });
}

/** @param {string} key */
function retune(key) {
  const next = adjustTuning(tuning, key);
  if (!next) return;
  tuning = next;
  pipeline = createPipeline();
}

// Debug: gravação, reprodução e contagem de golpes (teste informal "20 golpes de cada mão").
const recorder = createLandmarkRecorder();
/** @type {null | ReturnType<typeof createReplaySource>} */
let replay = null;
/** @type {null | { t: number, view: import('./render.js').View }} */
let lastFrame = null;
const counters = {
  left: 0,
  right: 0,
  /** golpes das duas mãos com até DEBUG.simultaneousMs entre eles */
  together: 0,
  /** @type {Record<string, number>} */ byPiece: {},
  /** @type {Record<number, number>} ms do último golpe de cada mão */ lastByHand: {},
};

// Medição de atraso. O Chrome informa em captureTime quando a câmera capturou o quadro
// (mesmo relógio do performance.now), então dá para medir câmera -> detecção e
// câmera -> som tocado. Falta só a saída do áudio, que o navegador estima à parte.
const camToDetect = createRollingMedian(DEBUG.latencySamples);
const camToSound = createRollingMedian(DEBUG.latencySamples);
/** @type {number | undefined} captureTime do quadro em processamento */
let frameCaptureTime;
/** @type {number | undefined} FPS que a câmera de fato entregou */
let cameraFps;

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
  cameraFps = video.srcObject.getVideoTracks()[0]?.getSettings().frameRate;
  stage.hidden = false;
  stopLoop = startFrameLoop(video, onFrame, clock);
  enterPosition();
}

function enterPosition() {
  mode = 'position';
  metronome.stop();
  toolbar.hidden = true;
  hint.reset();
  positionHold('none', 0);
  showScreen('position');
}

function enterMenu() {
  mode = 'menu';
  metronome.stop();
  toolbar.hidden = true;
  hint.reset();
  showScreen('menu');
  document.getElementById('menu-free').focus();
}

function enterFreePlay() {
  mode = 'free';
  pipeline.reset();
  audio?.resume();
  toolbar.hidden = false;
  showScreen(null);
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

/**
 * @param {number} timestampMs
 * @param {{ captureTime?: number }} [metadata]
 */
function onFrame(timestampMs, metadata) {
  frameCaptureTime = replay ? undefined : metadata?.captureTime;
  let frame;
  try {
    frame = readHands(timestampMs);
  } catch (err) {
    console.error(err);
    fail('O rastreamento das mãos parou. Tente de novo.');
    return;
  }
  const { hands, detectMs } = frame;
  if (frameCaptureTime) camToDetect.add(performance.now() - frameCaptureTime);

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

  const { tracked, bases, hits, states } = pipeline.process(timestampMs, hands, view);
  // Fora do modo livre a detecção roda (mantém a velocidade em dia), mas não toca.
  if (mode === 'free') for (const hit of hits) onHit(hit, tracked);

  clear(ctx, view);
  if (mode === 'free') drawKit(ctx, pieces, view, lastHitAt, timestampMs);
  if (debugPanel.visible || mode === 'position') drawHands(ctx, hands, view);
  drawSticks(ctx, tracked, bases, view);

  if (mode === 'position') updatePosition(hands, view, timestampMs);
  if (mode === 'free') {
    metronome.update();
    hint.update(hands.length, timestampMs);
  }
  debugPanel.update(timestampMs, detectMs, {
    hands: hands.length,
    delegate: replay ? 'gravação' : tracker.delegate,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    extra: [
      ...debugLines(states, timestampMs),
      `tamanho da mão: ${
        hands
          .map((h) =>
            handSize(
              h.map((p) => toStage(p, view)),
              view,
            ).toFixed(2),
          )
          .join(' · ') || '-'
      } (máx. ${POSITIONING.maxHandSize})`,
    ],
  });
}

/**
 * @param {{ x: number, y: number }[][]} hands
 * @param {import('./render.js').View} view
 * @param {number} now
 */
function updatePosition(hands, view, now) {
  const staged = hands.map((h) => h.map((p) => toStage(p, view)));
  const allInside = staged.every((h) => handFullyVisible(h));
  const largest = Math.max(0, ...staged.map((h) => handSize(h, view)));
  const status = positionStatus(hands.length, allInside, largest);
  const { progress, ready } = positionHold(status, now);
  if (positionText.textContent !== POSITION_MESSAGES[status]) {
    positionText.textContent = POSITION_MESSAGES[status];
  }
  positionProgress.style.width = `${Math.round(progress * 100)}%`;
  if (ready) enterMenu();
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
  if (frameCaptureTime) camToSound.add(performance.now() - frameCaptureTime);
  lastHitAt[piece.id] = hit.t;
  const other = Object.entries(counters.lastByHand).some(
    ([id, t]) => Number(id) !== hit.handId && hit.t - t <= DEBUG.simultaneousMs,
  );
  if (other) counters.together++;
  counters.lastByHand[hit.handId] = hit.t;
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
    `${describeTuning(tuning)} · intervalo ${HIT.minIntervalMs} ms`,
    ...states.map(
      (s) =>
        `mão ${s.id}: vy ${s.vy.toFixed(2)}/s · ${s.pieceId ?? '-'}${s.armed ? '' : ' · desarmada'}`,
    ),
    `golpes: esq ${counters.left} · dir ${counters.right} · juntos ${counters.together} · ` +
      (pieces.map((p) => `${p.label} ${counters.byPiece[p.id] ?? 0}`).join(' ') || '-'),
  ];
  const out = audio?.outputLatencyMs();
  lines.push(
    audio ? `áudio: ${audio.ctx.state} · saída ~${out.toFixed(0)} ms` : 'áudio: indisponível',
  );
  const cd = camToDetect.read();
  const cs = camToSound.read();
  const fmt = (/** @type {number | null} */ v) => (v === null ? '?' : v.toFixed(0));
  lines.push(
    `câmera ${cameraFps ? cameraFps.toFixed(0) : '?'} FPS (pedido ${CAMERA.idealFrameRate}) · ` +
      `captura→detecção ${fmt(cd)} ms`,
  );
  lines.push(
    cs === null
      ? 'atraso do golpe: dê alguns golpes para medir'
      : `atraso do golpe: captura→som ${fmt(cs)} ms + saída ${fmt(out ?? null)} ms ≈ ${fmt(cs + (out ?? 0))} ms`,
  );
  if (recorder.recording) lines.push(`● gravando ${(recorder.elapsed(now) / 1000).toFixed(1)} s`);
  if (replay) lines.push('▶ reproduzindo gravação');
  return lines;
}

function resetCounters() {
  counters.left = 0;
  counters.right = 0;
  counters.byPiece = {};
  counters.together = 0;
  counters.lastByHand = {};
}

function toggleRecording() {
  if (!lastFrame) return;
  if (!recorder.recording) {
    recorder.start(lastFrame.t, lastFrame.view);
    return;
  }
  const rec = recorder.stop();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  // Guarda junto os parâmetros em uso, para reproduzir a gravação nas mesmas condições.
  if (rec) rec.tuning = tuning;
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
  mode = 'off';
  toolbar.hidden = true;
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
document.getElementById('position-skip').addEventListener('click', enterMenu);
document.getElementById('menu-free').addEventListener('click', enterFreePlay);
document.getElementById('menu-position').addEventListener('click', enterPosition);
document.getElementById('to-menu').addEventListener('click', enterMenu);
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
