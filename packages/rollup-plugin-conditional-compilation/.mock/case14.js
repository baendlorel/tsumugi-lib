// Edge case: else after multiple elif with same conditions
// #if VAL === 1
console.log('one');
// #elseif VAL === 2
console.log('two');
// #elseif VAL === 3
console.log('three');
// #elseif VAL === 4
console.log('four');
// #elseif VAL === 5
console.log('five');
// #else
console.log('other');
// #endif

// Nested elif with multiple branches at each level
// #if OUTER
console.log('outer-start');
// #if INNER_A
console.log('inner-a');
// #elseif INNER_B
console.log('inner-b');
// #elseif INNER_C
console.log('inner-c');
// #else
console.log('inner-default');
// #endif
console.log('outer-middle');
// #if SECOND_A
console.log('second-a');
// #elseif SECOND_B
console.log('second-b');
// #else
console.log('second-default');
// #endif
console.log('outer-end');
// #elseif OUTER_ALT
console.log('outer-alt');
// #else
console.log('outer-default');
// #endif

console.log('done14');
