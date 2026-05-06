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

NAN_MODULE_INIT(Init) {
  Nan::Set(target, Nan::New("add_i32").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(AddI32)).ToLocalChecked());
  Nan::Set(target, Nan::New("add_f64").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(AddF64)).ToLocalChecked());
  Nan::Set(target, Nan::New("getpid").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(Getpid)).ToLocalChecked());
  Nan::Set(target, Nan::New("sum_6_i32").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(Sum6I32)).ToLocalChecked());
  Nan::Set(target, Nan::New("pointer_to_usize").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(PointerToUsize)).ToLocalChecked());
  Nan::Set(target, Nan::New("sum_buffer").ToLocalChecked(),
    Nan::GetFunction(Nan::New<FunctionTemplate>(SumBuffer)).ToLocalChecked());
}

NODE_MODULE(addon, Init)
