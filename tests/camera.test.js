import { describe, expect, it, vi } from 'vitest';
import { CameraError, classifyCameraError, startCamera, stopStream } from '../src/camera.js';

function fakeStream() {
  const track = { stop: vi.fn() };
  return { track, stream: { getTracks: () => [track] } };
}

function fakeVideo({ playRejects } = {}) {
  return {
    muted: false,
    playsInline: false,
    srcObject: null,
    videoWidth: 640,
    videoHeight: 480,
    setAttribute: vi.fn(),
    play: playRejects ? vi.fn().mockRejectedValue(playRejects) : vi.fn().mockResolvedValue(),
  };
}

function rejectWith(name) {
  return { getUserMedia: vi.fn().mockRejectedValue(new DOMException('x', name)) };
}

describe('classifyCameraError', () => {
  it.each([
    ['NotAllowedError', 'denied'],
    ['PermissionDeniedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'not-found'],
    ['OverconstrainedError', 'not-found'],
    ['NotReadableError', 'in-use'],
    ['TrackStartError', 'in-use'],
    ['AbortError', 'in-use'],
    ['QualquerOutro', 'unknown'],
  ])('%s -> %s', (name, code) => {
    expect(classifyCameraError({ name })).toBe(code);
  });

  it('aceita erro sem nome', () => {
    expect(classifyCameraError(undefined)).toBe('unknown');
  });
});

describe('startCamera', () => {
  it('recusa contexto inseguro antes de pedir a câmera', async () => {
    const mediaDevices = { getUserMedia: vi.fn() };
    await expect(startCamera(fakeVideo(), { secure: false, mediaDevices })).rejects.toMatchObject({
      code: 'insecure',
    });
    expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('avisa quando o navegador não tem getUserMedia', async () => {
    await expect(
      startCamera(fakeVideo(), { secure: true, mediaDevices: {} }),
    ).rejects.toMatchObject({ code: 'unsupported' });
  });

  it.each([
    ['NotAllowedError', 'denied'],
    ['NotFoundError', 'not-found'],
    ['NotReadableError', 'in-use'],
  ])('traduz %s em CameraError %s', async (name, code) => {
    const err = await startCamera(fakeVideo(), {
      secure: true,
      mediaDevices: rejectWith(name),
    }).catch((e) => e);
    expect(err).toBeInstanceOf(CameraError);
    expect(err.code).toBe(code);
    expect(err.message).toMatch(/\S/);
  });

  it('pede só vídeo da câmera frontal e liga ao <video> com playsinline e muted', async () => {
    const { stream } = fakeStream();
    const mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(stream) };
    const video = fakeVideo();

    const cam = await startCamera(video, { secure: true, mediaDevices });

    const constraints = mediaDevices.getUserMedia.mock.calls[0][0];
    expect(constraints.audio).toBe(false);
    expect(constraints.video.facingMode).toBe('user');
    expect(video.srcObject).toBe(stream);
    expect(video.muted).toBe(true);
    expect(video.setAttribute).toHaveBeenCalledWith('playsinline', '');
    expect(cam).toMatchObject({ width: 640, height: 480 });
  });

  it('para as trilhas se o vídeo não conseguir tocar', async () => {
    const { stream, track } = fakeStream();
    const mediaDevices = { getUserMedia: vi.fn().mockResolvedValue(stream) };
    const video = fakeVideo({ playRejects: new DOMException('x', 'AbortError') });

    await expect(startCamera(video, { secure: true, mediaDevices })).rejects.toMatchObject({
      code: 'in-use',
    });
    expect(track.stop).toHaveBeenCalled();
  });
});

describe('stopStream', () => {
  it('para todas as trilhas e tolera stream nulo', () => {
    const { stream, track } = fakeStream();
    stopStream(stream);
    expect(track.stop).toHaveBeenCalledOnce();
    expect(() => stopStream(null)).not.toThrow();
  });
});
