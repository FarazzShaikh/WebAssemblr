export function typeError(tag, expected) {
    throw new TypeError(`unexpected tag 0x${tag.toString(16)} (${expected} expected)`);
}
