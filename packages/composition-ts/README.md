# Composition TS

Instead of inheritance, compose prototype parts into a generated class.

## Usage

```ts
import { compose } from 'composition-ts';

const statePart = {
  id: 0,
  name: '',
};

const renamable = {
  rename(this: typeof statePart, next: string) {
    this.name = next;
    return this.name;
  },
};

const describable = {
  get label() {
    const self = this as typeof statePart;
    return `${self.id}:${self.name}`;
  },
};

const PersonModel = compose(
  function Person(this: Person, id: number, name: string) {
    this.id = id;
    this.name = name;
  },
  statePart,
  renamable,
  describable,
);

const person = new PersonModel(1, 'Ada');

person.rename('Grace');
console.log(person.label); // 1:Grace
```

## API

### compose(initializer, ...parts)

Creates a new class and copies every property descriptor from `parts` onto its prototype.

```ts
declare function compose<Protos extends readonly object[], Args extends any[], Instance extends Compose<Protos>>(
  initializer: (this: Instance, ...args: Args) => any,
  ...parts: Protos
): new (...args: Args) => Instance;
```

Parameters:

- `initializer`: A regular function invoked inside the generated constructor with the new instance bound as `this`.
- `parts`: An array of objects whose own property descriptors are copied onto the generated class prototype.

Notes:

- `initializer` must be a regular function. Arrow functions cannot receive the instance through `this`.
- Property descriptors are copied as-is, so getters, setters, enumerability, and writability are preserved.
- When multiple parts define the same key, later parts overwrite earlier ones.

## License

MIT
