'use client';

import { motion } from 'framer-motion';
import { LogitItem, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function LogitsStage({ logits, model }: { logits: LogitItem[]; model: ModelPreset }) {
  const max = Math.max(...logits.map((l) => Math.abs(l.value)), 0.001);

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <StageHeading
        title="Output Logits"
        description="The final token's vector is projected across the entire vocabulary, producing one raw score — a logit — for every candidate next word. Higher is more likely, but these aren't probabilities yet."
      />

      <div className="flex w-full max-w-lg flex-col gap-2">
        {logits.map((l, i) => {
          const widthPct = (Math.abs(l.value) / max) * 50;
          const positive = l.value >= 0;
          return (
            <motion.div
              key={l.word}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3"
            >
              <span className="w-20 shrink-0 text-right font-mono text-xs text-base-300">{l.word}</span>
              <div className="relative h-4 flex-1 rounded bg-white/[0.03]">
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/10" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ delay: i * 0.05 + 0.1, duration: 0.5, ease: 'easeOut' }}
                  className="absolute top-0 h-full rounded"
                  style={{
                    backgroundColor: positive ? model.accent : '#f87171',
                    left: positive ? '50%' : undefined,
                    right: positive ? undefined : '50%',
                    opacity: 0.85,
                  }}
                />
              </div>
              <span className="w-14 shrink-0 font-mono text-[11px] text-base-500">
                {l.value >= 0 ? '+' : ''}{l.value.toFixed(2)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
