#include <nan.h>
#include <unistd.h>
extern "C" {
#include "scenarios.h"
}

using namespace Nan;
using namespace v8;

NAN_METHOD(AddI32) {
  int32_t a = info[0]->Int32Value(Nan::GetCurrentContext()).FromJust();
  int32_t b = info[1]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(add_i32_impl(a, b)));
}

NAN_METHOD(NoopVoid) {
  noop_void_impl();
}

NAN_METHOD(IdentityI32) {
  int32_t value = info[0]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(identity_i32_impl(value)));
}

NAN_METHOD(AddI8) {
  int8_t a = (int8_t)info[0]->Int32Value(Nan::GetCurrentContext()).FromJust();
  int8_t b = (int8_t)info[1]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(add_i8_impl(a, b)));
}

NAN_METHOD(AddU8) {
  uint8_t a = (uint8_t)info[0]->Uint32Value(Nan::GetCurrentContext()).FromJust();
  uint8_t b = (uint8_t)info[1]->Uint32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Uint32>(add_u8_impl(a, b)));
}

NAN_METHOD(AddI16) {
  int16_t a = (int16_t)info[0]->Int32Value(Nan::GetCurrentContext()).FromJust();
  int16_t b = (int16_t)info[1]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(add_i16_impl(a, b)));
}

NAN_METHOD(AddU16) {
  uint16_t a = (uint16_t)info[0]->Uint32Value(Nan::GetCurrentContext()).FromJust();
  uint16_t b = (uint16_t)info[1]->Uint32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Uint32>(add_u16_impl(a, b)));
}

NAN_METHOD(AddI64) {
  bool lossless;
  int64_t a = info[0].As<BigInt>()->Int64Value(&lossless);
  int64_t b = info[1].As<BigInt>()->Int64Value(&lossless);
  info.GetReturnValue().Set(v8::BigInt::New(info.GetIsolate(), add_i64_impl(a, b)));
}

NAN_METHOD(AddU64) {
  bool lossless;
  uint64_t a = info[0].As<BigInt>()->Uint64Value(&lossless);
  uint64_t b = info[1].As<BigInt>()->Uint64Value(&lossless);
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(info.GetIsolate(), add_u64_impl(a, b)));
}

NAN_METHOD(AddF32) {
  float a = (float)info[0]->NumberValue(Nan::GetCurrentContext()).FromJust();
  float b = (float)info[1]->NumberValue(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Number>(add_f32_impl(a, b)));
}

NAN_METHOD(AddF64) {
  double a = info[0]->NumberValue(Nan::GetCurrentContext()).FromJust();
  double b = info[1]->NumberValue(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Number>(add_f64_impl(a, b)));
}

NAN_METHOD(Getpid) {
  info.GetReturnValue().Set(Nan::New<Int32>((int32_t)getpid()));
}

NAN_METHOD(Sum6I32) {
  int32_t v[6];
  for (int i = 0; i < 6; i++)
    v[i] = info[i]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(
    sum_6_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5])));
}

NAN_METHOD(Sum3I32) {
  int32_t v[3];
  for (int i = 0; i < 3; i++)
    v[i] = info[i]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(sum_3_i32_impl(v[0], v[1], v[2])));
}

NAN_METHOD(Sum5I32) {
  int32_t v[5];
  for (int i = 0; i < 5; i++)
    v[i] = info[i]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(sum_5_i32_impl(v[0], v[1], v[2], v[3], v[4])));
}

NAN_METHOD(Sum8I32) {
  int32_t v[8];
  for (int i = 0; i < 8; i++)
    v[i] = info[i]->Int32Value(Nan::GetCurrentContext()).FromJust();
  info.GetReturnValue().Set(Nan::New<Int32>(
    sum_8_i32_impl(v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7])));
}

NAN_METHOD(PointerToUsize) {
  Local<Object> bufObj = info[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
  uint64_t addr = pointer_to_usize_impl((const void*)node::Buffer::Data(bufObj));
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(info.GetIsolate(), addr));
}

NAN_METHOD(SumBuffer) {
  Local<Object> bufObj = info[0]->ToObject(Nan::GetCurrentContext()).ToLocalChecked();
  uint64_t r = sum_buffer_impl(
    (const uint8_t*)node::Buffer::Data(bufObj),
    (uint64_t)node::Buffer::Length(bufObj));
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(info.GetIsolate(), r));
}

NAN_METHOD(StringLength) {
  Nan::Utf8String value(info[0]);
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(
    info.GetIsolate(), string_length_impl(*value)));
}

NAN_METHOD(StringFirstChar) {
  Nan::Utf8String value(info[0]);
  info.GetReturnValue().Set(Nan::New<Uint32>(string_first_char_impl(*value)));
}

NAN_METHOD(StringEqualsHello) {
  Nan::Utf8String value(info[0]);
  info.GetReturnValue().Set(Nan::New<Uint32>(string_equals_hello_impl(*value)));
}

#define SET_METHOD(name, fn) \
  Nan::Set(target, Nan::New(name).ToLocalChecked(), \
    Nan::GetFunction(Nan::New<FunctionTemplate>(fn)).ToLocalChecked())

NAN_MODULE_INIT(Init) {
  SET_METHOD("add_i32", AddI32);
  SET_METHOD("noop_void", NoopVoid);
  SET_METHOD("identity_i32", IdentityI32);
  SET_METHOD("add_i8", AddI8);
  SET_METHOD("add_u8", AddU8);
  SET_METHOD("add_i16", AddI16);
  SET_METHOD("add_u16", AddU16);
  SET_METHOD("add_i64", AddI64);
  SET_METHOD("add_u64", AddU64);
  SET_METHOD("add_f32", AddF32);
  SET_METHOD("add_f64", AddF64);
  SET_METHOD("getpid", Getpid);
  SET_METHOD("sum_6_i32", Sum6I32);
  SET_METHOD("sum_3_i32", Sum3I32);
  SET_METHOD("sum_5_i32", Sum5I32);
  SET_METHOD("sum_8_i32", Sum8I32);
  SET_METHOD("pointer_to_usize", PointerToUsize);
  SET_METHOD("sum_buffer", SumBuffer);
  SET_METHOD("string_length", StringLength);
  SET_METHOD("string_first_char", StringFirstChar);
  SET_METHOD("string_equals_hello", StringEqualsHello);
}

NODE_MODULE(addon, Init)
