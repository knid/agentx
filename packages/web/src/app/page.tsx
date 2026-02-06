import { db } from '@/lib/db';
import { agents, users } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { AgentCard } from '@/components/AgentCard';
import { AgentSearch } from '@/components/AgentSearch';
import { CategoryBadge } from '@/components/CategoryBadge';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getFeaturedAgents() {
  return db
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
    .where(eq(agents.isDeprecated, false))
    .orderBy(desc(agents.downloadCount))
    .limit(6);
}

async function getCategories() {
  return db
    .select({
      category: agents.category,
      count: sql<number>`count(*)::int`,
    })
    .from(agents)
    .where(eq(agents.isDeprecated, false))
    .groupBy(agents.category)
    .orderBy(sql`count(*) desc`)
    .limit(10);
}

async function getStats() {
  const [result] = await db
    .select({
      totalAgents: sql<number>`count(*)::int`,
      totalDownloads: sql<number>`coalesce(sum(${agents.downloadCount}), 0)::int`,
    })
    .from(agents);
  return result;
}

export default async function HomePage() {
  const [featured, categories, stats] = await Promise.all([
    getFeaturedAgents(),
    getCategories(),
    getStats(),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-surface-800">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/20 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              AI Agents,{' '}
              <span className="text-primary-400">One Command Away</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-surface-300">
              Discover, install, and run AI agents powered by Claude. The open
              marketplace for CLI-first AI agents.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="w-full max-w-lg">
                <AgentSearch
                  placeholder="Search for agents..."
                  size="lg"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-surface-700 bg-surface-900 px-5 py-2.5">
                <code className="text-sm text-surface-200">
                  <span className="text-surface-500">$ </span>
                  npm install -g agentx
                </code>
              </div>
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-surface-400">
              <div>
                <span className="text-2xl font-bold text-white">
                  {stats.totalAgents}
                </span>{' '}
                agents
              </div>
              <div>
                <span className="text-2xl font-bold text-white">
                  {formatNumber(stats.totalDownloads)}
                </span>{' '}
                downloads
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Agents */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Popular Agents</h2>
            <Link
              href="/agents"
              className="text-sm font-medium text-primary-400 hover:text-primary-300"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((agent) => (
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
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="border-t border-surface-800">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-white">
              Browse by Category
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {categories
                .filter((c) => c.category)
                .map((c) => (
                  <Link
                    key={c.category}
                    href={`/categories/${c.category}`}
                    className="flex items-center justify-between rounded-lg border border-surface-800 bg-surface-900/50 px-4 py-3 transition-colors hover:border-surface-600 hover:bg-surface-900"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryBadge
                        category={c.category!}
                        linkable={false}
                      />
                    </div>
                    <span className="text-sm text-surface-500">
                      {c.count}
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Getting Started */}
      <section className="border-t border-surface-800">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-white">
            Get Started in Seconds
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-400">
                <span className="text-lg font-bold">1</span>
              </div>
              <h3 className="mt-4 font-semibold text-white">Install</h3>
              <p className="mt-2 text-sm text-surface-400">
                Install the agentx CLI globally via npm.
              </p>
              <code className="mt-3 inline-block rounded bg-surface-900 px-3 py-1.5 text-xs text-surface-300">
                npm install -g agentx
              </code>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-400">
                <span className="text-lg font-bold">2</span>
              </div>
              <h3 className="mt-4 font-semibold text-white">Add an Agent</h3>
              <p className="mt-2 text-sm text-surface-400">
                Install any agent from the registry.
              </p>
              <code className="mt-3 inline-block rounded bg-surface-900 px-3 py-1.5 text-xs text-surface-300">
                agentx install @agentx/gmail-agent
              </code>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-400">
                <span className="text-lg font-bold">3</span>
              </div>
              <h3 className="mt-4 font-semibold text-white">Run</h3>
              <p className="mt-2 text-sm text-surface-400">
                Run the agent from your terminal.
              </p>
              <code className="mt-3 inline-block rounded bg-surface-900 px-3 py-1.5 text-xs text-surface-300">
                agentx run gmail-agent &quot;summarize emails&quot;
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
