import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'agentx - AI Agent Marketplace',
    template: '%s | agentx',
  },
  description:
    'Discover, install, and run AI agents powered by Claude. The open marketplace for CLI-first AI agents.',
  keywords: [
    'AI agents',
    'Claude',
    'MCP',
    'CLI',
    'marketplace',
    'developer tools',
  ],
  openGraph: {
    title: 'agentx - AI Agent Marketplace',
    description:
      'Discover, install, and run AI agents powered by Claude.',
    url: 'https://agentx.dev',
    siteName: 'agentx',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'agentx - AI Agent Marketplace',
    description:
      'Discover, install, and run AI agents powered by Claude.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-950 text-surface-100 antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
