import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

const ts_CLIOverride = {
	include: ["cli/bin/*"],
	compilerOptions: {
		declaration: false,
	},
};

export default [
	// CLI
	{
		input: "./bin/wasmlr.ts",
		output: {
			file: "./dist/cli-bundle.js",
			format: "cjs",
			sourcemap: false,
			banner: "#!/usr/bin/env node",
		},
		external: ["path", "child_process", "process", "fs", "chalk", "gradient-string"],
		plugins: [typescript({ tsconfigOverride: ts_CLIOverride }), terser()],
	},
];
