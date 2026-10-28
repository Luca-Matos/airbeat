import { describe, expect, it } from 'vitest';
import { toScreen } from '../src/render.js';

const base = { videoWidth: 640, videoHeight: 480, mirrored: false };

describe('toScreen', () => {
  it('mapeia direto quando tela e vídeo têm a mesma proporção', () => {
    const view = { ...base, width: 1280, height: 960, fit: 'cover' };
    expect(toScreen({ x: 0, y: 0 }, view)).toEqual({ x: 0, y: 0 });
    expect(toScreen({ x: 0.5, y: 0.25 }, view)).toEqual({ x: 640, y: 240 });
    expect(toScreen({ x: 1, y: 1 }, view)).toEqual({ x: 1280, y: 960 });
  });

  it('espelha o eixo x: o lado esquerdo da câmera aparece à direita', () => {
    const view = { ...base, width: 640, height: 480, fit: 'cover', mirrored: true };
    expect(toScreen({ x: 0.1, y: 0.5 }, view)).toEqual({ x: 576, y: 240 });
    expect(toScreen({ x: 1, y: 0 }, view)).toEqual({ x: 0, y: 0 });
  });

  it('cover em tela retrato corta as laterais igual ao object-fit', () => {
    // Vídeo 4:3 numa tela 400x800: escala 800/480, largura exibida 1066.67, corte de 333.33 de cada lado.
    const view = { ...base, width: 400, height: 800, fit: 'cover' };
    const center = toScreen({ x: 0.5, y: 0.5 }, view);
    expect(center.x).toBeCloseTo(200);
    expect(center.y).toBeCloseTo(400);
    expect(toScreen({ x: 0, y: 0 }, view).x).toBeCloseTo(-333.333, 2);
    expect(toScreen({ x: 0, y: 1 }, view).y).toBeCloseTo(800);
  });

  it('contain em tela larga deixa faixas nas laterais', () => {
    // Vídeo 4:3 numa tela 1600x600: escala 600/480, largura 800, faixa de 400 de cada lado.
    const view = { ...base, width: 1600, height: 600, fit: 'contain' };
    expect(toScreen({ x: 0, y: 0 }, view)).toEqual({ x: 400, y: 0 });
    expect(toScreen({ x: 1, y: 1 }, view)).toEqual({ x: 1200, y: 600 });
  });
});
