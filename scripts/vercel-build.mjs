#!/usr/bin/env node
/**
 * Vercel / local production build.
 *
 * On Vercel: apply Drizzle migrations, deploy brain/ to Telos Hosted, then
 * next build. Locally: next build only (use db:push and brain deploy --env local).
 *
 * Set BRAIN_DEPLOY=0 to skip the hosted brain deploy (migrations still run).
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  main();
} catch (error) {
  console.error(`build failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

function main() {
  if (process.env.VERCEL) {
    run("npm", ["run", "db:migrate"]);
    run("npm", ["run", "brain:deploy"]);
  }

  run("npx", ["next", "build"]);
}

function run(command, args) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
