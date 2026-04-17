/* Block comment that contains what looks like a directive which must be ignored by parser
// #if SHOULD_NOT_BE_SEEN
console.log('inside block comment');
// #endif
*/

// A string containing the text '#if' should not be parsed as a directive
console.log("this string contains #if but it's not a directive");

//    #if A && (B || C)
console.log('A-start');
//    #if B
console.log('B-inner');
//    #endif
console.log('A-end');
//    #endif

// a closing line to ensure file ends nicely
console.log('done6');
