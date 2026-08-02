'use client';

import { motion } from 'framer-motion';
import { Token } from '@/lib/types';
import StageHeading from './StageHeading';

export default function TokenizerStage({ tokens }: { tokens: Token[] }) {
  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <StageHeading
        title="Tokenizer"
        description="The model can't read letters — only numbers. So the text is cut into small chunks called tokens, and each one is mapped to an ID."
      />

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {tokens.map((t, i) => (
          <motion.div
            key={`${t.id}-${i}`}
            initial={{ opacity: 0, y: 16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 200, damping: 18 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="rounded-xl border px-3.5 py-2 font-mono text-sm font-medium shadow-lg"
              style={{
                borderColor: `${t.color}55`,
                backgroundColor: `${t.color}1a`,
                color: t.color,
                boxShadow: `0 8px 24px -12px ${t.color}88`,
              }}
            >
              {t.text}
            </div>
            <span className="font-mono text-[10px] text-base-500">#{t.id}</span>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: tokens.length * 0.07 + 0.3 }}
        className="text-center text-xs text-base-500"
      >
        {tokens.length} tokens · long or rare words are split into smaller pieces (prefixed with{' '}
        <span className="font-mono">##</span>), just like real subword tokenizers.
      </motion.p>
    </div>
  );
}
