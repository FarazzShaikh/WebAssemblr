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

    memory: new WebAssembly.Memory({ initial: 512 }),
  },
  wasi_snapshot_preview1: {
    proc_exit: function () {},
  },
};

export enum TYPES {
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

interface i_returnType {
  r_type: string;
  r_type_len?: number;
  a_type?: string;
  p_type?: string | string[];
}

type TypedArray = ArrayLike<any> & {
  BYTES_PER_ELEMENT: number;
  set(array: ArrayLike<number>, offset?: number): void;
  slice(start?: number, end?: number): TypedArray;
};
type TypedArrayConstructor<T> = {
  new (): T;
  new (size: number): T;
  new (buffer: ArrayBuffer): T;
  BYTES_PER_ELEMENT: number;
};

export class WASMlr {
  private functions: Record<string, Function>;
  private stack_returnTypes: i_returnType[];

  private memmoryBuffers: Record<string, TypedArray>;

  private malloc: Function;
  private free: Function;

  constructor() {
    this.functions = {};
    this.stack_returnTypes = [];
    this.memmoryBuffers = {};
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
      wasmBytes = require("fs").readFileSync(filepath);
    } else {
      const wasmFile = await fetch(filepath);
      wasmBytes = await wasmFile.arrayBuffer();
    }

    try {
      const instance: WebAssembly.WebAssemblyInstantiatedSource = await WebAssembly.instantiate(
        wasmBytes,
        WASM_CONFIG
      );
      this.free = instance.instance.exports.free as Function;
      this.malloc = instance.instance.exports.malloc as Function;

      const mem: WebAssembly.Memory = instance.instance.exports
        .memory as WebAssembly.Memory;
      this.memmoryBuffers = {
        [TYPES.int8_t]: new Int8Array(mem.buffer), // int8_t
        [TYPES.uint8_t]: new Uint8Array(mem.buffer), // uint8_t
        [TYPES.int16_t]: new Int16Array(mem.buffer), // int16_t
        [TYPES.uint16_t]: new Uint16Array(mem.buffer), // uint16_t
        [TYPES.int32_t]: new Int32Array(mem.buffer), // int32_t
        [TYPES.uint32_t]: new Uint32Array(mem.buffer), // uint32_t
        [TYPES.float]: new Float32Array(mem.buffer), // float
        [TYPES.double]: new Float64Array(mem.buffer), // double
      };

      for (const key in instance.instance.exports) {
        const f = instance.instance.exports[key];
        if (typeof f === "function")
          this.functions[key] = (...args: any[]) => this._call(f, args);
      }
    } catch (error) {
      throw error;
    }
    return this;
  }

  public returns(type: string) {
    this.stack_returnTypes.push({
      r_type: type,
    });
    return this;
  }

  public ofType(arrayType: string) {
    const top = this.stack_returnTypes[this.stack_returnTypes.length - 1];
    if (!top) throw "Please specify a return type to set it's buffer type.";
    top.a_type = arrayType;
    return this;
  }

  public andTakes(paramType: string | string[]) {
    const top = this.stack_returnTypes[this.stack_returnTypes.length - 1];
    if (!top) throw "Please specify a return type to set it's inputs.";
    top.p_type = paramType;
    return this;
  }

  public ofLength(length: number) {
    const top = this.stack_returnTypes[this.stack_returnTypes.length - 1];
    if (!top) throw "Please specify a return type to set it's Length.";
    if (top.r_type !== "array")
      throw 'Length can only be set for return type "array".';
    top.r_type_len = length;
    return this;
  }

  public call(name?: string, args?: any[]) {
    if (name && args) {
      return this.functions[name](...args);
    }
    const top = this.stack_returnTypes[this.stack_returnTypes.length - 1];
    if (!top)
      throw "Please specify a return type for function you want to call";
    return this.functions;
  }

  private _call(f: Function, args: any[]) {
    let top: i_returnType | undefined = this.stack_returnTypes.pop();

    if (top) {
      const retType: string = top.r_type;
      const retLen: number = top.r_type_len || 1;
      const heapType: string = top.a_type || TYPES.int8_t;
      const paramTypes: string | string[] = top.p_type || TYPES.int8_t;

      const params: number[] = [];

      let i = 0;
      for (let arg of args) {
        if (typeof arg === "string") {
          arg = new TextEncoder().encode(arg);
        }
        if (Array.isArray(arg)) {
          let ptr: number | null = null;
          try {
            const p_heapType = Array.isArray(paramTypes)
              ? paramTypes[i]
              : paramTypes;

            const typedArgs: TypedArray = HEAP[p_heapType].from(arg);
            const argLen: number = typedArgs.length;

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

              if (ptr) params.push(ptr);
              params.push(argLen);
            }
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
        return this._decodeUTF8String(heapType, ptr);
      } else if (retType === "array") {
        const ptr = f(...params);
        return this._decodeArray(heapType, ptr, retLen);
      }

      return f(...params);
    } else {
      throw "Return Type not defined";
    }
  }

  private _decodeArray(heapType: string, ptr: number, length?: number): any[] {
    const mem = this.memmoryBuffers[heapType];
    let arr = [];
    for (let i = 0; i < (length || 1); i++) {
      arr.push(mem[ptr / mem.BYTES_PER_ELEMENT + i]);
    }
    return arr;
  }

  private _decodeUTF8String(heapType: string, ptr: number): string {
    const mem = this.memmoryBuffers[heapType];
    let str = "";
    for (let i = 0; mem[ptr + i]; i++) {
      str += String.fromCharCode(mem[ptr / mem.BYTES_PER_ELEMENT + i]);
    }

    return str;
  }
}
