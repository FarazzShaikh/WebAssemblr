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
};

export class WASMlr {
  module: Record<string, Function>;

  constructor() {
    this.module = { "": () => {} };
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
      this.module = instance.instance.exports as Record<string, Function>;

      console.log(this.module.c_fact(5));
    } catch (error) {
      console.error(error);
    }
  }
}

(async function () {
  const w = await new WASMlr().init("../../../test/wasm/wasm.wasm");
})();
