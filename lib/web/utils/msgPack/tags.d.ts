export declare const enum Tag {
    Nil = 192,
    False = 194,
    True = 195,
    Int8 = 208,
    Int16 = 209,
    Int32 = 210,
    Int64 = 211,
    Uint8 = 204,
    Uint16 = 205,
    Uint32 = 206,
    Uint64 = 207,
    Float32 = 202,
    Float64 = 203,
    Str8 = 217,
    Str16 = 218,
    Str32 = 219,
    Bin8 = 196,
    Bin16 = 197,
    Bin32 = 198,
    Array16 = 220,
    Array32 = 221,
    Map16 = 222,
    Map32 = 223,
    Ext8 = 199,
    Ext16 = 200,
    Ext32 = 201,
    FixExt1 = 212,
    FixExt2 = 213,
    FixExt4 = 214,
    FixExt8 = 215,
    FixExt16 = 216
}
export declare function posFixintTag(i: number): Tag;
export declare function isPosFixintTag(tag: Tag): boolean;
export declare function readPosFixint(tag: Tag): number;
export declare function negFixintTag(i: number): Tag;
export declare function isNegFixintTag(tag: Tag): boolean;
export declare function readNegFixint(tag: Tag): number;
export declare function fixstrTag(length: number): Tag;
export declare function isFixstrTag(tag: Tag): boolean;
export declare function readFixstr(tag: Tag): number;
export declare function fixarrayTag(length: number): Tag;
export declare function isFixarrayTag(tag: Tag): boolean;
export declare function readFixarray(tag: Tag): number;
export declare function fixmapTag(length: number): Tag;
export declare function isFixmapTag(tag: Tag): boolean;
export declare function readFixmap(tag: Tag): number;
