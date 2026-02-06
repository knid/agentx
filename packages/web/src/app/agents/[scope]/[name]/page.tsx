import { db } from '@/lib/db';
import { agents, agentVersions, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InstallCommand } from '@/components/InstallCommand';
import { CategoryBadge } from '@/components/CategoryBadge';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface AgentDetailPageProps {
  params: Promise<{ scope: string; name: string }>;
}

export async function generateMetadata({
  params,
}: AgentDetailPageProps): Promise<Metadata> {
  const { scope, name } = await params;
  const decodedScope = decodeURIComponent(scope);
  return {
    title: `${decodedScope}/${name}`,
    description: `Install and run ${decodedScope}/${name} AI agent with agentx.`,
  };
}

export default async function AgentDetailPage({
  params,
}: AgentDetailPageProps) {
  const { scope, name } = await params;
  const decodedScope = decodeURIComponent(scope);

  const [agent] = await db
    .select({
      id: agents.id,
      scope: agents.scope,
      name: agents.name,
      description: agents.description,
      readme: agents.readme,
      category: agents.category,
      tags: agents.tags,
      license: agents.license,
      repository: agents.repository,
      homepage: agents.homepage,
      downloadCount: agents.downloadCount,
      starCount: agents.starCount,
      latestVersion: agents.latestVersion,
      isVerified: agents.isVerified,
      isFeatured: agents.isFeatured,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
      authorUsername: users.username,
      authorDisplayName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(agents)
    .innerJoin(users, eq(agents.authorId, users.id))
    .where(and(eq(agents.scope, decodedScope), eq(agents.name, name)))
    .limit(1);

  if (!agent) {
    notFound();
  }

  const versions = await db
    .select({
      version: agentVersions.version,
      tarballSize: agentVersions.tarballSize,
      downloadCount: agentVersions.downloadCount,
      publishedAt: agentVersions.publishedAt,
      mcpServers: agentVersions.mcpServers,
      permissions: agentVersions.permissions,
      requires: agentVersions.requires,
    })
    .from(agentVersions)
    .where(eq(agentVersions.agentId, agent.id))
    .orderBy(desc(agentVersions.publishedAt));

  const latestVersionData = versions[0];
  const permissions = (latestVersionData?.permissions as Record<string, boolean> | null) || {};
  const mcpServers = latestVersionData?.mcpServers as Record<string, unknown> | null;
  const requires = latestVersionData?.requires as Record<string, string> | null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-10 lg:flex-row">
        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">
                  {agent.scope}/{agent.name}
                </h1>
                {agent.isVerified && (
                  <svg
                    className="h-5 w-5 text-primary-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              {agent.description && (
                <p className="mt-2 text-surface-300">{agent.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {agent.category && <CategoryBadge category={agent.category} />}
                {agent.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-800 px-2.5 py-0.5 text-xs text-surface-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Install Command */}
          <div className="mt-8">
            <InstallCommand scope={agent.scope} name={agent.name} />
          </div>

          {/* README */}
          {agent.readme && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-white">README</h2>
              <div className="prose-invert mt-4 max-w-none whitespace-pre-wrap rounded-lg border border-surface-800 bg-surface-900/50 p-6 text-sm text-surface-300">
                {agent.readme}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="shrink-0 lg:w-72">
          <div className="space-y-6">
            {/* Stats */}
            <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-5">
              <h3 className="text-sm font-semibold text-white">Stats</h3>
              <dl className="mt-3 space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-400">Downloads</dt>
                  <dd className="text-sm font-medium text-white">
                    {formatNumber(agent.downloadCount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-400">Stars</dt>
                  <dd className="text-sm font-medium text-white">
                    {formatNumber(agent.starCount)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-400">Version</dt>
                  <dd className="text-sm font-medium text-white">
                    {agent.latestVersion || '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-surface-400">License</dt>
                  <dd className="text-sm font-medium text-white">
                    {agent.license || 'MIT'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Author */}
            <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-5">
              <h3 className="text-sm font-semibold text-white">Author</h3>
              <a
                href={`/users/${agent.authorUsername}`}
                className="mt-3 flex items-center gap-3 hover:opacity-80"
              >
                {agent.authorAvatarUrl && (
                  <img
                    src={agent.authorAvatarUrl}
                    alt={agent.authorUsername}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {agent.authorDisplayName || agent.authorUsername}
                  </p>
                  <p className="text-xs text-surface-500">
                    @{agent.authorUsername}
                  </p>
                </div>
              </a>
            </div>

            {/* Permissions */}
            {Object.keys(permissions).length > 0 && (
              <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-5">
                <h3 className="text-sm font-semibold text-white">
                  Permissions
                </h3>
                <ul className="mt-3 space-y-2">
                  {Object.entries(permissions).map(([key, value]) => (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      {value ? (
                        <span className="text-amber-400">&#9679;</span>
                      ) : (
                        <span className="text-green-400">&#9679;</span>
                      )}
                      <span className="text-surface-300">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* MCP Servers */}
            {mcpServers && Object.keys(mcpServers).length > 0 && (
              <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-5">
                <h3 className="text-sm font-semibold text-white">
                  MCP Servers
                </h3>
                <ul className="mt-3 space-y-1">
                  {Object.keys(mcpServers).map((server) => (
                    <li
                      key={server}
                      className="text-sm text-surface-300"
                    >
                      {server}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {requires && Object.keys(requires).length > 0 && (
              <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-5">
                <h3 className="text-sm font-semibold text-white">
                  Requirements
                </h3>
                <dl className="mt-3 space-y-2">
                  {Object.entries(requires).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <dt className="text-sm text-surface-400">{key}</dt>
                      <dd className="text-sm text-surface-300">
                        {String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Links */}
            {(agent.repository || agent.homepage) && (
              <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-5">
                <h3 className="text-sm font-semibold text-white">Links</h3>
                <ul className="mt-3 space-y-2">
                  {agent.repository && (
                    <li>
                      <a
                        href={agent.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-400 hover:text-primary-300"
                      >
                        Repository
                      </a>
                    </li>
                  )}
                  {agent.homepage && (
                    <li>
                      <a
                        href={agent.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-400 hover:text-primary-300"
                      >
                        Homepage
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Versions */}
            {versions.length > 0 && (
              <div className="rounded-lg border border-surface-800 bg-surface-900/50 p-5">
                <h3 className="text-sm font-semibold text-white">Versions</h3>
                <ul className="mt-3 space-y-2">
                  {versions.slice(0, 10).map((v) => (
                    <li
                      key={v.version}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-surface-300">{v.version}</span>
                      <span className="text-xs text-surface-500">
                        {new Date(v.publishedAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
