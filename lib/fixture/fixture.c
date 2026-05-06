#include "../native/scenarios.h"

#if defined(_WIN32)
  #define EXPORT __declspec(dllexport)
#else
  #define EXPORT __attribute__((visibility("default")))
#endif

EXPORT int32_t add_i32(int32_t a, int32_t b) {
  return add_i32_impl(a, b);
}

EXPORT double add_f64(double a, double b) {
  return add_f64_impl(a, b);
}

EXPORT int32_t sum_6_i32(int32_t a, int32_t b, int32_t c,
                         int32_t d, int32_t e, int32_t f) {
  return sum_6_i32_impl(a, b, c, d, e, f);
}

EXPORT uint64_t pointer_to_usize(const void* p) {
  return pointer_to_usize_impl(p);
}

EXPORT uint64_t sum_buffer(const uint8_t* buf, uint64_t n) {
  return sum_buffer_impl(buf, n);
}
