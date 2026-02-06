import { loadGlobalConfig } from '../config/global-config.js';

/**
 * A telemetry event sent anonymously to the registry.
 */
export interface TelemetryEvent {
  /** Scoped agent name (e.g. "@agentx/gmail-agent"). */
  agent: string;
  /** Agent version from agent.yaml. */
  version?: string;
  /** Whether the agent run completed successfully. */
  success: boolean;
  /** Run duration in milliseconds. */
  duration_ms: number;
  /** Error classification when success is false. */
  error_type?: string;
}

/**
 * Send a telemetry event to the registry API.
 *
 * - Respects the `telemetry` config flag (opt-out by setting to false).
 * - Fire-and-forget: never throws, never blocks the caller.
 */
export function sendTelemetry(event: TelemetryEvent): void {
  try {
    const config = loadGlobalConfig();

    if (!config.telemetry) {
      return;
    }

    const url = `${config.registry}/api/v1/telemetry`;

    // Fire-and-forget: we intentionally do not await this fetch.
    // Using global fetch (available in Node 18+).
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {
      // Silently ignore network errors — telemetry must never disrupt the user.
    });
  } catch {
    // Silently ignore config-loading or serialization errors.
  }
}
