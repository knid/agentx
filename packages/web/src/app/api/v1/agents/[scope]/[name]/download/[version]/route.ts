import { NextRequest, NextResponse } from 'next/server';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents, agentVersions, downloads } from '@/lib/db/schema';
import { rateLimit, getDefaultLimiter } from '@/lib/utils/rate-limit';
import { createHash } from 'node:crypto';

interface RouteParams {
  params: Promise<{ scope: string; name: string; version: string }>;
}

/**
 * GET /api/v1/agents/:scope/:name/download/:version
 *
 * Returns the tarball URL and SHA-256 hash for a specific agent version.
 * Increments the download counter for both the agent and the version.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { scope, name, version } = await params;

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

    // Look up the specific version
    const versionRows = await db
      .select()
      .from(agentVersions)
      .where(
        and(
          eq(agentVersions.agentId, agent.id),
          eq(agentVersions.version, version),
        ),
      )
      .limit(1);

    if (versionRows.length === 0) {
      return NextResponse.json(
        { error: `Version ${version} not found for ${scope}/${name}` },
        { status: 404 },
      );
    }

    const versionData = versionRows[0];

    // Increment download counts (fire-and-forget)
    const ipHash = createHash('sha256').update(ip).digest('hex');

    // Record the download event and increment counters
    await Promise.all([
      db.insert(downloads).values({
        agentId: agent.id,
        version,
        ipHash,
      }),
      db
        .update(agents)
        .set({ downloadCount: sql`${agents.downloadCount} + 1` })
        .where(eq(agents.id, agent.id)),
      db
        .update(agentVersions)
        .set({ downloadCount: sql`${agentVersions.downloadCount} + 1` })
        .where(eq(agentVersions.id, versionData.id)),
    ]);

    return NextResponse.json({
      version: versionData.version,
      tarball_url: versionData.tarballUrl,
      tarball_sha256: versionData.tarballSha256,
      tarball_size: versionData.tarballSize,
      published_at: versionData.publishedAt.toISOString(),
    });
  } catch (error) {
    console.error('GET /api/v1/agents/[scope]/[name]/download/[version] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
