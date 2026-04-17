#include <node.h>
#include <v8.h>
#include <string>

/**
 * Check if `{` appears before `(` in a function string
 *
 * - ignores comment
 * @param src function string
 */
bool _HasBraceBeforeParen(const std::string& src) {
  size_t i = 4, len = src.length();
  while (i < len) {
    // & skip comment
    // skip /* ... */
    if (i + 1 < len && src[i] == '/' && src[i + 1] == '*') {
      i += 2;
      while (i + 1 < len && !(src[i] == '*' && src[i + 1] == '/')) {
        i++;
      }
      i += 2;  // skip */
    }
    // skip // ...
    else if (i + 1 < len && src[i] == '/' && src[i + 1] == '/') {
      i += 2;
      while (i < len && src[i] != '\n') {
        i++;
      }
      // keep the newline character
      if (i < len && src[i] == '\n') {
        i++;
      }
    }
    // & not comment
    else {
      if (src[i] == '{') {
        return true;
      }
      if (src[i] == '(') {
        return false;
      }
      i++;
    }
  }
  return false;
}

namespace function_feature {
typedef v8::Isolate* Isol;
typedef v8::FunctionCallback FnCB;

// Local handle types
typedef v8::Local<v8::Context> LCtx;
typedef v8::Local<v8::Value> LVal;
typedef v8::Local<v8::Proxy> LPxy;
typedef v8::Local<v8::Function> LFun;
typedef v8::Local<v8::String> LStr;
typedef v8::Local<v8::Symbol> LSym;
typedef v8::MaybeLocal<v8::String> MStr;
typedef v8::Local<v8::Object> LObj;
typedef v8::Local<v8::Array> LArr;
constexpr auto STR_TYPE = v8::NewStringType::kNormal;

// #region Utils
inline LStr _String(Isol isolate, const char* str) {
  return v8::String::NewFromUtf8(isolate, str, STR_TYPE).ToLocalChecked();
}

inline void Throws(v8::FunctionCallbackInfo<v8::Value> info, const char* msg) {
  Isol isolate = info.GetIsolate();
  MStr maybe_msg = _String(info.GetIsolate(), msg);
  LVal err = v8::Exception::TypeError(maybe_msg.ToLocalChecked());
  isolate->ThrowException(err);
}

template <typename T>
void _Set(LObj result, const char* k, T v) {
  Isol isolate = result->GetIsolate();
  LCtx ctx = isolate->GetCurrentContext();
  LVal key = _String(isolate, k);

  // 自动包装为 V8 Value
  LVal value;
  if constexpr (std::is_same_v<T, bool>) {
    value = v8::Boolean::New(isolate, v);
  } else if constexpr (std::is_same_v<T, int>) {
    value = v8::Integer::New(isolate, v);
  } else if constexpr (std::is_same_v<T, double> || std::is_same_v<T, float>) {
    value = v8::Number::New(isolate, v);
  } else if constexpr (std::is_same_v<T, const char*>) {
    value = _String(isolate, v);
  } else if constexpr (std::is_same_v<T, std::string>) {
    value = _String(isolate, v.c_str());
  } else if constexpr (std::is_same_v<T, LVal>) {
    value = v;
  } else if constexpr (std::is_same_v<T, LFun>) {
    value = v;
  } else if constexpr (std::is_same_v<T, LObj>) {
    value = v;
  } else if constexpr (std::is_same_v<T, LArr>) {
    value = v;
  } else if constexpr (std::is_same_v<T, LStr>) {
    value = v;
  } else if constexpr (std::is_same_v<T, LSym>) {
    value = v;
  } else if constexpr (std::is_same_v<T, FnCB>) {
    // 处理函数回调类型
    auto tpl = v8::FunctionTemplate::New(isolate, v);
    value = tpl->GetFunction(ctx).ToLocalChecked();
  } else {
    value = _String(isolate, "unknown");
  }

  auto maybe_result = result->Set(ctx, key, value);
  maybe_result.Check();
}
// #endregion

LFun _GetOrigin(Isol isolate, LFun func) {
  LFun current = func;

  while (true) {
    bool changed = false;

    // First check bound target
    LVal bound = current->GetBoundFunction();
    if (bound->IsFunction()) {
      LFun boundFunc = LFun::Cast(bound);
      if (boundFunc != current) {
        current = boundFunc;
        changed = true;
        continue;
      }
    }

    // Then check proxy target
    if (current->IsProxy()) {
      LPxy proxy = LPxy::Cast(current);
      LVal target = proxy->GetTarget();
      if (target->IsFunction()) {
        LFun targetFunc = LFun::Cast(target);
        if (targetFunc != current) {
          current = targetFunc;
          changed = true;
          continue;
        }
      }
    }

    // If no change occurred, we've reached the origin
    if (!changed) {
      break;
    }
  }

  return current;
}

// Check if a function is a native constructor like Array, Boolean, etc.
bool _IsNativeConstructor(Isol isolate, LFun func) {
  LCtx ctx = isolate->GetCurrentContext();

  // Get the global object to access native constructors
  LObj global = ctx->Global();

  // List of native constructor names to check
  const char* native_constructors[] = {
      "Array",       "Boolean",      "Date",          "Error",
      "Function",    "Number",       "Object",        "RegExp",
      "String",      "Symbol",       "Promise",       "Map",
      "Set",         "WeakMap",      "WeakSet",       "ArrayBuffer",
      "DataView",    "Float32Array", "Float64Array",  "Int8Array",
      "Int16Array",  "Int32Array",   "Uint8Array",    "Uint8ClampedArray",
      "Uint16Array", "Uint32Array",  "BigInt64Array", "BigUint64Array"};

  for (const char* name : native_constructors) {
    LStr key = _String(isolate, name);
    v8::MaybeLocal<v8::Value> maybe_constructor = global->Get(ctx, key);
    LVal constructor_val;
    if (maybe_constructor.ToLocal(&constructor_val) &&
        constructor_val->IsFunction()) {
      LFun constructor = LFun::Cast(constructor_val);
      if (constructor == func) {
        return true;
      }
    }
  }

  return false;
}

// Check if function string starts with 'class' or '[class'
bool _HasClassSyntax(const std::string& func_str) {
  // minimum length for a class definition is 'class{}'
  if (func_str.length() < 7) {
    return false;
  }

  // Check for 'class' at the beginning
  if (func_str.substr(0, 5) == "class" || func_str.substr(0, 6) == "[class") {
    // 跳过注释，判断在未遇到圆括号时先遇到大括号
    return _HasBraceBeforeParen(func_str);
  }

  return false;
}

// Main function to check if a function is a class
bool _IsClass(Isol isolate, LFun func) {
  // Step 0: Must be a constructor
  if (!func->IsConstructor()) {
    return false;
  }

  // Get the original function (not bound)
  LFun origin = _GetOrigin(isolate, func);

  // Step 1: Check if it's a native constructor
  if (_IsNativeConstructor(isolate, origin)) {
    return true;
  }

  // Step 2: Check function.toString() for class syntax
  LCtx ctx = isolate->GetCurrentContext();
  MStr maybe_str = origin->FunctionProtoToString(ctx);
  LStr str;
  if (!maybe_str.ToLocal(&str)) {
    return false;
  }

  // Convert V8 string to std::string
  v8::String::Utf8Value utf8_str(isolate, str);
  std::string func_str(*utf8_str);

  return _HasClassSyntax(func_str);
}

// Get V8 function feature flags
LObj _GetFeatures(Isol isolate, LFun fn) {
  v8::EscapableHandleScope scope(isolate);
  LCtx ctx = isolate->GetCurrentContext();
  LObj result = v8::Object::New(isolate);

  _Set(result, "isConstructor", fn->IsConstructor());
  _Set(result, "isAsyncFunction", fn->IsAsyncFunction());
  _Set(result, "isGeneratorFunction", fn->IsGeneratorFunction());
  _Set(result, "isProxy", fn->IsProxy());
  _Set(result, "isCallable", fn->IsCallable());
  _Set(result, "isBound", fn->GetBoundFunction()->IsFunction());
  _Set(result, "isClass", _IsClass(isolate, fn));
  _Set(result, "origin", _GetOrigin(isolate, fn));

  return scope.Escape(result);
}

// #region Exported Functions
void GetFeatures(const v8::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1) {
    Throws(info, "Expected at least 1 argument");
    return;
  }

  if (!info[0]->IsFunction()) {
    Throws(info, "Argument must be a function");
    return;
  }

  LVal arg0 = info[0];
  LFun func = LFun::Cast(arg0);
  Isol isolate = info.GetIsolate();

  LObj result = _GetFeatures(isolate, func);
  info.GetReturnValue().Set(result);
}

void GetBound(const v8::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1) {
    Throws(info, "Expected at least 1 argument");
    return;
  }

  if (!info[0]->IsFunction()) {
    Throws(info, "Argument must be a function");
    return;
  }

  LVal arg0 = info[0];
  LFun func = LFun::Cast(arg0);

  LVal bound = func->GetBoundFunction();
  info.GetReturnValue().Set(bound);
}

void GetProxyConfig(const v8::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1) {
    Throws(info, "Expected at least 1 argument");
    return;
  }

  LVal arg0 = info[0];
  if (!arg0->IsObject() && !arg0->IsFunction()) {
    Throws(info, "Argument must be a function or an object");
    return;
  }

  Isol isolate = info.GetIsolate();
  if (arg0->IsProxy()) {
    LPxy proxy = LPxy::Cast(arg0);
    LVal proxyTarget = proxy->GetTarget();
    LVal proxyHandler = proxy->GetHandler();
    LObj result = v8::Object::New(isolate);
    _Set(result, "target", proxyTarget);
    _Set(result, "handler", proxyHandler);
    info.GetReturnValue().Set(result);
  } else {
    info.GetReturnValue().Set(v8::Undefined(isolate));
  }
}

void GetOrigin(const v8::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1) {
    Throws(info, "Expected at least 1 argument");
    return;
  }

  LVal arg0 = info[0];
  if (!arg0->IsObject() && !arg0->IsFunction()) {
    Throws(info, "Argument must be a function");
    return;
  }

  LFun func = LFun::Cast(arg0);
  Isol isolate = info.GetIsolate();

  LFun origin = _GetOrigin(isolate, func);
  info.GetReturnValue().Set(origin);
}

void SetName(const v8::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 2) {
    Throws(info, "Expected at least 2 arguments: function, name");
    return;
  }

  LVal arg0 = info[0];
  LVal arg1 = info[1];

  if (!arg0->IsFunction()) {
    Throws(info, "First argument must be a function");
    return;
  }

  if (!arg1->IsString() && !arg1->IsSymbol()) {
    Throws(info, "Second argument must be a string or symbol");
    return;
  }

  LFun fn = LFun::Cast(arg0);
  Isol isolate = info.GetIsolate();

  LStr name;
  if (arg1->IsSymbol()) {
    LSym sym = LSym::Cast(arg1);
    LVal desc = sym->Description(isolate);
    std::string s;
    if (desc->IsString()) {
      LStr desc_str = LStr::Cast(desc);
      v8::String::Utf8Value utf8(isolate, desc_str);
      s = "[";
      s += *utf8;
      s += "]";
    } else {
      s = "";
    }
    name = _String(isolate, s.c_str());
  } else {
    name = LStr::Cast(arg1);
  }

  fn->SetName(name);
  info.GetReturnValue().Set(fn);
}

void ProtoToString(const v8::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1) {
    Throws(info, "Expected at least 1 argument");
    return;
  }

  if (!info[0]->IsFunction()) {
    Throws(info, "Argument must be a function");
    return;
  }
  LVal arg0 = info[0];
  LFun fn = LFun::Cast(arg0);
  Isol isolate = info.GetIsolate();
  LCtx ctx = isolate->GetCurrentContext();
  v8::Local<v8::String> str = fn->FunctionProtoToString(ctx).ToLocalChecked();
  info.GetReturnValue().Set(str);
}

void IsClass(const v8::FunctionCallbackInfo<v8::Value>& info) {
  if (info.Length() < 1) {
    Throws(info, "Expected at least 1 argument");
    return;
  }

  if (!info[0]->IsFunction()) {
    Throws(info, "Argument must be a function");
    return;
  }

  LVal arg0 = info[0];
  LFun func = LFun::Cast(arg0);
  Isol isolate = info.GetIsolate();

  bool is_class = _IsClass(isolate, func);
  info.GetReturnValue().Set(v8::Boolean::New(isolate, is_class));
}
// #endregion

void Init(v8::Local<v8::Object> target) {
  _Set(target, "getFeatures", GetFeatures);
  _Set(target, "getBound", GetBound);
  _Set(target, "getOrigin", GetOrigin);
  _Set(target, "getProxyConfig", GetProxyConfig);
  _Set(target, "setName", SetName);
  _Set(target, "protoToString", ProtoToString);
  _Set(target, "isClass", IsClass);
}

NODE_MODULE(function_feature, Init)

}  // namespace function_feature
