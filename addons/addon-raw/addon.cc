#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <unistd.h>
extern "C" {
#include "scenarios.h"
}

using v8::Context;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::Value;
using v8::BigInt;
using v8::Int32;

static void AddI32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t a = args[0]->Int32Value(ctx).FromJust();
  int32_t b = args[1]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate, add_i32_impl(a, b)));
}

static void AddF64(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  double a = args[0]->NumberValue(ctx).FromJust();
  double b = args[1]->NumberValue(ctx).FromJust();
  args.GetReturnValue().Set(Number::New(isolate, add_f64_impl(a, b)));
}

static void Getpid(const FunctionCallbackInfo<Value>& args) {
  args.GetReturnValue().Set(Int32::New(args.GetIsolate(), (int32_t)getpid()));
}

static void Sum6I32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t v[6];
  for (int i = 0; i < 6; i++) v[i] = args[i]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate,
    sum_6_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5])));
}

static void PointerToUsize(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Object> bufObj = args[0].As<Object>();
  uint64_t r = pointer_to_usize_impl((const void*)node::Buffer::Data(bufObj));
  args.GetReturnValue().Set(BigInt::NewFromUnsigned(isolate, r));
}

static void SumBuffer(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Object> bufObj = args[0].As<Object>();
  uint64_t r = sum_buffer_impl(
    (const uint8_t*)node::Buffer::Data(bufObj),
    (uint64_t)node::Buffer::Length(bufObj));
  args.GetReturnValue().Set(BigInt::NewFromUnsigned(isolate, r));
}

static void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "add_i32",          AddI32);
  NODE_SET_METHOD(exports, "add_f64",          AddF64);
  NODE_SET_METHOD(exports, "getpid",           Getpid);
  NODE_SET_METHOD(exports, "sum_6_i32",        Sum6I32);
  NODE_SET_METHOD(exports, "pointer_to_usize", PointerToUsize);
  NODE_SET_METHOD(exports, "sum_buffer",       SumBuffer);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)
