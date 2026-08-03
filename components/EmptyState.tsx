'use client';

import { motion } from 'framer-motion';
import { STAGES } from '@/lib/stages';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex min-h-[70vh] flex-col items-center justify-center gap-8 rounded-2xl glass-panel p-10 text-center shadow-panel"
    >
      <p className="max-w-md text-sm text-base-400 sm:text-base">
        Enter a prompt on the left and hit <span className="font-medium text-base-100">Visualize</span> to
        watch it travel through all {STAGES.length} stages of a language model.
      </p>
      <div className="flex max-w-2xl flex-wrap items-center justify-center gap-2">
        {STAGES.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="rounded-full border border-base-700 bg-base-850 px-3 py-1.5 text-xs text-base-400">
              {s.title}
            </div>
            {i < STAGES.length - 1 && <span className="text-base-600">→</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
