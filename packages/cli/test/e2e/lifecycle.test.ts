import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

describe('Agent lifecycle: install -> configure -> run -> uninstall', () => {
  let testDir: string;
  let agentsDir: string;
  let secretsDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `agentx-e2e-${randomUUID()}`);
    agentsDir = join(testDir, 'agents');
    secretsDir = join(testDir, 'secrets');
    mkdirSync(agentsDir, { recursive: true });
    mkdirSync(secretsDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should simulate full agent lifecycle', async () => {
    // 1. Simulate install: create agent dir with agent.yaml
    const agentName = 'test-lifecycle-agent';
    const agentDir = join(agentsDir, agentName);
    mkdirSync(agentDir, { recursive: true });

    writeFileSync(join(agentDir, 'agent.yaml'), [
      'name: test-lifecycle-agent',
      'version: 1.0.0',
      'description: E2E test agent',
      'author: "@test"',
      'category: productivity',
      'permissions:',
      '  filesystem: true',
      'secrets:',
      '  - name: TEST_KEY',
      '    description: A test secret',
      '    required: true',
    ].join('\n'));

    writeFileSync(join(agentDir, 'system-prompt.md'), 'You are a test agent.');

    // Verify install
    expect(existsSync(join(agentDir, 'agent.yaml'))).toBe(true);
    expect(existsSync(join(agentDir, 'system-prompt.md'))).toBe(true);

    // 2. Simulate configure: encrypt and store secrets
    const { saveSecrets, loadSecrets, hasSecrets, deleteSecrets } = await import('../../src/secrets/store.js');

    await saveSecrets(agentName, { TEST_KEY: 'secret-value-123' }, secretsDir);

    // Verify configure
    const hasIt = await hasSecrets(agentName, secretsDir);
    expect(hasIt).toBe(true);

    const loaded = await loadSecrets(agentName, secretsDir);
    expect(loaded.TEST_KEY).toBe('secret-value-123');

    // 3. Simulate run: verify agent manifest loads correctly
    const { parse } = await import('yaml');
    const { readFileSync } = await import('node:fs');
    const { agentYamlSchema } = await import('../../src/schemas/agent-yaml.js');

    const raw = readFileSync(join(agentDir, 'agent.yaml'), 'utf-8');
    const manifest = agentYamlSchema.parse(parse(raw));
    expect(manifest.name).toBe('test-lifecycle-agent');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.secrets).toHaveLength(1);

    // Verify MCP config building with secrets
    const { resolveMCPConfig } = await import('../../src/runtime/mcp-builder.js');
    // No MCP servers in this test agent, so just verify the function works
    const resolved = resolveMCPConfig({}, loaded);
    expect(Object.keys(resolved)).toHaveLength(0);

    // 4. Simulate uninstall: remove agent and secrets
    rmSync(agentDir, { recursive: true, force: true });
    await deleteSecrets(agentName, secretsDir);

    // Verify uninstall
    expect(existsSync(agentDir)).toBe(false);
    const hasItAfter = await hasSecrets(agentName, secretsDir);
    expect(hasItAfter).toBe(false);
  });

  it('should handle agent without secrets', async () => {
    const agentName = 'no-secrets-agent';
    const agentDir = join(agentsDir, agentName);
    mkdirSync(agentDir, { recursive: true });

    writeFileSync(join(agentDir, 'agent.yaml'), [
      'name: no-secrets-agent',
      'version: 1.0.0',
      'description: Agent without secrets',
      'author: "@test"',
      'category: devtools',
      'permissions:',
      '  filesystem: true',
    ].join('\n'));

    writeFileSync(join(agentDir, 'system-prompt.md'), 'You are a simple test agent.');

    // Verify install
    expect(existsSync(join(agentDir, 'agent.yaml'))).toBe(true);

    // Verify no secrets needed
    const { hasSecrets } = await import('../../src/secrets/store.js');
    const has = await hasSecrets(agentName, secretsDir);
    expect(has).toBe(false);

    // Uninstall
    rmSync(agentDir, { recursive: true, force: true });
    expect(existsSync(agentDir)).toBe(false);
  });

  it('should handle secret update during lifecycle', async () => {
    const agentName = 'update-secrets-agent';
    const { saveSecrets, loadSecrets } = await import('../../src/secrets/store.js');

    // Initial configure
    await saveSecrets(agentName, { API_KEY: 'old-key' }, secretsDir);
    let loaded = await loadSecrets(agentName, secretsDir);
    expect(loaded.API_KEY).toBe('old-key');

    // Re-configure with new value
    await saveSecrets(agentName, { API_KEY: 'new-key' }, secretsDir);
    loaded = await loadSecrets(agentName, secretsDir);
    expect(loaded.API_KEY).toBe('new-key');
  });
});
