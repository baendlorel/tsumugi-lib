#!/usr/bin/env node

import { cctl } from '@shared/utils/color.js';

async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  try {
    const [command] = argv;

    return 0;
  } catch (error) {
    return 1;
  }
}

main();
