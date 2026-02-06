'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AgentSearchProps {
  initialQuery?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'lg';
}

export function AgentSearch({
  initialQuery = '',
  placeholder = 'Search agents...',
  autoFocus = false,
  size = 'sm',
}: AgentSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery || searchParams.get('q') || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (q) {
        router.push(`/agents?q=${encodeURIComponent(q)}`);
      } else {
        router.push('/agents');
      }
    },
    [query, router],
  );

  const sizeClasses =
    size === 'lg'
      ? 'py-4 pl-12 pr-5 text-lg rounded-xl'
      : 'py-2.5 pl-10 pr-4 text-sm rounded-lg';

  const iconClasses =
    size === 'lg' ? 'left-4 h-5 w-5' : 'left-3 h-4 w-4';

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">
        <svg
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-surface-400 ${iconClasses}`}
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-surface-700 bg-surface-900 text-surface-100 placeholder-surface-500 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-500 ${sizeClasses}`}
        />
      </div>
    </form>
  );
}
