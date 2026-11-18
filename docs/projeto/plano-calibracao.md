# Plano: tela de calibração (aprovada pelo grupo em 17/11; início em 20/11)

## Por que

- Os testes de 17/11 mostraram que um limiar único não serve para todos: quem toca curto e preciso
  perde golpes; quem descansa a baqueta dentro da peça gera toques duplos (webcam de 30 FPS: tremida e
  golpe curto ficam iguais num quadro só).
- Cada golpe pedido na calibração tem horário-alvo conhecido. Toda calibração vira uma gravação com
  gabarito, para testes automáticos (`tests/fixtures/`).
- O mesmo motor (alvos que descem, comparação golpe x alvo, estatística de atraso) é o núcleo das lições
  e da nota de precisão da Fase 3. Construir a calibração adianta os cartões "Estrutura das lições",
  "Classificação de precisão" e "Calibragem de latência".

**O que a calibração não faz:** o som do golpe não sai mais cedo (ele depende da câmera, da detecção e da
saída de áudio). Ela mede o atraso para descontar na nota, sugere a predição e alinha os alvos com o som.

## Fluxo (~2 minutos; menu → Calibração; cada etapa pode ser refeita)

| # | Etapa | O usuário faz | O app mede |
| --- | --- | --- | --- |
| 0 | Som | Ouve 4 cliques: "Está ouvindo?" | Áudio ligado e audível |
| 1 | Parado | Segura as duas baquetas paradas sobre o tambor por 3 s | Tremor (curso e velocidade em repouso), tamanho da mão, altura de descanso |
| 2 | Movimento (guiado pela imagem) | Um tambor grande no centro; um anel desce até ele e o usuário bate quando chega. Sem metrônomo. 60 BPM: 8 golpes mão direita, 8 esquerda, 8 alternando | Curso e pico de cada golpe, faltas, duplos, tempo do contato ao som |
| 3 | Ritmo (guiado pelo som) | Só o metrônomo a 80 BPM: 16 golpes junto com o clique | Atraso total golpe x clique (mediana) |
| 4 | Resultado | Vê os números; escolhe Aplicar, Refazer ou Testar no modo livre | — |

- **Movimento antes do som:** a medida de atraso precisa da detecção já ajustada.
- **Etapas 2 e 3 separadas** (como a "calibração de áudio e de vídeo" dos jogos de ritmo): a diferença
  entre elas diz quanto adiantar o desenho dos alvos para chegarem junto com o clique.

## Como os parâmetros saem dos dados

- `HIT.minTravel` e `HIT.downVelocity`: entre o tremor da etapa 1 (com folga de 1,5×) e o menor golpe da
  etapa 2 (com folga de 0,8×). Se os dois se sobrepõem: pedir "golpes um pouco maiores" e manter o padrão.
- Antes de aplicar, reproduzir os golpes da etapa 2 com os valores novos: só aplica com 90% ou mais de
  acerto e sem duplos. Sempre dentro de uma faixa segura (nunca abaixo do tremor; no máximo 1,5× o padrão).
- Atraso total: mediana de (golpe − clique), descartando desvios acima de 150 ms; no mínimo 8 golpes
  válidos. Os dois horários precisam estar no mesmo relógio: o golpe vem do `captureTime` do quadro
  (relógio da página) e o clique do relógio do áudio. Converter com `AudioContext.getOutputTimestamp()`;
  sem ele, usar `outputLatency`.
- Predição sugerida (`HIT.predictMs`): a que leva o som para perto do contato medido na etapa 2,
  limitada a 0–80 ms.
- Saída: objeto `{ version, date, hit: {...}, audioOffsetMs, visualOffsetMs, predictMs }` salvo pelo
  `storage.js`. O painel de debug mostra os valores em uso; "Restaurar padrão" volta ao `config.js`.
- Com o debug aberto, a calibração baixa a gravação com o gabarito preenchido (pronta para
  `tests/fixtures/`).

## Ordem de trabalho (um cartão por PR)

1. **Motor de alvos (puro):** horários dos alvos no relógio do áudio, comparação golpe x alvo, estatísticas
   (mediana, desvio, faltas, duplos). Testes com dados sintéticos. Serve às lições.
2. **Desenho dos alvos que descem** no `render.js`. Serve às lições.
3. **Tela de calibração** com as etapas descritas como dados (como as lições).
4. **Cálculo dos parâmetros, conferência e aplicação** (puro, testado com as gravações de 17/11).
5. **Salvar, mostrar no painel e exportar a gravação rotulada.**

Pronto quando: uma pessoa que nunca viu o app completa a calibração em até 2 minutos sem ajuda; os
valores aplicados reproduzem pelo menos 90% dos golpes da própria calibração; a nota de atraso fica
estável (duas calibrações seguidas diferem menos de 30 ms).

## Perguntas em aberto

- A calibração é obrigatória antes das lições (como no fluxo do XRD) ou opcional, com valores padrão?
  Proposta: obrigatória na primeira vez, depois opcional pelo menu.
- Ajustar por mão (esquerda e direita separadas)? Proposta: não nesta versão.
