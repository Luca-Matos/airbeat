# Alterações para o XRD, o Plano de Projeto e o Trello (19/11/2026)

Os documentos oficiais estão em PDF (`docs/projeto/`) e são editados pelo grupo. Este arquivo traz o
texto pronto de cada alteração decidida ou causada pelo trabalho de 17/11. Ao aplicar, marque a caixa.

## XRD: versão 1.1 (19/11/2026)

- [ ] **Histórico de versões**, nova linha: `1.1 | 19/11/2026 | Camada gráfica decidida (Canvas 2D);
      baqueta virtual e detecção por descida; layout das peças; sons sintetizados; calibragem com etapa
      de movimento; celulares na Fase 3; primeiros resultados de desempenho e precisão.`

- [ ] **Arquitetura Técnica**, linha "Camada gráfica": trocar "Canvas 2D como padrão. A-Frame e Three.js
      serão avaliados no protótipo." por:
      > Canvas 2D sobre o vídeo. Decisão de 17/11: a cena é plana, o Canvas 2D é mais leve e desenhou as
      > cinco peças com brilho sem custo perceptível. A-Frame e Three.js aumentariam o peso sem ganho para
      > a RA de espelho.

      E apagar o parágrafo "Decisão pendente para o protótipo (05/11)…".

- [ ] **Arquitetura Técnica**, linha "Áudio": trocar "Web Audio API (Tone.js como opção)" por "Web Audio
      API. Os sons das peças e do metrônomo são sintetizados no próprio código, sem arquivos de áudio."

- [ ] **Interação e Experiência do Usuário**, substituir o parágrafo "Interação principal" por:
      > O usuário fecha a mão em posição de joinha, como quem segura uma baqueta. A aplicação desenha uma
      > baqueta virtual do pulso até a ponta do dedão; a ponta é o que bate. Um golpe é uma descida da
      > baqueta: toca quando a ponta entra numa peça descendo rápido, ou com curso suficiente quando o
      > golpe é curto e controlado. Cada descida toca uma peça só, há um intervalo mínimo entre golpes da
      > mesma mão e a mão precisa subir (ou esperar um instante) antes do próximo golpe. A peça sob a
      > baqueta acende de leve antes do golpe, para o usuário saber onde vai bater.

- [ ] **Interação**, parágrafo "Peças": acrescentar ao fim:
      > O chimbal fica à esquerda e o prato à direita, ao alcance das mãos; o bumbo é um pad entre a caixa
      > e o tom, na altura delas, porque em posição de joinha o pulso sairia da imagem se o pad ficasse no
      > pé da tela.

- [ ] **Interação**, parágrafo "Calibragem": substituir por:
      > Calibragem: a primeira tela pede que o usuário se posicione (as mãos precisam aparecer inteiras e
      > não muito perto da câmera). A calibragem guiada tem três partes curtas: segurar as baquetas paradas
      > (mede o tremor), bater num tambor grande quando um alvo desce até ele (ajusta a detecção ao jeito de
      > cada pessoa) e bater junto com o metrônomo (mede e compensa a latência).

- [ ] **Fluxo da Aplicação**, item 4: trocar por "Calibragem guiada: tremor, movimento e latência (ver
      Interação)."

- [ ] **Design Visual e Modelagem**, parágrafo "Paleta": trocar "A paleta final será definida no
      protótipo." por:
      > Paleta do protótipo: chimbal amarelo `#ffd23f`, caixa vermelha `#ff5c5c`, tom verde `#3ddc97`,
      > prato azul `#4dabf7` e bumbo roxo `#b388ff`, com preenchimento semitransparente; a baqueta é branca
      > para não confundir com nenhuma peça.

- [ ] **Validação e Testes**, acrescentar ao fim:
      > Resultados de 17/11 (notebook i7-1255U, Chrome): 25 a 29 FPS (a webcam entrega no máximo 30),
      > detecção de ~20 ms na GPU, saída de áudio de ~50 ms. Teste contado com 80 golpes a 80 BPM: pelo
      > menos 96% dos golpes detectados e 5% de toques duplos. Registro completo em `docs/TESTES.md` no
      > repositório.

- [ ] **Validação e Testes**, item "Compatibilidade": acrescentar "Os testes em celular começam na Fase 3
      (decisão de 17/11)."

## Plano de Projeto: Controle de mudanças

- [ ] **Mudança 1, 17/11: testes em celular adiados.** O que muda: o critério de 19/11 passa a exigir
      medições só em 2 computadores; celulares entram na Fase 3 (26/11). Motivo: atraso da Fase 2 e foco
      no núcleo. Impacto: problemas de desempenho no celular aparecem mais tarde. Decisão: aprovada pelo
      grupo.
- [ ] **Mudança 2, 17/11: Canvas 2D.** O que muda: a avaliação de A-Frame/Three.js prevista para 05/11 é
      encerrada; fica Canvas 2D. Motivo: mais leve e suficiente para a cena plana. Impacto: nenhum no
      cronograma. Decisão: aprovada pelo grupo.
- [ ] **Mudança 3, 17/11: calibragem com etapa de movimento.** O que muda: além da latência, a
      calibragem ajusta a detecção de golpe a cada usuário. Motivo: os testes de 17/11 mostraram que o
      mesmo limiar perde golpes curtos de quem toca preciso e gera duplos em quem descansa a mão sobre a
      peça. Impacto: ~1 dia a mais, que também adianta o motor das lições (alvos e comparação golpe x
      alvo). Decisão: aprovada pelo grupo em 17/11; início em 20/11. Plano em
      `docs/projeto/plano-calibracao.md`.
- [ ] **Registro de cronograma:** Fase 2 (protótipo, previsto para 05/11) entregue em 17/11 junto com a
      bateria completa. PRs #5 a #15, revisados e testados pelo Luigi antes do merge.

## Plano de Projeto: Riscos (atualizar a coluna de situação)

- [ ] "Detecção imprecisa ou com falsos disparos": medido em 17/11, pelo menos 96% de detecção e 5% de
      duplos no teste contado. Mitigação em andamento: calibragem do movimento.
- [ ] "Latência perceptível": usuário relatou "um pouco de atraso". Medido: ~50 ms de áudio e ~25 ms de
      captura até a detecção; a predição de 40 ms compensa parte. A webcam de 30 FPS é um limite.
- [ ] Risco novo: **webcam limitada a 30 FPS** (média). Golpe curto e tremida ficam iguais num quadro só.
      Mitigação: orientar a descansar a baqueta acima da peça; calibragem; testar câmeras de 60 FPS.

## Trello: onde cada cartão vai

| Cartão | Coluna | Observação no cartão |
| --- | --- | --- |
| Criar repositório e publicar página base | Concluído | Testado pelo Luigi |
| Capturar câmera espelhada | Concluído | Testado pelo Luigi |
| Integrar MediaPipe Hands | Concluído | Testado pelo Luigi |
| Sons das cinco peças | Concluído | Programado por Luca com Claude Code; testado pelo Luigi |
| Detecção de golpe v1 | Concluído | Cinco rodadas de teste em 17/11 (PRs #5, #11 a #15) |
| Protótipo com uma ou duas peças | Concluído | Entregue já com as cinco peças |
| Decidir Canvas 2D ou A-Frame/Three.js | Concluído | Canvas 2D; falta escrever no XRD (acima) |
| Definir paleta e estilo visual das peças | Concluído | Paleta acima |
| Desenhar as cinco peças e efeitos | Em Teste | Versão em código; refinamento visual é o primeiro corte se faltar tempo |
| Mapear zonas das peças e golpes com duas mãos | Concluído | Layout v3 |
| Metrônomo com BPM ajustável | Concluído | Programado por Luca com Claude Code; testado pelo Luigi |
| Modo livre | Concluído | Idem |
| Interface: menu / posicionamento e configurações | Em Desenvolvimento | Menu e posicionamento prontos; "configurações" vira a tela de calibração |
| Medir FPS e latência | Em Teste | PC 1 medido; falta o PC 2 (`docs/TESTES.md`) |
| Wireframes das telas | A Fazer | Atrasado; desenhar a partir das telas que já existem |
| Atualizar XRD e preparar Apresentação 2 | Em Desenvolvimento | Usar este arquivo |
| Reunião de Controle 19/11 | A Fazer → Concluído depois da reunião | |
| Calibragem de latência | A Fazer | Começa em 20/11, junto com a calibragem do movimento |
| **Novo:** Calibragem do movimento | A Fazer | Etiqueta Mudança; aprovada em 17/11 |
| **Novo:** Gravações de teste contadas (fixtures) | A Fazer | Cortar a gravação contada de 17/11 em 4 arquivos de 20 golpes |
