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
  /**
   * 60 quando a câmera aguenta: menos espera entre quadros = menos atraso no golpe.
   * A maioria das webcams entrega 30; o valor real aparece no painel de debug.
   */
  idealFrameRate: 60,
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
  /**
   * Confiança mínima (0 a 1) de que a mão continua presente. Padrão do MediaPipe: 0.5.
   * 0.3 porque, na gravação de 17/11, a mão fechada (joinha) sumia parada 30 vezes em 23 s;
   * reencontrar mão fechada é mais difícil que continuar seguindo.
   */
  minHandPresenceConfidence: 0.3,
  /** Confiança mínima (0 a 1) para seguir a mão entre quadros sem redetectar. Padrão: 0.5 (ver acima). */
  minTrackingConfidence: 0.3,
};

/**
 * Detecção de golpe. As posições estão em "unidades de palco": 0 a 1 da largura e
 * da altura da área visível (depois do espelho e do corte do object-fit). Velocidade
 * em unidades de palco por segundo, medida pelo tempo dos quadros.
 * y cresce para baixo, então velocidade positiva = mão descendo.
 */
export const HIT = {
  /**
   * 'stroke': toca assim que a baqueta entra numa peça durante uma descida rápida (padrão).
   * 'velocity': v1, só toca se a velocidade no quadro dentro da peça passar do limiar.
   * 'lowestPoint': toca no fim da descida, na peça sob o ponto mais baixo (mais atraso).
   * Comparação na gravação de 17/11: ver o PR do ajuste da baqueta.
   */
  mode: 'stroke',
  /**
   * Ponto da mão que bate na peça:
   * 'thumb' (padrão): ponta do dedão, um pouco abaixo dela (`thumbOffset`). Pensado para a
   *   mão fechada em posição de joinha, como quem segura uma baqueta (pedido do teste de 17/11).
   * 'stick': ponta da mão, na reta pulso -> nós dos dedos, a `stickReach` do pulso.
   * 'knuckles': nós dos dedos (5, 9, 13, 17). 'palm': centro da palma (0, 5, 9, 13, 17), a v1.
   * 'indexTip': ponta do indicador (8).
   */
  controlPoint: 'thumb',
  /**
   * Quanto o ponto desce da ponta do dedão em direção à junta do meio dele (0 = na ponta,
   * 1 = na junta). 0.25 = "levemente abaixo da ponta".
   */
  thumbOffset: 0.25,
  /**
   * Alcance da baqueta em múltiplos da distância pulso -> nós dos dedos. 1 = nos nós;
   * 1.3 = um pouco além, onde ficam as falanges com a mão fechada. Medido em proporção da
   * própria mão, então vale para qualquer distância da câmera.
   */
  stickReach: 1.3,
  /**
   * Velocidade descendente que inicia um golpe, em alturas de palco por segundo.
   * 0.8 pegou mais golpes que 1.0 nas gravações de 17/11 sem aumentar os sem descida.
   */
  downVelocity: 0.8,
  /**
   * Abaixo desta velocidade (alturas de palco/s) a descida terminou. Bem menor que
   * downVelocity: a mão freando dentro da peça ainda está no mesmo golpe.
   */
  strokeEndVelocity: 0.2,
  /** Duração máxima de uma descida, em ms. Depois disso conta como terminada. */
  strokeMaxMs: 400,
  /**
   * Predição, em ms (modo 'stroke'): durante a descida, toca se a baqueta VAI entrar numa
   * peça dentro desse tempo, seguindo a velocidade atual. Adianta o som em até esse tempo
   * para compensar o atraso da câmera; alto demais toca peças em que a mão para antes.
   */
  predictMs: 40,
  /** No modo 'velocity' (v1): velocidade de subida que rearma a mão, em alturas de palco/s. */
  rearmUpVelocity: 0.3,
  /**
   * Intervalo mínimo entre dois golpes da mesma mão, em ms (100 ms = até 10 golpes/s por
   * mão). A proteção principal contra disparo duplo é o rearme por subida (rearmRise).
   */
  minIntervalMs: 100,
  /**
   * Depois de um golpe, quanto a baqueta precisa subir (alturas de palco) a partir do ponto
   * mais baixo para valer o próximo. Maior que o tremor da mão parada (~0,02), menor que o
   * curso de um golpe rápido (~0,05 ou mais).
   */
  rearmRise: 0.03,
  /** Se dois quadros da mesma mão estão mais distantes que isso (ms), a velocidade recomeça do zero. */
  maxFrameGapMs: 150,
  /**
   * Peso do quadro novo na média móvel exponencial da posição (0 a 1).
   * 1 = sem suavização. Suavizar reduz tremor mas atrasa o golpe; começar sem e medir.
   */
  smoothingAlpha: 1,
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
  /**
   * Limitador suave: até este nível (0 a 1) o som passa igual; acima, é comprimido aos
   * poucos em vez de estourar quando várias peças tocam juntas. Sem atraso (WaveShaper).
   */
  limiterKnee: 0.7,
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
  /** Raio da ponta da baqueta (o ponto que bate), em px de tela (CSS). */
  stickRadius: 12,
  /** Espessura da haste da baqueta, do centro da palma até a ponta, em px de tela (CSS). */
  stickWidth: 6,
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

/** Tela de posicionamento. */
export const POSITIONING = {
  /** Tempo, em ms, com as duas mãos inteiras na tela antes de seguir sozinho para o menu. */
  holdMs: 1500,
  /** Margem, em unidades de palco, que a mão precisa ter da borda para contar como "inteira". */
  edgeMargin: 0.02,
  /**
   * Tamanho máximo da mão (pulso -> base do dedo médio), em fração da altura do palco.
   * Acima disso a pessoa está perto demais: a mão fica maior que as peças e sai da tela
   * ao bater. Na gravação de 17/11 a mediana foi 0,36 (perto demais); ~0,2 equivale a
   * cerca de 1 m de um notebook.
   */
  maxHandSize: 0.22,
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
  /** Quantas amostras entram na mediana de atraso mostrada no painel. */
  latencySamples: 60,
  /** Dois golpes de mãos diferentes com até esta distância (ms) contam como simultâneos. */
  simultaneousMs: 50,
  /** Duração máxima de uma gravação, em ms, para não encher a memória se esquecerem ligada. */
  recordMaxMs: 120000,
};
