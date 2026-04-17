import { describe, it, expect } from 'vitest';
import { run } from './runner.js';

describe('Functionality', () => {
  it('should merge .d.ts files', async () => {
    const { content, options } = run('*.d.ts', 'common', {
      exclude: [],
      replace: {
        __FLAG__: 'ffff',
      },
    });
    expect(options.list.length).toBe(4);
    expect(content.includes('__FLAG__')).toBe(false);
    expect(content.includes('__FLAG2__')).toBe(true);
    expect(content.split('ffff').length - 1).toBe(4);
  });
});
