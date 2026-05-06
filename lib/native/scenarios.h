#ifndef NCB_SCENARIOS_H
#define NCB_SCENARIOS_H

#include <stdint.h>

static inline int32_t add_i32_impl(int32_t a, int32_t b) {
  return a + b;
}

static inline double add_f64_impl(double a, double b) {
  return a + b;
}

static inline int32_t sum_6_i32_impl(int32_t a, int32_t b, int32_t c,
                                     int32_t d, int32_t e, int32_t f) {
  return a + b + c + d + e + f;
}

static inline uint64_t pointer_to_usize_impl(const void* p) {
  return (uint64_t)(uintptr_t)p;
}

static inline uint64_t sum_buffer_impl(const uint8_t* buf, uint64_t n) {
  uint64_t s = 0;
  for (uint64_t i = 0; i < n; i++) s += buf[i];
  return s;
}

#endif
