export const enum Consts {
  InvalidUsingMacroInMethodName = '[Invalid]',
  AnonymousFunction = '[anonymous function]',
  AnonymousFunctionExpression = '[anonymous function expression]',
  AnonymousMethod = '[anonymous method]',
}

export function between(center: number, oneSide: number, otherSide: number) {
  return (oneSide <= center && center <= otherSide) || (otherSide <= center && center <= oneSide);
}

export function betweenStrict(center: number, oneSide: number, otherSide: number) {
  return (oneSide < center && center < otherSide) || (otherSide < center && center < oneSide);
}
