'use client';

import { useState } from 'react';

interface InstallCommandProps {
  scope: string;
  name: string;
}

export function InstallCommand({ scope, name }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);
  const command = `agentx install ${scope}/${name}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = command;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-900 px-4 py-2.5">
      <code className="flex-1 text-sm text-surface-200">
        <span className="text-surface-500">$ </span>
        {command}
      </code>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-800 hover:text-white"
        title="Copy to clipboard"
      >
        {copied ? (
          <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
