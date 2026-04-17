// Error cases: malformed elif/else usage

// Error: unmatched elif
// #elseif ORPHAN
console.log('orphan-elif');
// #endif

console.log('done15');
