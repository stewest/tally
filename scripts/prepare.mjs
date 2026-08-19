#!/usr/bin/env node
/**
 * Local install for this template.
 *
 * Runs on `npm install` (npm prepare lifecycle) and `npm run prepare`.
 * Skip with CI=1 or TEL_SKIP_PREPARE=1.
 *
 * After this finishes, fill ANTHROPIC_API_KEY, VOYAGE_API_KEY, and any
 * remaining MY_APP_* values in brain/.env.local. BRAIN_API_KEY is copied from
 * `brain start` (status box and brain.lock local.apiKey) into .env and
 * brain/.env.local. If start cannot re-print the key (instance already in the
 * Docker volume) and neither env file has a real value, prepare runs
 * `brain stop --project-id <compose> --reset` and starts again so a new key
 * can be issued.
 */

import { execFileSync, spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appEnvPath = join(root, ".env");
const appEnvExamplePath = join(root, ".env.example");
const brainDir = join(root, "brain");
const brainEnvPath = join(brainDir, ".env.local");
const brainEnvExamplePath = join(brainDir, ".env.example");

const PLACEHOLDER = /^(your-|changeme|todo$|placeholder)/i;

main().catch((error) => {
  console.error(`\nprepare failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});

async function main() {
  const skipReason = getSkipReason();
  if (skipReason) {
    console.log(`Skipping local stack prepare (${skipReason}).`);
    return;
  }

  console.log("Preparing local Supabase + Brain…\n");

  requireOnPath("supabase", "Install the Supabase CLI: brew install supabase/tap/supabase");
  requireDocker();

  step("Starting Supabase");
  run("supabase", ["start"], { cwd: root });

  step("Writing Supabase keys into .env");
  ensureCopied(appEnvExamplePath, appEnvPath);
  upsertEnvFile(appEnvPath, readSupabaseEnv());

  if (shouldInstallAppDeps()) {
    step("Installing npm dependencies");
    run("npm", ["install", "--ignore-scripts"], { cwd: root });
  } else {
    console.log("• npm install already in progress — skipping nested install");
  }

  step("Installing latest @telos.ready/brain globally");
  run("npm", ["install", "-g", "@telos.ready/brain@latest"]);
  requireOnPath(
    "brain",
    "Global Brain CLI was installed but is not on PATH. Open a new terminal and re-run npm run prepare.",
  );

  step("Generating shared tool API key");
  const toolApiKey = resolveToolApiKey();
  upsertEnvFile(appEnvPath, {
    TOOL_API_KEY: toolApiKey,
    BRAIN_URL: keepIfSet(readEnvValue(appEnvPath, "BRAIN_URL")) ?? "http://127.0.0.1:60061",
  });

  step("Starting Brain");
  let startOutput = await runAndCapture("brain", ["start"], { cwd: brainDir });

  // Let `brain start` create `.env.local` when it is missing so it can seed
  // the well-known TELOS_* local keys. Only fall back to the example if the
  // file still is not there, then write the shared tool handshake and the
  // execution API key announced at start (status box + brain.lock local.apiKey).
  ensureBrainEnvFile();

  let { announcedBrainApiKey, existingAppBrainApiKey, existingBrainEnvApiKey, brainApiKey } =
    resolveBrainApiKeys(startOutput);

  // Fresh checkout with a leftover Docker volume: createBrain 409s, lock gets
  // `(already created — …)`, and the key cannot be retrieved. Reset only when
  // no real key exists in lock, stdout, or either env file.
  if (!brainApiKey) {
    startOutput = await resetLocalBrainVolumeAndRestart();
    ensureBrainEnvFile();
    ({ announcedBrainApiKey, existingAppBrainApiKey, existingBrainEnvApiKey, brainApiKey } =
      resolveBrainApiKeys(startOutput));
  }

  upsertEnvFile(brainEnvPath, {
    MY_APP_API_KEY: toolApiKey,
    MY_APP_API_URL:
      keepIfSet(readEnvValue(brainEnvPath, "MY_APP_API_URL")) ??
      "http://host.docker.internal:3000",
    ...(shouldWriteBrainApiKey(existingBrainEnvApiKey, announcedBrainApiKey)
      ? { BRAIN_API_KEY: brainApiKey }
      : {}),
  });

  if (brainApiKey && shouldWriteBrainApiKey(existingAppBrainApiKey, announcedBrainApiKey)) {
    upsertEnvFile(appEnvPath, { BRAIN_API_KEY: brainApiKey });
  }

  if (brainApiKey) {
    console.log("  BRAIN_API_KEY is set in .env and brain/.env.local");
  } else {
    console.log(
      "  BRAIN_API_KEY was not announced. The execution key is shown only once at create. Reset the local volume and start again: `brain stop --project-id <compose-from-brain-status> --reset`, then `npm run prepare`.",
    );
  }

  console.log(`
Local stack is up.

Still required in brain/.env.local (this script does not set these):
  ANTHROPIC_API_KEY
  VOYAGE_API_KEY
  any other MY_APP_* values you need (MY_APP_API_KEY was generated;
  MY_APP_API_URL defaults to http://host.docker.internal:3000)

Next:
  npm run db:push
  cd brain && brain deploy --env local --instance local-brain
  npm run dev          # open http://localhost:3000

App .env TOOL_API_KEY and brain/.env.local MY_APP_API_KEY now match.
`);

  if (brainApiKey) {
    console.log("App .env BRAIN_API_KEY and brain/.env.local BRAIN_API_KEY now match.\n");
  }
}

function getSkipReason() {
  if (truthy(process.env.CI) || truthy(process.env.TEL_SKIP_PREPARE)) {
    return process.env.TEL_SKIP_PREPARE ? "TEL_SKIP_PREPARE" : "CI";
  }

  const command = process.env.npm_command;
  if (command === "ci" || command === "pack" || command === "publish" || command === "rebuild") {
    return `npm ${command}`;
  }

  return null;
}

function shouldInstallAppDeps() {
  return process.env.npm_command !== "install";
}

function readSupabaseEnv() {
  const raw = execFileSync("supabase", ["status", "-o", "json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  const status = parseJsonObject(raw);
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: status.SECRET_KEY,
    POSTGRES_URL: status.DB_URL,
  };

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      throw new Error(`supabase status did not include a value for ${key}`);
    }
  }

  return required;
}

function resolveToolApiKey() {
  const existing = keepIfSet(readEnvValue(appEnvPath, "TOOL_API_KEY"));
  if (existing) {
    console.log("  Reusing existing TOOL_API_KEY");
    return existing;
  }

  return generateApiKey();
}

function ensureBrainEnvFile() {
  if (!existsSync(brainEnvPath)) {
    ensureCopied(brainEnvExamplePath, brainEnvPath);
  }
}

function resolveBrainApiKeys(startOutput) {
  const announcedBrainApiKey =
    keepIfSet(readLocalLockApiKey()) ?? keepIfSet(parseAnnouncedBrainApiKey(startOutput));
  const existingAppBrainApiKey = keepIfSet(readEnvValue(appEnvPath, "BRAIN_API_KEY"));
  const existingBrainEnvApiKey = keepIfSet(readEnvValue(brainEnvPath, "BRAIN_API_KEY"));
  return {
    announcedBrainApiKey,
    existingAppBrainApiKey,
    existingBrainEnvApiKey,
    brainApiKey: announcedBrainApiKey ?? existingBrainEnvApiKey ?? existingAppBrainApiKey,
  };
}

async function resetLocalBrainVolumeAndRestart() {
  const composeProject = readComposeProjectId();
  if (!composeProject) {
    console.log("  Could not determine Compose project id; skipping Brain volume reset.");
    return "";
  }

  console.log("  No BRAIN_API_KEY found — resetting local Brain volume and restarting...");
  try {
    run("brain", ["stop", "--project-id", composeProject, "--reset"], { cwd: brainDir });
  } catch (error) {
    console.log(
      `  brain stop --reset failed (${error instanceof Error ? error.message : error}). Continuing without a new key.`,
    );
    return "";
  }

  return runAndCapture("brain", ["start"], { cwd: brainDir });
}

function generateApiKey() {
  try {
    return execFileSync("openssl", ["rand", "-hex", "32"], { encoding: "utf8" }).trim();
  } catch {
    return randomBytes(32).toString("hex");
  }
}

function keepIfSet(value) {
  if (!value || PLACEHOLDER.test(value) || value.startsWith("(")) {
    return undefined;
  }
  return value;
}

function shouldWriteBrainApiKey(existing, announced) {
  return Boolean(announced || !existing);
}

function parseAnnouncedBrainApiKey(output) {
  const text = String(output).replace(/\u001b\[[0-9;]*m/g, "");
  const boxMatch = text.match(/Brain API Key\s*[│|]\s*(\S+)/i);
  if (boxMatch?.[1]) {
    return boxMatch[1].replace(/[│|]+$/g, "").trim();
  }

  const onceMatch = text.match(/Save this API key now[^\n]*\n\s+(\S+)/i);
  return onceMatch?.[1]?.trim();
}

function readLockFile() {
  const lockPath = join(brainDir, "brain.lock");
  if (!existsSync(lockPath)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(readFileSync(lockPath, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

function readLocalLockApiKey() {
  const local = readLockFile()?.local;
  if (!local || typeof local !== "object" || Array.isArray(local)) {
    return undefined;
  }

  if (typeof local.apiKey !== "string") {
    return undefined;
  }

  return local.apiKey.trim();
}

function readComposeProjectId() {
  const local = readLockFile()?.local;
  const composeProject =
    local && typeof local === "object" && !Array.isArray(local) && typeof local.composeProject === "string"
      ? local.composeProject.trim()
      : "";
  if (composeProject) {
    return composeProject;
  }

  const configPath = join(brainDir, "brain.config.toml");
  if (!existsSync(configPath)) {
    return undefined;
  }

  const match = readFileSync(configPath, "utf8").match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  const projectId = match?.[1]?.trim();
  if (!projectId) {
    return undefined;
  }

  return projectId.endsWith("-brain") ? projectId : `${projectId}-brain`;
}

function readEnvValue(filePath, key) {
  if (!existsSync(filePath)) {
    return undefined;
  }

  const match = readFileSync(filePath, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!match) {
    return undefined;
  }

  return stripQuotes(match[1].replace(/\r$/, "").trim());
}

function upsertEnvFile(filePath, updates) {
  let content = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  if (content.length > 0 && !content.endsWith("\n")) {
    content += "\n";
  }

  for (const [key, raw] of Object.entries(updates)) {
    if (raw === undefined || raw === null) {
      continue;
    }

    const line = `${key}=${formatEnvValue(String(raw))}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(content)) {
      content = content.replace(pattern, line);
    } else {
      content += `${line}\n`;
    }
  }

  writeFileSync(filePath, content);
}

function formatEnvValue(value) {
  if (/[\s#"']/.test(value)) {
    return `"${value.replaceAll('"', '\\"')}"`;
  }
  return value;
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function ensureCopied(from, to) {
  if (!existsSync(to)) {
    if (!existsSync(from)) {
      throw new Error(`Missing ${from}`);
    }
    copyFileSync(from, to);
  }
}

function parseJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("supabase status did not return JSON");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function requireOnPath(binary, hint) {
  const result = spawnSync(binary, ["--version"], { stdio: "ignore" });
  if (result.error || result.status !== 0) {
    throw new Error(`${binary} is not available. ${hint}`);
  }
}

function requireDocker() {
  requireOnPath("docker", "Open Docker Desktop (or install Docker Engine).");
  const info = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (info.error || info.status !== 0) {
    throw new Error("Docker is installed but the daemon is not running. Open Docker Desktop and retry.");
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: options.cwd ?? root,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${result.status}`);
  }
}

function runAndCapture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: process.env,
    });
    let output = "";

    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      output += text;
      process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
        return;
      }
      resolve(output);
    });
  });
}

function step(label) {
  console.log(`\n• ${label}`);
}

function truthy(value) {
  return value === "1" || value === "true" || value === "yes";
}
