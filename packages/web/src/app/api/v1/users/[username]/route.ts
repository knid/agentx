import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, agents } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const [user] = await db
    .select({
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
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [stats] = await db
    .select({
      agentCount: sql<number>`count(*)::int`,
      totalDownloads: sql<number>`coalesce(sum(${agents.downloadCount}), 0)::int`,
    })
    .from(agents)
    .innerJoin(users, eq(agents.authorId, users.id))
    .where(eq(users.username, username));

  // Also fetch the user's agents
  const userAgents = await db
    .select({
      scope: agents.scope,
      name: agents.name,
      description: agents.description,
      category: agents.category,
      downloadCount: agents.downloadCount,
      starCount: agents.starCount,
      latestVersion: agents.latestVersion,
      isVerified: agents.isVerified,
      updatedAt: agents.updatedAt,
    })
    .from(agents)
    .innerJoin(users, eq(agents.authorId, users.id))
    .where(eq(users.username, username))
    .orderBy(desc(agents.downloadCount));

  return NextResponse.json({
    username: user.username,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
    bio: user.bio,
    website: user.website,
    agent_count: stats.agentCount,
    total_downloads: stats.totalDownloads,
    created_at: user.createdAt,
    agents: userAgents.map((a) => ({
      scope: a.scope,
      name: a.name,
      full_name: `${a.scope}/${a.name}`,
      description: a.description,
      category: a.category,
      download_count: a.downloadCount,
      star_count: a.starCount,
      latest_version: a.latestVersion,
      is_verified: a.isVerified,
      updated_at: a.updatedAt,
      author: {
        username: user.username,
        avatar_url: user.avatarUrl,
      },
    })),
  });
}
