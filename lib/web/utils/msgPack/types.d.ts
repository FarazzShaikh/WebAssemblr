import { WriteBuffer, ReadBuffer } from "./buffer";
export declare type EncodeFunc<T> = (buf: WriteBuffer, v: T) => void;
export declare type DecodeFunc<T> = (buf: ReadBuffer) => T;
export interface Type<T> {
    readonly enc: EncodeFunc<T>;
    readonly dec: DecodeFunc<T>;
}
export interface Collection<T> extends Type<T> {
    encHeader(buf: WriteBuffer, len: number): void;
    decHeader(buf: ReadBuffer, expect?: number): number;
}
export declare type Obj<T> = {
    [key: string]: T;
};
export declare type Field = [string, Type<any>];
export declare type Fields = {
    readonly [ordinal: number]: Field;
};
export interface Branches {
    readonly [ordinal: number]: Type<any>;
    ordinalOf(v: any): number;
}
export declare const Any: Type<any>;
export declare const Nil: Type<null>;
export declare const Bool: Type<boolean>;
export declare const Int: Type<number>;
export declare const Uint: Type<number>;
export declare const Float: Type<number>;
export declare const Bytes: Type<ArrayBuffer>;
export declare const Str: Type<string>;
export declare const Raw: Type<ArrayBuffer>;
export declare const Time: Type<Date>;
export declare const Arr: Collection<any[]>;
export declare const Map: Collection<Obj<any>>;
export declare function TypedArr<T>(valueT: Type<T>): Collection<T[]>;
export declare function TypedMap<V>(keyT: Type<number | string>, valueT: Type<V>): Collection<Obj<V>>;
export declare function structEncoder(fields: Fields): EncodeFunc<any>;
export declare function structDecoder(fields: Fields): DecodeFunc<any>;
export declare function Struct(fields: Fields): Type<Obj<any>>;
export declare function unionEncoder(branches: Branches): EncodeFunc<any>;
export declare function unionDecoder(branches: Branches): DecodeFunc<any>;
export declare function Union(branches: Branches): Type<any>;
