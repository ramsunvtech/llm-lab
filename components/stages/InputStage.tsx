'use client';

import { motion } from 'framer-motion';
import { ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function InputStage({ prompt, model }: { prompt: string; model: ModelPreset }) {
  return (
    <div className="flex flex-col items-center gap-8 py-6 text-center">
      <StageHeading
        title="Input Prompt"
        description={`This is the raw text you gave ${model.name}. Nothing has happened to it yet — it's still just characters.`}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 16 }}
        className="max-w-2xl rounded-2xl border px-8 py-6 font-mono text-lg sm:text-xl"
        style={{ borderColor: model.accentSoft, backgroundColor: model.accentSoft }}
      >
        “{prompt}”
      </motion.div>
      <div className="flex items-center gap-3 text-xs text-base-400">
        <span className="rounded-full border border-white/10 px-2.5 py-1">{prompt.length} characters</span>
        <span className="rounded-full border border-white/10 px-2.5 py-1">{model.name} · {model.org}</span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 text-base-500"
      >
        <span className="text-sm">Next: break it into tokens</span>
        <motion.span
          animate={{ x: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        >
          →
        </motion.span>
      </motion.div>
    </div>
  );
}
