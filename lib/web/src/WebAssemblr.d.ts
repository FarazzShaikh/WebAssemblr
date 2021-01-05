export declare const TYPES: Record<string, string>;
export declare class WASMlr {
    private functions;
    private stack_returnTypes;
    private memmoryBuffers;
    private malloc;
    private free;
    constructor();
    init(filepath: string): Promise<this>;
    returns(type: string): this;
    ofType(arrayType: string): this;
    andTakes(paramType: string | string[]): this;
    ofLength(length: number): this;
    call(name?: string, args?: any[]): any;
    private _call;
    private _decodeArray;
    private _decodeUTF8String;
}
