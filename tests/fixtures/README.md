# Gravações de landmarks

Cada `.json` aqui é uma sequência de pontos das mãos gravada no modo debug. Só números (tempo e
coordenadas), nenhuma imagem. O teste `tests/fixtures.test.js` reproduz cada arquivo no detector de
golpes e confere a quantidade anotada.

## Como gravar

1. `npm run dev` e abra `http://localhost:5173/?debug=1`.
2. Clique em Começar, posicione-se e espere as duas mãos aparecerem.
3. Aperte **R** para começar a gravar. Faça exatamente o combinado (ex.: 10 golpes na caixa) e conte.
4. Aperte **R** de novo. O navegador baixa `airbeat-landmarks-<data>.json`.
5. Renomeie com um nome que diga o caso (ex.: `10-golpes-caixa-mao-direita.json`) e mova para cá.
6. Abra o arquivo e preencha, no começo:
   - `"note"`: o que foi feito, luz e fundo (ex.: `"10 golpes na caixa, mão direita, sala clara"`).
   - `"expected": { "hits": 10, "tolerance": 0 }`: quantos golpes a pessoa fez de verdade.
     Use `tolerance` só se o caso for difícil de propósito (ex.: pouca luz) e anote o porquê.
7. `npm test`. Se falhar com o detector atual, isso é informação: registre no Trello antes de mexer
   em limiar.

Para ver uma gravação de novo no navegador: com o painel de debug aberto, aperte **P** e escolha o
arquivo. O app usa os pontos gravados no lugar da câmera e toca os sons.

## Casos combinados (CLAUDE.md, seção Testes)

- [ ] 10 golpes limpos (uma mão)
- [ ] golpes rápidos (alternando as mãos)
- [ ] mão parada sobre uma peça (esperado: 0 golpes)
- [ ] mão saindo do quadro
- [ ] pouca luz
