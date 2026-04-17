// Malformed directives and inline-comment edge cases
// Some of these are intentionally malformed to test parser robustness

// #if (A && )
console.log('malformed1');
// #endif

// Inline comments after code
console.log('keep-me'); // #if TRUE_IN_COMMENT

// Real directive after inline comment on its own line
// #if D
console.log('d-true');
// #endif

// directive-like token inside template literal
console.log(`template with #endif inside`);

console.log('done8');
