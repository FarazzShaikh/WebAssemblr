function t(t,e){throw new TypeError(`unexpected tag 0x${t.toString(16)} (${e} expected)`)}function e(t){return 127&t}function r(t){return 0==(128&t)}function n(t){return 224==(224&t)}function i(t){return 160==(224&t)}function s(t){return 144==(240&t)}function u(t){return 128==(240&t)}function c(t,e,r){const n=e.byteLength;if(n<=255)t.putUi8(r),t.putUi8(n);else if(n<=65535)t.putUi8(r+1),t.putUi16(n);else{if(!(n<=4294967295))throw new RangeError("length limit exceeded");t.putUi8(r+2),t.putUi32(n)}t.put(e)}function a(e){const r=e.getUi8();let n;switch(r){case 192:n=0;break;case 196:case 217:n=e.getUi8();break;case 197:case 218:n=e.getUi16();break;case 198:case 219:n=e.getUi32();break;default:i(r)||t(r,"bytes or string"),n=function(t){return 31&t}(r)}return e.get(n)}function o(t,e){e<16?t.putUi8(144|15&e):l(t,220,e)}function f(t,e){const r=t.getUi8(),n=s(r)?function(t){return 15&t}(r):h(t,r,220,"array");if(null!=e&&n!==e)throw new Error(`invalid array header size ${n}`);return n}function p(t,e){e<16?t.putUi8(128|15&e):l(t,222,e)}function y(t,e){const r=t.getUi8(),n=u(r)?function(t){return 15&t}(r):h(t,r,222,"map");if(null!=e&&n!==e)throw new Error(`invalid map header size ${n}`);return n}function l(t,e,r){if(r<=65535)t.putUi8(e),t.putUi16(r);else{if(!(r<=4294967295))throw new RangeError("length limit exceeded");t.putUi8(e+1),t.putUi32(r)}}function h(e,r,n,i){switch(r){case 192:return 0;case n:return e.getUi16();case n+1:return e.getUi32();default:t(r,i)}}const g={enc(t,e){(function(t){switch(typeof t){case"undefined":return U;case"boolean":return w;case"number":return isFinite(t)&&Math.floor(t)===t?t<0?d:_:b;case"string":return m;case"object":return null===t?U:Array.isArray(t)?I:t instanceof Uint8Array||t instanceof ArrayBuffer?A:t instanceof Date?E:k;default:throw new TypeError("unsupported type "+typeof t)}})(e).enc(t,e)},dec:t=>function(t){switch(t){case 192:return U;case 194:case 195:return w;case 208:case 209:case 210:case 211:return d;case 204:case 205:case 206:case 207:return _;case 202:case 203:return b;case 196:case 197:case 198:return A;case 217:case 218:case 219:return m;case 220:case 221:return I;case 222:case 223:return k;case 214:case 215:case 199:return E;default:if(r(t)||n(t))return d;if(i(t))return m;if(s(t))return I;if(u(t))return k;throw new TypeError(`unsupported tag ${t}`)}}(t.peek()).dec(t)},U={enc(t,e){t.putUi8(192)},dec(e){const r=e.getUi8();return 192!==r&&t(r,"nil"),null}},w={enc(t,e){t.putUi8(e?195:194)},dec(e){const r=e.getUi8();switch(r){case 192:case 194:return!1;case 195:return!0;default:t(r,"bool")}}},d={enc(t,r){-128<=r&&r<=127?r>=0?t.putUi8(e(r)):r>-32?t.putUi8(224|31&r):(t.putUi8(208),t.putUi8(r)):-32768<=r&&r<=32767?(t.putI8(209),t.putI16(r)):-2147483648<=r&&r<=2147483647?(t.putI8(210),t.putI32(r)):(t.putI8(211),t.putI64(r))},dec(e){const i=e.getUi8();if(r(i))return function(t){return 127&t}(i);if(n(i))return function(t){return t-256}(i);switch(i){case 192:return 0;case 208:return e.getI8();case 209:return e.getI16();case 210:return e.getI32();case 211:return e.getI64();case 204:return e.getUi8();case 205:return e.getUi16();case 206:return e.getUi32();case 207:return e.getUi64();default:t(i,"int")}}},_={enc(t,r){if(r<0)throw new Error(`not an uint: ${r}`);r<=127?t.putUi8(e(r)):r<=255?(t.putUi8(204),t.putUi8(r)):r<=65535?(t.putUi8(205),t.putUi16(r)):r<=4294967295?(t.putUi8(206),t.putUi32(r)):(t.putUi8(207),t.putUi64(r))},dec(t){const e=d.dec(t);if(e<0)throw new RangeError("uint underflow");return e}},b={enc(t,e){t.putUi8(203),t.putF(e)},dec(e){const r=e.getUi8();switch(r){case 192:return 0;case 202:return e.getF32();case 203:return e.getF64();default:t(r,"float")}}},A={enc(t,e){c(t,e,196)},dec:a},m={enc(t,e){const r=function(t){const e=t.length,r=new Uint8Array(4*e);let n,i=0,s=0;for(;s<e;)n=t.charCodeAt(s++),55296==(64512&n)&&(n=(n<<10)+t.charCodeAt(s++)-56613888),n<128?r[i++]=n:n<2048?(r[i++]=192+(n>>6),r[i++]=128+(63&n)):n<65536?(r[i++]=224+(n>>12),r[i++]=128+(n>>6&63),r[i++]=128+(63&n)):(r[i++]=240+(n>>18),r[i++]=128+(n>>12&63),r[i++]=128+(n>>6&63),r[i++]=128+(63&n));return r.buffer.slice(0,i)}(e);r.byteLength<32?(t.putUi8(160|31&r.byteLength),t.put(r)):c(t,r,217)},dec:t=>function(t){return new TextDecoder("utf-8").decode(t)}(a(t))},E={enc(t,e){const r=e.getTime();t.putUi8(199),t.putUi8(12),t.putI8(-1),t.putUi32(r%1e3*1e6),t.putI64(r/1e3)},dec(e){const r=e.getUi8();switch(r){case 214:if(-1===e.getI8())return new Date(1e3*e.getUi32());break;case 215:if(-1===e.getI8()){const t=e.getUi32(),r=e.getUi32();return new Date(1e3*(r+4294967296*(3&t))+t/4e6)}break;case 199:if(12===e.getUi8()&&-1===e.getI8()){const t=e.getUi32(),r=e.getI64();return new Date(1e3*r+t/1e6)}}t(r,"time")}},I=(T=g,{encHeader:o,decHeader:f,enc(t,e){o(t,e.length),e.forEach((e=>T.enc(t,e)))},dec(t){const e=[];for(let r=f(t);r>0;--r)e.push(T.dec(t));return e}});var T;const k=function(t,e){return{encHeader:p,decHeader:y,enc(r,n){const i=Object.keys(n);p(r,i.length),i.forEach((i=>{t.enc(r,i),e.enc(r,n[i])}))},dec(r){const n={};for(let i=y(r);i>0;--i){n[t.dec(r)]=e.dec(r)}return n}}}(g,g);function F(t,e){const r=function(){let t=new DataView(new ArrayBuffer(64)),e=0;function r(r){if(e+r>t.byteLength){const n=new Uint8Array(Math.max(e+r,t.byteLength+64));n.set(new Uint8Array(t.buffer.slice(0,e))),t=new DataView(n.buffer)}}return{put(n){r(n.byteLength),new Uint8Array(t.buffer).set(new Uint8Array(n),e),e+=n.byteLength},putI8(n){r(1),t.setInt8(e,n),++e},putI16(n){r(2),t.setInt16(e,n),e+=2},putI32(n){r(4),t.setInt32(e,n),e+=4},putI64(n){r(8);const i=n<0;i&&(n=-n);let s=n/4294967296|0,u=n%4294967296|0;i&&(u=1+~u|0,s=0===u?1+~s|0:~s),t.setUint32(e,s),t.setUint32(e+4,u),e+=8},putUi8(n){r(1),t.setUint8(e,n),++e},putUi16(n){r(2),t.setUint16(e,n),e+=2},putUi32(n){r(4),t.setUint32(e,n),e+=4},putUi64(n){r(8),t.setUint32(e,n/4294967296|0),t.setUint32(e+4,n%4294967296),e+=8},putF(n){r(8),t.setFloat64(e,n),e+=8},ui8array:()=>new Uint8Array(t.buffer.slice(0,e))}}();return(e||g).enc(r,t),r.ui8array()}function P(t,e){return(e||g).dec(function(t){let e=ArrayBuffer.isView(t)?new DataView(t.buffer,t.byteOffset,t.byteLength):new DataView(t),r=0;return{peek:()=>e.getUint8(r),get(t){r+=t;const n=e.byteOffset;return e.buffer.slice(n+r-t,n+r)},getI8:()=>e.getInt8(r++),getI16:()=>(r+=2,e.getInt16(r-2)),getI32:()=>(r+=4,e.getInt32(r-4)),getI64:()=>(r+=8,4294967296*e.getInt32(r-8)+e.getUint32(r-4)),getUi8:()=>e.getUint8(r++),getUi16:()=>(r+=2,e.getUint16(r-2)),getUi32:()=>(r+=4,e.getUint32(r-4)),getUi64:()=>(r+=8,4294967296*e.getUint32(r-8)+e.getUint32(r-4)),getF32:()=>(r+=4,e.getFloat32(r-4)),getF64:()=>(r+=8,e.getFloat64(r-8))}}(t))}const x={env:{memory:new WebAssembly.Memory({initial:512})},wasi_snapshot_preview1:{proc_exit:function(){},fd_close:function(){},fd_write:function(){},fd_seek:function(){}}},B={int8_t:"HEAP8",uint8_t:"HEAPU8",int16_t:"HEAP16",uint16_t:"HEAPU16",int32_t:"HEAP32",uint32_t:"HEAPU32",float:"HEAPF32",double:"HEAPF64"},L={[B.int8_t]:Int8Array,[B.uint8_t]:Uint8Array,[B.int16_t]:Int16Array,[B.uint16_t]:Uint16Array,[B.int32_t]:Int32Array,[B.uint32_t]:Uint32Array,[B.float]:Float32Array,[B.double]:Float64Array};class H{constructor(){this.functions={},this.stack_returnTypes=[],this.memmoryBuffers={}}async init(t){let e;if("object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node)e=require("fs").readFileSync(t);else{const r=await fetch(t);e=await r.arrayBuffer()}try{const t=await WebAssembly.instantiate(e,x);this.free=t.instance.exports.free,this.malloc=t.instance.exports.malloc;const r=t.instance.exports.memory;this.memmoryBuffers={[B.int8_t]:new Int8Array(r.buffer),[B.uint8_t]:new Uint8Array(r.buffer),[B.int16_t]:new Int16Array(r.buffer),[B.uint16_t]:new Uint16Array(r.buffer),[B.int32_t]:new Int32Array(r.buffer),[B.uint32_t]:new Uint32Array(r.buffer),[B.float]:new Float32Array(r.buffer),[B.double]:new Float64Array(r.buffer)};for(const e in t.instance.exports){const r=t.instance.exports[e];"function"==typeof r&&(this.functions[e]=(...t)=>this._call(r,t))}}catch(t){throw t}return this}returns(t){return this.stack_returnTypes.push({r_type:t}),this}ofType(t){const e=this.stack_returnTypes[this.stack_returnTypes.length-1];if(!e)throw"Please specify a return type to set it's buffer type.";return e.a_type=t,this}andTakes(t){const e=this.stack_returnTypes[this.stack_returnTypes.length-1];if(!e)throw"Please specify a return type to set it's inputs.";return e.p_type=t,this}ofLength(t){const e=this.stack_returnTypes[this.stack_returnTypes.length-1];if(!e)throw"Please specify a return type to set it's Length.";if("array"!==e.r_type)throw'Length can only be set for return type "array".';return e.r_type_len=t,this}call(t,e){if(t&&e)return this.functions[t](...e);if(!this.stack_returnTypes[this.stack_returnTypes.length-1])throw"Please specify a return type for function you want to call";return this.functions}_call(t,e){let r=this.stack_returnTypes.pop();if(r){const s=r.r_type,u=r.r_type_len||1,c=r.a_type||B.int8_t,a=r.p_type||B.int8_t,o=[];let f=0;for(let t of e)if("string"==typeof t&&(t=(new TextEncoder).encode(t)),Array.isArray(t)){let e=null;try{const r=Array.isArray(a)?a[f]:a,n=L[r].from(t),i=n.length;e=this.malloc(n.length*n.BYTES_PER_ELEMENT);const s=this.memmoryBuffers[r];if(e){switch(r){case B.int8_t:case B.uint8_t:s.set(n,e);case B.int16_t:case B.uint16_t:s.set(n,e>>1);break;case B.int32_t:case B.uint32_t:case B.float:s.set(n,e>>2);break;case B.double:s.set(n,e>>3)}e&&o.push(e),o.push(i)}}catch(t){throw t}finally{e&&this.free(e)}}else if("object"==typeof t){const e=F(t);var n=this.malloc(e.length),i=e.BYTES_PER_ELEMENT;this.memmoryBuffers[B.int8_t].set(e,n/i),o.push(n),o.push(e.length)}else"number"==typeof t&&o.push(t);if("string"===s){const e=t(...o);return this._decodeUTF8String(c,e)}if("array"===s){const e=t(...o);return this._decodeArray(c,e,u)}if("object"===s){const e=t(...o),r=new Uint8Array(this.memmoryBuffers[c].slice(e,e+(e>>2)));return this.free(e),P(r)}return t(...o)}throw"Return Type not defined"}_decodeArray(t,e,r){const n=this.memmoryBuffers[t];let i=[];for(let t=0;t<(r||1);t++)i.push(n[e/n.BYTES_PER_ELEMENT+t]);return i}_decodeUTF8String(t,e){const r=this.memmoryBuffers[t];let n="";for(let t=0;r[e+t];t++)n+=String.fromCharCode(r[e/r.BYTES_PER_ELEMENT+t]);return n}}export{B as TYPES,H as WASMlr};
//# sourceMappingURL=web-bundle.js.map