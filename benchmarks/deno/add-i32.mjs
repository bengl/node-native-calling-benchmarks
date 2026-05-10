import { bench, dlopenFixture } from './_common.mjs';

const lib = dlopenFixture({ add_i32: { parameters: ['i32', 'i32'], result: 'i32' } });
try {
  bench({ backend: 'deno', scenario: 'add-i32', n: 1e7, expected: 42 }, () => lib.symbols.add_i32(20, 22));
} finally {
  lib.close();
}
