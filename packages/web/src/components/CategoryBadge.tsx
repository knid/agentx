import Link from 'next/link';

const CATEGORY_COLORS: Record<string, string> = {
  productivity:
    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  devtools:
    'bg-violet-500/10 text-violet-400 border-violet-500/20',
  communication:
    'bg-green-500/10 text-green-400 border-green-500/20',
  data: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  writing:
    'bg-pink-500/10 text-pink-400 border-pink-500/20',
  research:
    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  automation:
    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  security:
    'bg-red-500/10 text-red-400 border-red-500/20',
  monitoring:
    'bg-teal-500/10 text-teal-400 border-teal-500/20',
  other:
    'bg-surface-500/10 text-surface-400 border-surface-500/20',
};

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

interface CategoryBadgeProps {
  category: string;
  linkable?: boolean;
}

export function CategoryBadge({
  category,
  linkable = true,
}: CategoryBadgeProps) {
  const colors =
    CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const label = CATEGORY_LABELS[category] || category;

  const badge = (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  );

  if (linkable) {
    return (
      <Link href={`/categories/${category}`} className="hover:opacity-80">
        {badge}
      </Link>
    );
  }

  return badge;
}
