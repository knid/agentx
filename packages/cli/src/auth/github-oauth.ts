import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { platform } from 'node:os';
import { ofetch } from 'ofetch';
import type { AuthToken } from '../types/config.js';
import type { AuthResponse } from '../types/registry.js';
import { AuthError } from '../utils/errors.js';

/**
 * Open a URL in the user's default browser.
 * Uses platform-specific commands: `open` on macOS, `xdg-open` on Linux,
 * and `cmd /c start` on Windows.
 */
function openBrowser(url: string): void {
  const os = platform();
  try {
    switch (os) {
      case 'darwin':
        execFileSync('open', [url]);
        break;
      case 'linux':
        execFileSync('xdg-open', [url]);
        break;
      case 'win32':
        execFileSync('cmd', ['/c', 'start', url.replace(/&/g, '^&')]);
        break;
      default:
        throw new AuthError(`Unsupported platform: ${os}. Please open this URL manually: ${url}`);
    }
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(`Failed to open browser. Please open this URL manually: ${url}`);
  }
}

/**
 * Parse the query string from a URL path (e.g. "/callback?code=X&state=Y").
 */
function parseQuery(url: string): URLSearchParams {
  const qIndex = url.indexOf('?');
  if (qIndex === -1) return new URLSearchParams();
  return new URLSearchParams(url.slice(qIndex + 1));
}

/**
 * Start the GitHub OAuth flow for CLI authentication.
 *
 * 1. Spins up a temporary HTTP server on a random localhost port.
 * 2. Requests a GitHub auth URL from the registry.
 * 3. Opens the URL in the user's default browser.
 * 4. Waits for the callback with an authorization code.
 * 5. Exchanges the code for a token via the registry.
 * 6. Shuts down the temporary server and returns the AuthToken.
 *
 * @param registryUrl - Base URL of the agentx registry (e.g. "https://registry.agentx.dev").
 * @returns The authenticated user's token data.
 */
export function startOAuthFlow(registryUrl: string): Promise<AuthToken> {
  return new Promise<AuthToken>((resolve, reject) => {
    const state = randomBytes(16).toString('hex');
    const server = createServer();

    // Timeout after 5 minutes if the user never completes the flow.
    const timeout = setTimeout(() => {
      server.close();
      reject(new AuthError('OAuth flow timed out after 5 minutes'));
    }, 5 * 60 * 1000);

    server.on('request', async (req, res) => {
      const url = req.url ?? '';

      // Only handle GET /callback
      if (!url.startsWith('/callback')) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      try {
        const params = parseQuery(url);
        const code = params.get('code');
        const returnedState = params.get('state');

        if (!code) {
          throw new AuthError('No authorization code received from GitHub');
        }

        if (returnedState !== state) {
          throw new AuthError('OAuth state mismatch - possible CSRF attack');
        }

        // Exchange the code for a token via the registry callback endpoint.
        const authResponse = await ofetch<AuthResponse>(
          `${registryUrl}/api/v1/auth/callback`,
          {
            method: 'GET',
            query: { code, state },
          },
        );

        const token: AuthToken = {
          token: authResponse.token,
          username: authResponse.user.username,
          github_id: authResponse.user.github_id,
          created_at: new Date().toISOString(),
        };

        // Send a success page to the browser.
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px;">
              <h1>Authentication successful!</h1>
              <p>You can close this tab and return to the terminal.</p>
            </body>
          </html>
        `);

        clearTimeout(timeout);
        server.close();
        resolve(token);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: system-ui, sans-serif; text-align: center; padding: 40px;">
              <h1>Authentication failed</h1>
              <p>Please return to the terminal for details.</p>
            </body>
          </html>
        `);

        clearTimeout(timeout);
        server.close();
        reject(
          error instanceof AuthError
            ? error
            : new AuthError(`OAuth callback failed: ${(error as Error).message}`),
        );
      }
    });

    // Listen on a random port, then kick off the flow.
    server.listen(0, '127.0.0.1', async () => {
      try {
        const address = server.address();
        if (!address || typeof address === 'string') {
          throw new AuthError('Failed to start local OAuth server');
        }

        const port = address.port;
        const redirectUri = `http://127.0.0.1:${port}/callback`;

        // Request the GitHub auth URL from the registry.
        const { auth_url } = await ofetch<{ auth_url: string }>(
          `${registryUrl}/api/v1/auth/github`,
          {
            method: 'POST',
            body: { redirect_uri: redirectUri, state },
          },
        );

        // Open the GitHub authorization page in the browser.
        openBrowser(auth_url);
      } catch (error) {
        clearTimeout(timeout);
        server.close();
        reject(
          error instanceof AuthError
            ? error
            : new AuthError(`Failed to start OAuth flow: ${(error as Error).message}`),
        );
      }
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(new AuthError(`OAuth server error: ${error.message}`));
    });
  });
}
