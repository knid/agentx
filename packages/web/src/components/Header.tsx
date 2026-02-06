'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/agents?q=${encodeURIComponent(q)}`);
      setQuery('');
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-surface-800 bg-surface-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            agent<span className="text-primary-400">x</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 sm:block">
          <div className="relative max-w-md">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents..."
              className="w-full rounded-lg border border-surface-700 bg-surface-900 py-2 pl-10 pr-4 text-sm text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </form>

        <nav className="flex items-center gap-1">
          <Link
            href="/agents"
            className="rounded-md px-3 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800 hover:text-white"
          >
            Browse
          </Link>
          <Link
            href="/agents?sort=trending"
            className="rounded-md px-3 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800 hover:text-white"
          >
            Trending
          </Link>
          <Link
            href="/docs"
            className="rounded-md px-3 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800 hover:text-white"
          >
            Docs
          </Link>
          <a
            href="https://github.com/agentx-dev/agentx"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800 hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
