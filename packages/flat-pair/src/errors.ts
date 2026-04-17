export const checkLength = (len: number) => {
  if (len % 2 !== 0) {
    throw new Error(`[__NAME__] Invalid length: ${len}. Length must be even.`);
  }
};
