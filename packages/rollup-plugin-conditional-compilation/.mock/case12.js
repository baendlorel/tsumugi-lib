// Complex expressions in elif
// #if A > 10
console.log('a-large');
// #elseif A > 5
console.log('a-medium');
// #elseif A > 0
console.log('a-small');
// #else
console.log('a-nonpositive');
// #endif

// Logical operators in elif chains
// #if X && Y
console.log('xy-both');
// #elseif X || Y
console.log('xy-either');
// #elseif !X && !Y
console.log('xy-neither');
// #else
console.log('xy-unknown');
// #endif

// Ternary and complex expressions
// #if TYPE === 'prod'
console.log('production');
// #elseif TYPE === 'dev'
console.log('development');
// #elseif TYPE === 'test'
console.log('testing');
// #else
console.log('unknown-type');
// #endif

console.log('done12');
