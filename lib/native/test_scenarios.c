#include "scenarios.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>

int main(void) {
  assert(add_i32_impl(20, 22) == 42);
  assert(add_f64_impl(1.5, 2.5) == 4.0);
  assert(sum_6_i32_impl(1, 2, 3, 4, 5, 6) == 21);

  int x;
  assert(pointer_to_usize_impl(&x) == (uint64_t)(uintptr_t)&x);

  uint8_t buf[64];
  memset(buf, 0x42, sizeof(buf));
  assert(sum_buffer_impl(buf, sizeof(buf)) == 64ULL * 0x42ULL);

  printf("scenarios: OK\n");
  return 0;
}
