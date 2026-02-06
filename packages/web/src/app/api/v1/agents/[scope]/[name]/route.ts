import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents, agentVersions, users } from '@/lib/db/schema';
import { rateLimit, getDefaultLimiter } from '@/lib/utils/rate-limit';

interface RouteParams {
  params: Promise<{ scope: string; name: string }>;
}

/**
 * GET /api/v1/agents/:scope/:name
 *
 * Returns full agent metadata including author info, versions, and README.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { scope, name } = await params;

    // Rate limit
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const rl = await rateLimit(ip, getDefaultLimiter());
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': String(rl.remaining),
            'X-RateLimit-Reset': String(rl.reset),
          },
        },
      );
    }

    // Look up the agent
    const agentRows = await db
      .select()
      .from(agents)
      .where(and(eq(agents.scope, scope), eq(agents.name, name)))
      .limit(1);

    if (agentRows.length === 0) {
      return NextResponse.json(
        { error: `Agent ${scope}/${name} not found` },
        { status: 404 },
      );
    }

    const agent = agentRows[0];

    // Fetch author info
    const authorRows = await db
      .select({
        username: users.username,
        display_name: users.displayName,
        avatar_url: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, agent.authorId))
      .limit(1);

    const author = authorRows[0] ?? { username: 'unknown', display_name: null, avatar_url: null };

    // Fetch all versions
    const versions = await db
      .select({
        version: agentVersions.version,
        tarball_size: agentVersions.tarballSize,
        download_count: agentVersions.downloadCount,
        published_at: agentVersions.publishedAt,
        requires: agentVersions.requires,
        mcp_servers: agentVersions.mcpServers,
        permissions: agentVersions.permissions,
      })
      .from(agentVersions)
      .where(eq(agentVersions.agentId, agent.id))
      .orderBy(agentVersions.publishedAt);

    return NextResponse.json({
      scope: agent.scope,
      name: agent.name,
      full_name: `${agent.scope}/${agent.name}`,
      description: agent.description,
      readme: agent.readme,
      category: agent.category,
      tags: agent.tags,
      license: agent.license,
      repository: agent.repository,
      homepage: agent.homepage,
      latest_version: agent.latestVersion,
      download_count: agent.downloadCount,
      star_count: agent.starCount,
      is_verified: agent.isVerified,
      is_featured: agent.isFeatured,
      is_deprecated: agent.isDeprecated,
      author,
      versions,
      created_at: agent.createdAt.toISOString(),
      updated_at: agent.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('GET /api/v1/agents/[scope]/[name] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
