#!/usr/bin/env node

// import { cctl } from '@shared/utils/color.js';

import { readFileSync } from 'node:fs';
import { parse, stringify } from 'smol-toml';

// import { help } from './services/help.js';
// import { interactiveUse } from './services/use.js';
// import { version } from './services/version.js';

// import { ClautcherError } from './common/index.js';

// async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
//   try {
//     if (argv.length === 0) {
//       await interactiveUse();
//       return 0;
//     }

//     const [command] = argv;

//     if (command === 'help' || command === '--help' || command === '-h') {
//       help();
//       return 0;
//     }

//     if (command === 'version' || command === '--version' || command === '-v') {
//       version();
//       return 0;
//     }

//     await interactiveUse();
//     return 0;
//   } catch (error) {
//     if (error instanceof ClautcherError) {
//       console.error(cctl.red + error.message + cctl.reset);
//       if (error.type === 'UnknownCommand' || error.type === 'NotEnoughArguments') {
//         help();
//       }
//     } else {
//       console.error(error);
//     }
//     return 1;
//   }
// }

// main();

const content = readFileSync('./tests/1.toml', 'utf-8');
// const content = readFileSync('/home/aldia/.codex/config.toml', 'utf-8');
const parsed = parse(content);
const stringified = stringify(parsed);
console.log(parsed);
console.log(stringified);
