import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Learn how to use agentx to install, run, and create AI agents.',
};

const DOCS = [
  {
    title: 'Getting Started',
    description:
      'Install the agentx CLI and run your first agent in under a minute.',
    href: '/docs/getting-started',
  },
  {
    title: 'Creating Agents',
    description:
      'Learn how to scaffold, build, test, and publish your own AI agents.',
    href: '/docs/creating-agents',
  },
  {
    title: 'agent.yaml Reference',
    description:
      'Complete reference for the agent manifest file format and all available options.',
    href: '/docs/agent-yaml-reference',
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Documentation</h1>
      <p className="mt-3 text-surface-300">
        Everything you need to get started with agentx.
      </p>

      <div className="mt-10 space-y-4">
        {DOCS.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="block rounded-xl border border-surface-800 bg-surface-900/50 p-6 transition-all hover:border-surface-600 hover:bg-surface-900"
          >
            <h2 className="text-lg font-semibold text-white">{doc.title}</h2>
            <p className="mt-2 text-sm text-surface-400">{doc.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-surface-800 bg-surface-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Quick Install</h2>
        <div className="mt-4 rounded-lg bg-surface-950 p-4">
          <code className="text-sm text-surface-200">
            <span className="text-surface-500">$ </span>
            npm install -g @knid/agentx
          </code>
        </div>
        <div className="mt-4 space-y-2 text-sm text-surface-400">
          <p>Then try these commands:</p>
          <ul className="space-y-1">
            <li>
              <code className="text-surface-300">agentx search &lt;query&gt;</code>{' '}
              — Search for agents
            </li>
            <li>
              <code className="text-surface-300">
                agentx install @scope/name
              </code>{' '}
              — Install an agent
            </li>
            <li>
              <code className="text-surface-300">
                agentx run &lt;agent&gt; &quot;prompt&quot;
              </code>{' '}
              — Run an agent
            </li>
            <li>
              <code className="text-surface-300">agentx init</code> — Scaffold a
              new agent
            </li>
            <li>
              <code className="text-surface-300">agentx doctor</code> — Check
              your environment
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
