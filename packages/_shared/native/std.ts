// Cached native methods for performance optimization

// # Array
export const $isArray = Array.isArray;
export const $arrayFrom = Array.from;
export const $concat = Array.prototype.concat;
export const $filter = Array.prototype.filter;
export const $push = Array.prototype.push;
export const $slice = Array.prototype.slice;
export const $splice = Array.prototype.splice;

// # Object
export const $fnToString = Function.prototype.toString;
export const $toString = Object.prototype.toString;
export const $ObjectPrototype = Object.prototype;
export const $is = Object.is;
export const $assign = Object.assign;
export const $hasOwn = Object.prototype.hasOwnProperty;
export const $keys = Object.keys as <T>(o: T) => Array<keyof T>;
export const $define = Object.defineProperty;
export const $defines = Object.defineProperties;
export const $entries = Object.entries as <T>(o: T) => Array<[keyof T, T[keyof T]]>;
export const $jsonStringify = JSON.stringify;
export const $getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
export const $freeze = Object.freeze;

// # Reflect

export const $set = Reflect.set;
export const $get = Reflect.get;
export const $has = Reflect.has;
export const $ownKeys = Reflect.ownKeys;
// & Do not use `Object.defineProperty`
export const $reflectDefine = Reflect.defineProperty;
export const $delete = Reflect.deleteProperty;
export const $getPrototypeOf = Reflect.getPrototypeOf;
export const $setPrototypeOf = Reflect.setPrototypeOf;

// # Math and related utilities
export const $max = Math.max;
export const $min = Math.min;
export const $floor = Math.floor;
export const $random = Math.random;
export const $randomInt = (min: number, max: number) => $floor($random() * (max - min + 1)) + min;

// # Number
export const $isNaN = Number.isNaN;
export const $isInt = Number.isInteger;
export const $isSafeInt = Number.isSafeInteger;
export const $isFinite = Number.isFinite;
export const $MAX_INT = Number.MAX_SAFE_INTEGER;
export const $MIN_INT = Number.MIN_SAFE_INTEGER;

export const $isThenable = (o: any): o is Promise<any> => typeof o?.then === 'function';
