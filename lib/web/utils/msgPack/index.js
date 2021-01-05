import { Nil, Bool, Int, Uint, Float, Bytes, Str, TypedArr, TypedMap, Time, Any, Arr, Map, Struct, Union, structEncoder, structDecoder, unionEncoder, unionDecoder, } from "./types.js";
import { createWriteBuffer, createReadBuffer, } from "./buffer.js";
export { Nil, Bool, Int, Uint, Float, Bytes, Str, TypedArr, TypedMap, Time, Any, Arr, Map, Struct, Union, structEncoder, structDecoder, unionEncoder, unionDecoder, encode, decode, };
function encode(v, typ) {
    const buf = createWriteBuffer();
    (typ || Any).enc(buf, v);
    return buf.ui8array();
}
function decode(buf, typ) {
    return (typ || Any).dec(createReadBuffer(buf));
}
