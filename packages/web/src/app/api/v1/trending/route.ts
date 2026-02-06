import { NextRequest, NextResponse } from 'next/server';
import { sql, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents, users, downloads } from '@/lib/db/schema';
import { rateLimit } from '@/lib/utils/rate-limit';

/**
 * Map a period string to a PostgreSQL interval expression.
 */
function periodToInterval(period: string): string {
  switch (period) {
    case 'day':
      return '1 day';
    case 'month':
      return '30 days';
    case 'week':
    default:
      return '7 days';
  }
}

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
    const period = searchParams.get('period') ?? 'week';
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam ?? '20', 10) || 20, 1), 100);

    if (!['day', 'week', 'month'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Use day, week, or month.' },
        { status: 400 },
      );
    }

    const interval = periodToInterval(period);

    // Query agents with their recent download counts within the period.
    // Uses a subquery to count downloads in the period window, then orders
    // by that count descending.
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
        recentDownloads: sql<number>`coalesce((
          SELECT count(*)::int FROM downloads
          WHERE downloads.agent_id = ${agents.id}
            AND downloads.created_at >= now() - interval '${sql.raw(interval)}'
        ), 0)`.as('recent_downloads'),
      })
      .from(agents)
      .innerJoin(users, sql`${agents.authorId} = ${users.id}`)
      .where(sql`${agents.isDeprecated} = false`)
      .orderBy(sql`recent_downloads DESC`, desc(agents.downloadCount))
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
    console.error('GET /api/v1/trending error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
