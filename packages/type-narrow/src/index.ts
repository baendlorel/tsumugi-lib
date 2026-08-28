/**
 * Use this to narrow the type of a value. It does nothing at runtime, but it allows you to assert that a value is of a certain type.
 *
 * __PKG_INFO__
 *
 * @param value The value to narrow.
 */
export function static_cast<TypeYouWant>(value: unknown): asserts value is TypeYouWant {
  // & does nothing at runtime. Only for type inference.
}

const a = 'sdf' as unknown;
static_cast<number>(a);
void a;
