'use client';

import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-3 pt-4 text-center"
    >
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-base-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Runs entirely in your browser — no backend
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
        LLM Lab
      </h1>
      <p className="max-w-xl text-balance text-sm text-base-300 sm:text-base">
        Watch, step by step, what actually happens inside a large language model —
        from your prompt to its next word.
      </p>
    </motion.div>
  );
}
