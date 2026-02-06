import { db } from '@/lib/db';
import { agents, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { AgentCard } from '@/components/AgentCard';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface UserPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: UserPageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}`,
    description: `View agents published by @${username} on agentx.`,
  };
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params;

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      website: users.website,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    notFound();
  }

  const [userAgents, [{ totalDownloads }]] = await Promise.all([
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
      })
      .from(agents)
      .where(eq(agents.authorId, user.id))
      .orderBy(desc(agents.downloadCount)),
    db
      .select({
        totalDownloads: sql<number>`coalesce(sum(${agents.downloadCount}), 0)::int`,
      })
      .from(agents)
      .where(eq(agents.authorId, user.id)),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="flex items-start gap-6">
        {user.avatarUrl && (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="h-20 w-20 rounded-full"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {user.displayName || user.username}
          </h1>
          <p className="text-surface-400">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 max-w-xl text-sm text-surface-300">
              {user.bio}
            </p>
          )}
          <div className="mt-4 flex items-center gap-6 text-sm text-surface-400">
            <span>
              <strong className="text-white">{userAgents.length}</strong> agent
              {userAgents.length !== 1 ? 's' : ''}
            </span>
            <span>
              <strong className="text-white">
                {formatNumber(totalDownloads)}
              </strong>{' '}
              total downloads
            </span>
            <span>
              Joined{' '}
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
          {user.website && (
            <a
              href={user.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-primary-400 hover:text-primary-300"
            >
              {user.website}
            </a>
          )}
        </div>
      </div>

      {/* User's Agents */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white">Published Agents</h2>
        {userAgents.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userAgents.map((agent) => (
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
                  username: user.username,
                  avatarUrl: user.avatarUrl,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-surface-400">
            No published agents yet.
          </p>
        )}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
