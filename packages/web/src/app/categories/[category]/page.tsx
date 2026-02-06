import { db } from '@/lib/db';
import { agents, users } from '@/lib/db/schema';
import { desc, eq, and } from 'drizzle-orm';
import { AgentCard } from '@/components/AgentCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  productivity: 'Productivity',
  devtools: 'Developer Tools',
  communication: 'Communication',
  data: 'Data',
  writing: 'Writing',
  research: 'Research',
  automation: 'Automation',
  security: 'Security',
  monitoring: 'Monitoring',
  other: 'Other',
};

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category] || category;
  return {
    title: `${label} Agents`,
    description: `Browse ${label.toLowerCase()} AI agents on agentx.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const label = CATEGORY_LABELS[category] || category;

  const results = await db
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
    .where(
      and(eq(agents.category, category), eq(agents.isDeprecated, false)),
    )
    .orderBy(desc(agents.downloadCount))
    .limit(100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">{label}</h1>
        <CategoryBadge category={category} linkable={false} />
      </div>
      <p className="mt-2 text-sm text-surface-400">
        {results.length} agent{results.length !== 1 ? 's' : ''} in this
        category
      </p>

      {results.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <p className="text-lg text-surface-400">
            No agents in this category yet.
          </p>
        </div>
      )}
    </div>
  );
}
