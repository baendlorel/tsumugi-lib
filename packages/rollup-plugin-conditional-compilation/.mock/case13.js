// Adjacent elif blocks without separation
// #if A
console.log('block1-a');
// #endif
// #if B
console.log('block2-b');
// #elseif C
console.log('block2-c');
// #endif
// #if D
console.log('block3-d');
// #elseif E
console.log('block3-e');
// #elseif F
console.log('block3-f');
// #else
console.log('block3-none');
// #endif

// Extreme nesting: 4 levels deep with elif at each level
// #if L1
console.log('L1');
// #if L2
console.log('L2');
// #if L3
console.log('L3');
// #if L4
console.log('L4-deepest');
// #elseif L4_ALT
console.log('L4-alt');
// #endif
// #elseif L3_ALT
console.log('L3-alt');
// #endif
// #elseif L2_ALT
console.log('L2-alt');
// #endif
// #elseif L1_ALT
console.log('L1-alt');
// #endif

console.log('done13');
