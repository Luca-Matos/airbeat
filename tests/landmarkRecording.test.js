import { describe, expect, it } from 'vitest';
import { createReplaySource } from '../src/debug.js';
import { layoutKit } from '../src/drumKit.js';
import {
  createLandmarkRecorder,
  parseRecording,
  replayRecording,
} from '../src/landmarkRecording.js';
import { sample, strokes } from './helpers/trajectories.js';

const view = {
  videoWidth: 640,
  videoHeight: 480,
  width: 1280,
  height: 960,
  fit: 'cover',
  mirrored: true,
};

/**
 * Mão sintética de 21 pontos cuja palma fica em (x, y) da câmera. Todos os pontos
 * iguais: a média dá o mesmo ponto, o que basta para testar o caminho completo.
 */
function fakeHand(x, y) {
  return Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
}

/** Converte unidades de palco para coordenadas da câmera (desfaz espelho; tela 4:3 sem corte). */
const stageToCamera = ({ x, y }) => ({ x: 1 - x, y });

describe('gravação de landmarks', () => {
  it('grava, vira JSON, volta e reproduz o mesmo número de golpes', () => {
    const snare = layoutKit(view.width, view.height).find((p) => p.id === 'snare');
    const pos = strokes([
      { x: snare.cx, top: 0.3, bottom: snare.cy, at: 100 },
      { x: snare.cx, top: 0.3, bottom: snare.cy, at: 600 },
      { x: snare.cx, top: 0.3, bottom: snare.cy, at: 1100 },
    ]);
    const rec = createLandmarkRecorder();
    rec.start(5000, view);
    for (const { t, point } of sample(pos, { durationMs: 1600 })) {
      const cam = stageToCamera(point);
      rec.add(5000 + t, [fakeHand(cam.x, cam.y)]);
    }
    const file = JSON.parse(JSON.stringify(rec.stop()));

    expect(file.format).toBe('airbeat-landmarks');
    expect(file.frames[0].t).toBe(0);
    expect(file.frames[0].hands[0][0]).toHaveLength(2);
    const hits = replayRecording(file);
    expect(hits.map((h) => h.pieceId)).toEqual(['snare', 'snare', 'snare']);
  });

  it('para de aceitar quadros depois do tempo máximo', () => {
    const rec = createLandmarkRecorder({ maxMs: 1000 });
    rec.start(0, view);
    expect(rec.add(500, [])).toBe(true);
    expect(rec.add(1500, [])).toBe(false);
  });

  it('arredonda os pontos para o arquivo ficar pequeno', () => {
    const rec = createLandmarkRecorder({ decimals: 3 });
    rec.start(0, view);
    rec.add(10, [[{ x: 0.123456, y: 0.98765, z: 0.5 }]]);
    expect(rec.stop().frames[0].hands[0][0]).toEqual([0.123, 0.988]);
  });

  it('recusa arquivo que não é gravação do AirBeat', () => {
    expect(() => parseRecording({ foo: 1 })).toThrow(/gravação/);
    expect(() => parseRecording({ format: 'airbeat-landmarks', version: 99, frames: [] })).toThrow(
      /Versão/,
    );
  });
});

describe('createReplaySource', () => {
  it('entrega o último quadro gravado até cada instante e null no fim', () => {
    const src = createReplaySource([
      { t: 0, hands: ['a'] },
      { t: 33, hands: ['b'] },
      { t: 66, hands: ['c'] },
    ]);
    expect(src.handsAt(1000)).toEqual(['a']);
    expect(src.handsAt(1040)).toEqual(['b']);
    expect(src.handsAt(1066)).toEqual(['c']);
    expect(src.handsAt(1100)).toBeNull();
  });
});
