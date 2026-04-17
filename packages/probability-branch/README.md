# Probability Branch

A lightweight TypeScript library for probabilistic branching and random selection, powered by the Mersenne Twister algorithm. 🎲✨

For more awesome packages, check out [my homepage💛](https://baendlorel.github.io/?repoType=npm)

---

## Features

- Define multiple branches with custom probabilities and handlers
- Select a branch randomly or deterministically
- Limit the number of times a branch can be executed
- Pluggable random number generator (default: Mersenne Twister)
- Global control of random seed and generator

---

## Installation

```bash
pnpm add probability-branch
# or
npm install probability-branch
```

---

## Usage

```typescript
import { pb } from 'probability-branch';

// Create a probability branch instance
pb()
  .br(70, () => console.log('Branch A'))
  .br(30, () => console.log('Branch B'))
  .br(23.3, () => console.log('Branch C'))
  .br(103.6, () => console.log('Branch D'))
  .run(); // Randomly runs one branch based on weights
```

---

## API Reference

### `pb(options?: Partial<ProbabilityBranchOptions>): ProbabilityBranch`

Create a new probability branch instance.

- `options.limit`: Maximum number of times the branch can be run (default: 1, set to 0 for unlimited).
- **Returns** An `ProbabilityBranch` instance.

### `instance.br(weight: number, handler: Fn)`

Add a branch with a given probability and handler.

- `weight`: Non-negative number, probability weight for this branch.
- `handler`: Function to execute if this branch is selected.

### `instance.run(probability?: number): ProbabilityBranchResult`

Run the probability branch. If `probability` is not provided, a random value is generated.

- Default random number generator is Mersenne Twister.

- **Returns** an object below:

```typescript
interface ProbabilityBranchResult {
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
```

### `instance.getCount(): number`

Get how many times this instance has been run.

### Random Generator Control (Global)

#### `pb.setSeed(seed: number): ProbabilityBranchCreator`

Set the seed for the global random number generator.

#### `pb.getSeed(): number`

Get the current seed.

#### `pb.getCount(): number`

Get how many random numbers have been generated since initialization.

#### `pb.setGenerator(generator: RandomGenerator): ProbabilityBranchCreator`

Replace the global random number generator.

- The generator must implement the `RandomGenerator` interface. [See example below](#example-custom-random-generator)

#### `pb.restoreDefaultGenerator(): ProbabilityBranchCreator`

Restore the default Mersenne Twister generator.

## Example: Custom Random Generator

In this interface, only `random` method is strictly required.

Other methods will fallback to a default implementation that does nothing.

```typescript
class MyRandom implements RandomGenerator {
  private seed = 42;
  private count = 0;
  random() {
    this.count++;
    return Math.random();
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

pb.setGenerator(new MyRandom());
pb.setSeed(123);
```

## Bonus: Mersenne Twister

You can import the Mersenne Twister directly if you want to use it as a custom random generator:

```typescript
import { MersenneTwister } from 'probability-branch';

new MersenneTwister(); // equivalent to `new MersenneTwister(0)`
const mt = new MersenneTwister(23);
mt.random(); // generates a random [0,1) number
```

---

## License

MIT

---

## Author

**KasukabeTsumugi**  
Email: futami16237@gmail.com
