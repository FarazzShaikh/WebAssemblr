import { type } from "os";

type t_genericObj_functions = { [key: string]: Function };
type t_genericObj_object = { [key: string]: {} };

const WASM_CONFIG: t_genericObj_object = {
  env: {
    DYNAMICTOP_PTR: 0,
    STACKTOP: 0,
    STACK_MAX: 0,
    abort: function () {},
    enlargeMemory: function () {},
    getTotalMemory: function () {},
    abortOnCannotGrowMemory: function () {},
    ___lock: function () {},
    ___syscall6: function () {},
    ___setErrNo: function () {},
    ___syscall140: function () {},
    _emscripten_memcpy_big: function () {},
    ___syscall54: function () {},
    ___unlock: function () {},
    ___syscall146: function () {},
    emscripten_resize_heap: function () {},

    memory: new WebAssembly.Memory({ initial: 256, maximum: 256 }),
    table: new WebAssembly.Table({
      initial: 6,
      element: "anyfunc",
      maximum: 6,
    }),
    memoryBase: 0,
    tableBase: 0,
  },
  wasi_snapshot_preview1: {
    proc_exit: function () {},
  },
};

enum TYPES {
  int8_t = "HEAP8",
  uint8_t = "HEAPU8",
  int16_t = "HEAP16",
  uint16_t = "HEAPU16",
  int32_t = "HEAP32",
  uint32_t = "HEAPU32",
  float = "HEAPF32",
  double = "HEAPF64",
}

const HEAP: { [key: string]: any } = {
  [TYPES.int8_t]: Int8Array, // int8_t
  [TYPES.uint8_t]: Uint8Array, // uint8_t
  [TYPES.int16_t]: Int16Array, // int16_t
  [TYPES.uint16_t]: Uint16Array, // uint16_t
  [TYPES.int32_t]: Int32Array, // int32_t
  [TYPES.uint32_t]: Uint32Array, // uint32_t
  [TYPES.float]: Float32Array, // float
  [TYPES.double]: Float64Array, // double
};

export class WASMlr {
  private functions: Record<string, Function>;
  private stack_returnTypes: string[];
  private memory: WebAssembly.Memory;

  private malloc: Function;
  private free: Function;

  constructor() {
    this.functions = {};
    this.stack_returnTypes = [];
  }

  public async init(filepath: string) {
    const ENV_NDOE: boolean =
      typeof process === "object" &&
      typeof process.versions === "object" &&
      typeof process.versions.node === "string";

    let fs: t_genericObj_functions;
    let path: t_genericObj_functions;

    let wasmBytes: BufferSource;

    if (ENV_NDOE) {
      fs = require("fs");
      path = require("path");

      const wasmPath: string = path.resolve(__dirname, filepath);
      wasmBytes = fs.readFileSync(wasmPath);
    } else {
      const wasmFile = await fetch(filepath);
      wasmBytes = await wasmFile.arrayBuffer();
    }

    try {
      const instance: WebAssembly.WebAssemblyInstantiatedSource = await WebAssembly.instantiate(
        wasmBytes,
        WASM_CONFIG
      );
      console.log(instance.instance.exports);
      this.free = instance.instance.exports.free as Function;
      this.malloc = instance.instance.exports.malloc as Function;
      this.memory = instance.instance.exports.memory as WebAssembly.Memory;
      for (const key in instance.instance.exports) {
        const f = instance.instance.exports[key];
        if (typeof f === "function")
          this.functions[key] = (...args: any[]) => this._call(f, args);
      }
    } catch (error) {
      console.error(error);
    }
    return this;
  }

  public returns(type: string): Record<string, Function> {
    this.stack_returnTypes.push(type);
    return this.functions;
  }

  private _call(f: Function, args: any[]) {
    const retType: string | undefined = this.stack_returnTypes.pop();

    const params: number[] = [];

    for (const arg of args) {
      if (Array.isArray(arg)) {
        let ptr: number | null = null;
        try {
          const typedArgs: typeof HEAP[TYPES.int8_t] = HEAP[TYPES.int8_t].from(
            arg
          );
          const argLen: number = typedArgs.length;
          ptr = this.malloc(typedArgs.length * typedArgs.BYTES_PER_ELEMENT);
          const mem: typeof HEAP[TYPES.int8_t] = new HEAP[TYPES.int8_t](
            this.memory.buffer,
            ptr,
            argLen
          );
          mem.set(typedArgs);

          if (ptr) params.push(ptr);
          params.push(argLen);
        } catch (error) {
          throw error;
        } finally {
          if (ptr) {
            this.free(ptr);
          }
        }
      } else if (typeof arg === "number") {
        params.push(arg);
      }
    }

    if (retType === "string") {
      const ptr = f(...params);
      return this._decodeUTF8String(ptr);
    } else if (retType === "array") {
      const ptr = f(...params);
      return this._decodeArray(ptr, 3);
    }

    return f(...args);
  }

  private _decodeArray(ptr: number, length?: number): any[] {
    const mem = new HEAP[TYPES.int8_t](this.memory.buffer);

    let arr = [];
    for (let i = 0; i < (length || 1); i++) {
      arr.push(mem[ptr + i]);
    }
    return arr;
  }

  private _decodeUTF8String(ptr: number): string {
    const mem = new HEAP[TYPES.int8_t](this.memory.buffer);

    let str = "";
    for (let i = 0; mem[ptr + i]; i++) {
      str += String.fromCharCode(mem[ptr + i]);
    }

    return str;
  }
}

(async function () {
  const w = await new WASMlr().init("../../../test/wasm/wasm.wasm");

  console.log(w.returns("array").cpp_doubleArray([4, 5, 6]));
})();
