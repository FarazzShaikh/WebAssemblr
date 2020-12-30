#!/usr/bin/env node

import yargs, { Argv, exit, Options } from "yargs";
import { exec } from "child_process";
import path from "path";

type Argv_Type = {
  [x: string]: unknown;
  input: (string | number)[] | undefined;
  output: string | undefined;
  _: (string | number)[];
  $0: string;
};

const argv: Argv_Type = yargs
  .option("input", {
    description: "Path of input C/C++ files.",
    alias: "i",
    type: "array",
  })
  .option("output", {
    description: "Path of resulting WASM and preamble.js file",
    alias: "o",
    type: "string",
  })
  .help()
  .alias("help", "h").argv;

if (argv.input) {
  const input = argv.input.join(" ");
  const output = argv.output ? `${argv.output}/wasm.js` : "./wasm.js";

  const command: string = `emcc --no-entry ${input} -s WASM=1 -s MODULARIZE=1 -s EXPORTED_FUNCTIONS=\"['_malloc', '_free']\" -s EXTRA_EXPORTED_RUNTIME_METHODS=\"['ccall']\" -o ${output}`;
  execCommand(command);
} else {
  console.log(
    "Please provide path to C/C++ files to be compiled. Run -h for help."
  );
}

function execCommand(command: string) {
  exec("emcc --version", (error, stdout, stderr) => {
    if (error !== null) {
      console.log(
        "There Seems to be an issue with your instalations of Emscripten."
      );
      console.log(
        'Make sure you have the latest verison of Emscripten installed, or "emcc" exported in $PATH '
      );
    } else {
      exec(command, (error, stdout, stderr) => {
        console.log(stdout);
        if (error !== null) {
          console.log("exec error: " + error);
        }
      });
    }
  });
}
