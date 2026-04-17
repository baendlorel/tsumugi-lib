// Adjacent directives and else-as-elif trickiness
// #if X
console.log('x-true');
// #endif
// #if 0
console.log('x-false');
// #endif

// Mixed directives with no blank lines
// #if Y
// #if Z
console.log('y-and-z');
// #endif
// #endif

// case with numeric expressions and unary operators
// #if -1
console.log('neg');
// #endif

console.log('done7');
