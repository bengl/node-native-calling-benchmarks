#include <napi.h>
#include <string>
#include <unistd.h>
extern "C" {
#include "scenarios.h"
}

static Napi::Value AddI32(const Napi::CallbackInfo& info) {
  int32_t a = info[0].As<Napi::Number>().Int32Value();
  int32_t b = info[1].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(), add_i32_impl(a, b));
}

static Napi::Value NoopVoid(const Napi::CallbackInfo& info) {
  noop_void_impl();
  return info.Env().Undefined();
}

static Napi::Value IdentityI32(const Napi::CallbackInfo& info) {
  int32_t value = info[0].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(), identity_i32_impl(value));
}

static Napi::Value AddI8(const Napi::CallbackInfo& info) {
  int8_t a = (int8_t)info[0].As<Napi::Number>().Int32Value();
  int8_t b = (int8_t)info[1].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(), add_i8_impl(a, b));
}

static Napi::Value AddU8(const Napi::CallbackInfo& info) {
  uint8_t a = (uint8_t)info[0].As<Napi::Number>().Uint32Value();
  uint8_t b = (uint8_t)info[1].As<Napi::Number>().Uint32Value();
  return Napi::Number::New(info.Env(), add_u8_impl(a, b));
}

static Napi::Value AddI16(const Napi::CallbackInfo& info) {
  int16_t a = (int16_t)info[0].As<Napi::Number>().Int32Value();
  int16_t b = (int16_t)info[1].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(), add_i16_impl(a, b));
}

static Napi::Value AddU16(const Napi::CallbackInfo& info) {
  uint16_t a = (uint16_t)info[0].As<Napi::Number>().Uint32Value();
  uint16_t b = (uint16_t)info[1].As<Napi::Number>().Uint32Value();
  return Napi::Number::New(info.Env(), add_u16_impl(a, b));
}

static Napi::Value AddI64(const Napi::CallbackInfo& info) {
  bool lossless;
  int64_t a = info[0].As<Napi::BigInt>().Int64Value(&lossless);
  int64_t b = info[1].As<Napi::BigInt>().Int64Value(&lossless);
  return Napi::BigInt::New(info.Env(), add_i64_impl(a, b));
}

static Napi::Value AddU64(const Napi::CallbackInfo& info) {
  bool lossless;
  uint64_t a = info[0].As<Napi::BigInt>().Uint64Value(&lossless);
  uint64_t b = info[1].As<Napi::BigInt>().Uint64Value(&lossless);
  return Napi::BigInt::New(info.Env(), add_u64_impl(a, b));
}

static Napi::Value AddF32(const Napi::CallbackInfo& info) {
  float a = (float)info[0].As<Napi::Number>().DoubleValue();
  float b = (float)info[1].As<Napi::Number>().DoubleValue();
  return Napi::Number::New(info.Env(), add_f32_impl(a, b));
}

static Napi::Value AddF64(const Napi::CallbackInfo& info) {
  double a = info[0].As<Napi::Number>().DoubleValue();
  double b = info[1].As<Napi::Number>().DoubleValue();
  return Napi::Number::New(info.Env(), add_f64_impl(a, b));
}

static Napi::Value Getpid(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), (int32_t)getpid());
}

static Napi::Value Sum6I32(const Napi::CallbackInfo& info) {
  int32_t v[6];
  for (size_t i = 0; i < 6; i++) v[i] = info[i].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(),
    sum_6_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5]));
}

static Napi::Value Sum3I32(const Napi::CallbackInfo& info) {
  int32_t v[3];
  for (size_t i = 0; i < 3; i++) v[i] = info[i].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(), sum_3_i32_impl(v[0], v[1], v[2]));
}

static Napi::Value Sum5I32(const Napi::CallbackInfo& info) {
  int32_t v[5];
  for (size_t i = 0; i < 5; i++) v[i] = info[i].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(), sum_5_i32_impl(v[0], v[1], v[2], v[3], v[4]));
}

static Napi::Value Sum8I32(const Napi::CallbackInfo& info) {
  int32_t v[8];
  for (size_t i = 0; i < 8; i++) v[i] = info[i].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(),
    sum_8_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]));
}

static Napi::Value PointerToUsize(const Napi::CallbackInfo& info) {
  Napi::Buffer<uint8_t> buf = info[0].As<Napi::Buffer<uint8_t>>();
  return Napi::BigInt::New(info.Env(),
    pointer_to_usize_impl(buf.Data()));
}

static Napi::Value SumBuffer(const Napi::CallbackInfo& info) {
  Napi::Buffer<uint8_t> buf = info[0].As<Napi::Buffer<uint8_t>>();
  return Napi::BigInt::New(info.Env(),
    sum_buffer_impl(buf.Data(), (uint64_t)buf.Length()));
}

static Napi::Value StringLength(const Napi::CallbackInfo& info) {
  std::string value = info[0].As<Napi::String>().Utf8Value();
  return Napi::BigInt::New(info.Env(), string_length_impl(value.c_str()));
}

static Napi::Value StringFirstChar(const Napi::CallbackInfo& info) {
  std::string value = info[0].As<Napi::String>().Utf8Value();
  return Napi::Number::New(info.Env(), string_first_char_impl(value.c_str()));
}

static Napi::Value StringEqualsHello(const Napi::CallbackInfo& info) {
  std::string value = info[0].As<Napi::String>().Utf8Value();
  return Napi::Number::New(info.Env(), string_equals_hello_impl(value.c_str()));
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("add_i32", Napi::Function::New(env, AddI32));
  exports.Set("noop_void", Napi::Function::New(env, NoopVoid));
  exports.Set("identity_i32", Napi::Function::New(env, IdentityI32));
  exports.Set("add_i8", Napi::Function::New(env, AddI8));
  exports.Set("add_u8", Napi::Function::New(env, AddU8));
  exports.Set("add_i16", Napi::Function::New(env, AddI16));
  exports.Set("add_u16", Napi::Function::New(env, AddU16));
  exports.Set("add_i64", Napi::Function::New(env, AddI64));
  exports.Set("add_u64", Napi::Function::New(env, AddU64));
  exports.Set("add_f32", Napi::Function::New(env, AddF32));
  exports.Set("add_f64", Napi::Function::New(env, AddF64));
  exports.Set("getpid",  Napi::Function::New(env, Getpid));
  exports.Set("sum_6_i32", Napi::Function::New(env, Sum6I32));
  exports.Set("sum_3_i32", Napi::Function::New(env, Sum3I32));
  exports.Set("sum_5_i32", Napi::Function::New(env, Sum5I32));
  exports.Set("sum_8_i32", Napi::Function::New(env, Sum8I32));
  exports.Set("pointer_to_usize", Napi::Function::New(env, PointerToUsize));
  exports.Set("sum_buffer", Napi::Function::New(env, SumBuffer));
  exports.Set("string_length", Napi::Function::New(env, StringLength));
  exports.Set("string_first_char", Napi::Function::New(env, StringFirstChar));
  exports.Set("string_equals_hello", Napi::Function::New(env, StringEqualsHello));
  return exports;
}

NODE_API_MODULE(addon, Init)
