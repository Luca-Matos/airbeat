// Todas as constantes de ajuste do AirBeat ficam aqui, com unidade e motivo.
// Os valores iniciais vêm do XRD e do CLAUDE.md e serão ajustados com testes.

/** Prefixo dos arquivos estáticos (no Pages é /airbeat/). Fora do Vite (scripts Node) vale '/'. */
const BASE_URL = import.meta.env?.BASE_URL ?? '/';

/** Nome exibido e versão da interface. */
export const APP_NAME = 'AirBeat';

/**
 * Pedido feito à câmera. Resolução baixa de propósito: o MediaPipe trabalha em
 * resolução reduzida internamente e 640x480 alivia celulares mais lentos.
 * Os valores são "ideal", o navegador escolhe o mais próximo disponível.
 */
export const CAMERA = {
  /** Câmera frontal, para o efeito de espelho. */
  facingMode: 'user',
  /** Largura ideal pedida, em px. */
  idealWidth: 640,
  /** Altura ideal pedida, em px. */
  idealHeight: 480,
  /** Quadros por segundo ideais pedidos à câmera. */
  idealFrameRate: 30,
};

/**
 * Como o vídeo preenche a tela. 'cover' corta as bordas e ocupa tudo; 'contain'
 * mostra o quadro inteiro com faixas. Os pontos das mãos seguem o mesmo ajuste.
 */
export const VIDEO_FIT = 'cover';

/** Rastreamento de mãos (MediaPipe HandLandmarker). */
export const TRACKING = {
  /** Modelo servido pelo próprio app (public/models), para não depender de rede externa. */
  modelPath: `${BASE_URL}models/hand_landmarker.task`,
  /** Pasta do runtime wasm, copiada de node_modules por scripts/copy-mediapipe-wasm.js. */
  wasmPath: `${BASE_URL}mediapipe/wasm`,
  /** Ordem de tentativa do processamento. Se a GPU falhar ao criar, cai para a CPU. */
  delegates: ['GPU', 'CPU'],
  /** Quantas mãos detectar no máximo. */
  numHands: 2,
  /** Confiança mínima (0 a 1) para detectar uma mão nova no quadro. Padrão do MediaPipe: 0.5. */
  minHandDetectionConfidence: 0.5,
  /** Confiança mínima (0 a 1) de que a mão continua presente. Padrão: 0.5. */
  minHandPresenceConfidence: 0.5,
  /** Confiança mínima (0 a 1) para seguir a mão entre quadros sem redetectar. Padrão: 0.5. */
  minTrackingConfidence: 0.5,
};

/**
 * Detecção de golpe. As posições estão em "unidades de palco": 0 a 1 da largura e
 * da altura da área visível (depois do espelho e do corte do object-fit). Velocidade
 * em unidades de palco por segundo, medida pelo tempo dos quadros.
 * y cresce para baixo, então velocidade positiva = mão descendo.
 */
export const HIT = {
  /**
   * 'velocity': dispara quando a mão entra na peça descendo acima do limiar.
   * 'lowestPoint': espera a mão parar de descer (onde a baqueta bateria de verdade).
   * As duas ficam disponíveis para comparar com gravações; decisão em aberto.
   */
  mode: 'velocity',
  /** Ponto da mão usado como "baqueta": 'palm' (média de 0,5,9,13,17) ou 'indexTip' (8). */
  controlPoint: 'palm',
  /** Velocidade descendente mínima para contar como golpe, em alturas de palco por segundo. */
  downVelocity: 1.2,
  /** Velocidade de subida que rearma a mão depois de um golpe, em alturas de palco por segundo. */
  rearmUpVelocity: 0.3,
  /** Intervalo mínimo entre dois golpes da mesma mão, em ms. Evita disparo duplo. */
  minIntervalMs: 120,
  /** Se dois quadros da mesma mão estão mais distantes que isso (ms), a velocidade recomeça do zero. */
  maxFrameGapMs: 150,
  /**
   * Peso do quadro novo na média móvel exponencial da posição (0 a 1).
   * 1 = sem suavização. Suavizar reduz tremor mas atrasa o golpe; começar sem e medir.
   */
  smoothingAlpha: 1,
  /** No modo 'lowestPoint', tempo máximo (ms) esperando a mão parar antes de disparar mesmo assim. */
  lowestPointMaxWaitMs: 200,
  /** Velocidade (alturas de palco/s) abaixo da qual a descida é considerada parada no modo 'lowestPoint'. */
  lowestPointStopVelocity: 0.15,
};

/** Associação das mãos entre quadros (não usamos o rótulo esquerda/direita do MediaPipe). */
export const HAND_MATCH = {
  /**
   * Distância máxima, em unidades de palco, para considerar que é a mesma mão do quadro anterior.
   * Um golpe rápido a 15 FPS anda ~0,25 entre quadros; abaixo disso a mão "vira outra" e o golpe se perde.
   */
  maxJump: 0.35,
  /** Tempo, em ms, que uma mão sumida ainda é lembrada antes de virar uma mão nova. */
  forgetAfterMs: 300,
};

/** Saída de áudio. */
export const AUDIO = {
  /** Volume geral (0 a 1) aplicado depois de todos os sons. */
  masterGain: 0.9,
  /** Pedido ao navegador: menor latência possível, mesmo gastando mais CPU. */
  latencyHint: 'interactive',
};

/** Metrônomo (src/audio/metronome.js). */
export const METRONOME = {
  /** Andamento inicial, em batidas por minuto. Lento o bastante para iniciantes. */
  defaultBpm: 80,
  /** Andamento mínimo aceito, em BPM. */
  minBpm: 40,
  /** Andamento máximo aceito, em BPM. */
  maxBpm: 200,
  /** Quanto os botões - e + mudam o andamento, em BPM. */
  bpmStep: 5,
  /** Batidas por compasso; a primeira é acentuada. */
  beatsPerBar: 4,
  /** Quanto à frente o agendador marca as batidas, em ms. Maior = mais robusto a travadas, mais lento para reagir a mudanças. */
  lookaheadMs: 100,
  /** Intervalo do setInterval que acorda o agendador, em ms. Precisa ser bem menor que lookaheadMs. */
  timerIntervalMs: 25,
  /** Espera antes da primeira batida, em ms, para o agendador começar com folga. */
  startDelayMs: 100,
};

/**
 * Receitas dos sons, sintetizados no código (src/audio/synth.js). Nenhum arquivo de
 * áudio externo, então não há licença de terceiros. Cada som soma camadas:
 * - tone: oscilador com queda de altura (freq -> freqEnd, constante pitchDecayMs)
 * - noise: ruído branco filtrado
 * - metal: soma de ondas quadradas em frequências não harmônicas (timbre de prato)
 * Tempos em ms, frequências em Hz. `gain` é o volume final relativo (0 a 1), aplicado
 * depois de normalizar o pico. `drive` satura de leve (1 = sem saturação).
 */
const METAL_FREQS = [263, 400, 421, 474, 587, 845];
export const SOUNDS = {
  kick: {
    durationMs: 500,
    gain: 1,
    drive: 1.6,
    layers: [
      {
        type: 'tone',
        wave: 'sine',
        freq: 160,
        freqEnd: 45,
        pitchDecayMs: 35,
        decayMs: 170,
        gain: 1,
      },
      { type: 'noise', filter: { type: 'lowpass', freq: 3000, q: 0.7 }, decayMs: 4, gain: 0.25 },
    ],
  },
  snare: {
    durationMs: 320,
    gain: 0.85,
    drive: 1,
    layers: [
      {
        type: 'tone',
        wave: 'triangle',
        freq: 200,
        freqEnd: 175,
        pitchDecayMs: 30,
        decayMs: 60,
        gain: 0.6,
      },
      { type: 'tone', wave: 'sine', freq: 330, decayMs: 40, gain: 0.3 },
      { type: 'noise', filter: { type: 'highpass', freq: 1500, q: 0.7 }, decayMs: 85, gain: 0.9 },
    ],
  },
  tom: {
    durationMs: 550,
    gain: 0.9,
    drive: 1.2,
    layers: [
      {
        type: 'tone',
        wave: 'sine',
        freq: 150,
        freqEnd: 105,
        pitchDecayMs: 90,
        decayMs: 210,
        gain: 1,
      },
      { type: 'noise', filter: { type: 'lowpass', freq: 2500, q: 0.7 }, decayMs: 12, gain: 0.15 },
    ],
  },
  hihat: {
    durationMs: 130,
    gain: 0.55,
    drive: 1,
    layers: [
      {
        type: 'metal',
        freqs: METAL_FREQS,
        filter: { type: 'highpass', freq: 7000, q: 0.7 },
        decayMs: 30,
        gain: 1,
      },
      { type: 'noise', filter: { type: 'highpass', freq: 8000, q: 0.7 }, decayMs: 25, gain: 0.5 },
    ],
  },
  crash: {
    durationMs: 1800,
    gain: 0.6,
    drive: 1,
    layers: [
      {
        type: 'metal',
        freqs: METAL_FREQS,
        filter: { type: 'highpass', freq: 5000, q: 0.7 },
        decayMs: 550,
        gain: 0.7,
      },
      { type: 'noise', filter: { type: 'highpass', freq: 4000, q: 0.7 }, decayMs: 650, gain: 1 },
    ],
  },
  click: {
    durationMs: 40,
    gain: 0.6,
    drive: 1,
    layers: [{ type: 'tone', wave: 'sine', freq: 1000, decayMs: 8, gain: 1 }],
  },
  clickAccent: {
    durationMs: 40,
    gain: 0.8,
    drive: 1,
    layers: [{ type: 'tone', wave: 'sine', freq: 1600, decayMs: 8, gain: 1 }],
  },
};

/** Desenho das mãos sobre o vídeo. */
export const HAND_STYLE = {
  /** Cor do esqueleto de cada mão (só no debug), na ordem do MediaPipe (não é esquerda/direita). */
  colors: ['#33d6ff', '#ff5ca8'],
  /** Raio de cada ponto do esqueleto, em px de tela (CSS). */
  pointRadius: 4,
  /** Espessura das linhas entre os pontos, em px de tela (CSS). */
  lineWidth: 2,
  /** Raio do ponto de controle (a "baqueta"), em px de tela (CSS). */
  stickRadius: 12,
  /** Cor do ponto de controle. Branco para não confundir com a cor de nenhuma peça. */
  stickColor: '#ffffff',
};

/**
 * Bateria: 5 peças em arco em volta do usuário, em unidades de palco (0 a 1 da área
 * visível). No espelho, a mão esquerda do usuário aparece à esquerda da tela, então o
 * chimbal fica à esquerda e o prato à direita, como numa bateria real. O bumbo é um
 * pad embaixo, tocado com a mão (pedal não é rastreável pela câmera frontal).
 * Paleta provisória (cartão "Definir paleta"): cores saturadas e bem distintas.
 */
export const DRUM_KIT = {
  pieces: [
    {
      id: 'hihat',
      label: 'Chimbal',
      sound: 'hihat',
      color: '#ffd23f',
      shape: 'circle',
      x: 0.14,
      y: 0.5,
    },
    {
      id: 'snare',
      label: 'Caixa',
      sound: 'snare',
      color: '#ff5c5c',
      shape: 'circle',
      x: 0.36,
      y: 0.64,
    },
    { id: 'tom', label: 'Tom', sound: 'tom', color: '#3ddc97', shape: 'circle', x: 0.64, y: 0.64 },
    {
      id: 'crash',
      label: 'Prato',
      sound: 'crash',
      color: '#4dabf7',
      shape: 'circle',
      x: 0.86,
      y: 0.5,
    },
    // Retângulo: x/y são o centro, w/h a largura e a altura.
    {
      id: 'kick',
      label: 'Bumbo',
      sound: 'kick',
      color: '#b388ff',
      shape: 'rect',
      x: 0.5,
      y: 0.89,
      w: 0.22,
      h: 0.16,
    },
  ],
  /** Raio das peças redondas, em fração do menor lado do palco (fica redonda em qualquer tela). */
  radius: 0.13,
  /** Teto do raio, em fração da largura do palco, para as peças não se sobreporem em tela retrato. */
  maxRadiusOfWidth: 0.1,
  /** Folga da zona de golpe além do desenho (1 = exatamente o desenho; 1.15 = 15% maior). */
  hitMargin: 1.15,
};

/** Aparência das peças. */
export const KIT_STYLE = {
  /** Opacidade do preenchimento em repouso (0 a 1). Baixa para o usuário se ver por trás. */
  fillAlpha: 0.22,
  /** Opacidade do preenchimento no instante do golpe. */
  hitFillAlpha: 0.8,
  /** Opacidade do contorno. */
  strokeAlpha: 0.9,
  /** Espessura do contorno, em px CSS. */
  lineWidth: 3,
  /** Duração do brilho depois do golpe, em ms. */
  flashMs: 180,
  /** Quanto a peça cresce no golpe (1 = nada). */
  hitScale: 1.08,
  /** Desfoque do brilho, em px CSS. */
  glowBlur: 28,
  /** Fonte do nome das peças. */
  labelFont: '600 15px system-ui, sans-serif',
};

/** Aviso de mãos fora do enquadramento. */
export const HANDS_HINT = {
  /**
   * Tempo, em ms, que a contagem de mãos precisa ficar estável antes de o aviso
   * mudar. Evita o aviso piscar quando o rastreamento perde a mão por 1 ou 2 quadros.
   */
  settleMs: 500,
};

/** Painel de debug (FPS, tempo de detecção). */
export const DEBUG = {
  /** Painel visível ao abrir. A tecla D alterna; ?debug=0 ou ?debug=1 na URL forçam. */
  panelVisibleByDefault: true,
  /** Janela, em ms, usada para calcular FPS e tempo médio de detecção. */
  statsWindowMs: 1000,
  /** Intervalo, em ms, entre atualizações do texto do painel (atualizar todo quadro pesa). */
  panelRefreshMs: 250,
  /** Casas decimais dos pontos gravados (4 = 0,1 px numa imagem de 1000 px), para o arquivo ficar pequeno. */
  recordDecimals: 4,
  /** Duração máxima de uma gravação, em ms, para não encher a memória se esquecerem ligada. */
  recordMaxMs: 120000,
};
