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
**R** grava landmarks, **P** reproduz uma gravação, **Z** zera os contadores. No modo livre:
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

Mínimo: 2 computadores e 2 celulares. No celular a câmera só abre pelo link do Pages (HTTPS).
O FPS do Chrome headless (~5) não vale como medição.

## Registros

_Nenhum registro ainda._
