import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * How to run the pinned Brain CLI. Prefer the package dist entry — npm's
 * `.bin/brain` copy of index.js cannot resolve `./commands/*`.
 *
 * @param {string} root repo root
 * @returns {{ command: string, extraArgs: string[], display: string } | undefined}
 */
export function resolveBrainCli(root) {
  const dist = join(root, "node_modules", "@telos.ready", "brain", "dist", "index.js");
  if (existsSync(dist)) {
    return { command: process.execPath, extraArgs: [dist], display: "brain" };
  }

  const onPath = spawnSync("brain", ["--version"], { stdio: "ignore" });
  if (!onPath.error && onPath.status === 0) {
    return { command: "brain", extraArgs: [], display: "brain" };
  }

  return undefined;
}

/**
 * @param {string} brainDir
 * @returns {Record<string, unknown> | undefined}
 */
export function readLockFile(brainDir) {
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

/**
 * Compose project id: `brain.lock` `local.composeProject`, else
 * `brain.config.toml` `project_id` with a `-brain` suffix.
 *
 * @param {string} brainDir
 * @returns {string | undefined}
 */
export function readComposeProjectId(brainDir) {
  const local = readLockFile(brainDir)?.local;
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

/**
 * @param {string} brainDir
 * @returns {string | undefined}
 */
export function readLocalLockApiKey(brainDir) {
  const local = readLockFile(brainDir)?.local;
  if (!local || typeof local !== "object" || Array.isArray(local)) {
    return undefined;
  }

  if (typeof local.apiKey !== "string") {
    return undefined;
  }

  return local.apiKey.trim();
}
