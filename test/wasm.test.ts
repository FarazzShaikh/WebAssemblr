import { WASMlr, TYPES } from "../src/WebAssemblr";

type GenericTestType =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[];
type Test<E, I> = { exp: E; inp: I[] };

describe("C++ Tests", () => {
  let wasm: WASMlr;

  const runTest = function (
    tests: Test<GenericTestType, GenericTestType>[],
    func: Function
  ) {
    for (const test of tests) {
      const expected: GenericTestType = test.exp;
      const inp: GenericTestType[] = test.inp;

      const actual: number = func()(...inp);
      if (Array.isArray(expected)) {
        expect(actual).toStrictEqual(expected);
        continue;
      }

      expect(actual).toBe(expected);
    }
  };

  beforeAll(
    async (): Promise<void> => {
      const path = require("path");
      const wasmPath: string = path.resolve(__dirname, "./wasm/wasm.wasm");
      wasm = await new WASMlr().init(wasmPath);
    }
  );

  test("Factorial of int", (): void => {
    const tests: Test<number, number>[] = [
      { exp: 1, inp: [0] },
      { exp: 1, inp: [1] },
      { exp: 2, inp: [2] },
      { exp: 6, inp: [3] },
      { exp: 120, inp: [5] },
      { exp: 479001600, inp: [12] },
      { exp: 1307674368000, inp: [15] },
    ];

    const func: Function = () => wasm.returns("number").call().factorial;
    runTest(tests, func);
  });

  test("Add ints", (): void => {
    const tests: Test<number, number>[] = [
      { exp: 0, inp: [0, 0] },
      { exp: 0, inp: [1, -1] },
      { exp: 0, inp: [-100, 100] },
      { exp: 1, inp: [1, 0] },
      { exp: 1, inp: [0, 1] },
    ];

    const func: Function = () => wasm.returns("number").call().addInt;
    runTest(tests, func);
  });

  test("Multiply ints", (): void => {
    const tests: Test<number, number>[] = [
      { exp: 0, inp: [0, 0] },
      { exp: -1, inp: [1, -1] },
      { exp: 1, inp: [-1, -1] },
      { exp: -10000, inp: [-100, 100] },
      { exp: 0, inp: [1, 0] },
      { exp: 0, inp: [0, 1] },
    ];

    const func: Function = () => wasm.returns("number").call().multiplyInt;
    runTest(tests, func);
  });

  test("Double ints", (): void => {
    const tests: Test<number[], number[]>[] = [
      { exp: [0, 0], inp: [[0, 0]] },
      { exp: [2, 4], inp: [[1, 2]] },
    ];

    let out_bufferLength: number = 2;

    const func: Function = () =>
      wasm.returns("array").ofLength(out_bufferLength).call().doubleArray;
    runTest(tests, func);
  });

  test("Sum Array", (): void => {
    const tests: Test<number, number[]>[] = [
      { exp: 0, inp: [[0, 0]] },
      { exp: 3, inp: [[1, 2]] },
      { exp: 145, inp: [[1, 2, 3, 64, 75]] },
    ];

    const func: Function = () =>
      wasm.returns("number").andTakes(TYPES.int32_t).call().sumArray;
    runTest(tests, func);
  });
});
