#!/usr/bin/env tsx

import { build } from './build.js';
import { lint } from './lint.js';
import { publish } from './publish.js';
import { skill } from './skill.js';
import { test } from './test.js';

const task = process.argv[2];
const [who] = process.argv.slice(3);
if (task === '--publish') {
  publish(who);
} else if (task === '--build') {
  build(who);
} else if (task === '--test') {
  test(who);
} else if (task === '--skill') {
  skill(who);
} else if (task === '--lint') {
  lint(who);
} else {
  console.error(`Unknown task: ${task}`);
}
