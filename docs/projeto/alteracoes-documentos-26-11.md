# Alterações para o XRD, o Plano de Projeto e o Trello (26/11/2026)

Continua o arquivo de 19/11 (`alteracoes-documentos-19-11.md`); aplique aquele primeiro. Texto pronto
de cada alteração causada pelo trabalho de 25/11 (PRs #17 a #21). Ao aplicar, marque a caixa.

## Plano de Projeto: Controle de mudanças

- [ ] **Mudança 4, 25/11: calibragem em duas partes.** O que muda: na Fase 3 entra só a calibragem
      de latência (tocar junto com o metrônomo; o deslocamento é a mediana). As etapas de tremor e
      de movimento, que ajustam a detecção a cada pessoa, passam para a Reunião de 10/12. Motivo: o
      tempo entre 19/11 e 26/11 não bastou para o plano inteiro; a parte de latência é a que a nota
      de precisão precisa. Impacto: até 10/12 os limiares de golpe são os mesmos para todos (5% de
      duplos no teste contado de 17/11). Decisão: proposta por Luca em 25/11; confirmar com o grupo e registrar a data.
- [ ] **Registro, 19/11: sugestão da professora sobre o layout.** O que muda: peças ~15% maiores e
      mais afastadas; chimbal e prato bem no alto; caixa, tom e bumbo um pouco mais baixos (layout
      v4, PR #17). Impacto: nenhum no cronograma. Limite: o bumbo não desce além de ~0,74 da tela,
      senão o pulso sai da imagem na pose de joinha (testes de 17/11).
- [ ] **Registro de cronograma:** Fase 3 programada em 25/11 (PRs #17 a #21). Os cartões
      "Estrutura das lições", "Classificação de precisão" e "Calibragem de latência" passaram dos
      prazos de 22 e 24/11.

## XRD: versão 1.2 (26/11/2026)

- [ ] **Histórico de versões**, nova linha: `1.2 | 26/11/2026 | Layout das peças sugerido pela
      professora; lições 1 a 3; nota de precisão; calibragem de latência; modo por toque ou clique.`
- [ ] **Interação**, parágrafo "Peças" (substitui o acréscimo de 19/11): 
      > O chimbal fica no alto à esquerda e o prato no alto à direita, como numa bateria real; caixa e
      > tom ficam mais abaixo, afastados, e o bumbo é um pad entre eles, na altura deles. As peças
      > ocupam boa parte da tela para facilitar a mira (sugestão da professora em 19/11). O bumbo não
      > fica no pé da tela porque, em posição de joinha, o pulso sairia da imagem.
- [ ] **Interação**, parágrafo "Lições": acrescentar ao fim:
      > Cada lição começa com um compasso de contagem do metrônomo (1, 2, 3, 4). Um contorno da peça
      > desce até ela e encaixa no instante do clique; o golpe recebe "Perfeito!" (até 50 ms),
      > "Bom" (até 100 ms) ou "Errou". A nota final vai de 0 a 100 (perfeito vale 1, bom vale meio)
      > e a tela de resultado diz se a pessoa tende a adiantar ou atrasar. Golpe e clique são
      > comparados no instante em que o som é ouvido, já descontada a saída de áudio.
- [ ] **Interação**, parágrafo "Calibragem" (substitui o texto de 19/11):
      > Calibragem: antes da primeira lição, o usuário bate na caixa junto com 16 cliques do
      > metrônomo a 80 BPM. O atraso é a mediana das diferenças, sem os erros isolados, e fica salvo no
      > navegador (separado para câmera e para toque). Pode ser pulada e refeita pelo menu. Uma
      > segunda etapa, que ajusta a detecção do golpe ao movimento de cada pessoa, está prevista
      > para 10/12.
- [ ] **Fluxo da Aplicação**, item 4: trocar por "Calibragem de latência: tocar junto com o metrônomo
      (antes da primeira lição; pode ser refeita pelo menu)."
- [ ] **Fluxo**, acrescentar: "Sem câmera, a tela inicial oferece 'Tocar sem câmera': a bateria
      aparece sobre fundo escuro e as peças tocam por toque ou clique, inclusive nas lições."
- [ ] **Lições** (lista): "1. Pulso: caixa em semínimas, 70 BPM. 2. Colcheias alternadas: caixa,
      direita e esquerda, 60 BPM. 3. Chimbal e caixa: chimbal em todos os tempos e caixa junto no 2 e
      no 4, 65 BPM. Quatro compassos cada (~15 a 20 s)."

## Trello: onde cada cartão vai

| Cartão | Coluna | Observação no cartão |
| --- | --- | --- |
| Reunião de Controle 19/11 | Concluído | |
| Atualizar XRD e preparar Apresentação 2 | Concluído | Se o XRD 1.1 já foi aplicado |
| **Novo:** Layout v4 (sugestão da professora) | Em Teste | PR #17; teste 1 do roteiro de 26/11 |
| Modo alternativo por toque ou clique | Em Teste | PR #18; teste 2 |
| Estrutura das lições | Em Teste | PRs #19 e #20 |
| Classificação de precisão | Em Teste | PR #19 (janelas de 50 e 100 ms em `config.js`) |
| Lições 1 a 3 | Em Teste | PR #20; testes 4 e 5 |
| Calibragem de latência | Em Teste | PR #21; teste 3. Só a etapa de ritmo (Mudança 4) |
| Calibragem do movimento | A Fazer | Prazo 10/12 (Mudança 4) |
| Tela de resultado e progresso salvo | Em Teste | Adiantado da Fase 4: a tela de resultado e a melhor nota já vêm no PR #20 |
| Interface: menu / posicionamento e configurações | Em Teste | Menu com lições e calibragem |
| Medir FPS e latência | Em Teste | Falta o PC 2 e os celulares (teste 6) |
| Wireframes das telas | Em Desenvolvimento | Atrasado; desenhar a partir das telas que já existem |
| Atualizar XRD e preparar Apresentação 3 | Em Desenvolvimento | Usar este arquivo |
| Gravações de teste contadas (fixtures) | A Fazer | |

Cada cartão "Em Teste" só vai para Concluído depois do teste feito por quem não programou (regra do
Plano), com o resultado anotado em `docs/TESTES.md`.
