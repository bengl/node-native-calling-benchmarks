#define NAPI_VERSION 8
#include <node_api.h>
#include <stdbool.h>
#include <unistd.h>
#include "scenarios.h"

#define DECLARE_METHOD(name) \
  { #name, NULL, name, NULL, NULL, NULL, napi_default, NULL }

static napi_value add_i32(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int32_t a, b;
  napi_get_value_int32(env, argv[0], &a);
  napi_get_value_int32(env, argv[1], &b);
  napi_value out;
  napi_create_int32(env, add_i32_impl(a, b), &out);
  return out;
}

static napi_value noop_void(napi_env env, napi_callback_info info) {
  (void)env;
  (void)info;
  noop_void_impl();
  return NULL;
}

static napi_value identity_i32(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int32_t value;
  napi_get_value_int32(env, argv[0], &value);
  napi_value out;
  napi_create_int32(env, identity_i32_impl(value), &out);
  return out;
}

#define ADD_INT_FN(name, ctype, getter, creator) \
  static napi_value name(napi_env env, napi_callback_info info) { \
    size_t argc = 2; \
    napi_value argv[2]; \
    napi_get_cb_info(env, info, &argc, argv, NULL, NULL); \
    ctype a, b; \
    getter(env, argv[0], &a); \
    getter(env, argv[1], &b); \
    napi_value out; \
    creator(env, name##_impl(a, b), &out); \
    return out; \
  }

ADD_INT_FN(add_i8, int32_t, napi_get_value_int32, napi_create_int32)
ADD_INT_FN(add_u8, uint32_t, napi_get_value_uint32, napi_create_uint32)
ADD_INT_FN(add_i16, int32_t, napi_get_value_int32, napi_create_int32)
ADD_INT_FN(add_u16, uint32_t, napi_get_value_uint32, napi_create_uint32)

static napi_value add_i64(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int64_t a, b;
  bool lossless;
  napi_get_value_bigint_int64(env, argv[0], &a, &lossless);
  napi_get_value_bigint_int64(env, argv[1], &b, &lossless);
  napi_value out;
  napi_create_bigint_int64(env, add_i64_impl(a, b), &out);
  return out;
}

static napi_value add_u64(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  uint64_t a, b;
  bool lossless;
  napi_get_value_bigint_uint64(env, argv[0], &a, &lossless);
  napi_get_value_bigint_uint64(env, argv[1], &b, &lossless);
  napi_value out;
  napi_create_bigint_uint64(env, add_u64_impl(a, b), &out);
  return out;
}

static napi_value add_f32(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  double a, b;
  napi_get_value_double(env, argv[0], &a);
  napi_get_value_double(env, argv[1], &b);
  napi_value out;
  napi_create_double(env, add_f32_impl((float)a, (float)b), &out);
  return out;
}

static napi_value add_f64(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  double a, b;
  napi_get_value_double(env, argv[0], &a);
  napi_get_value_double(env, argv[1], &b);
  napi_value out;
  napi_create_double(env, add_f64_impl(a, b), &out);
  return out;
}

static napi_value getpid_fn(napi_env env, napi_callback_info info) {
  (void)info;
  napi_value out;
  napi_create_int32(env, (int32_t)getpid(), &out);
  return out;
}

static napi_value sum_6_i32(napi_env env, napi_callback_info info) {
  size_t argc = 6;
  napi_value argv[6];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int32_t v[6];
  for (size_t i = 0; i < 6; i++) napi_get_value_int32(env, argv[i], &v[i]);
  napi_value out;
  napi_create_int32(env, sum_6_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5]), &out);
  return out;
}

static napi_value sum_3_i32(napi_env env, napi_callback_info info) {
  size_t argc = 3;
  napi_value argv[3];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int32_t v[3];
  for (size_t i = 0; i < 3; i++) napi_get_value_int32(env, argv[i], &v[i]);
  napi_value out;
  napi_create_int32(env, sum_3_i32_impl(v[0], v[1], v[2]), &out);
  return out;
}

static napi_value sum_5_i32(napi_env env, napi_callback_info info) {
  size_t argc = 5;
  napi_value argv[5];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int32_t v[5];
  for (size_t i = 0; i < 5; i++) napi_get_value_int32(env, argv[i], &v[i]);
  napi_value out;
  napi_create_int32(env, sum_5_i32_impl(v[0], v[1], v[2], v[3], v[4]), &out);
  return out;
}

static napi_value sum_8_i32(napi_env env, napi_callback_info info) {
  size_t argc = 8;
  napi_value argv[8];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  int32_t v[8];
  for (size_t i = 0; i < 8; i++) napi_get_value_int32(env, argv[i], &v[i]);
  napi_value out;
  napi_create_int32(env, sum_8_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]), &out);
  return out;
}

static napi_value pointer_to_usize(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  void* data; size_t len;
  napi_get_buffer_info(env, argv[0], &data, &len);
  napi_value out;
  napi_create_bigint_uint64(env, pointer_to_usize_impl(data), &out);
  return out;
}

static napi_value sum_buffer(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  void* data; size_t len;
  napi_get_buffer_info(env, argv[0], &data, &len);
  napi_value out;
  napi_create_bigint_uint64(env, sum_buffer_impl((const uint8_t*)data, (uint64_t)len), &out);
  return out;
}

static napi_value string_length(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  char value[64];
  size_t written;
  napi_get_value_string_utf8(env, argv[0], value, sizeof(value), &written);
  napi_value out;
  napi_create_bigint_uint64(env, string_length_impl(value), &out);
  return out;
}

static napi_value string_first_char(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  char value[64];
  size_t written;
  napi_get_value_string_utf8(env, argv[0], value, sizeof(value), &written);
  napi_value out;
  napi_create_uint32(env, string_first_char_impl(value), &out);
  return out;
}

static napi_value string_equals_hello(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  char value[64];
  size_t written;
  napi_get_value_string_utf8(env, argv[0], value, sizeof(value), &written);
  napi_value out;
  napi_create_uint32(env, string_equals_hello_impl(value), &out);
  return out;
}

NAPI_MODULE_INIT() {
  napi_property_descriptor props[] = {
    DECLARE_METHOD(add_i32),
    DECLARE_METHOD(noop_void),
    DECLARE_METHOD(identity_i32),
    DECLARE_METHOD(add_i8),
    DECLARE_METHOD(add_u8),
    DECLARE_METHOD(add_i16),
    DECLARE_METHOD(add_u16),
    DECLARE_METHOD(add_i64),
    DECLARE_METHOD(add_u64),
    DECLARE_METHOD(add_f32),
    DECLARE_METHOD(add_f64),
    { "getpid", NULL, getpid_fn, NULL, NULL, NULL, napi_default, NULL },
    DECLARE_METHOD(sum_6_i32),
    DECLARE_METHOD(sum_3_i32),
    DECLARE_METHOD(sum_5_i32),
    DECLARE_METHOD(sum_8_i32),
    DECLARE_METHOD(pointer_to_usize),
    DECLARE_METHOD(sum_buffer),
    DECLARE_METHOD(string_length),
    DECLARE_METHOD(string_first_char),
    DECLARE_METHOD(string_equals_hello),
  };
  napi_define_properties(env, exports, sizeof(props)/sizeof(*props), props);
  return exports;
}
