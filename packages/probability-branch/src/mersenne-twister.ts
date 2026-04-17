import type { RandomGenerator } from './global.js';

const enum Mersenne {
  N = 624,
  M = 397,
  MATRIX_A = 0x9908b0df,
  UPPER_MASK = 0x80000000,
  LOWER_MASK = 0x7fffffff,
  K = 2.3283064365386963e-10, // 1.0 / 0x100000000,
}

export class MersenneTwister implements RandomGenerator {
  private mt: number[] = new Array(Mersenne.N);
  private mti: number = Mersenne.N + 1;
  private seed: number;
  private count: number = 0;

  constructor(seed = 0) {
    this.seed = seed;
    this.init(seed);
  }

  private init(s: number) {
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < Mersenne.N; this.mti++) {
      this.mt[this.mti] = (1812433253 * (this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30)) + this.mti) >>> 0;
    }
    this.seed = s;
    this.count = 0;
  }

  /**
   * Get how many random numbers have been generated since initialization
   */
  getCount(): number {
    return this.count;
  }

  /**
   * Get the seed that once used to initialize this generator
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Initialize the generator with a new seed
   * @param seed
   */
  setSeed(seed: number): void {
    this.init(seed);
  }

  private randomInt(): number {
    let y: number;
    const mag01 = [0x0, Mersenne.MATRIX_A];

    if (this.mti >= Mersenne.N) {
      let kk: number;
      for (kk = 0; kk < Mersenne.N - Mersenne.M; kk++) {
        y = (this.mt[kk] & Mersenne.UPPER_MASK) | (this.mt[kk + 1] & Mersenne.LOWER_MASK);
        this.mt[kk] = this.mt[kk + Mersenne.M] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      for (; kk < Mersenne.N - 1; kk++) {
        y = (this.mt[kk] & Mersenne.UPPER_MASK) | (this.mt[kk + 1] & Mersenne.LOWER_MASK);
        this.mt[kk] = this.mt[kk + (Mersenne.M - Mersenne.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      y = (this.mt[Mersenne.N - 1] & Mersenne.UPPER_MASK) | (this.mt[0] & Mersenne.LOWER_MASK);
      this.mt[Mersenne.N - 1] = this.mt[Mersenne.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
      this.mti = 0;
    }

    y = this.mt[this.mti++];
    // Tempering
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;

    this.count++;
    return y >>> 0;
  }

  /**
   * Generate a random number in the range [0, 1)
   */
  random(): number {
    return this.randomInt() * Mersenne.K;
  }
}
