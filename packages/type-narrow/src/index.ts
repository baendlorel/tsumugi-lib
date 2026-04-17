/**
 * Use this to narrow the type of a value. It does nothing at runtime, but it allows you to assert that a value is of a certain type.
 *
 * __PKG_INFO__
 *
 * @param value The value to narrow.
 */
export function narrow<TypeYouWant>(value: unknown): asserts value is TypeYouWant {
  // & does nothing at runtime. Only for type inference.
}

/**
 * Tribute to type cast in C++.
 * - Just an alias for `narrow`.
 *
 * __AUTHOR__
 */
export const static_cast: typeof narrow = narrow;

/**
 * Create a specialized narrower function for a specific type.
 *
 * This can be useful if you want to create a reusable narrower function for a specific type.
 *
 * __AUTHOR__
 */
export function createNarrower<TypeYouWant>() {
  return (value: unknown): asserts value is TypeYouWant => {
    // & does nothing at runtime. Only for type inference.
  };
}

const a = 'sdf' as unknown;
narrow<number>(a);
void a;
