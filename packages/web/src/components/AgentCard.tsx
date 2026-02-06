import Link from 'next/link';
import { CategoryBadge } from './CategoryBadge';

interface AgentCardProps {
  scope: string;
  name: string;
  description: string | null;
  category: string | null;
  downloadCount: number;
  starCount: number;
  latestVersion: string | null;
  author: {
    username: string;
    avatarUrl: string | null;
  };
  isVerified?: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function AgentCard({
  scope,
  name,
  description,
  category,
  downloadCount,
  starCount,
  latestVersion,
  author,
  isVerified,
}: AgentCardProps) {
  return (
    <Link
      href={`/agents/${encodeURIComponent(scope)}/${encodeURIComponent(name)}`}
      className="group block rounded-xl border border-surface-800 bg-surface-900/50 p-5 transition-all hover:border-surface-600 hover:bg-surface-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white group-hover:text-primary-400">
              {scope}/{name}
            </h3>
            {isVerified && (
              <svg
                className="h-4 w-4 shrink-0 text-primary-400"
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
          {latestVersion && (
            <span className="text-xs text-surface-500">v{latestVersion}</span>
          )}
        </div>
        {category && <CategoryBadge category={category} linkable={false} />}
      </div>

      {description && (
        <p className="mt-3 line-clamp-2 text-sm text-surface-400">
          {description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-surface-500">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {formatNumber(downloadCount)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            {formatNumber(starCount)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {author.avatarUrl && (
            <img
              src={author.avatarUrl}
              alt={author.username}
              className="h-4 w-4 rounded-full"
            />
          )}
          <span className="text-xs text-surface-500">{author.username}</span>
        </div>
      </div>
    </Link>
  );
}
