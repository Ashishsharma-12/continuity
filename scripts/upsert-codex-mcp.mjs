#!/usr/bin/env node
/**
 * Upsert [mcp_servers.continuity] in a Codex config.toml.
 * Usage: node scripts/upsert-codex-mcp.mjs <config.toml> <path-to-mcp.js>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const configPath = process.argv[2];
const mcpJs = process.argv[3];

if (!configPath || !mcpJs) {
  console.error(
    "usage: node scripts/upsert-codex-mcp.mjs <config.toml> <mcp.js>",
  );
  process.exit(1);
}

mkdirSync(dirname(configPath), { recursive: true });
const raw = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
const lines = raw.split(/\r?\n/);
const kept = [];
let skipping = false;

for (const line of lines) {
  const trimmed = line.trim();
  if (
    trimmed.startsWith("#") &&
    /Continuity MCP/i.test(trimmed)
  ) {
    continue;
  }
  // Orphaned leftover from a broken prior merge (bare TOML string-array line).
  if (/^\["[^"]*mcp\.js"\]\s*$/.test(trimmed)) {
    continue;
  }

  const header = line.match(/^\[([^\]]+)\]\s*$/);
  if (header) {
    const name = header[1];
    skipping =
      name === "mcp_servers.continuity" ||
      name.startsWith("mcp_servers.continuity.");
    if (skipping) continue;
  }
  if (skipping) continue;
  kept.push(line);
}

while (kept.length && kept[kept.length - 1].trim() === "") kept.pop();

const esc = mcpJs.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const block = [
  "# Continuity MCP — stdio entry (local dist)",
  "[mcp_servers.continuity]",
  'command = "node"',
  `args = ["${esc}"]`,
  "",
].join("\n");

const body = kept.join("\n").trimEnd();
writeFileSync(configPath, (body ? body + "\n\n" : "") + block);
