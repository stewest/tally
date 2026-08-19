import { existsSync, readFileSync, writeFileSync } from "node:fs";

export const PLACEHOLDER = /^(your-|changeme|todo$|placeholder)/i;

/**
 * @param {string | undefined | null} value
 * @returns {string | undefined}
 */
export function keepIfSet(value) {
  if (value == null) {
    return undefined;
  }

  const trimmed = String(value).trim();
  if (!trimmed || PLACEHOLDER.test(trimmed) || trimmed.startsWith("(")) {
    return undefined;
  }

  return trimmed;
}

/**
 * @param {string} value
 */
export function formatEnvValue(value) {
  if (value === "") {
    return "";
  }
  if (/[\s#"']/.test(value)) {
    return `"${value.replaceAll('"', '\\"')}"`;
  }
  return value;
}

/**
 * @param {string} filePath
 * @param {Record<string, string | undefined | null>} updates
 */
export function upsertEnvFile(filePath, updates) {
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
