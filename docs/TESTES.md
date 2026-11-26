# Testes manuais

Checklist preenchido a cada rodada de testes, um bloco por dispositivo. Mínimo: 2 computadores
(Chrome ou Edge) e 2 celulares (Chrome no Android). Safari no iPhone como verificação extra.

## Modelo de registro

| Campo                      | Valor                       |
| -------------------------- | --------------------------- |
| Data e testador            |                             |
| Dispositivo e sistema      |                             |
| Navegador e versão         |                             |
| Link testado (local/Pages) |                             |
| Câmera abriu               |                             |
| Mãos detectadas (0/1/2)    |                             |
| Pontos alinhados com a mão |                             |
| FPS medido (painel debug)  |                             |
| Tempo de detecção (ms)     |                             |
| Erros no console           |                             |
| Golpes feitos x detectados | esq: \_\_/20 · dir: \_\_/20 |
| Disparos falsos            |                             |
| Disparos duplos            |                             |
| Latência de saída (painel) |                             |
| Latência percebida         |                             |
| Iluminação e fundo         |                             |
| Observações                |                             |

## Roteiro da rodada de 19/11 (bateria completa)

Abra com `?debug=1` no fim do link para ver o painel. Teclas com o painel aberto: **D** esconde,
**R** grava landmarks, **P** reproduz uma gravação, **Z** zera os contadores. Ajuste ao vivo:
**[** e **]** encurtam e alongam a baqueta (no dedão, o ponto desce ou sobe na reta pulso -> dedão), **,** e
**.** o limiar de velocidade, **9** e **0** a predição, **K** troca o ponto da mão (thumb, stick,
knuckles, palm, indexTip) e **O** o modo (stroke, lowestPoint, velocity). No modo livre:
**M** liga o metrônomo, **+**/**−** mudam o BPM, **Esc** volta ao menu.

1. **Abrir e posicionar.** Clique em Começar e permita a câmera. A tela "Posicione-se" deve
   mudar a mensagem conforme você mostra 0, 1 e 2 mãos, e seguir sozinha para o menu depois de
   ~1,5 s com as duas mãos inteiras. Anote se os pontos coloridos ficam em cima das mãos.
2. **Sons sem câmera.** Antes de tudo, `npm run sounds` gera os WAV em `sounds-preview/`. Ouçam e
   anotem o que soa estranho (Luigi decide os ajustes em `SOUNDS`, no `config.js`).
3. **Golpe por peça.** Modo livre. Aperte **Z**. Dê 20 golpes com a mão esquerda (alternando entre
   chimbal e caixa) e anote "golpes: esq" no painel. Repita com a direita (tom e prato). Depois
   10 golpes no bumbo. Preencha "Golpes feitos x detectados".
4. **Disparo falso.** Deixe as mãos paradas sobre a caixa por 10 s, depois balance-as devagar.
   Nenhum som deve sair. Anote quantos saíram.
5. **Disparo duplo.** 10 golpes fortes na caixa. Conte se algum soou duas vezes.
6. **Golpes rápidos.** Alterne as mãos na caixa o mais rápido que conseguir por 5 s. Anote se as
   duas mãos são reconhecidas e se o som acompanha.
7. **Metrônomo.** Ligue, mude para 60 e para 120 BPM. O clique deve ficar regular e os pontos
   devem acender junto com o som. Toque junto e anote a sensação de atraso.
8. **Latência.** Anote "saída ~X ms" do painel e a sensação (imediato / atraso leve / atraso
   incômodo).
9. **Gravações para os testes automáticos.** Grave (R) pelo menos os 3 casos em
   `tests/fixtures/README.md` e coloque os arquivos lá, com `note` e `expected` preenchidos.
10. **Vazamento.** Entre e saia do modo livre 10 vezes (Menu / Modo livre). O FPS não deve cair.

Para 19/11: 2 computadores (Chrome ou Edge), rodando local com `npm run dev`. Celulares ficaram
para a Fase 3 (decisão de 17/11); quando voltarem, a câmera só abre pelo link do Pages (HTTPS).
O FPS do Chrome headless (~5) não vale como medição.

## Roteiro de 26/11 (Fase 3, aplicação prévia)

Antes: mesclar os PRs #17 a #21 nessa ordem (ver o fim deste roteiro) e esperar o deploy do Pages.
Cada teste leva o número do PR que ele confere.

1. **Layout v4 (#17).** PC com câmera, `?debug=1`, Modo livre, mão em joinha. Aperte **Z** e dê 20
   golpes por peça a 80 BPM (metrônomo ligado). Anote detectados e duplos por peça (17/11: ≥ 96% e
   5% de duplos). Ao bater na caixa e no bumbo, os pontos da mão continuam aparecendo (o pulso
   não pode sair da imagem)? Erguer o braço para chimbal e prato cansa?
2. **Toque sem câmera (#18).** No celular Android, pelo link do Pages: "Tocar sem câmera", Modo
   livre. Toque com dois dedos ao mesmo tempo (caixa e chimbal). Sai som nos dois? A página rola ou
   dá zoom? No PC, negue a câmera: a tela de erro deve oferecer "Tocar sem câmera".
3. **Calibragem (#21).** PC com câmera: menu, "Calibrar o atraso", duas vezes seguidas. Anote os dois
   valores (meta: diferença menor que 30 ms). Repita no modo por toque (o valor deve ser menor).
4. **Lições (#20).** Lições 1, 2 e 3 com câmera, uma vez cada. Anote a nota e se o alvo encaixa na
   peça junto com o clique que se ouve. Saia no meio de uma lição (Menu ou Esc): o clique tem que
   parar na hora.
5. **Pessoa nova (critério de pronto da Fase 3).** Alguém que nunca viu o app, sem explicação:
   abrir o link, posicionar-se, calibrar, completar a lição 1 e ver a nota. Anote onde travou e
   quanto tempo levou. Não ajude; só observe.
6. **Celulares (adiados de 19/11).** 1 ou 2 Androids com Chrome, pelo link do Pages: a câmera abre?
   FPS no painel (`?debug=1`)? Dá para tocar a lição 1? Preencha uma tabela igual à do PC 1.
7. **Vazamento.** Entre e saia de uma lição 10 vezes. O FPS não deve cair.

Ordem de mesclagem: #17 → #18 → #19 → #20 → #21 (cada um tem como base o anterior). Antes de apagar
a branch de um PR mesclado, troque a base do próximo para `main` (`gh pr edit <n> --base main`);
senão o GitHub fecha o PR seguinte (aconteceu com o #6 em 17/11).

## Medições de desempenho (Reunião de Controle de 19/11)

Critério da etapa: medir FPS e latência em 2 computadores (celulares adiados para a Fase 3, decisão de
17/11). Meta do XRD: pelo menos 24 FPS.

### PC 1 · Luca · notebook

| Campo                                   | Valor                                                                                                                                                                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data e testador                         | 17/11/2026, Luca (gravações) e Claude Code (medição com câmera falsa)                                                                                                                                                                          |
| Dispositivo                             | Notebook Intel Core i7-1255U, Intel Iris Xe (Alder Lake GT2), 8 GB, Arch Linux                                                                                                                                                                 |
| Navegador                               | Google Chrome 149                                                                                                                                                                                                                              |
| Câmera                                  | "720p HD Camera" USB. Modos: 640x480 e 1280x720, **no máximo 30 FPS** (o app pede 60; não é possível nesta câmera)                                                                                                                             |
| Link testado                            | local (`npm run dev`) e Pages (https://luca-matos.github.io/airbeat/)                                                                                                                                                                          |
| FPS medido (7 gravações reais, 6 min)   | 25,5 a 29,0 FPS, intervalo mediano 33 ms. **Meta de 24 FPS atingida**; o teto é a câmera (30)                                                                                                                                                  |
| Tempo de detecção (MediaPipe, GPU)      | 19,5 ms (Pages) a 22,6 ms (local), com câmera falsa do Chrome e GPU real                                                                                                                                                                       |
| Captura do quadro até o fim da detecção | 24 a 32 ms (medido pelo `captureTime` do Chrome)                                                                                                                                                                                               |
| Saída de áudio                          | 45 a 55 ms (PipeWire, buffer de 1024 amostras; pedir menos latência ao navegador não muda)                                                                                                                                                     |
| Espera pelo próximo quadro              | 0 a 33 ms (câmera a 30 FPS)                                                                                                                                                                                                                    |
| Atraso total do golpe                   | **Não medido com mãos reais ainda.** O painel mostra "atraso do golpe: captura→som + saída" depois de alguns golpes; falta anotar. O golpe dispara antes do fundo do movimento (modo `stroke` + predição de 40 ms), o que compensa parte disso |
| Latência percebida                      | "Um pouco de atraso, não é a pior coisa" (Luca, 17/11)                                                                                                                                                                                         |
| Mãos detectadas                         | Duas mãos em 55% a 94% dos quadros, conforme a pose; mão fechada de lado é a que mais some                                                                                                                                                     |
| Erros no console                        | Nenhum (só avisos internos do MediaPipe: `gl_context`, `landmark_projection`)                                                                                                                                                                  |
| Iluminação e fundo                      | Quarto com luz artificial; o mesmo em todas as gravações                                                                                                                                                                                       |

Precisão da detecção (gravação contada de 17/11, 80 golpes a 80 BPM em tom, bumbo, caixa e chimbal):
85 toques para 80 golpes. Pelo menos 77 dos 80 golpes tocaram (**96% ou mais**; meta do XRD: 85%). A
falta clara é 1 na caixa (na troca de mão); no chimbal a contagem do bloco é incerta (1 a 2). Houve 4
toques duplos (5%), todos no bumbo, com a baqueta parada dentro da peça. Um "buraco" aparente no tom
(26 a 27 s) é variação do seu tempo (um golpe ~280 ms adiantado e o seguinte ~170 ms atrasado), não
falta. Detalhes em Registros, 5ª rodada.

### PC 2 · Luigi

| Campo                                             | Valor      |
| ------------------------------------------------- | ---------- |
| Data e testador                                   | _pendente_ |
| Dispositivo                                       | _pendente_ |
| Navegador                                         | _pendente_ |
| Câmera (FPS real no painel)                       | _pendente_ |
| FPS medido (painel)                               | _pendente_ |
| Tempo de detecção (painel)                        | _pendente_ |
| Captura→detecção (painel)                         | _pendente_ |
| Saída de áudio (painel)                           | _pendente_ |
| Atraso do golpe (painel, depois de ~20 golpes)    | _pendente_ |
| Golpes feitos x detectados (20 por peça a 80 BPM) | _pendente_ |
| Observações                                       | _pendente_ |

Como medir no PC 2: abrir https://luca-matos.github.io/airbeat/?debug=1, Começar, posicionar, Modo livre.
Esperar 10 s parado e anotar as linhas "FPS · detecção", "câmera … · captura→detecção" e "áudio · saída".
Dar ~20 golpes e anotar "atraso do golpe". Para a precisão, apertar Z, tocar 20 golpes por peça com o
metrônomo (M) a 80 BPM e anotar os contadores.

## Registros

### 17/11 · Luca · PC, Chrome, janela 1896x926 · gravação `airbeat-landmarks-2026-11-17-22-24-54.json`

Teste livre de 30 s, sem contagem anotada. Impressões: "um pouco de atraso, não é a pior coisa";
o pior foi a posição da baqueta: só a palma de baixo contava, a mão tinha que vir numa posição
estranha e só uma parte específica de cada peça funcionava.

Análise da gravação (25,5 FPS, duas mãos em 83% dos quadros):

- O ponto de controle da v1 (centro da palma, com o pulso) fica na parte de baixo da mão.
- A v1 só tocava se a velocidade **dentro** da peça passasse do limiar. A mão freia ao chegar, por
  isso só a parte de cima das peças funcionava.
- Perto demais da câmera: a mão (pulso até a base do dedo médio) media 0,36 da altura da tela
  (mediana). Ela ficava maior que as peças e o pulso saía por baixo da tela em parte dos golpes.
  A janela larga corta 35% da imagem da câmera na vertical, o que aumenta o efeito.
- Os golpes disparam de 70 a 100 ms **antes** do fundo do movimento. O atraso sentido vem da
  câmera, do processamento e da saída de áudio, não de o detector esperar.

Comparação na mesma gravação (53 descidas encontradas pelos nós dos dedos; "sem descida" =
golpe sem descida correspondente, candidato a disparo falso):

| Configuração                      | Golpes | Casaram com descida | Sem descida |
| --------------------------------- | ------ | ------------------- | ----------- |
| v1: velocity, palma, limiar 1,2   | 49     | 36                  | 13          |
| stroke, palma, limiar 1,0         | 45     | 39                  | 6           |
| stroke, nós dos dedos             | 41     | 36                  | 5           |
| stroke, baqueta 1,3 (novo padrão) | 30     | 27                  | 3           |

A baqueta pega menos aqui porque a gravação foi feita mirando com a palma. Precisa de gravação
nova mirando com a ponta da mão, a uns 1 m da câmera.

Mudanças feitas: modo `stroke`, baqueta desenhada da palma até a ponta, aviso de "perto demais"
no posicionamento e ajuste ao vivo pelo painel.

### 17/11 (2ª rodada) · Luca · mesmo PC · gravação `airbeat-landmarks-2026-11-17-22-37-14.json`

Impressão: "melhorou, mas ainda um pouco mal posicionado". O ideal seria o ponto no dedão, com a mão
fechada em posição de joinha, levemente abaixo da ponta. Pedidos: ver quantos golpes dá para fazer
ao mesmo tempo e diminuir o atraso.

- Distância corrigida: tamanho da mão 0,19 (antes 0,36). Pose de joinha em 99% dos quadros.
- A baqueta pela reta pulso -> nós dos dedos saía para fora da mão quando o punho ficava de lado.
  O dedão (ponto 4, um quarto do caminho em direção ao ponto 3) fica sempre no topo do punho e
  treme tanto quanto os nós dos dedos (mediana de 4,7 px contra 3,9 px).
- Só uma mão foi vista em 35% dos quadros. A mão sumia **parada**, longe da borda: 30 perdas em
  23 s. É o MediaPipe perdendo a mão fechada. Confiança de presença e de seguimento baixou de 0,5
  para 0,3.

Quantos golpes dá para fazer (simulação, uma mão sobre a caixa):

| Golpes por segundo, por mão | 25 FPS | 30 FPS | 60 FPS |
| --------------------------- | ------ | ------ | ------ |
| até 8                       | 100%   | 100%   | 100%   |
| 9                           | 89%    | 92%    | 97%    |
| 10                          | 75%    | 90%    | 88%    |
| 12                          | 58%    | 67%    | 71%    |

- Duas mãos ao mesmo tempo (no mesmo quadro) tocam as duas peças. O painel conta como "juntos".
  O limite é de 2 mãos (`TRACKING.numHands`). O áudio toca quantos sons forem preciso juntos, com
  um limitador suave para não estourar.
- Intervalo mínimo baixou de 120 para 100 ms (até 10 golpes/s por mão). Contra disparo duplo
  entrou o rearme por subida (3% da tela), que derrubou os pares suspeitos de 4 para 1 na 1ª
  gravação.

Atraso medido no Chrome com a GPU deste notebook (Intel Iris Xe) e câmera falsa:

| Etapa                                              | Tempo     |
| -------------------------------------------------- | --------- |
| Detecção (MediaPipe, GPU)                          | ~23 ms    |
| Captura do quadro até o fim da detecção            | ~30 ms    |
| Saída de áudio (PipeWire, buffer de 1024 amostras) | ~45 ms    |
| Espera pelo próximo quadro da câmera (a 30 FPS)    | 0 a 33 ms |

Mudanças contra o atraso: predição de 40 ms (toca quando a baqueta vai entrar na peça), câmera
pedida a 60 FPS (vale se a webcam aguentar; o painel mostra o real) e medição de verdade no painel
("atraso do golpe: captura→som + saída"). Pedir menos latência ao navegador não mudou nada: o total
de áudio ficou em ~45 ms em todas as opções.

### 17/11 (3ª rodada) · Luca · mesmo PC · gravações `…23-04-38.json` (34 s) e `…23-06-38.json` (102 s)

Impressões: predição testada de 0 a 90 ms, difícil diferenciar; 40 ms pareceu melhor (mantido). Posição
da mão melhorou, mas ainda estranha. Prato, chimbal e bumbo quase nunca acertam de primeira. Pedido:
baqueta como vetor do pulso até a ponta do dedão, batendo na ponta ou um pouco abaixo.

Descidas por peça (fundo da descida mais perto de cada peça, replay com a configuração da gravação):

| Peça    | Descidas | Viraram golpe | Observação                                                                |
| ------- | -------- | ------------- | ------------------------------------------------------------------------- |
| Caixa   | 145      | 80%           |                                                                           |
| Tom     | 182      | 84%           |                                                                           |
| Prato   | 27       | 74%           | golpe na diagonal (43°) e terminando abaixo da peça                       |
| Chimbal | 6        | 3             | o dedão passou só ~2% do tempo em x < 0,2: fora do alcance                |
| Bumbo   | 18       | 7             | pulso fora da tela em 17 de 18; 5 vezes a caixa ou o tom tocou no caminho |

- Na pose de joinha a ponta do dedão fica ~1,4 tamanho de mão acima do pulso (~0,26 da tela). Peça
  com centro abaixo de y ≈ 0,74 obriga o pulso a sair da tela e o rastreamento perde a mão.
- Duas mãos visíveis em 71% a 75% dos quadros (era 55% na 2ª rodada).

Mudanças (layout v2 e baqueta):

- Baqueta do pulso (0) até a ponta do dedão (4); bate a 95% do caminho (`HIT.thumbReach`).
- Chimbal de x 0,14 para 0,22 e prato de 0,86 para 0,78, os dois 10% maiores e um pouco mais altos.
- Bumbo: de pad embaixo (y 0,89) para pad no vão entre caixa e tom (y 0,73). A descida até ele não
  cruza outra peça e o pulso fica na tela.
- Mira: a peça sob a ponta da baqueta acende de leve antes do golpe.
- Replay das gravações com o layout novo: caixa e tom praticamente iguais (2 golpes do tom foram
  para o prato e 1 a 2 da caixa para o chimbal). Chimbal, prato e bumbo precisam de gravação nova,
  porque estas foram feitas mirando o layout antigo.

### 17/11 (4ª rodada) · Luca · mesmo PC · gravação `…23-18-46.json` (68 s, precisão e ritmo)

Impressão: tentando tocar preciso e no ritmo, batendo continuamente, muitos golpes não pegaram, mesmo
com o movimento na altura em que deveriam pegar. A posição da baqueta (pulso -> dedão) ficou boa.

Duas mãos em 94% dos quadros. Com a configuração do PR #13, 109 de 181 descidas tocaram (60%). Por que
as outras falharam:

- 54 eram **lentas**: tocando preciso, o golpe fica curto e controlado (curso mediano de 4,7% da tela,
  pico de 0,62/s, contra 11,6% e 1,44/s dos que tocavam). O limiar único de 0,8/s barrava esses golpes.
- 7 golpes no bumbo pararam de 3 a 9% da tela **acima** dele, na altura da caixa e do tom.
- Golpes no ritmo a partir da mão parada: depois de um golpe a mão escorregava para baixo devagar e
  subia só ~1% antes do próximo; o rearme (subir 3%) barrava.

Mudanças:

- A descida começa em 0,4/s (`downVelocity`) e toca se for rápida (`fastVelocity` 0,8) ou tiver curso
  de 3% da tela (`minTravel`). Tremor tem velocidade parecida, mas curso de 1 a 2%.
- Se a descida para já dentro de uma peça que não tinha alcançado antes, toca nesse momento.
- Rearme com prazo: depois de 250 ms do último golpe a mão volta a valer mesmo sem subir
  (`rearmMaxMs`).
- Bumbo subiu para a altura da caixa e do tom (y 0,66, alto 0,2); prato de 0,78 para 0,77.

| Gravação                     | Antes (PR #13) | Agora | Golpes sem descida |
| ---------------------------- | -------------- | ----- | ------------------ |
| `…23-18-46` (precisão, 68 s) | 60%            | 78%   | 6 -> 8             |
| `…23-06-38` (102 s)          | 73%            | 81%   | 15 -> 25           |
| `…23-04-38` (34 s)           | 59%            | 72%   | 7 -> 12            |

Por peça na gravação de precisão (agora): caixa 84%, bumbo 86%, tom 76%, chimbal 76%, prato 60% (só 10
tentativas). "Descidas de referência" = descidas da ponta da baqueta com curso de 3% ou mais; sem a
contagem real dos golpes, uma parte delas pode ser só reposicionamento da mão, e uma parte dos golpes
sem descida pode ser golpe curto de verdade. Próximo passo: gravação com contagem anotada.

### 17/11 (5ª rodada, contada) · Luca · mesmo PC · gravação `…23-29-00.json` (79 s)

Protocolo: 20 golpes em cada peça no metrônomo a 80 BPM (750 ms), na ordem tom, bumbo, caixa e
chimbal. Impressão: alguns golpes não tocaram, outros tocaram duas vezes.

Contagem pelo replay, usando a grade de 750 ms (intervalo < 450 ms = duplo; buraco > 1100 ms = falta):

| Bloco     | Golpes feitos | Antes (PR #14)         | Agora                                                         |
| --------- | ------------- | ---------------------- | ------------------------------------------------------------- |
| Tom       | 20            | 21 (2 duplos)          | 20 (certo; o intervalo grande em 26–27 s é variação de tempo) |
| Bumbo     | 20            | 23 (4 duplos)          | 24 (4 duplos)                                                 |
| Caixa     | 20            | 21 (2 duplos, 1 falta) | 20 (0 duplos, 1 falta)                                        |
| Chimbal   | 20*           | 20 (2 faltas)          | 21 (1 falta)                                                  |
| **Total** | **80**        | **8 duplos, 4 faltas** | **4 duplos, 3 faltas**                                        |

\* No chimbal o tempo cobre 22 batidas; a contagem do bloco é incerta.

Causas encontradas quadro a quadro:

- **Duplos por quadros colados:** às vezes dois quadros chegam com 16 ms de diferença em vez de 33.
  Uma tremida de 1,6% medida em 16 ms parece golpe rápido. Corrigido: a velocidade é medida contra
  uma amostra de pelo menos 30 ms (`HIT.velocityWindowMs`).
- **Duplos restantes (bumbo):** a baqueta paira **dentro** do bumbo entre os golpes e dá uma tremida
  de ~4% num quadro só. A 29 FPS isso é igual a um golpe curto de verdade (o golpe real de 48,88 s
  também desce 3% num único quadro). Exigir 2 quadros de descida zerou os duplos, mas perdeu 10
  golpes reais; descartado. Ficou uma dica no menu: descansar a baqueta acima da peça, sem ela acender.
- **Faltas por golpe lento e suave:** a descida passava de 0,25/s por vários quadros antes de chegar a
  0,4/s, e o curso contado a partir daí não chegava a 3%. Corrigido em parte: a descida começa em
  0,3/s (`HIT.downVelocity`). Contar o curso desde o topo do movimento recuperava mais, mas criava
  duplos (a mão parada escorregando); descartado.
- **Falta restante no tom (≈26,4 s):** a mão desceu só 2,6%, no nível do tremor.

Efeito nas gravações anteriores: precisão (68 s) 78% -> 82% das descidas tocam; 102 s: 81% -> 83%,
com golpes sem descida 23 -> 29.
