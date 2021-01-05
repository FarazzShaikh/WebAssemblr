import { typeError } from "./error.js";
import { createWriteBuffer, putBlob, getBlob, putArrHeader, getArrHeader, putMapHeader, getMapHeader, getRaw, } from "./buffer.js";
import { posFixintTag, isPosFixintTag, readPosFixint, negFixintTag, isNegFixintTag, readNegFixint, fixstrTag, isFixstrTag, isFixarrayTag, isFixmapTag, } from "./tags.js";
export const Any = {
    enc(buf, v) {
        typeOf(v).enc(buf, v);
    },
    dec(buf) {
        return tagType(buf.peek()).dec(buf);
    },
};
export const Nil = {
    enc(buf, v) {
        buf.putUi8(192 /* Nil */);
    },
    dec(buf) {
        const tag = buf.getUi8();
        if (tag !== 192 /* Nil */) {
            typeError(tag, "nil");
        }
        return null;
    },
};
export const Bool = {
    enc(buf, v) {
        buf.putUi8(v ? 195 /* True */ : 194 /* False */);
    },
    dec(buf) {
        const tag = buf.getUi8();
        switch (tag) {
            case 192 /* Nil */:
            case 194 /* False */:
                return false;
            case 195 /* True */:
                return true;
            default:
                typeError(tag, "bool");
        }
    },
};
export const Int = {
    enc(buf, v) {
        if (-128 <= v && v <= 127) {
            if (v >= 0) {
                buf.putUi8(posFixintTag(v));
            }
            else if (v > -32) {
                buf.putUi8(negFixintTag(v));
            }
            else {
                buf.putUi8(208 /* Int8 */);
                buf.putUi8(v);
            }
        }
        else if (-32768 <= v && v <= 32767) {
            buf.putI8(209 /* Int16 */);
            buf.putI16(v);
        }
        else if (-2147483648 <= v && v <= 2147483647) {
            buf.putI8(210 /* Int32 */);
            buf.putI32(v);
        }
        else {
            buf.putI8(211 /* Int64 */);
            buf.putI64(v);
        }
    },
    dec(buf) {
        const tag = buf.getUi8();
        if (isPosFixintTag(tag)) {
            return readPosFixint(tag);
        }
        else if (isNegFixintTag(tag)) {
            return readNegFixint(tag);
        }
        switch (tag) {
            case 192 /* Nil */:
                return 0;
            // signed int types
            case 208 /* Int8 */:
                return buf.getI8();
            case 209 /* Int16 */:
                return buf.getI16();
            case 210 /* Int32 */:
                return buf.getI32();
            case 211 /* Int64 */:
                return buf.getI64();
            // unsigned int types
            case 204 /* Uint8 */:
                return buf.getUi8();
            case 205 /* Uint16 */:
                return buf.getUi16();
            case 206 /* Uint32 */:
                return buf.getUi32();
            case 207 /* Uint64 */:
                return buf.getUi64();
            default:
                typeError(tag, "int");
        }
    },
};
export const Uint = {
    enc(buf, v) {
        if (v < 0) {
            throw new Error(`not an uint: ${v}`);
        }
        else if (v <= 127) {
            buf.putUi8(posFixintTag(v));
        }
        else if (v <= 255) {
            buf.putUi8(204 /* Uint8 */);
            buf.putUi8(v);
        }
        else if (v <= 65535) {
            buf.putUi8(205 /* Uint16 */);
            buf.putUi16(v);
        }
        else if (v <= 4294967295) {
            buf.putUi8(206 /* Uint32 */);
            buf.putUi32(v);
        }
        else {
            buf.putUi8(207 /* Uint64 */);
            buf.putUi64(v);
        }
    },
    dec(buf) {
        const v = Int.dec(buf);
        if (v < 0) {
            throw new RangeError("uint underflow");
        }
        return v;
    },
};
export const Float = {
    enc(buf, v) {
        buf.putUi8(203 /* Float64 */);
        buf.putF(v);
    },
    dec(buf) {
        const tag = buf.getUi8();
        switch (tag) {
            case 192 /* Nil */:
                return 0;
            case 202 /* Float32 */:
                return buf.getF32();
            case 203 /* Float64 */:
                return buf.getF64();
            default:
                typeError(tag, "float");
        }
    },
};
export const Bytes = {
    enc(buf, v) {
        putBlob(buf, v, 196 /* Bin8 */);
    },
    dec: getBlob,
};
export const Str = {
    enc(buf, v) {
        const utf8 = toUTF8(v);
        if (utf8.byteLength < 32) {
            buf.putUi8(fixstrTag(utf8.byteLength));
            buf.put(utf8);
        }
        else {
            putBlob(buf, utf8, 217 /* Str8 */);
        }
    },
    dec(buf) {
        return fromUTF8(getBlob(buf));
    },
};
export const Raw = {
    enc(buf, v) {
        buf.put(v);
    },
    dec(buf) {
        const res = createWriteBuffer();
        getRaw(buf, res);
        const arr = res.ui8array();
        return arr.buffer.slice(0, arr.length);
    },
};
export const Time = {
    enc(buf, v) {
        const ms = v.getTime();
        buf.putUi8(199 /* Ext8 */);
        buf.putUi8(12);
        buf.putI8(-1);
        buf.putUi32((ms % 1000) * 1000000);
        buf.putI64(ms / 1000);
    },
    dec(buf) {
        const tag = buf.getUi8();
        switch (tag) {
            case 214 /* FixExt4 */: // 32-bit seconds
                if (buf.getI8() === -1) {
                    return new Date(buf.getUi32() * 1000);
                }
                break;
            case 215 /* FixExt8 */: // 34-bit seconds + 30-bit nanoseconds
                if (buf.getI8() === -1) {
                    const lo = buf.getUi32();
                    const hi = buf.getUi32();
                    // seconds: hi + (lo&0x3)*0x100000000
                    // nanoseconds: lo>>2 == lo/4
                    return new Date((hi + (lo & 0x3) * 0x100000000) * 1000 + lo / 4000000);
                }
                break;
            case 199 /* Ext8 */: // 64-bit seconds + 32-bit nanoseconds
                if (buf.getUi8() === 12 && buf.getI8() === -1) {
                    const ns = buf.getUi32();
                    const s = buf.getI64();
                    return new Date(s * 1000 + ns / 1000000);
                }
                break;
        }
        typeError(tag, "time");
    },
};
export const Arr = TypedArr(Any);
export const Map = TypedMap(Any, Any);
export function TypedArr(valueT) {
    return {
        encHeader: putArrHeader,
        decHeader: getArrHeader,
        enc(buf, v) {
            putArrHeader(buf, v.length);
            v.forEach((x) => valueT.enc(buf, x));
        },
        dec(buf) {
            const res = [];
            for (let n = getArrHeader(buf); n > 0; --n) {
                res.push(valueT.dec(buf));
            }
            return res;
        },
    };
}
export function TypedMap(keyT, valueT) {
    return {
        encHeader: putMapHeader,
        decHeader: getMapHeader,
        enc(buf, v) {
            const props = Object.keys(v);
            putMapHeader(buf, props.length);
            props.forEach((p) => {
                keyT.enc(buf, p);
                valueT.enc(buf, v[p]);
            });
        },
        dec(buf) {
            const res = {};
            for (let n = getMapHeader(buf); n > 0; --n) {
                const k = keyT.dec(buf);
                res[k] = valueT.dec(buf);
            }
            return res;
        },
    };
}
export function structEncoder(fields) {
    const ordinals = Object.keys(fields);
    return (buf, v) => {
        putMapHeader(buf, ordinals.length);
        ordinals.forEach((ord) => {
            const f = fields[ord];
            Int.enc(buf, Number(ord));
            f[1].enc(buf, v[f[0]]);
        });
    };
}
export function structDecoder(fields) {
    return (buf) => {
        const res = {};
        for (let n = getMapHeader(buf); n > 0; --n) {
            const f = fields[Int.dec(buf)];
            if (f) {
                res[f[0]] = f[1].dec(buf);
            }
            else {
                Any.dec(buf);
            }
        }
        return res;
    };
}
export function Struct(fields) {
    return {
        enc: structEncoder(fields),
        dec: structDecoder(fields),
    };
}
export function unionEncoder(branches) {
    return (buf, v) => {
        putArrHeader(buf, 2);
        const ord = branches.ordinalOf(v);
        Int.enc(buf, ord);
        branches[ord].enc(buf, v);
    };
}
export function unionDecoder(branches) {
    return (buf) => {
        getArrHeader(buf, 2);
        const t = branches[Int.dec(buf)];
        if (!t) {
            throw new TypeError("invalid union type");
        }
        return t.dec(buf);
    };
}
export function Union(branches) {
    return {
        enc: unionEncoder(branches),
        dec: unionDecoder(branches),
    };
}
function toUTF8(v) {
    const n = v.length;
    const bin = new Uint8Array(4 * n);
    let pos = 0, i = 0, c;
    while (i < n) {
        c = v.charCodeAt(i++);
        if ((c & 0xfc00) === 0xd800) {
            c = (c << 10) + v.charCodeAt(i++) - 0x35fdc00;
        }
        if (c < 0x80) {
            bin[pos++] = c;
        }
        else if (c < 0x800) {
            bin[pos++] = 0xc0 + (c >> 6);
            bin[pos++] = 0x80 + (c & 0x3f);
        }
        else if (c < 0x10000) {
            bin[pos++] = 0xe0 + (c >> 12);
            bin[pos++] = 0x80 + ((c >> 6) & 0x3f);
            bin[pos++] = 0x80 + (c & 0x3f);
        }
        else {
            bin[pos++] = 0xf0 + (c >> 18);
            bin[pos++] = 0x80 + ((c >> 12) & 0x3f);
            bin[pos++] = 0x80 + ((c >> 6) & 0x3f);
            bin[pos++] = 0x80 + (c & 0x3f);
        }
    }
    return bin.buffer.slice(0, pos);
}
function fromUTF8(buf) {
    return new TextDecoder("utf-8").decode(buf);
}
function typeOf(v) {
    switch (typeof v) {
        case "undefined":
            return Nil;
        case "boolean":
            return Bool;
        case "number":
            return !isFinite(v) || Math.floor(v) !== v ? Float : v < 0 ? Int : Uint;
        case "string":
            return Str;
        case "object":
            return v === null
                ? Nil
                : Array.isArray(v)
                    ? Arr
                    : v instanceof Uint8Array || v instanceof ArrayBuffer
                        ? Bytes
                        : v instanceof Date
                            ? Time
                            : Map;
        default:
            throw new TypeError(`unsupported type ${typeof v}`);
    }
}
function tagType(tag) {
    switch (tag) {
        case 192 /* Nil */:
            return Nil;
        case 194 /* False */:
        case 195 /* True */:
            return Bool;
        case 208 /* Int8 */:
        case 209 /* Int16 */:
        case 210 /* Int32 */:
        case 211 /* Int64 */:
            return Int;
        case 204 /* Uint8 */:
        case 205 /* Uint16 */:
        case 206 /* Uint32 */:
        case 207 /* Uint64 */:
            return Uint;
        case 202 /* Float32 */:
        case 203 /* Float64 */:
            return Float;
        case 196 /* Bin8 */:
        case 197 /* Bin16 */:
        case 198 /* Bin32 */:
            return Bytes;
        case 217 /* Str8 */:
        case 218 /* Str16 */:
        case 219 /* Str32 */:
            return Str;
        case 220 /* Array16 */:
        case 221 /* Array32 */:
            return Arr;
        case 222 /* Map16 */:
        case 223 /* Map32 */:
            return Map;
        case 214 /* FixExt4 */:
        case 215 /* FixExt8 */:
        case 199 /* Ext8 */:
            return Time;
        default:
            if (isPosFixintTag(tag) || isNegFixintTag(tag)) {
                return Int;
            }
            if (isFixstrTag(tag)) {
                return Str;
            }
            if (isFixarrayTag(tag)) {
                return Arr;
            }
            if (isFixmapTag(tag)) {
                return Map;
            }
            throw new TypeError(`unsupported tag ${tag}`);
    }
}
