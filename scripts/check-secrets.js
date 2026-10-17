import fs from "node:fs";
import { spawnSync } from "node:child_process";
import pathModule from "node:path";
import { fileURLToPath } from "node:url";

function git(args) {
  const result = spawnSync("git", args, { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    console.error(`Falló git ${args[0]}: ${result.stderr.toString("utf8").trim()}`);
    process.exit(2);
  }
  return result.stdout;
}

const paths = (buffer) => buffer.toString("utf8").split("\0").filter(Boolean);
const forbiddenPath = (path) => {
  const name = path.split("/").at(-1).toLowerCase();
  if (name === ".env.example") return null;
  if (/^\.env(?:\..*)?$/.test(name)) return "archivo de entorno";
  if ([".npmrc", ".pypirc", ".netrc", "id_rsa", "id_ed25519"].includes(name)) return "archivo de credenciales";
  if ([".cuentas.json", ".firmantes.json", ".demo-organizador.json", ".claves.json"].includes(name) || /^(credentials|service-account[^/]*)\.json$/.test(name)) return "archivo de credenciales";
  if (/\.(?:pem|key|p12|pfx|jks|keystore|tfvars(?:\.json)?)$/.test(name)) return "archivo de claves";
  return null;
};

export function detect(path, buffer) {
  const reasons = [];
  const nameReason = forbiddenPath(path);
  if (nameReason) reasons.push(nameReason);
  if (buffer.includes(0)) return reasons;
  const body = buffer.toString("utf8");
  const rules = [
    ["bloque de clave privada", /-----BEGIN (?:[A-Z ]* )?PRIVATE KEY-----/i],
    ["token con formato conocido", /(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|(?:sk_(?:live|test)|APP_USR)-[A-Za-z0-9_-]{16,}|xox[baprs]-[A-Za-z0-9-]{20,}|glpat-[A-Za-z0-9_-]{20,})/],
    ["clave incrustada en código", /PrivateKey\.fromString(?:Der|ECDSA|ED25519)\s*\(\s*["'][^"']{20,}["']/],
    ["variable sensible con valor", /(?:^|\n)[ \t]*(?:export[ \t]+)?(?:HEDERA_PRIVATE_KEY|DEMO_DONANTE_KEY|NUCLEO_CLAVES|MP_ACCESS_TOKEN|MERCADOPAGO_ACCESS_TOKEN|VERCEL_TOKEN|AWS_SECRET_ACCESS_KEY|PRIVATE_KEY|SECRET_KEY|API_KEY|ACCESS_TOKEN|CLIENT_SECRET|PASSWORD)[ \t]*=[ \t]*["']?[^\s"'#]{4,}/im],
    ["credencial en JSON", /["'](?:private[_-]?key|api[_-]?key|client[_-]?secret|access[_-]?token|password)["']\s*:\s*["'][^"']{8,}["']/i],
  ];
  for (const [label, pattern] of rules) if (pattern.test(body)) reasons.push(label);
  return reasons;
}

function filesAtCommit(commit) {
  return paths(git(["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "-z", "--diff-filter=ACMR", commit]));
}

function check(entries) {
  let failures = 0;
  for (const { path, revision, fromWorktree } of entries) {
    let body;
    try {
      body = fromWorktree ? fs.readFileSync(path) : git(["show", revision === ":" ? `:${path}` : `${revision}:${path}`]);
    } catch (error) {
      console.error(`No se pudo leer ${path}: ${error.message}`);
      process.exit(2);
    }
    const reasons = detect(path, body);
    if (reasons.length) {
      console.error(`BLOQUEADO ${path}${revision && revision !== ":" ? ` (${revision.slice(0, 8)})` : ""}: ${reasons.join(", ")}`);
      failures++;
    }
  }
  if (failures) {
    console.error(`Se encontraron ${failures} archivo(s) riesgosos. Quitalos del commit y rotá cualquier clave que ya se haya compartido.`);
    process.exit(1);
  }
  console.log(`Revisión de secretos: ${entries.length} archivo(s), sin hallazgos.`);
}

const mode = process.argv[2];
if (process.argv[1] && pathModule.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let entries;
  if (mode === "--staged") {
    entries = paths(git(["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR"]))
      .map((path) => ({ path, revision: ":" }));
  } else if (mode === "--tracked") {
    entries = paths(git(["ls-files", "-z"])).map((path) => ({ path, fromWorktree: true }));
  } else if (mode === "--range" || mode === "--outgoing") {
    const ranges = mode === "--range" ? [process.argv[3]] : fs.readFileSync(0, "utf8").trim().split("\n").filter(Boolean).map((line) => {
      const [localRef, localSha, , remoteSha] = line.trim().split(/\s+/);
      if (localSha === "0000000000000000000000000000000000000000") return null;
      return remoteSha === "0000000000000000000000000000000000000000"
        ? `${localSha} --not --remotes`
        : `${remoteSha}..${localSha}`;
    }).filter(Boolean);
    if (mode === "--outgoing" && ranges.length === 0) ranges.push("HEAD --not --remotes");
    if (ranges.some((range) => !range)) { console.error("Falta el rango de commits."); process.exit(2); }
    const commits = new Set(ranges.flatMap((range) => git(["rev-list", "--reverse", ...range.split(" ")]).toString("utf8").split(/\r?\n/).filter(Boolean)));
    entries = [...commits].flatMap((commit) => filesAtCommit(commit).map((path) => ({ path, revision: commit })));
  } else {
    console.error("Uso: node scripts/check-secrets.js --staged | --tracked | --range BASE..HEAD | --outgoing");
    process.exit(2);
  }
  check(entries);
}
