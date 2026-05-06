#define NAPI_VERSION 8
#include <node_api.h>
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

NAPI_MODULE_INIT() {
  napi_property_descriptor props[] = {
    DECLARE_METHOD(add_i32),
    DECLARE_METHOD(add_f64),
    { "getpid", NULL, getpid_fn, NULL, NULL, NULL, napi_default, NULL },
    DECLARE_METHOD(sum_6_i32),
    DECLARE_METHOD(pointer_to_usize),
    DECLARE_METHOD(sum_buffer),
  };
  napi_define_properties(env, exports, sizeof(props)/sizeof(*props), props);
  return exports;
}
