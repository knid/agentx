import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents, users } from '@/lib/db/schema';
import { rateLimit } from '@/lib/utils/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const rl = await rateLimit(ip);
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required query parameter: q' },
        { status: 400 },
      );
    }

    const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10) || 20, 1), 100);

    // Full-text search using tsvector/tsquery with the GIN index
    const results = await db
      .select({
        id: agents.id,
        scope: agents.scope,
        name: agents.name,
        description: agents.description,
        category: agents.category,
        tags: agents.tags,
        latestVersion: agents.latestVersion,
        downloadCount: agents.downloadCount,
        starCount: agents.starCount,
        isVerified: agents.isVerified,
        updatedAt: agents.updatedAt,
        authorUsername: users.username,
        authorDisplayName: users.displayName,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(agents)
      .innerJoin(users, sql`${agents.authorId} = ${users.id}`)
      .where(
        sql`to_tsvector('english', ${agents.name} || ' ' || coalesce(${agents.description}, '')) @@ plainto_tsquery('english', ${query})`,
      )
      .orderBy(sql`ts_rank(to_tsvector('english', ${agents.name} || ' ' || coalesce(${agents.description}, '')), plainto_tsquery('english', ${query})) DESC`)
      .limit(limit);

    const formattedAgents = results.map((row) => ({
      scope: row.scope,
      name: row.name,
      full_name: `${row.scope}/${row.name}`,
      description: row.description ?? '',
      category: row.category ?? undefined,
      tags: row.tags ?? [],
      latest_version: row.latestVersion ?? '0.0.0',
      download_count: row.downloadCount,
      star_count: row.starCount,
      is_verified: row.isVerified,
      author: {
        username: row.authorUsername,
        display_name: row.authorDisplayName ?? undefined,
        avatar_url: row.authorAvatarUrl ?? undefined,
      },
      updated_at: row.updatedAt.toISOString(),
    }));

    const rateLimitHeaders = {
      'X-RateLimit-Limit': String(rl.limit),
      'X-RateLimit-Remaining': String(rl.remaining),
      'X-RateLimit-Reset': String(rl.reset),
    };

    return NextResponse.json(
      {
        agents: formattedAgents,
        total: formattedAgents.length,
        page: 1,
        limit,
      },
      { headers: rateLimitHeaders },
    );
  } catch (error) {
    console.error('GET /api/v1/search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
