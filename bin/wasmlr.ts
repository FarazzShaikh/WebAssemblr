#!/usr/bin/env node

import path from "path";
import { exec, ExecException } from "child_process";
import { Print } from "./utils";
import { exit } from "process";

(async function () {
	console.clear();
	const args: string[] = process.argv.slice(2);

	const argMap: Record<string, string[]> = {
		i: [],
		o: [],
		e: [],
		f: [],
		z: [],

		h: [],
		v: [],
	};

	let key = "";
	for (const arg of args) {
		if (arg.startsWith("-") && !arg.startsWith("--")) {
			const option = arg.split("-")[1];
			if (!(option in argMap)) {
				Print.error(`Unknown argument "${arg}"`);
				Print.help();
				exit(0);
			} else {
				key = option;
			}
		}

		if (key === "h") {
			Print.title();
			Print.help();
			exit(0);
		}

		if (key === "v") {
			Print.title();
			Print.version();
			exit(0);
		}

		if (arg.split("-")[1] !== key) argMap[key].push(arg);
	}

	if (argMap.i.length <= 0 || argMap.o.length <= 0) {
		Print.error(`Please provide required arguments`);
		Print.help();
		exit(0);
	}

	let emccOpts = "";
	argMap.e.forEach((o, i) => {
		if (i > 0 && i < argMap.e.length) emccOpts += " -s " + o;
		else emccOpts += o;
	});
	const filename = path.normalize(argMap.o[0].includes(".wasm") ? argMap.o[0] : `${argMap.o[0]}/wasm.wasm`);

	const command = `emcc \
    -${argMap.z[0] || "Os"} \
    ${argMap.i.join(" ")} \
    -s WASM=1 \
    -s EXPORTED_FUNCTIONS=\"['_malloc', '_free']\" \
    -I./lib/msgpack-c/include \
    -o ${filename} \
    ${argMap.f.join(" ")} \
    ${emccOpts ? "-s " + emccOpts : ""}`.replace(/  +/g, " ");

	execCommand(command);

	function execCommand(command: string) {
		exec("emcc --version", (error, stdout, stderr) => {
			if (error !== null) {
				Print.error("There Seems to be an issue with your instalations of Emscripten.");
				Print.error('Make sure you have the latest verison of Emscripten installed, or "emcc" exported in $PATH ');
			} else {
				Print.success(`Generating...`);
				exec(command, (error: ExecException | null) => {
					if (error !== null) {
						Print.error("exec error: " + error);
					} else {
						Print.success(`WASM Generated - ${filename}`);
					}
				});
			}
		});
	}
})();
