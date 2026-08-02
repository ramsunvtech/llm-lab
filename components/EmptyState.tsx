'use client';

import { motion } from 'framer-motion';
import { STAGES } from '@/lib/stages';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="flex flex-col items-center gap-6 rounded-2xl glass-panel p-10 text-center shadow-panel"
    >
      <p className="text-sm text-base-300">
        Enter a prompt above and hit <span className="text-base-100">Visualize</span> to watch it travel
        through all {STAGES.length} stages of a language model.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-base-400">
              {s.title}
            </div>
            {i < STAGES.length - 1 && <span className="text-base-600">→</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
