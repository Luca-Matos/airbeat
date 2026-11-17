// Exporta os sons sintetizados em WAV, para ouvir e ajustar as receitas sem abrir
// o app nem a câmera. Uso: npm run sounds -- <pasta>   (padrão: sounds-preview/)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOUNDS } from '../src/config.js';
import { renderSound } from '../src/audio/synth.js';

const SAMPLE_RATE = 48000;
const outDir = process.argv[2] ?? 'sounds-preview';

/** WAV PCM 16 bits mono. */
function toWav(data, sampleRate) {
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + data.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) =>
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2),
  );
  return buf;
}

mkdirSync(outDir, { recursive: true });
// Mesma semente que o engine usa (posição na lista + 1), para soar igual ao app.
Object.entries(SOUNDS).forEach(([id, recipe], i) => {
  const file = join(outDir, `${id}.wav`);
  writeFileSync(file, toWav(renderSound(recipe, SAMPLE_RATE, i + 1), SAMPLE_RATE));
  console.log(file);
});
