export type AnyFn = (...args: any[]) => any;

export interface ProbabilityBranchOptions {
  /**
   * Default is `1`, means you can only run the branch once
   * - if you want to run the branch multiple times, set this to `0`
   */
  limit: number;
}

export interface Branch {
  handler: AnyFn;
  weight: number;
}

export interface ProbabilityBranchResult {
  /**
   * The probability value used for this run
   */
  probability: number;

  /**
   * The total sum of all branch weights
   */
  sum: number;

  /**
   * How many times this branch has been run
   */
  count: number;

  /**
   * The maximum number of times this branch can be run
   * - `0` means unlimited runs
   */
  limit: number;

  /**
   * All branches in this instance
   * - this is a reference to the real executed branches, be careful when modifying it
   */
  branches: Branch[];

  /**
   * Whether `branches.length` is `0`
   */
  readonly empty: boolean;

  /**
   * The index of the entered branch
   */
  index: number;

  /**
   * The value returned by the entered handler
   * - if `branches.length` is `0`, this will be `undefined`
   */
  returned: unknown;
}

export interface RandomGenerator {
  random(): number;

  /**
   * Get the seed for the random number generator(default is Mersenne Twister)
   * - The generator is **GLOBAL**, will affect all instances of `ProbabilityBranch`
   * @param seed the seed to set for the random number generator
   */
  setSeed(seed: number): void;

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
