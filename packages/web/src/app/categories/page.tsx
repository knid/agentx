import { db } from '@/lib/db';
import { agents } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import Link from 'next/link';
import { CategoryBadge } from '@/components/CategoryBadge';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse AI agents by category on agentx.',
};

export default async function CategoriesPage() {
  const categories = await db
    .select({
      category: agents.category,
      count: sql<number>`count(*)::int`,
    })
    .from(agents)
    .where(eq(agents.isDeprecated, false))
    .groupBy(agents.category)
    .orderBy(sql`count(*) desc`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white">Categories</h1>
      <p className="mt-2 text-sm text-surface-400">
        Browse agents by category.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories
          .filter((c) => c.category)
          .map((c) => (
            <Link
              key={c.category}
              href={`/categories/${c.category}`}
              className="flex items-center justify-between rounded-xl border border-surface-800 bg-surface-900/50 p-5 transition-all hover:border-surface-600 hover:bg-surface-900"
            >
              <CategoryBadge category={c.category!} linkable={false} />
              <span className="text-lg font-semibold text-white">
                {c.count}
              </span>
            </Link>
          ))}
      </div>
    </div>
  );
}
