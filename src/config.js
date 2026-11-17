// Todas as constantes de ajuste do AirBeat ficam aqui, com unidade e motivo.
// Os valores iniciais vêm do XRD e do CLAUDE.md e serão ajustados com testes.

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
  modelPath: `${import.meta.env.BASE_URL}models/hand_landmarker.task`,
  /** Pasta do runtime wasm, copiada de node_modules por scripts/copy-mediapipe-wasm.js. */
  wasmPath: `${import.meta.env.BASE_URL}mediapipe/wasm`,
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

/** Desenho das mãos sobre o vídeo. */
export const HAND_STYLE = {
  /** Cor de cada mão, na ordem em que o MediaPipe as devolve (não é esquerda/direita). */
  colors: ['#33d6ff', '#ff5ca8'],
  /** Raio de cada ponto, em px de tela (CSS). */
  pointRadius: 4,
  /** Espessura das linhas entre os pontos, em px de tela (CSS). */
  lineWidth: 2,
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
};
