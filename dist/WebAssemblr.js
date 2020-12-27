"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.WebAssemblr = void 0;
var CallArrayOptionsDefaults = {
    heapIn: "HEAP8",
    heapOut: "HEAP8",
    returnArraySize: 1
};
var WebAssemblr = /** @class */ (function () {
    function WebAssemblr(_a, funcs) {
        var _this = this;
        var Module = _a.Module;
        this._callArray = function (func, returnType, paramTypes, params, options) {
            if (paramTypes === void 0) { paramTypes = []; }
            var heapIn = options.heapIn, heapOut = options.heapOut, returnArraySize = options.returnArraySize;
            var heapMap = {
                HEAP8: Int8Array,
                HEAPU8: Uint8Array,
                HEAP16: Int16Array,
                HEAPU16: Uint16Array,
                HEAP32: Int32Array,
                HEAPU32: Uint32Array,
                HEAPF32: Float32Array,
                HEAPF64: Float64Array
            };
            var res;
            var error;
            var returnTypeParam = returnType == "array" ? "number" : returnType;
            var parameters = [];
            var parameterTypes = [];
            var bufs = [];
            try {
                if (params) {
                    for (var p = 0; p < params.length; p++) {
                        if (paramTypes[p] == "array" || typeof params[p] === "object") {
                            var typedArray = new heapMap[heapIn](params[p].length);
                            for (var i = 0; i < params[p].length; i++) {
                                typedArray[i] = params[p][i];
                            }
                            var buf = _this.Module._malloc(typedArray.length * typedArray.BYTES_PER_ELEMENT);
                            switch (heapIn) {
                                case "HEAP8":
                                case "HEAPU8":
                                    _this.Module[heapIn].set(typedArray, buf);
                                    break;
                                case "HEAP16":
                                case "HEAPU16":
                                    _this.Module[heapIn].set(typedArray, buf >> 1);
                                    break;
                                case "HEAP32":
                                case "HEAPU32":
                                case "HEAPF32":
                                    _this.Module[heapIn].set(typedArray, buf >> 2);
                                    break;
                                case "HEAPF64":
                                    _this.Module[heapIn].set(typedArray, buf >> 3);
                                    break;
                            }
                            bufs.push(buf);
                            parameters.push(buf);
                            parameters.push(params[p].length);
                            parameterTypes.push("number");
                            parameterTypes.push("number");
                        }
                        else {
                            parameters.push(params[p]);
                            parameterTypes.push(paramTypes[p] == undefined ? "number" : paramTypes[p]);
                        }
                    }
                }
                res = _this.Module.ccall(func, returnTypeParam, parameterTypes, parameters);
            }
            catch (e) {
                error = e;
            }
            finally {
                for (var b = 0; b < bufs.length; b++) {
                    _this.Module._free(bufs[b]);
                }
            }
            if (error)
                throw error;
            if (returnType == "array") {
                var returnData = [];
                for (var v = 0; v < returnArraySize; v++) {
                    returnData.push(_this.Module[heapOut][res / heapMap[heapOut].BYTES_PER_ELEMENT + v]);
                }
                return returnData;
            }
            else {
                return res;
            }
        };
        this.Module = Module;
        if (funcs) {
            this.FUNCS = {};
            funcs.forEach(function (f, i) {
                var func = _this.Module["_" + f];
                if (func) {
                    _this.FUNCS[f] = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        return _this._call(f, args);
                    };
                }
                else {
                    throw "No such function - " + f + " found for index " + i;
                }
            });
        }
    }
    WebAssemblr.prototype.call = function () {
        return this.FUNCS;
    };
    WebAssemblr.prototype.returns = function (type, options) {
        this.c_returnType = type;
        this.c_options = __assign(__assign({}, CallArrayOptionsDefaults), options);
        return this;
    };
    WebAssemblr.prototype._call = function (f, args) {
        if (args.find(function (a) { return Array.isArray(a); }) ||
            this.c_returnType === "array" ||
            this.c_returnType === "string") {
            if (!this.c_returnType) {
                throw "Please chain WebAssemblr::returns method to specify a return type for argument type array.";
            }
            var paramTypes = args.map(function (param) {
                if (typeof param === "object")
                    return "array";
                else
                    return typeof param;
            });
            paramTypes.reduce(function (acc, val) { return acc.concat(val); }, []);
            return this._callArray(f, this.c_returnType, paramTypes, args, this.c_options);
        }
        var func = this.Module["_" + f];
        return func.apply(void 0, args);
    };
    return WebAssemblr;
}());
exports.WebAssemblr = WebAssemblr;
