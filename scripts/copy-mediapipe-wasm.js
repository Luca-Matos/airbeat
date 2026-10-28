// Copia o runtime wasm do MediaPipe de node_modules para public/, para o app
// servir tudo de si mesmo (sem CDN) e a versão bater sempre com o package.json.
// Só os arquivos carregados com useModule=false: SIMD e a variante sem SIMD.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const to = join(root, 'public/mediapipe/wasm');
const files = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

mkdirSync(to, { recursive: true });
for (const file of files) copyFileSync(join(from, file), join(to, file));
console.log(`MediaPipe wasm copiado para ${to}`);
