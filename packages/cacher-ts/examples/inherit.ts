import { isDeepStrictEqual } from 'node:util';
import { Cacher, Cache, SubCache } from '../src/index.js';
import { initializeDecoratedCaches } from '../src/decorator.js';

class AA {
  @Cache({ id: 'a' })
  async a() {
    return 'aa';
  }
}

class BB extends AA {
  @Cache({ id: 'a' })
  async a() {
    return 'bb';
  }
}

async function main() {
  const aa = new AA();
  const bb = new BB();
  await aa.a();
  await bb.a();
}
main();
