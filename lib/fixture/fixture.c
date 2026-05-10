#include "../native/scenarios.h"

#if defined(_WIN32)
  #define EXPORT __declspec(dllexport)
#else
  #define EXPORT __attribute__((visibility("default")))
#endif

EXPORT int32_t add_i32(int32_t a, int32_t b) {
  return add_i32_impl(a, b);
}

EXPORT void noop_void(void) {
  noop_void_impl();
}

EXPORT int32_t identity_i32(int32_t value) {
  return identity_i32_impl(value);
}

EXPORT int8_t add_i8(int8_t a, int8_t b) {
  return add_i8_impl(a, b);
}

EXPORT uint8_t add_u8(uint8_t a, uint8_t b) {
  return add_u8_impl(a, b);
}

EXPORT int16_t add_i16(int16_t a, int16_t b) {
  return add_i16_impl(a, b);
}

EXPORT uint16_t add_u16(uint16_t a, uint16_t b) {
  return add_u16_impl(a, b);
}

EXPORT int64_t add_i64(int64_t a, int64_t b) {
  return add_i64_impl(a, b);
}

EXPORT uint64_t add_u64(uint64_t a, uint64_t b) {
  return add_u64_impl(a, b);
}

EXPORT float add_f32(float a, float b) {
  return add_f32_impl(a, b);
}

EXPORT double add_f64(double a, double b) {
  return add_f64_impl(a, b);
}

EXPORT int32_t sum_6_i32(int32_t a, int32_t b, int32_t c,
                         int32_t d, int32_t e, int32_t f) {
  return sum_6_i32_impl(a, b, c, d, e, f);
}

EXPORT int32_t sum_3_i32(int32_t a, int32_t b, int32_t c) {
  return sum_3_i32_impl(a, b, c);
}

EXPORT int32_t sum_5_i32(int32_t a, int32_t b, int32_t c,
                         int32_t d, int32_t e) {
  return sum_5_i32_impl(a, b, c, d, e);
}

EXPORT int32_t sum_8_i32(int32_t a, int32_t b, int32_t c,
                         int32_t d, int32_t e, int32_t f,
                         int32_t g, int32_t h) {
  return sum_8_i32_impl(a, b, c, d, e, f, g, h);
}

EXPORT uint64_t pointer_to_usize(const void* p) {
  return pointer_to_usize_impl(p);
}

EXPORT uint64_t sum_buffer(const uint8_t* buf, uint64_t n) {
  return sum_buffer_impl(buf, n);
}

EXPORT uint64_t string_length(const char* value) {
  return string_length_impl(value);
}

EXPORT uint8_t string_first_char(const char* value) {
  return string_first_char_impl(value);
}

EXPORT uint8_t string_equals_hello(const char* value) {
  return string_equals_hello_impl(value);
}
