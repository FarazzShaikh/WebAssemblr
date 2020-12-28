#!/usr/bin/env node

const { exec } = require("child_process");

exec("ls -la", (error: Error, stdout: string, stderr: string) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
});
