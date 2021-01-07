/**
 * WASMlr type definitions
 */
declare namespace types {
    export type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
    export type ReturnType = "string" | "number" | "object" | TypedArray;
    export type Argument = string | number | boolean | object | TypedArray;
    export type Result = string | number | boolean | object | TypedArray;
    type ExportedFunction = (returnType: ReturnType, ...args: Argument[]) => Result;
    export type ExportedFunctions = Record<string, ExportedFunction>;
    export {};
}
/**
 * WebAssemblr Class
 */
declare class WASMlr {
    /** Exported functions */
    private functions;
    /** WASM Memmory Buffer as Typed Arrays */
    private memmoryBuffers;
    private malloc;
    private free;
    /** WASM Memmory Types */
    static TYPES: Record<string, string>;
    /**
     * Initialize WebAssemblr instance
     * @param {string} filepath Path to `.wasm` file
     * @returns Promise resolving to the functions exported from WASM
     */
    init(filepath: string): Promise<types.ExportedFunctions>;
    private _call;
    private _isTypedArray;
    private _decodeArray;
    private _decodeUTF8String;
}

export { WASMlr, types };
