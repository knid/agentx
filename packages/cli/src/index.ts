import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runCommand } from './commands/run.js';
import { configureCommand } from './commands/configure.js';
import { initCommand } from './commands/init.js';
import { validateCommand } from './commands/validate.js';
import { testCommand } from './commands/test.js';
import { doctorCommand } from './commands/doctor.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { whoamiCommand } from './commands/whoami.js';
import { publishCommand } from './commands/publish.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('agentx')
  .description('The package manager for AI agents powered by Claude Code')
  .version(pkg.version);

program.addCommand(runCommand);
program.addCommand(configureCommand);
program.addCommand(initCommand);
program.addCommand(validateCommand);
program.addCommand(testCommand);
program.addCommand(doctorCommand);
program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(whoamiCommand);
program.addCommand(publishCommand);

program.parse();
