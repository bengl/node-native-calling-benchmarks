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
using v8::String;

static void AddI32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t a = args[0]->Int32Value(ctx).FromJust();
  int32_t b = args[1]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate, add_i32_impl(a, b)));
}

static void NoopVoid(const FunctionCallbackInfo<Value>& args) {
  noop_void_impl();
}

static void IdentityI32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t value = args[0]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate, identity_i32_impl(value)));
}

static void AddI8(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int8_t a = (int8_t)args[0]->Int32Value(ctx).FromJust();
  int8_t b = (int8_t)args[1]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate, add_i8_impl(a, b)));
}

static void AddU8(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  uint8_t a = (uint8_t)args[0]->Uint32Value(ctx).FromJust();
  uint8_t b = (uint8_t)args[1]->Uint32Value(ctx).FromJust();
  args.GetReturnValue().Set(v8::Uint32::New(isolate, add_u8_impl(a, b)));
}

static void AddI16(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int16_t a = (int16_t)args[0]->Int32Value(ctx).FromJust();
  int16_t b = (int16_t)args[1]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate, add_i16_impl(a, b)));
}

static void AddU16(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  uint16_t a = (uint16_t)args[0]->Uint32Value(ctx).FromJust();
  uint16_t b = (uint16_t)args[1]->Uint32Value(ctx).FromJust();
  args.GetReturnValue().Set(v8::Uint32::New(isolate, add_u16_impl(a, b)));
}

static void AddI64(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  bool lossless;
  int64_t a = args[0].As<BigInt>()->Int64Value(&lossless);
  int64_t b = args[1].As<BigInt>()->Int64Value(&lossless);
  args.GetReturnValue().Set(BigInt::New(isolate, add_i64_impl(a, b)));
}

static void AddU64(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  bool lossless;
  uint64_t a = args[0].As<BigInt>()->Uint64Value(&lossless);
  uint64_t b = args[1].As<BigInt>()->Uint64Value(&lossless);
  args.GetReturnValue().Set(BigInt::NewFromUnsigned(isolate, add_u64_impl(a, b)));
}

static void AddF32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  float a = (float)args[0]->NumberValue(ctx).FromJust();
  float b = (float)args[1]->NumberValue(ctx).FromJust();
  args.GetReturnValue().Set(Number::New(isolate, add_f32_impl(a, b)));
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

static void Sum3I32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t v[3];
  for (int i = 0; i < 3; i++) v[i] = args[i]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate, sum_3_i32_impl(v[0], v[1], v[2])));
}

static void Sum5I32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t v[5];
  for (int i = 0; i < 5; i++) v[i] = args[i]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate, sum_5_i32_impl(v[0], v[1], v[2], v[3], v[4])));
}

static void Sum8I32(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> ctx = isolate->GetCurrentContext();
  int32_t v[8];
  for (int i = 0; i < 8; i++) v[i] = args[i]->Int32Value(ctx).FromJust();
  args.GetReturnValue().Set(Int32::New(isolate,
    sum_8_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7])));
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

static void StringLength(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  String::Utf8Value value(isolate, args[0]);
  args.GetReturnValue().Set(BigInt::NewFromUnsigned(isolate, string_length_impl(*value)));
}

static void StringFirstChar(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  String::Utf8Value value(isolate, args[0]);
  args.GetReturnValue().Set(v8::Uint32::New(isolate, string_first_char_impl(*value)));
}

static void StringEqualsHello(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  String::Utf8Value value(isolate, args[0]);
  args.GetReturnValue().Set(v8::Uint32::New(isolate, string_equals_hello_impl(*value)));
}

static void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "add_i32",          AddI32);
  NODE_SET_METHOD(exports, "noop_void",        NoopVoid);
  NODE_SET_METHOD(exports, "identity_i32",     IdentityI32);
  NODE_SET_METHOD(exports, "add_i8",           AddI8);
  NODE_SET_METHOD(exports, "add_u8",           AddU8);
  NODE_SET_METHOD(exports, "add_i16",          AddI16);
  NODE_SET_METHOD(exports, "add_u16",          AddU16);
  NODE_SET_METHOD(exports, "add_i64",          AddI64);
  NODE_SET_METHOD(exports, "add_u64",          AddU64);
  NODE_SET_METHOD(exports, "add_f32",          AddF32);
  NODE_SET_METHOD(exports, "add_f64",          AddF64);
  NODE_SET_METHOD(exports, "getpid",           Getpid);
  NODE_SET_METHOD(exports, "sum_6_i32",        Sum6I32);
  NODE_SET_METHOD(exports, "sum_3_i32",        Sum3I32);
  NODE_SET_METHOD(exports, "sum_5_i32",        Sum5I32);
  NODE_SET_METHOD(exports, "sum_8_i32",        Sum8I32);
  NODE_SET_METHOD(exports, "pointer_to_usize", PointerToUsize);
  NODE_SET_METHOD(exports, "sum_buffer",       SumBuffer);
  NODE_SET_METHOD(exports, "string_length",    StringLength);
  NODE_SET_METHOD(exports, "string_first_char", StringFirstChar);
  NODE_SET_METHOD(exports, "string_equals_hello", StringEqualsHello);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)
