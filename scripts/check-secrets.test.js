import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { detect } from "./check-secrets.js";

const scan = (name, text) => detect(name, Buffer.from(text));

test("bloquea archivos de entorno y claves aunque su contenido parezca inocente", () => {
  assert.ok(scan("hedera/.env.production", "hola").length);
  assert.ok(scan("certs/operador.pem", "hola").length);
  assert.ok(scan("hedera/.cuentas.json", "{}").length);
  assert.ok(scan("contratos/.claves.json", "{}").length);
});

test("detecta credenciales en archivos con nombres normales", () => {
  const variable = `${"HEDERA"}_${"PRIVATE_KEY"}=abcdef0123456789`;
  const json = `{"${"private"}_${"key"}":"abcdef0123456789"}`;
  assert.ok(scan("src/config.js", variable).length);
  assert.ok(scan("src/config.json", json).length);
});

test("permite el ejemplo vacío y los identificadores públicos de Hedera", () => {
  assert.deepEqual(scan(".env.example", "HEDERA_PRIVATE_KEY=\nREGISTRO_TOPIC_ID=0.0.123456"), []);
  assert.deepEqual(scan("hedera/estado.json", '{"registroTopicId":"0.0.123456"}'), []);
});

test("rechaza un secreto preparado para commit sin mostrar su valor", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "colectas-secret-test-"));
  const run = (command, args) => spawnSync(command, args, { cwd: dir, encoding: "utf8" });
  try {
    assert.equal(run("git", ["init", "-q"]).status, 0);
    const secret = "abcdef0123456789";
    fs.writeFileSync(path.join(dir, "config.js"), `${"HEDERA"}_${"PRIVATE_KEY"}=${secret}\n`);
    assert.equal(run("git", ["add", "config.js"]).status, 0);
    const script = fileURLToPath(new URL("./check-secrets.js", import.meta.url));
    const result = run(process.execPath, [script, "--staged"]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /BLOQUEADO config\.js/);
    assert.ok(!result.stderr.includes(secret));
  } finally {
    if (path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep)) fs.rmSync(dir, { recursive: true, force: true });
  }
});
