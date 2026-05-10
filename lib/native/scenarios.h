#ifndef NCB_SCENARIOS_H
#define NCB_SCENARIOS_H

#include <stdint.h>
#include <stddef.h>

static inline void noop_void_impl(void) {
}

static inline int32_t identity_i32_impl(int32_t value) {
  return value;
}

static inline int8_t add_i8_impl(int8_t a, int8_t b) {
  return a + b;
}

static inline uint8_t add_u8_impl(uint8_t a, uint8_t b) {
  return a + b;
}

static inline int16_t add_i16_impl(int16_t a, int16_t b) {
  return a + b;
}

static inline uint16_t add_u16_impl(uint16_t a, uint16_t b) {
  return a + b;
}

static inline int32_t add_i32_impl(int32_t a, int32_t b) {
  return a + b;
}

static inline int64_t add_i64_impl(int64_t a, int64_t b) {
  return a + b;
}

static inline uint64_t add_u64_impl(uint64_t a, uint64_t b) {
  return a + b;
}

static inline float add_f32_impl(float a, float b) {
  return a + b;
}

static inline double add_f64_impl(double a, double b) {
  return a + b;
}

static inline int32_t sum_3_i32_impl(int32_t a, int32_t b, int32_t c) {
  return a + b + c;
}

static inline int32_t sum_5_i32_impl(int32_t a, int32_t b, int32_t c,
                                     int32_t d, int32_t e) {
  return a + b + c + d + e;
}

static inline int32_t sum_8_i32_impl(int32_t a, int32_t b, int32_t c,
                                     int32_t d, int32_t e, int32_t f,
                                     int32_t g, int32_t h) {
  return a + b + c + d + e + f + g + h;
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

static inline uint64_t string_length_impl(const char* value) {
  uint64_t len = 0;
  while (value[len] != '\0') len++;
  return len;
}

static inline uint8_t string_first_char_impl(const char* value) {
  return (uint8_t)value[0];
}

static inline uint8_t string_equals_hello_impl(const char* value) {
  const char expected[] = "hello";
  for (size_t i = 0; expected[i] != '\0'; i++) {
    if (value[i] != expected[i]) return 0;
  }
  return value[5] == '\0';
}

#endif
