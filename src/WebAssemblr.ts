/**
 * Config object type
 */
interface WebAssemblrConfig {
  // @type Function
  Module: { [key: string]: unknown };
  funcs?: string[];
  funcAlias?: string[];
}

/**
 * WASM Heap Types
 */
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

/**
 * WASM Heaps
 */
interface HeapMap {
  [key: string]: any;
  HEAP8: Int8ArrayConstructor; // int8_t
  HEAPU8: Uint8ArrayConstructor; // uint8_t
  HEAP16: Int16ArrayConstructor; // int16_t
  HEAPU16: Uint16ArrayConstructor; // uint16_t
  HEAP32: Int32ArrayConstructor; // int32_t
  HEAPU32: Uint32ArrayConstructor; // uint32_t
  HEAPF32: Float32ArrayConstructor; // float
  HEAPF64: Float64ArrayConstructor; // double
}

/**
 * Returns "Array" options type
 */
interface CallArrayOptions {
  [key: string]: unknown;
  heapIn?: string;
  heapOut?: string;
  returnArraySize?: number;
}

/**
 * Returns "Array" options defualts
 */
const CallArrayOptionsDefaults: CallArrayOptions = {
  heapIn: TYPES.int8_t,
  heapOut: TYPES.int8_t,
  returnArraySize: 1,
};

export class WebAssemblr {
  private Module: any;
  private FUNCS: { [name: string]: Function } = {};
  private heapMap: HeapMap;
  private returnType: string = "";
  private options: CallArrayOptions = CallArrayOptionsDefaults;

  constructor() {
    this.heapMap = {
      HEAP8: Int8Array, // int8_t
      HEAPU8: Uint8Array, // uint8_t
      HEAP16: Int16Array, // int16_t
      HEAPU16: Uint16Array, // uint16_t
      HEAP32: Int32Array, // int32_t
      HEAPU32: Uint32Array, // uint32_t
      HEAPF32: Float32Array, // float
      HEAPF64: Float64Array, // double
    };
  }

  /**
   * Initializes an instance of WebAssemblr
   * @param {WebAssemblrConfig} options WebAssemblr Options
   * @param {string[]} funcs Array of exported function names
   * @param {string[]} funcAlias Array of aliases assigned to exported functions
   *
   * @returns {WebAssemblr} An instance of `WebAssemblr`
   */
  public async init(options: WebAssemblrConfig): Promise<WebAssemblr> {
    const { Module, funcs, funcAlias } = options;

    this.Module = await new Promise((resolve, reject) => {
      Module.onRuntimeInitialized = () => {
        resolve(Module);
      };
    });

    if (funcs) {
      this.FUNCS = {};

      for (let i = 0; i < funcs.length; i++) {
        const f = funcs[i];

        let nameAlias: string = f;
        if (funcAlias) {
          nameAlias = funcAlias[i];
        }

        if (this.Module["_" + f]) {
          this.FUNCS[nameAlias] = (...args: any[]) => this._callArray(f, args);
        } else {
          throw `No such function - ${f} found for index ${f}`;
        }
      }
    }

    return this;
  }

  /**
   * Sets a return type.
   * @param {string} type Return type of subsequent function.
   * @param {CallArrayOptions} options Options for IO buffers.
   *
   * @returns An `object` with Exported Fucntions
   */
  public returns(
    type: string,
    options?: CallArrayOptions
  ): { [name: string]: Function } {
    this.returnType = type;
    if (options) {
      for (const key in this.options) {
        this.options[key] = options[key] || CallArrayOptionsDefaults[key];
      }
    }
    return this.FUNCS;
  }

  /**
   * Calls WASM function. Adapted from {@link https://becominghuman.ai/passing-and-returning-webassembly-array-parameters-a0f572c65d97|Dan Ruta on Medium}
   * @param func Function name to be called
   * @param returnType Return time
   * @param paramTypes Types of parameters
   * @param params Function arguments
   * @param options Options for IO buffers.
   * @private
   */
  private _callArray = (f: string, args: any[]) => {
    if (!this.returnType) {
      throw `Please chain WebAssemblr::returns method to specify a return type.`;
    }
    let paramTypes: string[] = [];
    for (const arg of args) {
      if (Array.isArray(arg)) paramTypes.push("array");
      else paramTypes.push(typeof arg);
    }

    const returnType = this.returnType;
    const params = args;
    const func = f;

    const { heapIn, heapOut, returnArraySize }: CallArrayOptions = this.options;

    if (heapIn && heapOut && returnArraySize) {
      let res: number;
      const returnTypeParam: string =
        returnType == "array" ? "number" : returnType;
      const parameters: any = [];
      const parameterTypes: Array<string> = [];
      const bufs: number[] = [];

      try {
        if (params) {
          for (let p = 0; p < params.length; p++) {
            if (paramTypes[p] == "array" || typeof params[p] === "object") {
              const typedArray = new this.heapMap[heapIn](params[p].length);

              for (let i = 0; i < params[p].length; i++) {
                typedArray[i] = params[p][i];
              }

              const buf = this.Module._malloc(
                typedArray.length * typedArray.BYTES_PER_ELEMENT
              );

              switch (heapIn) {
                case "HEAP8":
                case "HEAPU8":
                  this.Module[heapIn].set(typedArray, buf);
                  break;
                case "HEAP16":
                case "HEAPU16":
                  this.Module[heapIn].set(typedArray, buf >> 1);
                  break;
                case "HEAP32":
                case "HEAPU32":
                case "HEAPF32":
                  this.Module[heapIn].set(typedArray, buf >> 2);
                  break;
                case "HEAPF64":
                  this.Module[heapIn].set(typedArray, buf >> 3);
                  break;
              }

              bufs.push(buf);
              parameters.push(buf);
              parameters.push(params[p].length);
              parameterTypes.push("number");
              parameterTypes.push("number");
            } else {
              parameters.push(params[p]);
              parameterTypes.push(
                paramTypes[p] == undefined ? "number" : paramTypes[p]
              );
            }
          }
        }

        res = this.Module.ccall(
          func,
          returnTypeParam,
          parameterTypes,
          parameters
        );
      } catch (e) {
        throw e;
      } finally {
        for (let b = 0; b < bufs.length; b++) {
          this.Module._free(bufs[b]);
        }
      }

      if (returnType == "array") {
        const returnData = [];

        for (let v = 0; v < returnArraySize; v++) {
          returnData.push(
            this.Module[heapOut][
              res / this.heapMap[heapOut].BYTES_PER_ELEMENT + v
            ]
          );
        }

        return returnData;
      } else {
        return res;
      }
    }
  };
}
