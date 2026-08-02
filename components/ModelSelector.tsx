'use client';

import { motion } from 'framer-motion';
import { ModelPreset } from '@/lib/types';

export default function ModelSelector({
  models,
  selected,
  onSelect,
}: {
  models: ModelPreset[];
  selected: ModelPreset;
  onSelect: (m: ModelPreset) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="mr-1 text-xs font-medium uppercase tracking-wide text-base-400">
        Model
      </span>
      {models.map((m) => {
        const active = m.id === selected.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className="relative rounded-full px-3.5 py-1.5 text-sm font-medium transition"
            style={{
              color: active ? '#0b0d11' : '#c2c9d6',
              backgroundColor: active ? m.accent : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? m.accent : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {m.name}
            <span className="ml-1.5 hidden text-[11px] opacity-70 sm:inline">· {m.org}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
