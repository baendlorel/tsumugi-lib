export const $expect = (o: unknown, message: string): void => {
  if (!o) {
    throw new Error('[__NAME__] ' + message);
  }
};

export const $warn = (message: string): void => {
  console.warn('[__NAME__] ' + message);
};
