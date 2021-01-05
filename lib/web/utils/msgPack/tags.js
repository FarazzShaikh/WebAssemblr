// positive fixint: 0xxx xxxx
export function posFixintTag(i) {
    return i & 0x7f;
}
export function isPosFixintTag(tag) {
    return (tag & 0x80) === 0;
}
export function readPosFixint(tag) {
    return tag & 0x7f;
}
// negative fixint: 111x xxxx
export function negFixintTag(i) {
    return 0xe0 | (i & 0x1f);
}
export function isNegFixintTag(tag) {
    return (tag & 0xe0) == 0xe0;
}
export function readNegFixint(tag) {
    return tag - 0x100;
}
// fixstr: 101x xxxx
export function fixstrTag(length) {
    return 0xa0 | (length & 0x1f);
}
export function isFixstrTag(tag) {
    return (tag & 0xe0) == 0xa0;
}
export function readFixstr(tag) {
    return tag & 0x1f;
}
// fixarray: 1001 xxxx
export function fixarrayTag(length) {
    return 0x90 | (length & 0x0f);
}
export function isFixarrayTag(tag) {
    return (tag & 0xf0) == 0x90;
}
export function readFixarray(tag) {
    return tag & 0x0f;
}
// fixmap: 1000 xxxx
export function fixmapTag(length) {
    return 0x80 | (length & 0x0f);
}
export function isFixmapTag(tag) {
    return (tag & 0xf0) == 0x80;
}
export function readFixmap(tag) {
    return tag & 0x0f;
}
