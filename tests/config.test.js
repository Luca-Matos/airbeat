import { describe, expect, it } from 'vitest';
import * as config from '../src/config.js';

describe('config', () => {
  it('exporta o nome do app', () => {
    expect(config.APP_NAME).toBe('AirBeat');
  });
});
