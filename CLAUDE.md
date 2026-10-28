# AirBeat

Bateria virtual em realidade aumentada que roda no navegador. A câmera frontal mostra o usuário como num espelho, uma bateria minimalista aparece à frente dele e ele toca com as próprias mãos, rastreadas pelo MediaPipe. Lições curtas ensinam pulsação e ritmo a iniciantes, com nota de precisão em milissegundos e calibragem de latência.

Projeto Aplicado V (Realidade Virtual e Aumentada), UNDF, 2026.2. Profa. Cíntia da Costa Souza. Equipe de 3: Luca Matos Parente (rastreamento e detecção de golpes), Luigi Calovi Fonini (áudio, lições, sons) e [seu nome] (design, arte, documentação).

## Antes de qualquer tarefa

1. Leia a seção **Estado atual** no fim deste arquivo e a etapa correspondente em **Etapas e marcos**.
2. Trabalhe em **um cartão do Trello por vez**. Se a tarefa pedida não está no backlog (`docs/projeto/backlog-trello.csv`), avise antes de fazer.
3. Se a tarefa mudaria escopo, cronograma ou tecnologia, **não faça**. Escreva a proposta em texto para o Controle de mudanças do Plano de Projeto e espere decisão do grupo.
4. Você não vê a câmera nem ouve o áudio. Nunca diga que a detecção de golpe, a latência ou o som "funcionam" só porque o código compila. Diga o que foi verificado (testes automáticos, fixtures gravadas) e liste o que a equipe precisa testar à mão, com passos exatos.

## Regras do guia da disciplina (não quebrar)

- Experiência de 5 a 15 minutos, com proposta central clara.
- Sem hardware específico: só câmera de celular ou computador.
- **Direitos autorais:** nenhum som, modelo 3D ou imagem sem licença. Sons sintetizados no código, gravados pela equipe ou CC0. Todo asset entra em `ASSETS.md` (nome, fonte, licença, quem incluiu) no mesmo commit.
- Originalidade: não é clone de nada. O diferencial é o ensino: lições, nota de precisão e calibragem de latência.
- Em cada fase: testes de usabilidade e desempenho, XRD atualizado, Trello atualizado e apresentação.
- Qualquer atividade necessária para a aplicação ficar pronta tem cartão no Trello.

## Documentos de referência (`docs/`)

- `docs/projeto/`: One-Page Concept, XRD, Plano de Projeto e `backlog-trello.csv` (nossos).
- `docs/professora/`: modelos e guia da disciplina (Marco 1, XRD, Plano, One-Page).

O XRD diz **como a experiência será**; o Plano diz **como vamos desenvolver**. Se uma decisão técnica mudar algo descrito neles, diga ao usuário qual trecho precisa ser atualizado. Não reescreva os documentos por conta própria.

## Stack e decisões

| Camada | Escolha | Motivo |
|---|---|---|
| Linguagem | JavaScript (módulos ES) com tipos em JSDoc | Sem etapa extra de compilação; JSDoc ainda permite checagem no editor. Trocar para TypeScript só se o grupo concordar antes de o código crescer. |
| Build e servidor | Vite | Servidor de desenvolvimento rápido e build estático para o GitHub Pages. |
| Rastreamento | `@mediapipe/tasks-vision` (HandLandmarker) | Roda no navegador, gratuito, sem hardware. O AR.js não rastreia mãos e por isso não serve. |
| Gráficos | Canvas 2D sobre o `<video>` | A cena é plana e 2D basta. A-Frame/Three.js só entram se o protótipo mostrar ganho real; decisão registrada no XRD até 05/11. |
| Áudio | Web Audio API pura | Controle fino do tempo (`AudioContext.currentTime`). Tone.js só se simplificar de verdade. |
| Testes | Vitest (unidade e replay), Playwright opcional (fumaça) | Ver seção Testes. |
| Hospedagem | GitHub Pages via GitHub Actions | HTTPS, necessário para a câmera fora do localhost. |

Dependências novas só com justificativa curta (peso, licença, manutenção) e aprovação do usuário. Fixe versões exatas do MediaPipe e confira a API instalada nos tipos do pacote, porque a documentação online muda.

## Estrutura de pastas

```
airbeat/
  CLAUDE.md  ASSETS.md  README.md
  docs/projeto/  docs/professora/  docs/TESTES.md
  public/models/hand_landmarker.task      # modelo hospedado por nós
  public/sounds/                          # só com licença registrada
  src/
    main.js                # inicialização e máquina de telas
    config.js              # TODOS os limiares e constantes
    camera.js              # getUserMedia, erros, espelhamento
    handTracker.js         # MediaPipe: carrega, detecta, devolve pontos
    hitDetector.js         # PURO: pontos por frame -> eventos de golpe
    drumKit.js             # PURO: geometria e zonas das peças
    audio/engine.js        # AudioContext, samples, tocar peça
    audio/metronome.js     # agendamento com antecipação
    lessons/               # lições como dados (JSON/JS), sem lógica
    scoring.js             # PURO: diferença de tempo -> perfeito/bom/errou
    calibration.js         # mede e guarda o deslocamento de latência
    render.js              # desenho no canvas
    ui/                    # telas: posicionamento, menu, lição, resultado
    storage.js             # localStorage com try/catch
    debug.js               # FPS, tempos, gravar/reproduzir landmarks
  tests/  tests/fixtures/                 # sequências de landmarks gravadas
```

Regra de arquitetura: lógica que decide algo (golpe, nota, agenda do metrônomo) fica em módulos **puros**, sem DOM, câmera ou áudio, para testar com dados. Tudo que toca no navegador fica em camadas finas por fora.

## Comandos

```bash
npm install
npm run dev          # http://localhost:5173 (a câmera funciona em localhost sem HTTPS)
npm run dev -- --host   # testar no celular pela rede; exige HTTPS (ver abaixo)
npm test             # Vitest, uma execução
npm run test:watch
npm run lint         # ESLint + Prettier --check
npm run build        # saída em dist/
npm run preview      # serve o build local
```

- No celular a câmera só abre em HTTPS. Opções: plugin `@vitejs/plugin-basic-ssl` no `dev` (o navegador avisa sobre certificado), ou publicar a branch no GitHub Pages e testar o link.
- GitHub Pages serve em `/<repo>/`. Configure `base` no `vite.config.js` e use `import.meta.env.BASE_URL` para carregar sons e o modelo; caminhos absolutos como `/sounds/x.wav` quebram em produção.

## Setup inicial (se o repositório ainda estiver vazio)

1. `npm create vite@latest . -- --template vanilla`, instalar `vitest`, `eslint`, `prettier`, `@mediapipe/tasks-vision`.
2. Criar `.gitignore` (`node_modules`, `dist`, `.env`), `README.md`, `ASSETS.md`, `docs/`.
3. Workflow do GitHub Actions que roda `lint` e `test` em todo PR e publica no Pages ao fazer merge na `main`.
4. Commit inicial e confirmar que a página publicada abre com HTTPS.

## Como o núcleo funciona

**Fluxo por quadro:** vídeo -> `handTracker` (landmarks normalizados 0 a 1) -> ponto de controle por mão -> `hitDetector` -> evento de golpe -> `audio/engine` toca o som e `scoring` compara com o metrônomo -> `render` desenha.

**Rastreamento (MediaPipe):**
- `FilesetResolver.forVisionTasks(<pasta wasm com versão fixa>)` e `HandLandmarker.createFromOptions` com `runningMode: "VIDEO"` e `numHands: 2`. Modelo em `public/models/`, não em CDN, para o app não depender de rede externa na apresentação.
- Teste `delegate: "GPU"` com queda para CPU se falhar. Confirme o nome da opção nos tipos do pacote.
- Chame `detectForVideo` com timestamps **crescentes**; repetir ou retroceder o timestamp gera erro. Use `requestVideoFrameCallback` quando existir, senão `requestAnimationFrame`.
- Limiares de confiança (`minHandDetectionConfidence`, `minHandPresenceConfidence`, `minTrackingConfidence`, padrão 0.5) ficam em `config.js` e são ajustados com teste.
- Índices dos landmarks: 0 punho, 5/9/13/17 base dos dedos, 8 ponta do indicador. Ponto de controle inicial sugerido: centro da palma (média de 0, 5, 9, 13, 17). Hipótese a validar no protótipo; comparar com a ponta do indicador.
- Não dependa do rótulo esquerda/direita (`handedness`): ele fica invertido com a imagem espelhada e oscila. Para guardar a velocidade de cada mão entre quadros, associe pela posição mais próxima do quadro anterior.
- Espelhamento: mostre o vídeo com `transform: scaleX(-1)` e converta as coordenadas num único ponto (`toScreen`). Nunca espalhe `1 - x` pelo código.

**Detecção de golpe (`hitDetector`):**
- Velocidade vertical do ponto de controle (unidades normalizadas por segundo, usando o tempo dos quadros, nunca a contagem de quadros).
- Golpe = movimento descendente acima de um limiar **e** ponto dentro da zona de uma peça **e** fora do intervalo mínimo daquela mão (valor inicial ~120 ms, ajustar).
- Rearme: só permite novo golpe depois que a mão sobe ou sai da zona (histerese), para evitar disparo duplo.
- Variante a avaliar no protótipo: disparar no ponto mais baixo do movimento (a velocidade vertical passa de descendente a zero), que é onde a baqueta bate de verdade. Comparar as duas com gravações e escolher com dados.
- Suavização (média móvel exponencial leve) reduz tremor mas **adiciona atraso**. Comece sem e meça.
- O bumbo é um pad na parte baixa da tela, tocado com a mão.

**Áudio e tempo:**
- Crie o `AudioContext` e chame `resume()` dentro de um clique do usuário (botão "Começar"), por causa da política de autoplay e do iOS.
- Decodifique todos os samples para `AudioBuffer` no carregamento. Tocar = novo `AudioBufferSourceNode.start()` na hora; nada de criar `<audio>` no golpe.
- Metrônomo com agendamento por antecipação: um `setInterval` curto (~25 ms) agenda notas nos próximos ~100 ms usando `AudioContext.currentTime`. Nunca `setTimeout` direto por batida (o tempo oscila).
- Nota de precisão: `tempoDoGolpe - tempoDaBatidaAlvo - deslocamentoDeCalibragem`. Janelas iniciais do XRD: perfeito até ~50 ms, bom até ~100 ms. São valores de partida, ajustados nos testes.
- Calibragem: o usuário toca junto com o metrônomo por alguns compassos; o deslocamento é a mediana das diferenças (mediana, não média, para ignorar erros isolados). Salvar em `storage.js`.

**Privacidade:** o vídeo é processado só no dispositivo. Nenhum quadro é gravado, enviado ou logado. Sem analytics e sem chamadas de rede além dos arquivos estáticos. A gravação de landmarks do modo debug guarda só números, em arquivo local, e só quando a equipe ativa.

## Convenções

- Identificadores de código em inglês; textos da interface, comentários de contexto e documentação em português do Brasil.
- Sem números mágicos: toda constante de ajuste vai em `config.js` com comentário do que é e da unidade (ms, px, unidades normalizadas).
- Funções pequenas, um módulo = uma responsabilidade. Comente o **porquê**, não o quê.
- Liberar recursos: parar as trilhas da câmera (`track.stop()`), fechar o `HandLandmarker` e cancelar loops ao sair de uma tela.
- Estados de carregamento e de erro sempre visíveis (carregando modelo, câmera negada, mãos fora do enquadramento).
- `localStorage` e `sessionStorage` sempre dentro de `try/catch`; o app tem que funcionar sem eles.
- Git: uma branch por cartão (`feat/deteccao-golpe`), commits pequenos no formato Conventional Commits em português (`feat: detecta golpe por velocidade`), PR revisado por **outra pessoa** que não escreveu o código (regra do Plano: cartão só vai para Concluído depois de testado por outro integrante). Nunca commitar direto na `main`.
- Antes de dizer que terminou: `npm run lint && npm test` passando e a lista de testes manuais pendentes entregue ao usuário.

## Testes

1. **Unidade (Vitest):** `hitDetector` com trajetórias sintéticas (descida rápida, descida lenta, tremor, duas mãos), `scoring` nas fronteiras das janelas, agenda do metrônomo com relógio falso, leitura das lições.
2. **Replay de gravações:** o modo debug grava sequências de landmarks (`timestamp` + pontos) em `tests/fixtures/`. Os testes reproduzem a sequência no `hitDetector` e conferem quantos golpes saem. Assim, ao mexer num limiar, dá para ver na hora se algo que funcionava quebrou. Gravar casos: 10 golpes limpos, golpes rápidos, mão parada, mão saindo do quadro, pouca luz.
3. **Manual (`docs/TESTES.md`):** checklist por dispositivo (navegador, câmera, FPS medido, latência percebida, observações). Mínimo: 2 computadores e 2 celulares (Chrome/Edge no PC, Chrome no Android; Safari no iPhone como verificação extra).
4. **Fumaça opcional (Playwright, a partir da Fase 3):** Chromium com `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream` para conferir que o app carrega, pede a câmera e não gera erro no console. Isso não valida a detecção de mãos.
5. **Desempenho:** painel de debug com FPS, tempo de cada detecção e estimativa de latência. Meta do XRD: pelo menos 24 FPS nos dispositivos de teste.
6. **Usabilidade:** 5 a 8 pessoas do público (iniciantes), sem explicação prévia, observação + questionário SUS (meta de referência 68). Roteiro feito por [seu nome].

## Etapas e marcos

Cada etapa só termina quando o **critério de pronto** é verdadeiro. Se um critério falhar perto do prazo, corte o escopo pela ordem do final desta seção, não a qualidade do núcleo.

### Etapa 0 -> Reunião de Controle 29/10: base técnica
- Repositório, Vite, lint, testes e deploy no Pages com HTTPS.
- `camera.js` com tratamento de erros (permissão negada, sem câmera, câmera em uso, contexto inseguro) e vídeo espelhado. Use `playsinline` e `muted` no `<video>`; vídeo de câmera precisa disso para iniciar no celular.
- `handTracker.js` detectando as duas mãos e desenhando os pontos alinhados com a imagem.
- **Pronto quando:** link do Pages abre, pede a câmera, mostra as duas mãos com os pontos sobre elas, sem erro no console, FPS visível no debug (meta 24+). Wireframes das telas existem.

### Fase 2 -> 05/11: protótipo
- `hitDetector` v1, `drumKit` com 1 ou 2 peças, sons das peças (`ASSETS.md` atualizado), `audio/engine`, retorno visual (peça acende), painel de debug com gravar/reproduzir landmarks.
- Decisão Canvas 2D vs A-Frame/Three.js registrada no XRD, com o motivo.
- **Pronto quando:** cada mão toca uma peça com som e brilho; teste informal registrado (por exemplo, 20 golpes de cada mão: quantos detectados, quantos falsos); pelo menos 3 fixtures gravadas com testes passando; XRD e Trello atualizados.

### Entre 05/11 e a Reunião de 19/11: bateria completa
- 5 peças em arco (chimbal, caixa, tom, prato, bumbo-pad), duas mãos independentes, metrônomo com BPM ajustável, modo livre, primeira medição de FPS e latência em 2 PCs e 2 celulares.
- **Pronto quando:** dá para tocar livremente com as duas mãos sem disparo duplo evidente e sem travar; medições registradas em `docs/TESTES.md`.

### Fase 3 -> 26/11: aplicação prévia
- Estrutura de lições (dados), alvos sobre as peças, `scoring`, calibragem de latência, lições 1 a 3 (semínimas; colcheias alternando mãos na caixa; chimbal e caixa), modo alternativo por toque ou clique, telas de posicionamento e menu.
- **Pronto quando:** uma pessoa que nunca viu o app consegue abrir, posicionar-se, calibrar, completar a lição 1 e ver a nota final; o modo por toque funciona sem câmera; XRD e Trello atualizados.

### Até a Reunião de 10/12: completar e testar
- Lições 4 e 5, tela de resultado, progresso salvo no navegador, teste de precisão do rastreamento (golpes feitos x detectados, com luz e fundo variados), testes de usabilidade com SUS, correção dos bugs.
- **Congelamento de funcionalidades em 10/12** (recomendação): depois disso só correção de bug e documentação.
- **Pronto quando:** modo livre e as 5 lições funcionam do início ao fim, nenhum bug de prioridade Alta aberto, resultados de desempenho e usabilidade registrados.

### Fase 4 -> 17/12: entrega
- XRD final, Plano atualizado, licenças de todos os assets conferidas, slides e ensaio, demonstração ensaiada no dispositivo e na rede reais da apresentação, com o modo por toque como plano B.
- **Pronto quando:** link estável com HTTPS, critérios de sucesso do XRD avaliados com dados, apresentação ensaiada.

**Ordem de corte se faltar tempo (do primeiro ao último):** lição de ritmo brasileiro (extra) -> lição 5 -> refinamentos visuais -> lição 4. **Núcleo que não se corta:** rastreamento, detecção de golpe, 5 peças com som, metrônomo, calibragem, lições 1 a 3, modo por toque ou clique.

## Erros comuns (checar antes de abrir PR)

- Câmera não abre: página fora de HTTPS (exceto `localhost`), permissão negada ou câmera usada por outro app. Mostrar mensagem clara em português.
- Som não toca: `AudioContext` ainda suspenso; falta `resume()` num clique.
- Detecção parece "espelhada": coordenadas convertidas em lugares diferentes; usar só `toScreen`.
- Disparo duplo: falta intervalo mínimo ou rearme.
- Golpes perdidos com a mão em movimento rápido: mão borrada pela câmera em ambiente escuro; testar com mais luz antes de mexer em limiares.
- Atraso crescente: loop de detecção mais lento que o vídeo acumulando quadros; descartar quadros atrasados em vez de enfileirar.
- Funciona local e quebra no Pages: caminhos sem `BASE_URL`.
- Celular lento: reduzir a resolução pedida à câmera (por exemplo 640x480) antes de qualquer otimização de código.
- Vazamento: câmera e modelo não liberados ao trocar de tela; guia de teste: abrir e sair de uma lição 10 vezes e ver se o FPS cai.
- Asset sem licença registrada em `ASSETS.md`.

## Fora do escopo (não implementar sem decisão do grupo)

Multiusuário, ranking, login, pedal de bumbo, MIDI, baquetas reais, leitura de partitura, gravação ou compartilhamento de vídeo, aplicativo nativo.

## Estado atual (atualizar a cada sessão de trabalho)

- [x] Fase 1 (15/10): One-Page, XRD v1.0, Plano v1.0, backlog do Trello, Apresentação 1
- [x] Etapa 0 (29/10): repositório e deploy. https://github.com/Luca-Matos/airbeat, publicado em https://luca-matos.github.io/airbeat/ (PR #1)
- [~] Etapa 0 (29/10): câmera espelhada. Código e testes prontos (PR #2); falta teste manual em PC e celular
- [~] Etapa 0 (29/10): MediaPipe com duas mãos. Código pronto (PR #3); falta confirmar com mãos reais o alinhamento dos pontos e o FPS (meta 24+) nos aparelhos
- [ ] Etapa 0 (29/10): wireframes
- Etapa em andamento: Etapa 0
- Revisão pendente: PRs #1, #2 e #3 foram mesclados antes da revisão (exceção para a reunião de 29/10). Precisam ser revisados e testados pelo Luigi antes de os cartões irem para Concluído.
- Decisões em aberto: Canvas 2D vs A-Frame (até 05/11); ponto de controle da mão (palma vs ponta do indicador); disparo no ponto mais baixo vs por limiar de velocidade.
- Cartões em andamento (máx. 2 por pessoa): [preencher]
- Bugs conhecidos: nenhum registrado. FPS no Chrome headless (~5, GPU emulada) não vale como medição.
