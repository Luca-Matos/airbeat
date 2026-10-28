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
