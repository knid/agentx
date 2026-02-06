import { randomBytes } from 'node:crypto';

/** GitHub user profile returned after authentication. */
export interface GitHubUserProfile {
  github_id: number;
  username: string;
  display_name: string;
  email: string | null;
  avatar_url: string;
}

/**
 * Builds the GitHub OAuth authorization URL.
 *
 * @param redirectUri - The callback URL GitHub should redirect to after authorization
 * @param state       - An opaque CSRF token to verify the callback
 * @returns The full GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    throw new Error('Missing GITHUB_CLIENT_ID environment variable');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchanges a GitHub OAuth authorization code for an access token.
 *
 * @param code - The authorization code received from GitHub's OAuth callback
 * @returns The GitHub access token
 * @throws If the token exchange fails
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variables');
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with status ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description ?? data.error}`);
  }

  if (!data.access_token) {
    throw new Error('GitHub OAuth response did not include an access token');
  }

  return data.access_token;
}

/**
 * Fetches the authenticated user's profile from the GitHub API.
 *
 * @param accessToken - A valid GitHub access token
 * @returns The user's GitHub profile
 * @throws If the API request fails
 */
export async function getUserProfile(accessToken: string): Promise<GitHubUserProfile> {
  const [userResponse, emailsResponse] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }),
  ]);

  if (!userResponse.ok) {
    throw new Error(`GitHub API /user request failed with status ${userResponse.status}`);
  }

  const userData = (await userResponse.json()) as {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
    email: string | null;
  };

  // Try to get the primary email from the emails endpoint
  let email: string | null = userData.email;

  if (emailsResponse.ok) {
    const emails = (await emailsResponse.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;

    const primaryEmail = emails.find((e) => e.primary && e.verified);
    if (primaryEmail) {
      email = primaryEmail.email;
    }
  }

  return {
    github_id: userData.id,
    username: userData.login,
    display_name: userData.name ?? userData.login,
    email,
    avatar_url: userData.avatar_url,
  };
}

/**
 * Generates a random agentx authentication token.
 *
 * The token format is `agentx_` followed by 32 random hex characters (16 bytes).
 *
 * @returns A unique token string prefixed with `agentx_`
 */
export function generateAgentxToken(): string {
  const bytes = randomBytes(16);
  return `agentx_${bytes.toString('hex')}`;
}
