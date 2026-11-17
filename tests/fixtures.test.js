// Reproduz cada gravação real de tests/fixtures/ no detector e confere o número de
// golpes anotado em "expected". Ao mexer num limiar, mostra o que deixou de funcionar.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { replayRecording } from '../src/landmarkRecording.js';

const dir = join(import.meta.dirname, 'fixtures');
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

describe('gravações de landmarks (tests/fixtures)', () => {
  it.skipIf(files.length > 0)('nenhuma gravação ainda: ver tests/fixtures/README.md', () => {});

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    const expected = data.expected;
    it.skipIf(!expected)(`${file}: ${data.note || 'sem descrição'}`, () => {
      const hits = replayRecording(data);
      const tolerance = expected.tolerance ?? 0;
      expect(
        Math.abs(hits.length - expected.hits),
        `golpes detectados: ${hits.length}`,
      ).toBeLessThanOrEqual(tolerance);
    });
  }
});
