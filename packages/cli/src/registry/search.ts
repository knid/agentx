import { createRegistryClient } from './client.js';
import type { SearchResult, PaginatedResponse } from '../types/registry.js';

/**
 * Options for searching agents in the registry.
 */
export interface SearchOptions {
  /** Maximum number of results to return (default: 20). */
  limit?: number;
  /** Filter by category. */
  category?: string;
  /** Sort order: downloads, stars, newest. */
  sort?: string;
}

/**
 * Options for fetching trending agents.
 */
export interface TrendingOptions {
  /** Time period: day, week, month (default: week). */
  period?: string;
  /** Maximum number of results to return (default: 20). */
  limit?: number;
}

/** Category entry from /api/v1/categories. */
export interface CategoryEntry {
  slug: string;
  name: string;
  count: number;
}

/**
 * Search agents in the registry using full-text search.
 *
 * @param query - The search query string.
 * @param options - Optional search parameters.
 * @returns A paginated response containing matching agents.
 */
export async function searchAgents(
  query: string,
  options?: SearchOptions,
): Promise<PaginatedResponse<SearchResult>> {
  const client = createRegistryClient();
  const params = new URLSearchParams({ q: query });

  if (options?.limit) {
    params.set('limit', String(options.limit));
  }
  if (options?.category) {
    params.set('category', options.category);
  }
  if (options?.sort) {
    params.set('sort', options.sort);
  }

  return client.get<PaginatedResponse<SearchResult>>(`/search?${params.toString()}`);
}

/**
 * Fetch trending agents from the registry.
 *
 * @param options - Optional trending parameters (period, limit).
 * @returns A paginated response containing trending agents.
 */
export async function getTrending(
  options?: TrendingOptions,
): Promise<PaginatedResponse<SearchResult>> {
  const client = createRegistryClient();
  const params = new URLSearchParams();

  if (options?.period) {
    params.set('period', options.period);
  }
  if (options?.limit) {
    params.set('limit', String(options.limit));
  }

  const qs = params.toString();
  return client.get<PaginatedResponse<SearchResult>>(`/trending${qs ? `?${qs}` : ''}`);
}

/**
 * Fetch all categories from the registry.
 *
 * @returns A list of categories with their agent counts.
 */
export async function getCategories(): Promise<CategoryEntry[]> {
  const client = createRegistryClient();
  const response = await client.get<{ categories: CategoryEntry[] }>('/categories');
  return response.categories;
}
