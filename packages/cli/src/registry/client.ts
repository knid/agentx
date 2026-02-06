import { ofetch } from 'ofetch';
import { loadGlobalConfig } from '../config/global-config.js';
import { RegistryError } from '../utils/errors.js';

/**
 * Options for creating a registry client.
 */
interface RegistryClientOptions {
  /** Bearer token for authenticated requests. */
  token?: string;
}

/**
 * A typed HTTP client for the agentx registry API.
 */
interface RegistryClient {
  /** Send a GET request to the registry. */
  get<T>(path: string): Promise<T>;
  /** Send a POST request to the registry. */
  post<T>(path: string, body: unknown): Promise<T>;
  /** Send a PUT request to the registry. */
  put<T>(path: string, body: FormData | unknown): Promise<T>;
}

/**
 * Wrap an ofetch error into a typed RegistryError.
 */
function toRegistryError(error: unknown): RegistryError {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    const message =
      (error as { data?: { message?: string } }).data?.message ??
      `Registry request failed with status ${status}`;
    return new RegistryError(message, status);
  }
  return new RegistryError(
    `Registry request failed: ${(error as Error).message}`,
  );
}

/**
 * Create a typed HTTP client for the agentx registry API.
 *
 * The client uses the registry URL from the global config as the base URL
 * and automatically adds `/api/v1` to all request paths.
 *
 * @param options - Optional configuration including an auth token.
 * @returns A client object with `get`, `post`, and `put` methods.
 */
export function createRegistryClient(options?: RegistryClientOptions): RegistryClient {
  const config = loadGlobalConfig();
  const baseURL = `${config.registry}/api/v1`;

  const authHeaders: Record<string, string> = {};
  if (options?.token) {
    authHeaders['Authorization'] = `Bearer ${options.token}`;
  }

  return {
    async get<T>(path: string): Promise<T> {
      try {
        return await ofetch<T>(path, {
          baseURL,
          method: 'GET',
          headers: authHeaders,
        });
      } catch (error) {
        throw toRegistryError(error);
      }
    },

    async post<T>(path: string, body: unknown): Promise<T> {
      try {
        return await ofetch<T>(path, {
          baseURL,
          method: 'POST',
          headers: authHeaders,
          body: body as Record<string, unknown>,
        });
      } catch (error) {
        throw toRegistryError(error);
      }
    },

    async put<T>(path: string, body: FormData | unknown): Promise<T> {
      try {
        // When body is FormData, ofetch sets the Content-Type automatically.
        return await ofetch<T>(path, {
          baseURL,
          method: 'PUT',
          headers: authHeaders,
          body: body as Record<string, unknown>,
        });
      } catch (error) {
        throw toRegistryError(error);
      }
    },
  };
}
