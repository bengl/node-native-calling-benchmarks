import { bench, dlopenFixture } from './_common.mjs';

const lib = dlopenFixture({ add_f64: { parameters: ['f64', 'f64'], result: 'f64' } });
try {
  bench({ backend: 'deno', scenario: 'add-f64', n: 1e7, expected: 4.0 }, () => lib.symbols.add_f64(1.5, 2.5));
} finally {
  lib.close();
}
