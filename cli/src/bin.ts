#!/usr/bin/env node
import { createRequire } from 'node:module';
import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { resumeCommand } from './commands/resume.js';
import { listCommand } from './commands/list.js';
import { statusCommand } from './commands/status.js';
import { validateCommand } from './commands/validate.js';
import { exportCommand } from './commands/export.js';
import { installCommand } from './commands/install.js';
import { doctorCommand } from './commands/doctor.js';
import { versionCommand } from './commands/version.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const program = new Command();
program.name('continuity').version(pkg.version).description('Cross-harness structured handoff — create/resume local .continuity artifacts');

program.command('create').argument('[goal]', 'original goal').option('--yes', 'skip interview').option('--full-patch', 'include full patch in preview').option('--auto', 'auto-save mode').option('--allow-secrets', 'allow secrets in patch').option('--cwd <path>', 'working directory').action((goal, opts) => { void createCommand(goal || 'handoff', opts); });

program.command('resume').argument('[id]', 'handoff id or latest', 'latest').option('--json', 'output json').option('--yes', 'force despite drift').option('--cwd <path>', 'working directory').action((id, opts) => { void resumeCommand(id, opts); });

program.command('list').option('--json', 'json output').option('--all', 'include all').option('--repo', 'filter to current repo').option('--cwd <path>', 'working directory').action((opts) => { void listCommand(opts); });

program.command('status').argument('[id]', 'handoff id or latest', 'latest').option('--json', 'json').option('--full-patch', 'include patch').option('--cwd <path>', 'working directory').action((id, opts) => { void statusCommand(id, opts); });

program.command('validate').argument('[id]', 'handoff id or latest', 'latest').option('--fix', 'fix and normalize').option('--cwd <path>', 'working directory').action((id, opts) => { void validateCommand(id, opts); });

program.command('export').argument('<id>', 'handoff id').option('--zip', 'zip to ~/.continuity/exports').option('--stdout', 'print state.json to stdout').option('--gist', 'hint gist via gh').option('--cwd <path>', 'working directory').action((id, opts) => { void exportCommand(id, opts); });

program.command('install').option('--harness <h>', 'claude|codex|cursor|opencode|all', 'all').option('--dry-run', 'preview').option('--cwd <path>', 'working directory').action((opts) => { void installCommand(opts); });

program.command('doctor').action(() => { void doctorCommand({}); });

program.command('version').action(() => { void versionCommand(); });

program.parseAsync(process.argv);
