#include <napi.h>
#include <unistd.h>
extern "C" {
#include "scenarios.h"
}

static Napi::Value AddI32(const Napi::CallbackInfo& info) {
  int32_t a = info[0].As<Napi::Number>().Int32Value();
  int32_t b = info[1].As<Napi::Number>().Int32Value();
  return Napi::Number::New(info.Env(), add_i32_impl(a, b));
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

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("add_i32", Napi::Function::New(env, AddI32));
  exports.Set("add_f64", Napi::Function::New(env, AddF64));
  exports.Set("getpid",  Napi::Function::New(env, Getpid));
  exports.Set("sum_6_i32", Napi::Function::New(env, Sum6I32));
  exports.Set("pointer_to_usize", Napi::Function::New(env, PointerToUsize));
  exports.Set("sum_buffer", Napi::Function::New(env, SumBuffer));
  return exports;
}

NODE_API_MODULE(addon, Init)
