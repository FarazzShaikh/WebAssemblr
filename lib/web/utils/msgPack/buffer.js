import { typeError } from "./error.js";
import { isPosFixintTag, isNegFixintTag, fixarrayTag, isFixarrayTag, readFixarray, fixmapTag, isFixmapTag, readFixmap, isFixstrTag, readFixstr, } from "./tags.js";
export function createWriteBuffer() {
    let view = new DataView(new ArrayBuffer(64));
    let n = 0;
    function need(x) {
        if (n + x > view.byteLength) {
            const arr = new Uint8Array(Math.max(n + x, view.byteLength + 64));
            arr.set(new Uint8Array(view.buffer.slice(0, n)));
            view = new DataView(arr.buffer);
        }
    }
    return {
        put(v) {
            need(v.byteLength);
            (new Uint8Array(view.buffer)).set(new Uint8Array(v), n);
            n += v.byteLength;
        },
        putI8(v) {
            need(1);
            view.setInt8(n, v);
            ++n;
        },
        putI16(v) {
            need(2);
            view.setInt16(n, v);
            n += 2;
        },
        putI32(v) {
            need(4);
            view.setInt32(n, v);
            n += 4;
        },
        putI64(v) {
            need(8);
            const neg = v < 0;
            if (neg) {
                v = -v;
            }
            let hi = (v / 0x100000000) | 0;
            let lo = (v % 0x100000000) | 0;
            if (neg) {
                // 2s complement
                lo = (~lo + 1) | 0;
                hi = lo === 0 ? (~hi + 1) | 0 : ~hi;
            }
            view.setUint32(n, hi);
            view.setUint32(n + 4, lo);
            n += 8;
        },
        putUi8(v) {
            need(1);
            view.setUint8(n, v);
            ++n;
        },
        putUi16(v) {
            need(2);
            view.setUint16(n, v);
            n += 2;
        },
        putUi32(v) {
            need(4);
            view.setUint32(n, v);
            n += 4;
        },
        putUi64(v) {
            need(8);
            view.setUint32(n, (v / 0x100000000) | 0);
            view.setUint32(n + 4, v % 0x100000000);
            n += 8;
        },
        putF(v) {
            need(8);
            view.setFloat64(n, v);
            n += 8;
        },
        ui8array() {
            return new Uint8Array(view.buffer.slice(0, n));
        },
    };
}
export function createReadBuffer(buf) {
    let view = ArrayBuffer.isView(buf) ? new DataView(buf.buffer, buf.byteOffset, buf.byteLength) : new DataView(buf);
    let n = 0;
    return {
        peek() {
            return view.getUint8(n);
        },
        get(len) {
            n += len;
            const off = view.byteOffset;
            return view.buffer.slice(off + n - len, off + n);
        },
        getI8() {
            return view.getInt8(n++);
        },
        getI16() {
            n += 2;
            return view.getInt16(n - 2);
        },
        getI32() {
            n += 4;
            return view.getInt32(n - 4);
        },
        getI64() {
            n += 8;
            const hi = view.getInt32(n - 8);
            const lo = view.getUint32(n - 4);
            return hi * 0x100000000 + lo;
        },
        getUi8() {
            return view.getUint8(n++);
        },
        getUi16() {
            n += 2;
            return view.getUint16(n - 2);
        },
        getUi32() {
            n += 4;
            return view.getUint32(n - 4);
        },
        getUi64() {
            n += 8;
            const hi = view.getUint32(n - 8);
            const lo = view.getUint32(n - 4);
            return hi * 0x100000000 + lo;
        },
        getF32() {
            n += 4;
            return view.getFloat32(n - 4);
        },
        getF64() {
            n += 8;
            return view.getFloat64(n - 8);
        },
    };
}
export function putBlob(buf, blob, baseTag) {
    const n = blob.byteLength;
    if (n <= 255) {
        buf.putUi8(baseTag);
        buf.putUi8(n);
    }
    else if (n <= 65535) {
        buf.putUi8(baseTag + 1);
        buf.putUi16(n);
    }
    else if (n <= 4294967295) {
        buf.putUi8(baseTag + 2);
        buf.putUi32(n);
    }
    else {
        throw new RangeError("length limit exceeded");
    }
    buf.put(blob);
}
export function getBlob(buf) {
    const tag = buf.getUi8();
    let n;
    switch (tag) {
        case 192 /* Nil */:
            n = 0;
            break;
        case 196 /* Bin8 */:
        case 217 /* Str8 */:
            n = buf.getUi8();
            break;
        case 197 /* Bin16 */:
        case 218 /* Str16 */:
            n = buf.getUi16();
            break;
        case 198 /* Bin32 */:
        case 219 /* Str32 */:
            n = buf.getUi32();
            break;
        default:
            if (!isFixstrTag(tag)) {
                typeError(tag, "bytes or string");
            }
            n = readFixstr(tag);
    }
    return buf.get(n);
}
export function putArrHeader(buf, n) {
    if (n < 16) {
        buf.putUi8(fixarrayTag(n));
    }
    else {
        putCollectionHeader(buf, 220 /* Array16 */, n);
    }
}
export function getArrHeader(buf, expect) {
    const tag = buf.getUi8();
    const n = isFixarrayTag(tag)
        ? readFixarray(tag)
        : getCollectionHeader(buf, tag, 220 /* Array16 */, "array");
    if (expect != null && n !== expect) {
        throw new Error(`invalid array header size ${n}`);
    }
    return n;
}
export function putMapHeader(buf, n) {
    if (n < 16) {
        buf.putUi8(fixmapTag(n));
    }
    else {
        putCollectionHeader(buf, 222 /* Map16 */, n);
    }
}
export function getMapHeader(buf, expect) {
    const tag = buf.getUi8();
    const n = isFixmapTag(tag)
        ? readFixmap(tag)
        : getCollectionHeader(buf, tag, 222 /* Map16 */, "map");
    if (expect != null && n !== expect) {
        throw new Error(`invalid map header size ${n}`);
    }
    return n;
}
function putCollectionHeader(buf, baseTag, n) {
    if (n <= 65535) {
        buf.putUi8(baseTag);
        buf.putUi16(n);
    }
    else if (n <= 4294967295) {
        buf.putUi8(baseTag + 1);
        buf.putUi32(n);
    }
    else {
        throw new RangeError("length limit exceeded");
    }
}
function getCollectionHeader(buf, tag, baseTag, typename) {
    switch (tag) {
        case 192 /* Nil */:
            return 0;
        case baseTag: // 16 bit
            return buf.getUi16();
        case baseTag + 1: // 32 bit
            return buf.getUi32();
        default:
            typeError(tag, typename);
    }
}
export function getRaw(buf, res) {
    let n;
    const tag = buf.getUi8();
    res.putUi8(tag);
    switch (tag) {
        case 192 /* Nil */:
        case 194 /* False */:
        case 195 /* True */:
            break;
        case 208 /* Int8 */:
        case 204 /* Uint8 */:
            res.putUi8(buf.getUi8());
            break;
        case 209 /* Int16 */:
        case 205 /* Uint16 */:
            res.putUi16(buf.getUi16());
            break;
        case 210 /* Int32 */:
        case 206 /* Uint32 */:
        case 202 /* Float32 */:
            res.putUi32(buf.getUi32());
            break;
        case 211 /* Int64 */:
        case 207 /* Uint64 */:
        case 203 /* Float64 */:
            res.putUi64(buf.getUi64());
            break;
        case 217 /* Str8 */:
        case 196 /* Bin8 */:
            res.putUi8(n = buf.getUi8());
            res.put(buf.get(n));
            break;
        case 218 /* Str16 */:
        case 197 /* Bin16 */:
            res.putUi16(n = buf.getUi16());
            res.put(buf.get(n));
            break;
        case 219 /* Str32 */:
        case 198 /* Bin32 */:
            res.putUi32(n = buf.getUi32());
            res.put(buf.get(n));
            break;
        case 220 /* Array16 */:
            res.putUi16(n = buf.getUi16());
            for (let i = 0; i < n; ++i) {
                getRaw(buf, res);
            }
            break;
        case 221 /* Array32 */:
            res.putUi32(n = buf.getUi32());
            for (let i = 0; i < n; ++i) {
                getRaw(buf, res);
            }
            break;
        case 222 /* Map16 */:
            res.putUi16(n = buf.getUi16());
            for (let i = 0; i < 2 * n; ++i) {
                getRaw(buf, res);
            }
            break;
        case 223 /* Map32 */:
            res.putUi32(n = buf.getUi32());
            for (let i = 0; i < 2 * n; ++i) {
                getRaw(buf, res);
            }
            break;
        case 212 /* FixExt1 */:
            res.put(buf.get(2));
            break;
        case 213 /* FixExt2 */:
            res.put(buf.get(3));
            break;
        case 214 /* FixExt4 */:
            res.put(buf.get(5));
            break;
        case 215 /* FixExt8 */:
            res.put(buf.get(9));
            break;
        case 216 /* FixExt16 */:
            res.put(buf.get(17));
            break;
        case 199 /* Ext8 */:
            res.putUi8(n = buf.getUi8());
            res.put(buf.get(1 + n));
            break;
        case 200 /* Ext16 */:
            res.putUi16(n = buf.getUi16());
            res.put(buf.get(1 + n));
            break;
        case 201 /* Ext32 */:
            res.putUi32(n = buf.getUi32());
            res.put(buf.get(1 + n));
            break;
        default:
            if (isPosFixintTag(tag) || isNegFixintTag(tag)) {
                // do nothing
            }
            else if (isFixstrTag(tag)) {
                res.put(buf.get(readFixstr(tag)));
            }
            else if (isFixarrayTag(tag)) {
                n = readFixarray(tag);
                for (let i = 0; i < n; ++i) {
                    getRaw(buf, res);
                }
            }
            else if (isFixmapTag(tag)) {
                n = 2 * readFixmap(tag);
                for (let i = 0; i < n; ++i) {
                    getRaw(buf, res);
                }
            }
            else {
                throw new TypeError(`unknown tag 0x${tag.toString(16)}`);
            }
    }
}
