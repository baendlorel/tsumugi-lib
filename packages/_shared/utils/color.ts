// color.js - 完整的彩色输出工具
/**
 * Color Control Characters for Terminal (cctl)
 */
export namespace cctl {
  export const reset = '\x1b[0m';
  export const bold = '\x1b[1m';
  export const dim = '\x1b[2m';
  export const italic = '\x1b[3m';
  export const underline = '\x1b[4m';
  export const blink = '\x1b[5m';
  export const inverse = '\x1b[7m';

  export const black = '\x1b[30m';
  export const red = '\x1b[31m';
  export const green = '\x1b[32m';
  export const yellow = '\x1b[33m';
  export const blue = '\x1b[34m';
  export const magenta = '\x1b[35m';
  export const cyan = '\x1b[36m';
  export const white = '\x1b[37m';

  export const brightBlack = '\x1b[90m';
  export const brightRed = '\x1b[91m';
  export const brightGreen = '\x1b[92m';
  export const brightYellow = '\x1b[93m';
  export const brightBlue = '\x1b[94m';
  export const brightMagenta = '\x1b[95m';
  export const brightCyan = '\x1b[96m';
  export const brightWhite = '\x1b[97m';

  export const bgBlack = '\x1b[40m';
  export const bgRed = '\x1b[41m';
  export const bgGreen = '\x1b[42m';
  export const bgYellow = '\x1b[43m';
  export const bgBlue = '\x1b[44m';
  export const bgMagenta = '\x1b[45m';
  export const bgCyan = '\x1b[46m';
  export const bgWhite = '\x1b[47m';

  export const bgBrightBlack = '\x1b[100m';
  export const bgBrightRed = '\x1b[101m';
  export const bgBrightGreen = '\x1b[102m';
  export const bgBrightYellow = '\x1b[103m';
  export const bgBrightBlue = '\x1b[104m';
  export const bgBrightMagenta = '\x1b[105m';
  export const bgBrightCyan = '\x1b[106m';
  export const bgBrightWhite = '\x1b[107m';

  export const claude = '\x1b[38;2;217;119;87m';
  export const deepseek = '\x1b[38;2;57;100;254m';
  export const gpt = '\x1b[38;2;41;60;77m';
}
