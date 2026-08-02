'use client';

import { motion } from 'framer-motion';
import { LogitItem, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function SoftmaxStage({ probs, model }: { probs: LogitItem[]; model: ModelPreset }) {
  const top = probs[0];

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <StageHeading
        title="Softmax"
        description="Softmax squashes every logit into a probability between 0 and 100% — and all of them add up to exactly 100%. Now the model has an actual distribution to sample from."
      />

      <div className="flex w-full max-w-lg flex-col gap-2.5">
        {probs.map((p, i) => (
          <motion.div
            key={p.word}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3"
          >
            <span
              className="w-20 shrink-0 text-right font-mono text-xs"
              style={{ color: p.word === top?.word ? model.accent : '#95a0b3' }}
            >
              {p.word}
            </span>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-white/[0.03]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p.value * 100}%` }}
                transition={{ delay: i * 0.05 + 0.15, duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: p.word === top?.word ? model.accent : '#4a5262',
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-[11px] text-base-400">
              {(p.value * 100).toFixed(1)}%
            </span>
          </motion.div>
        ))}
      </div>

      {top && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: probs.length * 0.05 + 0.4, type: 'spring', stiffness: 180 }}
          className="rounded-full border px-4 py-1.5 text-sm"
          style={{ borderColor: `${model.accent}66`, backgroundColor: `${model.accent}1a`, color: model.accent }}
        >
          Most likely next token: <span className="font-semibold">{top.word}</span>
        </motion.div>
      )}
    </div>
  );
}
