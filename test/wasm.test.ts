import { WASMlr, types } from "../lib/node/node-bundle.js";

type Test<E, I> = { exp: E; inp: I[] };

describe("C++ Tests", () => {
	let wasm: types.ExportedFunctions;

	const runTest = function (
		tests: Test<types.Result, types.Argument>[],
		retType: types.ReturnType,
		func: Function
	) {
		for (const test of tests) {
			const expected: any = test.exp;
			const inp: any[] = test.inp;

			const actual: types.ReturnType = func(retType, ...inp);
			if (typeof expected === "object") {
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

		const retType: types.ReturnType = "number";
		const func: Function = wasm.factorial;
		runTest(tests, retType, func);
	});

	test("Add ints", (): void => {
		const tests: Test<number, number>[] = [
			{ exp: 0, inp: [0, 0] },
			{ exp: 0, inp: [1, -1] },
			{ exp: 0, inp: [-100, 100] },
			{ exp: 1, inp: [1, 0] },
			{ exp: 1, inp: [0, 1] },
		];

		const retType: types.ReturnType = "number";
		const func: Function = wasm.addInt;
		runTest(tests, retType, func);
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

		const retType: types.ReturnType = "number";
		const func: Function = wasm.multiplyInt;
		runTest(tests, retType, func);
	});

	test("Double ints", (): void => {
		const tests: Test<Float32Array, Float32Array>[] = [
			{ exp: Float32Array.from([0, 0]), inp: [Float32Array.from([0, 0])] },
			{ exp: Float32Array.from([2, 4]), inp: [Float32Array.from([1, 2])] },
		];

		const retType: types.ReturnType = new Float32Array(2);
		const func: Function = wasm.doubleArray;
		runTest(tests, retType, func);
	});

	test("Sum Array", (): void => {
		const tests: Test<number, Int32Array>[] = [
			{ exp: 0, inp: [Int32Array.from([0, 0])] },
			{ exp: 3, inp: [Int32Array.from([1, 2])] },
			{ exp: 145, inp: [Int32Array.from([1, 2, 3, 64, 75])] },
		];

		const retType: types.ReturnType = "number";
		const func: Function = wasm.sumArray;
		runTest(tests, retType, func);
	});

	test("Modular Exponentiation", (): void => {
		const tests: Test<number, number>[] = [
			{ exp: 0, inp: [0, 1000, 100] },
			{ exp: 3, inp: [2, 3, 5] },
			{ exp: 6, inp: [2, 5, 13] },
			{ exp: 12, inp: [7, 150, 13] },
			{ exp: 49, inp: [1234, 1000, 69] },
		];

		const retType: types.ReturnType = "number";
		const func: Function = wasm.modularExponentiation;
		runTest(tests, retType, func);
	});

	test("Sum ints from object", (): void => {
		interface input {
			a: number;
			b: number;
		}
		const tests: Test<number, input>[] = [
			{ exp: 0, inp: [{ a: 0, b: 0 }] },
			{ exp: 0, inp: [{ a: 1, b: -1 }] },
			{ exp: 0, inp: [{ a: -100, b: 100 }] },
			{ exp: 1, inp: [{ a: 1, b: 0 }] },
			{ exp: 1, inp: [{ a: 0, b: 1 }] },
		];

		const retType: types.ReturnType = "number";
		const func: Function = wasm.addInt_object;
		runTest(tests, retType, func);
	});

	test("Get object from C++", (): void => {
		interface obj {
			firstName: string;
			lastName: string;
			num: number;
			age: number;
			arr: number[];
		}
		const tests: Test<obj, number>[] = [
			{
				exp: {
					firstName: "Joe",
					lastName: "Smith",
					num: 10.678600311279297,
					age: 4,
					arr: [1, 2, 28, 10028],
				},
				inp: [],
			},
		];

		const retType: types.ReturnType = "object";
		const func: Function = wasm.sendObjectToJS;
		runTest(tests, retType, func);
	});
});
