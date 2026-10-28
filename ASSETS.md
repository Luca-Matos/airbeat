# Assets e licenças

Todo som, modelo, imagem ou fonte que não foi escrito no código entra aqui no mesmo commit em que
é adicionado. Só aceitamos assets próprios da equipe, CC0 ou licença livre compatível.

| Arquivo                                     | Descrição                                                                                                    | Fonte                                                                                                            | Licença           | Incluído por           | Data       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------- | ---------- |
| `public/favicon.svg`                        | Ícone da aba (caixa e baquetas em formas simples)                                                            | Criado pela equipe no código                                                                                     | Própria (projeto) | Luca (com Claude Code) | 28/10/2026 |
| `public/models/hand_landmarker.task`        | Modelo de rastreamento de mãos do MediaPipe (float16, versão 1). SHA-256 `fbc2a300…cde1`                     | Google, `storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task` | Apache-2.0        | Luca (com Claude Code) | 28/10/2026 |
| `public/mediapipe/wasm/*` (gerado no build) | Runtime wasm do MediaPipe Tasks Vision 1.1.1, copiado de `node_modules` por `scripts/copy-mediapipe-wasm.js` | Pacote npm `@mediapipe/tasks-vision@1.1.1`                                                                       | Apache-2.0        | Luca (com Claude Code) | 28/10/2026 |
