import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'LLM Lab — See How a Language Model Thinks',
  description:
    'An interactive, animated walkthrough of every stage inside a large language model: tokenizer, embeddings, attention, transformer layers, and next-token prediction.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-base-950 text-base-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
