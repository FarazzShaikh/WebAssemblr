import { WebAssemblr } from "../src/WebAssemblr";
import wasmModule from "./wasm/main";

describe("C++ Tests", () => {
  test("Factorial of int", () => {
    wasmModule.onRuntimeInitialized = function () {
      const wasm: WebAssemblr = new WebAssemblr(
        {
          Module: wasmModule,
          cppMode: true,
        },
        ["cpp_fact"],
        ["fact"]
      );

      const tests: { [key: number]: number } = {
        0: 1,
        1: 1,
        2: 2,
        3: 6,
        5: 120,
        12: 479001600,
        15: 1307674368000,
      };

      for (const key in tests) {
        const expected: number = Number(tests[key]);
        const inp: number = Number(key);

        const actual: number = wasm.call().fact(inp);
        expect(actual).toBe(expected);
      }
    };
  });

  test("Add ints", () => {
    wasmModule.onRuntimeInitialized = function () {
      const wasm: WebAssemblr = new WebAssemblr(
        {
          Module: wasmModule,
          cppMode: true,
        },
        ["cpp_addInt"],
        ["addInt"]
      );

      const unittests: { exp: number; inp: number[] }[] = [
        { exp: 0, inp: [0, 0] },
        { exp: 0, inp: [1, -1] },
        { exp: 0, inp: [-100, 100] },

        { exp: 1, inp: [1, 0] },
        { exp: 1, inp: [0, 1] },
      ];

      for (const test of unittests) {
        const expected: number = test.exp;
        const inp: number[] = test.inp;

        const actual: number = wasm.call().addInt(...inp);
        expect(actual).toBe(expected);
      }
    };
  });

  test("Multiply ints", () => {
    wasmModule.onRuntimeInitialized = function () {
      const wasm: WebAssemblr = new WebAssemblr(
        {
          Module: wasmModule,
          cppMode: true,
        },
        ["cpp_multiplyInt"],
        ["multInt"]
      );

      const unittests: { exp: number; inp: number[] }[] = [
        { exp: 0, inp: [0, 0] },
        { exp: -1, inp: [1, -1] },
        { exp: 1, inp: [-1, -1] },
        { exp: -10000, inp: [-100, 100] },

        { exp: 0, inp: [1, 0] },
        { exp: 0, inp: [0, 1] },
      ];

      for (const test of unittests) {
        const expected: number = test.exp;
        const inp: number[] = test.inp;

        const actual: number = wasm.call().multInt(...inp);
        expect(actual).toBe(expected);
      }
    };
  });
});
