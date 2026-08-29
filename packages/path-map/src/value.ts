export const VK = Symbol('PathMap.Value');
export type VK = typeof VK;

export class Value<T> {
  [VK]: T;
  constructor(value: T) {
    this[VK] = value;
  }
}
