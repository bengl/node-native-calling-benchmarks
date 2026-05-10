import { bench, dlopenFixture } from './_common.mjs';

const lib = dlopenFixture({
  sum_6_i32: { parameters: ['i32', 'i32', 'i32', 'i32', 'i32', 'i32'], result: 'i32' },
});
try {
  bench({ backend: 'deno', scenario: 'many-args', n: 1e7, expected: 21 }, () => lib.symbols.sum_6_i32(1, 2, 3, 4, 5, 6));
} finally {
  lib.close();
}
