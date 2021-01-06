import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";

const ts_webOverride = {
	include: ["src/*"],
	compilerOptions: {
		target: "ESNext",
		module: "ESNext",
		outDir: "./lib/web/",

		lib: ["es2015", "dom"],
		moduleResolution: "Node",
	},
};

const ts_CLIOverride = {
	include: ["cli/bin/*"],
	compilerOptions: {
		declaration: false,
	},
};

export default [
	// NODE
	{
		input: "./src/WebAssemblr.ts",
		output: {
			file: "./lib/node/node-bundle.js",
			format: "cjs",
			sourcemap: true,
		},

		plugins: [typescript({ tsconfig: "tsconfig.json" }), terser()],
	},
	// WEB
	{
		input: "./src/WebAssemblr.ts",
		output: {
			file: "./lib/web/web-bundle.js",
			format: "es",
			sourcemap: true,
		},

		plugins: [typescript({ tsconfig: "tsconfig.json", tsconfigOverride: ts_webOverride }), terser()],
	},

	// NODE TYPES
	{
		input: "./lib/node/src/WebAssemblr.d.ts",
		output: [{ file: "./lib/node/node-bundle.d.ts", format: "cjs" }],
		plugins: [dts()],
	},

	// WEB
	{
		input: "./lib/web/src/WebAssemblr.d.ts",
		output: [{ file: "./lib/web/web-bundle.d.ts", format: "es" }],
		plugins: [dts()],
	},
];
