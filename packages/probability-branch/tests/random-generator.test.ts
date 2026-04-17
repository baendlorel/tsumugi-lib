import { describe, it, expect } from 'vitest';
import { pb } from '../src/probability-branch.js';

describe('Random Generator Control', () => {
  it('setSeed and getSeed work globally', () => {
    pb.setSeed(12345);
    expect(pb.getSeed()).toBe(12345);
    pb.setSeed(67890);
    expect(pb.getSeed()).toBe(67890);
  });

  it('getCount returns random numbers generated', () => {
    pb.setSeed(1);
    const before = pb.getCount();
    pb()
      .br(1, () => 1)
      .run();
    const after = pb.getCount();
    expect(after).toBeGreaterThan(before);
  });

  it('can replace and restore random generator', () => {
    class DummyGen {
      private seed = 0;
      private count = 0;
      random() {
        this.count++;
        return 0.5;
      }
      setSeed(seed: number) {
        this.seed = seed;
      }
      getSeed() {
        return this.seed;
      }
      getCount() {
        return this.count;
      }
    }
    pb.setGenerator(new DummyGen());
    pb.setSeed(42);
    expect(pb.getSeed()).toBe(42);
    pb.restoreDefaultGenerator();
    expect(typeof pb.getSeed()).toBe('number');
  });
});
