import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { rateLimit } from '@/lib/utils/rate-limit';

/** Map category slugs to display names. */
const CATEGORY_NAMES: Record<string, string> = {
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

    // Distinct categories with counts from the agents table
    const results = await db
      .select({
        category: agents.category,
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(agents)
      .where(sql`${agents.category} IS NOT NULL AND ${agents.isDeprecated} = false`)
      .groupBy(agents.category)
      .orderBy(sql`count DESC`);

    const categories = results.map((row) => ({
      slug: row.category!,
      name: CATEGORY_NAMES[row.category!] ?? row.category!,
      count: row.count,
    }));

    const rateLimitHeaders = {
      'X-RateLimit-Limit': String(rl.limit),
      'X-RateLimit-Remaining': String(rl.remaining),
      'X-RateLimit-Reset': String(rl.reset),
    };

    return NextResponse.json({ categories }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('GET /api/v1/categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
