import chalk from 'chalk';

const noColor = process.env.NO_COLOR !== undefined || process.argv.includes('--no-color');

const identity = (s: string) => s;

export const colors = {
  success: noColor ? identity : chalk.green,
  error: noColor ? identity : chalk.red,
  warn: noColor ? identity : chalk.yellow,
  info: noColor ? identity : chalk.blue,
  dim: noColor ? identity : chalk.dim,
  bold: noColor ? identity : chalk.bold,
  cyan: noColor ? identity : chalk.cyan,
  magenta: noColor ? identity : chalk.magenta,
};
