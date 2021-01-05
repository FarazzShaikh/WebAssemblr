import { Type, Collection, Obj, Nil, Bool, Int, Uint, Float, Bytes, Str, TypedArr, TypedMap, Time, Any, Arr, Map, Struct, Union, structEncoder, structDecoder, unionEncoder, unionDecoder } from "./types";
import { WriteBuffer, ReadBuffer } from "./buffer";
export { WriteBuffer, ReadBuffer, Type, Collection, Obj, Nil, Bool, Int, Uint, Float, Bytes, Str, TypedArr, TypedMap, Time, Any, Arr, Map, Struct, Union, structEncoder, structDecoder, unionEncoder, unionDecoder, encode, decode, };
declare function encode<T>(v: T, typ?: Type<T>): Uint8Array;
declare function decode<T>(buf: BufferSource, typ?: Type<T>): T;
