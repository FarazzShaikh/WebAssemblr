import fs from "fs";
import path from "path";
import chalk from "chalk";
import gradient from "gradient-string";
import { version } from "../package.json";

enum COLORS {
	RED = "FF9C81",
	GREEN = "E6FCA1",
}

export const Print = {
	title: (): void => {
		const logo: string = fs.readFileSync(path.resolve(__dirname, "./logo.txt"), "ascii");
		console.log(gradient(["#654ff0", "#b4a4f4"])(logo));
	},
	error: (message: string): void => {
		console.log(chalk.hex(COLORS.RED)(message));
	},
	help: (): void => {
		console.log(`
    ${chalk.bold`Usage:`}
        wasmlr -i <input file> -o <output file> -z [<Optimization level>]
        wasmlr -i <input file> -o <output file> -z [<Optimization level>] -a [<Emscripten options>]

    ${chalk.bold`Options:`}
        -i      ${chalk.hex(COLORS.RED)(`[Required]`)}      ${chalk.italic(`Specify input File.`)}
        -o      ${chalk.hex(COLORS.RED)(`[Required]`)}      ${chalk.italic(`Specify output File.`)}
        -e      ${chalk.hex(COLORS.GREEN)(`[Optional]`)}      ${chalk.italic(`Extra options for Emscripten.`)}
        -z      ${chalk.hex(COLORS.GREEN)(`[Optional]`)}      ${chalk.italic(`Emscripten compiler optimization Level.`)}

        -h      ${chalk.hex(COLORS.GREEN)(`[Optional]`)}      ${chalk.italic(`Help.`)}
        -v      ${chalk.hex(COLORS.GREEN)(`[Optional]`)}      ${chalk.italic(`WebAssemblr Version.`)}

    ${chalk.bold`Example:`}
        wasmlr -i ./cpp/* -o ./wasm/wasmlr.wasm -z Os -a EXPORTED_FUNCTIONS="['_malloc', '_free']"
      `);
	},
	success: (message: string) => {
		console.log(chalk.hex(COLORS.GREEN)(message));
	},
	version: function (): void {
		console.log(`
        ${chalk.bold`WebAssemblr (WASMlr) - ${chalk.hex(COLORS.GREEN)(version)}`}

        ${chalk.bold`By:`}
            ${chalk.italic`Faraz Shaikh:`}
                https://github.com/FarazzShaikh

        ${chalk.bold`Credits:`}
            ${chalk.italic`Shubham Gupto:`} Lending a hand with C++ Tests.
                https://github.com/IamShubhamGupto

        ${chalk.bold.hex(COLORS.RED)(`Star me on GitHub!:`)}
            https://github.com/FarazzShaikh/WebAssemblr
        `);
	},
};
