import { WebAssemblr } from "../src/WebAssemblr";
import wasmModule from "./wasm/wasm";

type Test = { exp: number | string; inp: (number | string)[] };

describe("C Tests", () => {
  let wasm: WebAssemblr;

  const runTest = function (tests: Test[], func: Function) {
    for (const test of tests) {
      const expected: number | string = test.exp;
      const inp: (number | string)[] = test.inp;

      const actual: number = func(...inp);
      expect(actual).toBe(expected);
    }
  };

  beforeAll(
    async (): Promise<void> => {
      wasm = await new WebAssemblr().init(
        {
          Module: wasmModule,
        },
        ["c_fact", "c_addInt", "c_multiplyInt", "c_getString"],
        ["fact", "addInt", "multInt", "getString"]
      );
    }
  );

  test("Factorial of int", (): void => {
    const tests: Test[] = [
      { exp: 1, inp: [0] },
      { exp: 1, inp: [1] },
      { exp: 2, inp: [2] },
      { exp: 6, inp: [3] },
      { exp: 120, inp: [5] },
      { exp: 479001600, inp: [12] },
      { exp: 1307674368000, inp: [15] },
    ];

    const func: Function = wasm.returns("number").fact;
    runTest(tests, func);
  });

  test("Add ints", (): void => {
    const tests: Test[] = [
      { exp: 0, inp: [0, 0] },
      { exp: 0, inp: [1, -1] },
      { exp: 0, inp: [-100, 100] },
      { exp: 1, inp: [1, 0] },
      { exp: 1, inp: [0, 1] },
    ];

    const func: Function = wasm.returns("number").addInt;
    runTest(tests, func);
  });

  test("Multiply ints", (): void => {
    const tests: Test[] = [
      { exp: 0, inp: [0, 0] },
      { exp: -1, inp: [1, -1] },
      { exp: 1, inp: [-1, -1] },
      { exp: -10000, inp: [-100, 100] },
      { exp: 0, inp: [1, 0] },
      { exp: 0, inp: [0, 1] },
    ];

    const func: Function = wasm.returns("number").multInt;
    runTest(tests, func);
  });

  test("Get String", (): void => {
    const tests: Test[] = [{ exp: "Hello, WASM!", inp: [] }];

    const func: Function = wasm.returns("string").getString;
    runTest(tests, func);
  });
});
