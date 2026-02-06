import { readFile } from 'fs/promises';
import { join } from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

const DOC_TITLES: Record<string, string> = {
  'getting-started': 'Getting Started',
  'creating-agents': 'Creating Agents',
  'agent-yaml-reference': 'agent.yaml Reference',
};

interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const docSlug = slug.join('/');
  const title = DOC_TITLES[docSlug] || docSlug;
  return { title };
}

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list-item'; text: string }
  | { type: 'code'; text: string }
  | { type: 'hr' };

function parseMarkdown(md: string): Block[] {
  const content = md.replace(/^---[\s\S]*?---\n*/, '');
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let inCodeBlock = false;
  let codeContent = '';

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', text: codeContent.trim() });
        codeContent = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4) });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3) });
    } else if (line.startsWith('# ')) {
      // Skip top-level heading — we render it separately
      continue;
    } else if (line.startsWith('- ')) {
      blocks.push({ type: 'list-item', text: line.slice(2) });
    } else if (/^\d+\. /.test(line)) {
      blocks.push({ type: 'list-item', text: line.replace(/^\d+\. /, '') });
    } else if (line.startsWith('---')) {
      blocks.push({ type: 'hr' });
    } else if (line.trim() !== '') {
      blocks.push({ type: 'paragraph', text: line });
    }
  }

  return blocks;
}

function InlineText({ text }: { text: string }) {
  // Split on inline code backticks and bold markers
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={i}
              className="rounded bg-surface-800 px-1.5 py-0.5 text-sm text-surface-200"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const docSlug = slug.join('/');
  const title = DOC_TITLES[docSlug];

  if (!title) {
    notFound();
  }

  let content: string;
  try {
    const filePath = join(
      process.cwd(),
      'content',
      'docs',
      `${docSlug}.mdx`,
    );
    content = await readFile(filePath, 'utf-8');
  } catch {
    notFound();
  }

  const blocks = parseMarkdown(content);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/docs"
        className="text-sm text-primary-400 hover:text-primary-300"
      >
        &larr; Back to docs
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-white">{title}</h1>
      <div className="mt-8 max-w-none space-y-4">
        {blocks.map((block, i) => {
          switch (block.type) {
            case 'h2':
              return (
                <h2
                  key={i}
                  className="mt-10 text-xl font-bold text-white"
                >
                  {block.text}
                </h2>
              );
            case 'h3':
              return (
                <h3
                  key={i}
                  className="mt-6 text-lg font-semibold text-white"
                >
                  {block.text}
                </h3>
              );
            case 'paragraph':
              return (
                <p key={i} className="leading-7 text-surface-300">
                  <InlineText text={block.text} />
                </p>
              );
            case 'list-item':
              return (
                <ul key={i} className="list-disc pl-6 text-surface-300">
                  <li>
                    <InlineText text={block.text} />
                  </li>
                </ul>
              );
            case 'code':
              return (
                <pre
                  key={i}
                  className="overflow-x-auto rounded-lg bg-surface-900 p-4 text-sm text-surface-200"
                >
                  <code>{block.text}</code>
                </pre>
              );
            case 'hr':
              return <hr key={i} className="my-8 border-surface-800" />;
          }
        })}
      </div>
    </div>
  );
}
