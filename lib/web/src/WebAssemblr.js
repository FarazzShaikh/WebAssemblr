import * as msgPack from "../utils/msgPack/index.js";
const WASM_CONFIG = {
    env: {
        memory: new WebAssembly.Memory({ initial: 512 }),
    },
    wasi_snapshot_preview1: {
        proc_exit: function () { },
        fd_close: function () { },
        fd_write: function () { },
        fd_seek: function () { },
    },
};
export const TYPES = {
    int8_t: "HEAP8",
    uint8_t: "HEAPU8",
    int16_t: "HEAP16",
    uint16_t: "HEAPU16",
    int32_t: "HEAP32",
    uint32_t: "HEAPU32",
    float: "HEAPF32",
    double: "HEAPF64",
};
const HEAP = {
    [TYPES.int8_t]: Int8Array,
    [TYPES.uint8_t]: Uint8Array,
    [TYPES.int16_t]: Int16Array,
    [TYPES.uint16_t]: Uint16Array,
    [TYPES.int32_t]: Int32Array,
    [TYPES.uint32_t]: Uint32Array,
    [TYPES.float]: Float32Array,
    [TYPES.double]: Float64Array,
};
export class WASMlr {
    constructor() {
        this.functions = {};
        this.stack_returnTypes = [];
        this.memmoryBuffers = {};
    }
    async init(filepath) {
        const ENV_NDOE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
        let wasmBytes;
        if (ENV_NDOE) {
            wasmBytes = require("fs").readFileSync(filepath);
        }
        else {
            const wasmFile = await fetch(filepath);
            wasmBytes = await wasmFile.arrayBuffer();
        }
        try {
            const instance = await WebAssembly.instantiate(wasmBytes, WASM_CONFIG);
            this.free = instance.instance.exports.free;
            this.malloc = instance.instance.exports.malloc;
            const mem = instance.instance.exports.memory;
            this.memmoryBuffers = {
                [TYPES.int8_t]: new Int8Array(mem.buffer),
                [TYPES.uint8_t]: new Uint8Array(mem.buffer),
                [TYPES.int16_t]: new Int16Array(mem.buffer),
                [TYPES.uint16_t]: new Uint16Array(mem.buffer),
                [TYPES.int32_t]: new Int32Array(mem.buffer),
                [TYPES.uint32_t]: new Uint32Array(mem.buffer),
                [TYPES.float]: new Float32Array(mem.buffer),
                [TYPES.double]: new Float64Array(mem.buffer),
            };
            for (const key in instance.instance.exports) {
                const f = instance.instance.exports[key];
                if (typeof f === "function")
                    this.functions[key] = (...args) => this._call(f, args);
            }
        }
        catch (error) {
            throw error;
        }
        return this;
    }
    returns(type) {
        this.stack_returnTypes.push({
            r_type: type,
        });
        return this;
    }
    ofType(arrayType) {
        const top = this.stack_returnTypes[this.stack_returnTypes.length - 1];
        if (!top)
            throw "Please specify a return type to set it's buffer type.";
        top.a_type = arrayType;
        return this;
    }
    andTakes(paramType) {
        const top = this.stack_returnTypes[this.stack_returnTypes.length - 1];
        if (!top)
            throw "Please specify a return type to set it's inputs.";
        top.p_type = paramType;
        return this;
    }
    ofLength(length) {
        const top = this.stack_returnTypes[this.stack_returnTypes.length - 1];
        if (!top)
            throw "Please specify a return type to set it's Length.";
        if (top.r_type !== "array")
            throw 'Length can only be set for return type "array".';
        top.r_type_len = length;
        return this;
    }
    call(name, args) {
        if (name && args) {
            return this.functions[name](...args);
        }
        const top = this.stack_returnTypes[this.stack_returnTypes.length - 1];
        if (!top)
            throw "Please specify a return type for function you want to call";
        return this.functions;
    }
    _call(f, args) {
        let top = this.stack_returnTypes.pop();
        if (top) {
            const retType = top.r_type;
            const retLen = top.r_type_len || 1;
            const heapType = top.a_type || TYPES.int8_t;
            const paramTypes = top.p_type || TYPES.int8_t;
            const params = [];
            let i = 0;
            for (let arg of args) {
                if (typeof arg === "string") {
                    arg = new TextEncoder().encode(arg);
                }
                if (Array.isArray(arg)) {
                    let ptr = null;
                    try {
                        const p_heapType = Array.isArray(paramTypes) ? paramTypes[i] : paramTypes;
                        const typedArgs = HEAP[p_heapType].from(arg);
                        const argLen = typedArgs.length;
                        ptr = this.malloc(typedArgs.length * typedArgs.BYTES_PER_ELEMENT);
                        const mem = this.memmoryBuffers[p_heapType];
                        if (ptr) {
                            switch (p_heapType) {
                                case TYPES.int8_t:
                                case TYPES.uint8_t:
                                    mem.set(typedArgs, ptr);
                                case TYPES.int16_t:
                                case TYPES.uint16_t:
                                    mem.set(typedArgs, ptr >> 1);
                                    break;
                                case TYPES.int32_t:
                                case TYPES.uint32_t:
                                case TYPES.float:
                                    mem.set(typedArgs, ptr >> 2);
                                    break;
                                case TYPES.double:
                                    mem.set(typedArgs, ptr >> 3);
                                    break;
                            }
                            if (ptr)
                                params.push(ptr);
                            params.push(argLen);
                        }
                    }
                    catch (error) {
                        throw error;
                    }
                    finally {
                        if (ptr) {
                            this.free(ptr);
                        }
                    }
                }
                else if (typeof arg === "object") {
                    const packed = msgPack.encode(arg);
                    var ptr = this.malloc(packed.length);
                    var bytes_per_element = packed.BYTES_PER_ELEMENT;
                    this.memmoryBuffers[TYPES.int8_t].set(packed, ptr / bytes_per_element);
                    params.push(ptr);
                    params.push(packed.length);
                }
                else if (typeof arg === "number") {
                    params.push(arg);
                }
            }
            if (retType === "string") {
                const ptr = f(...params);
                return this._decodeUTF8String(heapType, ptr);
            }
            else if (retType === "array") {
                const ptr = f(...params);
                return this._decodeArray(heapType, ptr, retLen);
            }
            else if (retType === "object") {
                const addressPtr = f(...params);
                const addressData = new Uint8Array(this.memmoryBuffers[heapType].slice(addressPtr, addressPtr + (addressPtr >> 2)));
                this.free(addressPtr);
                return msgPack.decode(addressData);
            }
            return f(...params);
        }
        else {
            throw "Return Type not defined";
        }
    }
    _decodeArray(heapType, ptr, length) {
        const mem = this.memmoryBuffers[heapType];
        let arr = [];
        for (let i = 0; i < (length || 1); i++) {
            arr.push(mem[ptr / mem.BYTES_PER_ELEMENT + i]);
        }
        return arr;
    }
    _decodeUTF8String(heapType, ptr) {
        const mem = this.memmoryBuffers[heapType];
        let str = "";
        for (let i = 0; mem[ptr + i]; i++) {
            str += String.fromCharCode(mem[ptr / mem.BYTES_PER_ELEMENT + i]);
        }
        return str;
    }
}
