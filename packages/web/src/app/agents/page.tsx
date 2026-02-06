import { db } from '@/lib/db';
import { agents, users } from '@/lib/db/schema';
import { desc, eq, sql, and, ilike } from 'drizzle-orm';
import { AgentCard } from '@/components/AgentCard';
import { AgentSearch } from '@/components/AgentSearch';
import { CategoryBadge } from '@/components/CategoryBadge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Browse Agents',
  description: 'Discover and install AI agents from the agentx marketplace.',
};

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const category = params.category || '';
  const sort = params.sort || 'downloads';
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(agents.isDeprecated, false)];
  if (category) {
    conditions.push(eq(agents.category, category));
  }
  if (query) {
    conditions.push(
      sql`to_tsvector('english', ${agents.name} || ' ' || coalesce(${agents.description}, '')) @@ plainto_tsquery('english', ${query})`,
    );
  }

  const orderBy =
    sort === 'stars'
      ? desc(agents.starCount)
      : sort === 'newest'
        ? desc(agents.createdAt)
        : sort === 'trending'
          ? desc(agents.downloadCount)
          : desc(agents.downloadCount);

  const [results, [{ count: totalCount }], categories] = await Promise.all([
    db
      .select({
        scope: agents.scope,
        name: agents.name,
        description: agents.description,
        category: agents.category,
        downloadCount: agents.downloadCount,
        starCount: agents.starCount,
        latestVersion: agents.latestVersion,
        isVerified: agents.isVerified,
        authorUsername: users.username,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(agents)
      .innerJoin(users, eq(agents.authorId, users.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(agents)
      .where(and(...conditions)),
    db
      .select({
        category: agents.category,
        count: sql<number>`count(*)::int`,
      })
      .from(agents)
      .where(eq(agents.isDeprecated, false))
      .groupBy(agents.category)
      .orderBy(sql`count(*) desc`),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="shrink-0 lg:w-56">
          <h2 className="text-sm font-semibold text-white">Categories</h2>
          <ul className="mt-3 space-y-1">
            <li>
              <Link
                href="/agents"
                className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                  !category
                    ? 'bg-surface-800 text-white'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                All
              </Link>
            </li>
            {categories
              .filter((c) => c.category)
              .map((c) => (
                <li key={c.category}>
                  <Link
                    href={`/agents?category=${c.category}`}
                    className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                      category === c.category
                        ? 'bg-surface-800 text-white'
                        : 'text-surface-400 hover:text-surface-200'
                    }`}
                  >
                    <span>{c.category}</span>
                    <span className="text-xs text-surface-600">{c.count}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md flex-1">
              <AgentSearch initialQuery={query} />
            </div>
            <div className="flex items-center gap-2">
              {['downloads', 'stars', 'newest'].map((s) => (
                <Link
                  key={s}
                  href={`/agents?${new URLSearchParams({
                    ...(query ? { q: query } : {}),
                    ...(category ? { category } : {}),
                    sort: s,
                  }).toString()}`}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    sort === s
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-surface-400 hover:text-surface-200'
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          {query && (
            <p className="mt-4 text-sm text-surface-400">
              {totalCount} result{totalCount !== 1 ? 's' : ''} for &ldquo;
              {query}&rdquo;
            </p>
          )}

          {results.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {results.map((agent) => (
                <AgentCard
                  key={`${agent.scope}/${agent.name}`}
                  scope={agent.scope}
                  name={agent.name}
                  description={agent.description}
                  category={agent.category}
                  downloadCount={agent.downloadCount}
                  starCount={agent.starCount}
                  latestVersion={agent.latestVersion}
                  isVerified={agent.isVerified}
                  author={{
                    username: agent.authorUsername,
                    avatarUrl: agent.authorAvatarUrl,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-16 text-center">
              <p className="text-lg text-surface-400">No agents found</p>
              <p className="mt-2 text-sm text-surface-500">
                Try a different search or browse categories.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/agents?${new URLSearchParams({
                    ...(query ? { q: query } : {}),
                    ...(category ? { category } : {}),
                    sort,
                    page: String(page - 1),
                  }).toString()}`}
                  className="rounded-md border border-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:bg-surface-800"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-surface-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/agents?${new URLSearchParams({
                    ...(query ? { q: query } : {}),
                    ...(category ? { category } : {}),
                    sort,
                    page: String(page + 1),
                  }).toString()}`}
                  className="rounded-md border border-surface-700 px-3 py-1.5 text-sm text-surface-300 hover:bg-surface-800"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
