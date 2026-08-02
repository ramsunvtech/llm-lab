'use client';

import { motion } from 'framer-motion';

const EXAMPLES = [
  'Why is the sky blue?',
  'Write a haiku about the ocean',
  'Explain gravity to a child',
  'The cat sat on the mat',
];

export default function PromptBar({
  prompt,
  setPrompt,
  onRun,
  hasResult,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  onRun: () => void;
  hasResult: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2 rounded-2xl glass-panel p-2 shadow-panel sm:flex-row sm:items-center">
        <input
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') onRun();
          }}
          placeholder="Type a prompt, e.g. “Why is the sky blue?”"
          className="w-full flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-base-100 placeholder:text-base-500 outline-none sm:text-base"
        />
        <button
          onClick={onRun}
          disabled={!prompt.trim()}
          className="mx-1 mb-1 shrink-0 rounded-xl bg-blue-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-base-700 disabled:text-base-400 sm:mb-0"
        >
          {hasResult ? 'Run again' : 'Visualize'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setPrompt(ex)}
            className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-base-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-base-100"
          >
            {ex}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
