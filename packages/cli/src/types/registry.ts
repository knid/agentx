/**
 * Minimal author information returned by the registry.
 */
export interface AuthorInfo {
  username: string;
  display_name?: string;
  avatar_url?: string;
}

/**
 * A single result from a registry search query.
 */
export interface SearchResult {
  scope: string;
  name: string;
  full_name: string;
  description: string;
  category?: string;
  tags: string[];
  latest_version: string;
  download_count: number;
  star_count: number;
  is_verified: boolean;
  author: AuthorInfo;
  updated_at: string;
}

/**
 * Full agent information returned when viewing a specific agent.
 * Extends {@link SearchResult} with additional metadata.
 */
export interface AgentInfo extends SearchResult {
  readme: string;
  license?: string;
  repository?: string;
  homepage?: string;
  is_featured: boolean;
  permissions?: {
    filesystem?: boolean;
    network?: boolean;
    execute_commands?: boolean;
  };
  mcp_servers?: string[];
  examples?: Array<{ prompt: string; description?: string }>;
  created_at: string;
}

/**
 * Response returned after successfully publishing an agent.
 */
export interface PublishResponse {
  success: boolean;
  version: string;
  full_name: string;
  url: string;
}

/**
 * Response returned after successful authentication via GitHub OAuth.
 */
export interface AuthResponse {
  token: string;
  user: {
    username: string;
    display_name?: string;
    avatar_url?: string;
    github_id: number;
  };
}

/**
 * A paginated list response from the registry.
 *
 * @typeParam T - The type of items in the response (typically {@link SearchResult}).
 */
export interface PaginatedResponse<T> {
  agents: T[];
  total: number;
  page: number;
  limit: number;
}
