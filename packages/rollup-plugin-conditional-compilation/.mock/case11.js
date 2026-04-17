// Multiple elif chains testing precedence
// #if false
console.log('never1');
// #elseif false
console.log('never2');
// #elseif false
console.log('never3');
// #elseif true
console.log('fourth-condition');
// #elseif true
console.log('never4');
// #else
console.log('never5');
// #endif

//!divider

// Deep nesting with mixed if/elif/else at different levels
// #if LEVEL1
console.log('L1-start');
// #if LEVEL2
console.log('L2-start');
// #elseif LEVEL2_ALT
console.log('L2-alt');
// #if LEVEL3
console.log('L3-deep');
// #endif
// #else
console.log('L2-else');
// #endif
console.log('L1-end');
// #endif

console.log('done11');
