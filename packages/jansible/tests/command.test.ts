import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadArgv } from '../src/command.js';

const originalArgv = process.argv.slice();
const originalExit = process.exit;

afterEach(() => {
  process.argv = originalArgv.slice();
  process.exit = originalExit;
  vi.restoreAllMocks();
});

describe('loadArgv', () => {
  it('parses exec command with spaces', () => {
    process.argv = ['node', 'jansible.js', '-e', 'echo', 'hello world'];

    expect(loadArgv()).toEqual({
      outputFile: null,
      command: 'echo hello world',
    });
  });

  it('parses output file and command', () => {
    process.argv = ['node', 'jansible.js', '-o', 'result.txt', '-e', 'echo', 'hi'];

    expect(loadArgv()).toEqual({
      outputFile: 'result.txt',
      command: 'echo hi',
    });
  });

  it('supports --output=filename', () => {
    process.argv = ['node', 'jansible.js', '--output=result.txt', '-e', 'echo', 'hi'];

    expect(loadArgv()).toEqual({
      outputFile: 'result.txt',
      command: 'echo hi',
    });
  });

  it('exits with code 0 for help', () => {
    process.argv = ['node', 'jansible.js', '--help'];

    const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as typeof process.exit);

    expect(loadArgv).toThrow('exit:0');
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('exits with code 0 for version', () => {
    process.argv = ['node', 'jansible.js', '--version'];

    const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`exit:${code}`);
    }) as typeof process.exit);

    expect(loadArgv).toThrow('exit:0');
    expect(exit).toHaveBeenCalledWith(0);
  });
});
