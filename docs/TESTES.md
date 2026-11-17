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
**[** e **]** mudam o alcance da baqueta, **,** e **.** o limiar de velocidade, **K** troca o ponto
da mão (stick, knuckles, palm, indexTip) e **O** o modo (stroke, lowestPoint, velocity). No modo livre:
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
