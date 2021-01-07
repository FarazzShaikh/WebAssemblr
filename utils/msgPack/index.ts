import { Type, Any } from "./types";
import { createWriteBuffer, createReadBuffer } from "./buffer";

export { encode, decode };

function encode<T>(v: T, typ?: Type<T>): Uint8Array {
	const buf = createWriteBuffer();
	(typ || Any).enc(buf, v);
	return buf.ui8array();
}

function decode<T>(buf: BufferSource, typ?: Type<T>): T {
	return (typ || Any).dec(createReadBuffer(buf));
}
