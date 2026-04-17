// Complex nested if-elif-else chains
// #if A
console.log('a-true');
// #elseif B
console.log('b-true');
// #elseif C
console.log('c-true');
// #else
console.log('all-false');
// #endif

// Nested elif inside if
// #if X
console.log('x-start');
// #if Y
console.log('xy-true');
// #elseif Z
console.log('xz-true');
// #else
console.log('x-but-not-yz');
// #endif
console.log('x-end');
// #endif

console.log('done10');
