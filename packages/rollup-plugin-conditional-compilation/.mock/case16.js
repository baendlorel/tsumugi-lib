// Error cases: malformed expression in elif
// #if VALID
console.log('valid');
// #elseif (BROKEN &&
console.log('broken-elif');
// #endif

console.log('done16');
