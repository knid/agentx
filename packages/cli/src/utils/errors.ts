export class AgentxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentxError';
  }
}

export class AgentNotFoundError extends AgentxError {
  constructor(agentName: string) {
    super(`Agent not found: ${agentName}`);
    this.name = 'AgentNotFoundError';
  }
}

export class ConfigError extends AgentxError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class AuthError extends AgentxError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class RegistryError extends AgentxError {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'RegistryError';
  }
}

export class ValidationError extends AgentxError {
  constructor(message: string, public details: string[] = []) {
    super(message);
    this.name = 'ValidationError';
  }
}
