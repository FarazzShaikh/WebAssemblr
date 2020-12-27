interface WebAssemblrConfig {
  Module: any;
}

interface HeapMap {
  HEAP8: Int8ArrayConstructor; // int8_t
  HEAPU8: Uint8ArrayConstructor; // uint8_t
  HEAP16: Int16ArrayConstructor; // int16_t
  HEAPU16: Uint16ArrayConstructor; // uint16_t
  HEAP32: Int32ArrayConstructor; // int32_t
  HEAPU32: Uint32ArrayConstructor; // uint32_t
  HEAPF32: Float32ArrayConstructor; // float
  HEAPF64: Float64ArrayConstructor; // double
}

interface CallArrayOptions {
  heapIn?: string;
  heapOut?: string;
  returnArraySize?: number;
}

const CallArrayOptionsDefaults: CallArrayOptions = {
  heapIn: "HEAP8",
  heapOut: "HEAP8",
  returnArraySize: 1,
};

export class WebAssemblr {
  Module: any;
  FUNCS: {};

  c_returnType: string;
  c_options: CallArrayOptions;
  constructor({ Module }: WebAssemblrConfig, funcs?: string[]) {
    this.Module = Module;

    if (funcs) {
      this.FUNCS = {};
      funcs.forEach((f, i) => {
        const func: Function = this.Module[`_${f}`];
        if (func) {
          this.FUNCS[f] = (...args) => this._call(f, args);
        } else {
          throw `No such function - ${f} found for index ${i}`;
        }
      });
    }
  }

  public call() {
    return this.FUNCS;
  }

  public returns(type: string, options: CallArrayOptions) {
    this.c_returnType = type;
    this.c_options = {
      ...CallArrayOptionsDefaults,
      ...options,
    };
    return this;
  }

  private _call(f: string, args: any[]) {
    if (
      args.find((a) => Array.isArray(a)) ||
      this.c_returnType === "array" ||
      this.c_returnType === "string"
    ) {
      if (!this.c_returnType) {
        throw `Please chain WebAssemblr::returns method to specify a return type for argument type array.`;
      }

      const paramTypes: string[] = args.map((param) => {
        if (typeof param === "object") return "array";
        else return typeof param;
      });
      paramTypes.reduce((acc, val) => acc.concat(val), []);

      return this._callArray(
        f,
        this.c_returnType,
        paramTypes,
        args,
        this.c_options
      );
    }
    const func: Function = this.Module[`_${f}`];
    return func(...args);
  }

  private _callArray = (
    func: string,
    returnType: string,
    paramTypes: Array<string> = [],
    params: any[],
    options: CallArrayOptions
  ) => {
    const { heapIn, heapOut, returnArraySize }: CallArrayOptions = options;

    const heapMap: HeapMap = {
      HEAP8: Int8Array, // int8_t
      HEAPU8: Uint8Array, // uint8_t
      HEAP16: Int16Array, // int16_t
      HEAPU16: Uint16Array, // uint16_t
      HEAP32: Int32Array, // int32_t
      HEAPU32: Uint32Array, // uint32_t
      HEAPF32: Float32Array, // float
      HEAPF64: Float64Array, // double
    };

    let res: number;
    let error: Error;
    const returnTypeParam: string =
      returnType == "array" ? "number" : returnType;
    const parameters: any = [];
    const parameterTypes: Array<string> = [];
    const bufs: number[] = [];

    try {
      if (params) {
        for (let p = 0; p < params.length; p++) {
          if (paramTypes[p] == "array" || typeof params[p] === "object") {
            const typedArray = new heapMap[heapIn](params[p].length);

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
      error = e;
    } finally {
      for (let b = 0; b < bufs.length; b++) {
        this.Module._free(bufs[b]);
      }
    }

    if (error) throw error;

    if (returnType == "array") {
      const returnData = [];

      for (let v = 0; v < returnArraySize; v++) {
        returnData.push(
          this.Module[heapOut][res / heapMap[heapOut].BYTES_PER_ELEMENT + v]
        );
      }

      return returnData;
    } else {
      return res;
    }
  };
}
