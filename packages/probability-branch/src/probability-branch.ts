import type { RandomGenerator, AnyFn, ProbabilityBranchOptions, ProbabilityBranchResult } from './global.js';
import { $isSafeInt, $MAX_INT } from '@shared';
import { $expect, $warn } from './expect.js';
import { MersenneTwister } from './mersenne-twister.js';

const defaultGen = new MersenneTwister();
let gen: RandomGenerator = defaultGen;

class ProbabilityBranch {
  private count: number = 0;
  private sum: number = 0;
  private branches: { handler: AnyFn; weight: number }[] = [];

  // options
  private limit: number;

  constructor(opts?: Partial<ProbabilityBranchOptions>) {
    const { limit = 1 } = Object(opts) as ProbabilityBranchOptions;
    this.limit = limit;
    $expect(limit >= 0 && $isSafeInt(limit), `'limit' must be a non-negative integer`);
  }

  /**
   * Get how many times this instance has been run
   */
  getCount(): number {
    return this.count;
  }

  /**
   * ### `br` means Branch
   *
   * Add a branch with a given probability and handler
   * - if the weight is 0, this branch will be ignored
   * - all weights will be summed up, and the probability of entering each branch is `weight / sum`
   * @param weight the probability of this branch, must be a non-negative number
   * @param handler the function to call when this branch is selected
   */
  br(weight: number, handler: AnyFn): ProbabilityBranch {
    $expect(typeof weight === 'number', `'pointProbability' must be a number`);
    $expect(typeof handler === 'function', `'handler' must be a function`);
    $expect(weight >= 0, `'pointProbability' must be non-negative`);
    $expect(weight <= $MAX_INT, `'pointProbability' must < ${$MAX_INT}`);

    if (weight === 0) {
      return this;
    }

    this.sum += weight;
    this.branches.push({ weight, handler });
    return this;
  }

  /**
   * Run this probability branch with a given probability
   * @param probability if not provided, a random value will be generated with a random number generator(default is Mersenne Twister)
   * - will **not** throw if `probability` is `NaN` or `Infinity`
   * @returns what the handler returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(probability?: number): ProbabilityBranchResult {
    if (probability === undefined) {
      probability = gen.random() * this.sum;
    }
    if (this.limit > 0) {
      $expect(this.limit > this.count, `This branch can only be run ${this.limit} time(s)`);
    }

    $expect(
      typeof probability === 'number',
      `'probability' must be a number, please check your input or the generator`,
    );

    const result: ProbabilityBranchResult = {
      probability,
      sum: this.sum,
      count: this.count,
      limit: this.limit,
      branches: this.branches,
      get empty() {
        return this.branches.length === 0;
      },

      // wait to be set
      index: NaN,
      returned: undefined,
    };

    if (this.sum === 0 || this.branches.length === 0) {
      return result;
    }

    this.count++;

    let cumulative = 0;
    const len = this.branches.length;
    for (let i = 0; i < len; i++) {
      const br = this.branches[i];
      cumulative += br.weight;
      if (probability < cumulative) {
        result.index = i;
        result.returned = br.handler();
        return result;
      }
    }

    // & prevent some edge cases where the probability is very close to the sum
    result.returned = this.branches[len - 1].handler();
    result.index = len - 1;
    return result;
  }
}

interface ProbabilityBranchCreator {
  (opts?: Partial<ProbabilityBranchOptions>): ProbabilityBranch;

  /**
   * Recover the default Mersenne Twister generator
   * - this is the same instance as before
   */
  restoreDefaultGenerator(): ProbabilityBranchCreator;

  /**
   * Get the seed for the random number generator(default is Mersenne Twister)
   * - The generator is **GLOBAL**, will affect all instances of `ProbabilityBranch`
   */
  setGenerator(generator: RandomGenerator): ProbabilityBranchCreator;

  /**
   * Get the seed for the random number generator(default is Mersenne Twister)
   * - The generator is **GLOBAL**, will affect all instances of `ProbabilityBranch`
   * @param seed the seed to set for the random number generator
   */
  setSeed(seed: number): ProbabilityBranchCreator;

  /**
   * Get the seed for the random number generator(default is Mersenne Twister)
   * - The generator is **GLOBAL**, will affect all instances of `ProbabilityBranch`
   */
  getSeed(): number;

  /**
   * Get how many random numbers have been generated since the generator is initialized
   * - The generator is **GLOBAL**, will affect all instances of `ProbabilityBranch`
   */
  getCount(): number;
}

/**
 * ## Usage
 * Create a new `ProbabilityBranch` instance
 * @param options.limit The maximum number of times this branch can be run, default is 1
 * @method `pb.setGenerator` Sets a custom global random generator
 * @method `pb.restoreDefaultGenerator` Restores the default Mersenne Twister generator
 * @method `pb.setSeed` Sets the seed for the global random generator
 * @method `pb.getSeed` Gets the current seed of the global random generator
 * @method `pb.getCount` Gets the count of random numbers generated globally
 *
 * __PKG_INFO__
 */
export const pb: ProbabilityBranchCreator = (options?: Partial<ProbabilityBranchOptions>) =>
  new ProbabilityBranch(options);

pb.restoreDefaultGenerator = function () {
  gen = defaultGen;
  return pb;
};

pb.setGenerator = function (generator: RandomGenerator) {
  const { random, getCount, getSeed, setSeed } = generator;
  $expect(typeof random === 'function', `'random' must be an instance of MersenneTwister`);
  const o = Object.create(null) as RandomGenerator;

  if (typeof getCount === 'function') {
    o.getCount = getCount.bind(generator);
  } else {
    o.getCount = () => NaN;
    $warn(`'getCount' is not implemented, set to () => NaN`);
  }

  if (typeof generator.getSeed === 'function') {
    o.getSeed = getSeed.bind(generator);
  } else {
    o.getSeed = () => NaN;
    $warn(`'getSeed' is not implemented, set to () => NaN`);
  }

  if (typeof generator.setSeed === 'function') {
    o.setSeed = setSeed.bind(generator);
  } else {
    o.setSeed = () => undefined;
    $warn(`'setSeed' is not implemented, set to () => undefined`);
  }

  return pb;
};

pb.setSeed = function (seed: number) {
  gen.setSeed(seed);
  return pb;
};

pb.getSeed = function () {
  return gen.getSeed();
};

pb.getCount = function () {
  return gen.getCount();
};
