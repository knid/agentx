# Contributing to agentx

Thanks for your interest in contributing to agentx! This guide covers development setup, testing, and pull request guidelines.

## Prerequisites

- Node.js >= 18
- npm >= 9 (ships with Node.js 18+)
- Claude CLI (for running agents locally)
- Git

## Development Setup

```bash
# Clone the repo
git clone https://github.com/agentx-dev/agentx.git
cd agentx

# Install all dependencies (workspaces are auto-linked)
npm install

# Build the CLI
npm run build --workspace=packages/cli

# Link for local development
cd packages/cli && npm link && cd ../..

# Verify it works
agentx doctor
```

## Project Structure

```
agentx/
  packages/
    cli/         # The agentx CLI tool (published to npm)
    web/         # agentx.dev - Next.js registry and website
    agents/      # Official starter agents
  specs/         # Feature specifications and design docs
```

### CLI Package (`packages/cli/`)

- **Language**: TypeScript (ESM, strict mode)
- **Build**: tsup (ESM output)
- **Test**: Vitest
- **Dependencies**: Commander.js, Zod, chalk, execa, @clack/prompts

Key directories:
- `src/commands/` - CLI command definitions (Commander.js)
- `src/runtime/` - Agent execution engine
- `src/registry/` - Registry API client
- `src/auth/` - GitHub OAuth and token management
- `src/secrets/` - AES-256-GCM secret encryption
- `src/schemas/` - Zod validation schemas
- `src/config/` - Configuration management
- `src/ui/` - Terminal UI helpers (spinner, table, colors)
- `test/` - Vitest test files

### Web Package (`packages/web/`)

- **Framework**: Next.js 15 (App Router)
- **Database**: Drizzle ORM + Neon PostgreSQL
- **Storage**: Cloudflare R2 (agent tarballs)
- **Styling**: Tailwind CSS v4

## Common Tasks

### Building

```bash
# Build CLI only
npm run build --workspace=packages/cli

# Build all packages
npm run build

# Watch mode (CLI)
npm run dev --workspace=packages/cli
```

### Testing

```bash
# Run CLI tests
npm test --workspace=packages/cli

# Watch mode
npm run test:watch --workspace=packages/cli

# With coverage
npm run test:coverage --workspace=packages/cli
```

### Type Checking

```bash
# CLI
npx tsc --noEmit --project packages/cli/tsconfig.json
```

### Linting

```bash
npm run lint --workspace=packages/cli
```

## Code Style

- **ESM imports**: All imports use `.js` extensions (TypeScript ESM requirement)
- **Error handling**: Use custom error classes from `src/utils/errors.ts`
- **UI output**: Use `src/ui/colors.ts` for colored output, respect `--no-color`
- **Async**: Use async/await, never raw Promises
- **Types**: Prefer Zod schemas with inferred types over standalone interfaces

## Writing Tests

We follow TDD: write tests first, verify they fail, then implement.

```typescript
// Example test file: test/commands/my-command.test.ts
import { describe, it, expect } from 'vitest';

describe('myCommand', () => {
  it('should do the expected thing', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

Tests use Vitest with `globals: true` so `describe`, `it`, `expect` are available globally.

## Pull Request Guidelines

1. **Branch from** `main` (or the current feature branch)
2. **One concern per PR** - keep PRs focused and reviewable
3. **Tests required** - all new code must have tests
4. **Type-safe** - `npx tsc --noEmit` must pass
5. **Tests pass** - `npm test --workspace=packages/cli` must pass

### PR Title Format

Use conventional commit style:

- `feat: add new command for X`
- `fix: resolve issue with secret encryption`
- `docs: update README with new examples`
- `refactor: simplify runner module`
- `test: add tests for download module`

### Commit Messages

- Keep the first line under 72 characters
- Use imperative mood ("add", "fix", "update", not "added", "fixed")
- Reference issues when applicable

## Adding a New CLI Command

1. Create the command file at `packages/cli/src/commands/your-command.ts`
2. Export a Commander `Command` instance
3. Wire it into `packages/cli/src/index.ts` with `program.addCommand()`
4. Add tests at `packages/cli/test/commands/your-command.test.ts`
5. Add help text with examples using `.description()` and `.addHelpText()`

Example:

```typescript
import { Command } from 'commander';
import { colors } from '../ui/colors.js';

export const myCommand = new Command('my-command')
  .description('Short description of the command')
  .argument('<required>', 'Description of required arg')
  .option('--flag', 'Description of flag')
  .action(async (arg: string, options) => {
    // Implementation
  });
```

## Reporting Issues

- Use GitHub Issues for bugs and feature requests
- Include reproduction steps for bugs
- Include your Node.js version, OS, and agentx version (`agentx doctor`)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
