import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-surface-800 bg-surface-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Product</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/agents"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Browse Agents
                </Link>
              </li>
              <li>
                <Link
                  href="/agents?sort=trending"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Trending
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Developers</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/docs"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/getting-started"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Getting Started
                </Link>
              </li>
              <li>
                <Link
                  href="/docs/creating-agents"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Create an Agent
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Community</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="https://github.com/agentx-dev/agentx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/agentx-dev/agentx/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/agentx-dev/agentx/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-surface-400 hover:text-surface-200"
                >
                  Discussions
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <span className="text-sm text-surface-400">MIT License</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-surface-800 pt-8">
          <p className="text-sm text-surface-500">
            agent<span className="text-primary-400">x</span> &mdash; The open
            marketplace for AI agents
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-surface-800 px-2.5 py-0.5 text-xs font-medium text-surface-300">
              MIT
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
