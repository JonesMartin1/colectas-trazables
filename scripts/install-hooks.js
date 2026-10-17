import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const git = (args) => spawnSync("git", args, { encoding: "utf8" });
if (git(["rev-parse", "--is-inside-work-tree"]).status !== 0) process.exit(0);

const current = git(["config", "--local", "--get", "core.hooksPath"]);
const path = current.stdout.trim().replaceAll("\\", "/");
if (current.status === 0 && path && path !== ".githooks") {
  console.warn(`Hooks existentes en ${path}. Ejecutá npm run secrets:check antes de cada commit y npm run secrets:check-all antes de subir cambios.`);
  process.exit(0);
}

for (const name of ["pre-commit", "pre-push"]) {
  fs.chmodSync(fileURLToPath(new URL(`../.githooks/${name}`, import.meta.url)), 0o755);
}

const installed = git(["config", "--local", "core.hooksPath", ".githooks"]);
if (installed.status !== 0) {
  console.error("No se pudieron activar los hooks de Git:", installed.stderr.trim());
  process.exit(1);
}
console.log("Hooks de seguridad activos (.githooks).");
