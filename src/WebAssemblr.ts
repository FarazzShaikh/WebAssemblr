/*

 __/\\\______________/\\\_____/\\\\\\\\\________/\\\\\\\\\\\____/\\\\____________/\\\\__/\\\\\\__________________        
  _\/\\\_____________\/\\\___/\\\\\\\\\\\\\____/\\\/////////\\\_\/\\\\\\________/\\\\\\_\////\\\__________________       
   _\/\\\_____________\/\\\__/\\\/////////\\\__\//\\\______\///__\/\\\//\\\____/\\\//\\\____\/\\\__________________      
    _\//\\\____/\\\____/\\\__\/\\\_______\/\\\___\////\\\_________\/\\\\///\\\/\\\/_\/\\\____\/\\\_____/\\/\\\\\\\__     
     __\//\\\__/\\\\\__/\\\___\/\\\\\\\\\\\\\\\______\////\\\______\/\\\__\///\\\/___\/\\\____\/\\\____\/\\\/////\\\_    
      ___\//\\\/\\\/\\\/\\\____\/\\\/////////\\\_________\////\\\___\/\\\____\///_____\/\\\____\/\\\____\/\\\___\///__   
       ____\//\\\\\\//\\\\\_____\/\\\_______\/\\\__/\\\______\//\\\__\/\\\_____________\/\\\____\/\\\____\/\\\_________  
        _____\//\\\__\//\\\______\/\\\_______\/\\\_\///\\\\\\\\\\\/___\/\\\_____________\/\\\__/\\\\\\\\\_\/\\\_________ 
         ______\///____\///_______\///________\///____\///////////_____\///______________\///__\/////////__\///__________

                                                                        A dead simple way to use WebAssembly in your script.

	Where the magic happenes.
*/

import * as msgPack from "../utils/msgPack/index";

/**
 * WASMlr type definitions
 */
export namespace types {
	export type TypedArray =
		| Int8Array
		| Uint8Array
		| Int16Array
		| Uint16Array
		| Int32Array
		| Uint32Array
		| Float32Array
		| Float64Array;
	export type ReturnType = "string" | "number" | "object" | TypedArray;
	export type Argument = string | number | boolean | object | TypedArray;

	export type Result = string | number | boolean | object | TypedArray;

	type ExportedFunction = (returnType: ReturnType, ...args: Argument[]) => Result;
	export type ExportedFunctions = Record<string, ExportedFunction>;
}

/**
 * Config object for WebAssembly::instantiate()
 */
const WASM_CONFIG: Record<string, Record<string, WebAssembly.ExportValue>> = {
	env: {
		memory: new WebAssembly.Memory({ initial: 512 }),
	},
	wasi_snapshot_preview1: {
		proc_exit: function () {},
		fd_close: function () {},
		fd_write: function () {},
		fd_seek: function () {},
	},
};

/**
 * WebAssemblr Class
 */
export class WASMlr {
	/** Exported functions */
	private functions: types.ExportedFunctions = {};
	/** WASM Memmory Buffer as Typed Arrays */
	private memmoryBuffers: Record<string, types.TypedArray> = {};

	private malloc: Function;
	private free: Function;

	/** WASM Memmory Types */
	public static TYPES: Record<string, string> = {
		int8: "Int8Array",
		uint8: "Uint8Array",

		int16: "Int16Array",
		uint16: "Uint16Array",

		int32: "Int32Array",
		uint32: "Uint32Array",

		float: "Float32Array",
		double: "Float64Array",
	};

	/**
	 * Initialize WebAssemblr instance
	 * @param {string} filepath Path to `.wasm` file
	 * @returns Promise resolving to the functions exported from WASM
	 */
	public async init(filepath: string): Promise<types.ExportedFunctions> {
		// Find Runtime
		const ENV_NDOE: boolean =
			typeof process === "object" &&
			typeof process.versions === "object" &&
			typeof process.versions.node === "string";

		// Import .wasm file as raw Byte Array
		let wasmBytes: BufferSource;
		if (ENV_NDOE) {
			wasmBytes = require("fs").readFileSync(filepath);
		} else {
			const wasmFile = await fetch(filepath);
			wasmBytes = await wasmFile.arrayBuffer();
		}

		// Instantiate WASM instance
		try {
			const instance: WebAssembly.WebAssemblyInstantiatedSource = await WebAssembly.instantiate(
				wasmBytes,
				WASM_CONFIG
			);
			this.free = instance.instance.exports.free as Function;
			this.malloc = instance.instance.exports.malloc as Function;

			const mem: WebAssembly.Memory = instance.instance.exports.memory as WebAssembly.Memory;

			this.memmoryBuffers["Int8Array"] = new Int8Array(mem.buffer);
			this.memmoryBuffers["Uint8Array"] = new Uint8Array(mem.buffer);
			this.memmoryBuffers["Int16Array"] = new Int16Array(mem.buffer);
			this.memmoryBuffers["Uint16Array"] = new Uint16Array(mem.buffer);
			this.memmoryBuffers["Int32Array"] = new Int32Array(mem.buffer);
			this.memmoryBuffers["Uint32Array"] = new Uint32Array(mem.buffer);
			this.memmoryBuffers["Float32Array"] = new Float32Array(mem.buffer);
			this.memmoryBuffers["Float64Array"] = new Float64Array(mem.buffer);

			for (const key in instance.instance.exports) {
				const f = instance.instance.exports[key] as Function;
				this.functions[key] = (returnType: types.ReturnType, ...args: types.Argument[]) =>
					this._call(f, args, returnType);
			}
		} catch (error) {
			throw error;
		}

		// Return instance.exports
		return this.functions;
	}

	private _call(f: Function, args: types.Argument[], returnType: types.ReturnType): types.Result {
		if (returnType) {
			let doesReturnArray: boolean = this._isTypedArray(returnType);

			if (!doesReturnArray && Array.isArray(returnType)) {
				doesReturnArray = true;
				returnType = Int8Array.from(returnType);
			}

			const retType: string = doesReturnArray ? "array" : (returnType as string);
			const heapType: string = doesReturnArray
				? returnType.constructor.name
				: WASMlr.TYPES.int8;

			const params: number[] = [];

			let i = 0;
			for (let arg of args) {
				if (typeof arg === "string") {
					arg = new TextEncoder().encode(arg);
				}
				if (this._isTypedArray(arg)) {
					let ptr: number | null = null;
					try {
						const typedArgs: types.TypedArray = arg;
						const argLen: number = typedArgs.length;
						const p_heapType: string = typedArgs.constructor.name;

						ptr = this.malloc(typedArgs.length * typedArgs.BYTES_PER_ELEMENT);
						const mem = this.memmoryBuffers[p_heapType];

						if (ptr) {
							switch (p_heapType) {
								case WASMlr.TYPES.int8:
								case WASMlr.TYPES.uint8:
									mem.set(typedArgs, ptr);
								case WASMlr.TYPES.int16:
								case WASMlr.TYPES.uint16:
									mem.set(typedArgs, ptr >> 1);
									break;
								case WASMlr.TYPES.int32:
								case WASMlr.TYPES.uint32:
								case WASMlr.TYPES.float:
									mem.set(typedArgs, ptr >> 2);
									break;
								case WASMlr.TYPES.double:
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
				} else if (typeof arg === "object") {
					const packed = msgPack.encode(arg);
					const ptr = this.malloc(packed.length);
					const bytes_per_element = packed.BYTES_PER_ELEMENT;
					this.memmoryBuffers[WASMlr.TYPES.int8].set(packed, ptr / bytes_per_element);

					params.push(ptr);
					params.push(packed.length);

					//this.free(ptr);
				} else if (typeof arg === "number") {
					params.push(arg);
				}
			}

			if (this._isTypedArray(returnType)) {
				const ptr = f(...params);
				this._decodeArray(heapType, ptr, returnType);
				return returnType;
			} else if (retType === "string") {
				const ptr = f(...params);
				return this._decodeUTF8String(heapType, ptr);
			} else if (retType === "object") {
				const addressPtr = f(...params);

				const addressData = new Uint8Array(
					this.memmoryBuffers[heapType].slice(addressPtr, addressPtr + (addressPtr >> 2))
				);

				this.free(addressPtr);
				return msgPack.decode(addressData);
			}

			return f(...params);
		} else {
			throw "Return Type not defined";
		}
	}

	private _isTypedArray(array: types.Argument): array is types.TypedArray {
		return (<types.TypedArray>array).BYTES_PER_ELEMENT !== undefined;
	}

	private _decodeArray(heapType: string, ptr: number, copyto: types.TypedArray): void {
		const mem = this.memmoryBuffers[heapType];
		const length = copyto.length;
		for (let i = 0; i < (length || 1); i++) {
			copyto[i] = mem[ptr / mem.BYTES_PER_ELEMENT + i];
		}
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
