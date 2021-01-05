import { Tag } from "./tags";
export interface WriteBuffer {
    put(v: BufferSource): void;
    putI8(v: number): void;
    putI16(v: number): void;
    putI32(v: number): void;
    putI64(v: number): void;
    putUi8(v: number): void;
    putUi16(v: number): void;
    putUi32(v: number): void;
    putUi64(v: number): void;
    putF(v: number): void;
    ui8array(): Uint8Array;
}
export interface ReadBuffer {
    peek(): number;
    get(len: number): ArrayBuffer;
    getI8(): number;
    getI16(): number;
    getI32(): number;
    getI64(): number;
    getUi8(): number;
    getUi16(): number;
    getUi32(): number;
    getUi64(): number;
    getF32(): number;
    getF64(): number;
}
export declare function createWriteBuffer(): WriteBuffer;
export declare function createReadBuffer(buf: BufferSource): ReadBuffer;
export declare function putBlob(buf: WriteBuffer, blob: ArrayBuffer, baseTag: Tag): void;
export declare function getBlob(buf: ReadBuffer): ArrayBuffer;
export declare function putArrHeader(buf: WriteBuffer, n: number): void;
export declare function getArrHeader(buf: ReadBuffer, expect?: number): number;
export declare function putMapHeader(buf: WriteBuffer, n: number): void;
export declare function getMapHeader(buf: ReadBuffer, expect?: number): number;
export declare function getRaw(buf: ReadBuffer, res: WriteBuffer): void;
