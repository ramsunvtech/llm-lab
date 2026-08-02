'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedStep, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function DecoderStage({
  prompt,
  generated,
  revealedCount,
  isGenerating,
  model,
}: {
  prompt: string;
  generated: GeneratedStep[];
  revealedCount: number;
  isGenerating: boolean;
  model: ModelPreset;
}) {
  const revealed = generated.slice(0, revealedCount);
  const current = generated[revealedCount - 1];

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <StageHeading
        title="Decoder & Sampling"
        description="One token is sampled from the probability distribution and appended to the sequence. Then the whole pipeline runs again on the longer sequence — that's how models generate text one token at a time."
      />

      <div className="flex w-full max-w-2xl flex-col items-center gap-5">
        <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-base-500">Growing sequence</p>
          <p className="font-mono text-sm leading-relaxed text-base-200 sm:text-base">
            <span className="text-base-400">{prompt}</span>{' '}
            <AnimatePresence>
              {revealed.map((g, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-semibold"
                  style={{ color: model.accent }}
                >
                  {g.word}{' '}
                </motion.span>
              ))}
            </AnimatePresence>
            {isGenerating && (
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                className="inline-block h-4 w-1.5 translate-y-0.5 bg-base-300"
              />
            )}
          </p>
        </div>

        <div className="flex min-h-[64px] w-full items-center justify-center gap-2 flex-wrap">
          {current && (
            <motion.div
              key={revealedCount}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center justify-center gap-1.5"
            >
              <span className="mr-1 text-xs text-base-500">sampled from:</span>
              {current.probs.map((p) => (
                <span
                  key={p.word}
                  className="rounded-full border px-2 py-0.5 text-[11px] font-mono"
                  style={{
                    borderColor: p.word === current.word ? `${model.accent}88` : 'rgba(255,255,255,0.08)',
                    backgroundColor: p.word === current.word ? `${model.accent}22` : 'transparent',
                    color: p.word === current.word ? model.accent : '#6b7385',
                  }}
                >
                  {p.word} {(p.value * 100).toFixed(0)}%
                </span>
              ))}
            </motion.div>
          )}
        </div>

        {!isGenerating && revealedCount >= generated.length && generated.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-2 rounded-2xl border px-6 py-4 text-center"
            style={{ borderColor: `${model.accent}55`, backgroundColor: `${model.accent}14` }}
          >
            <span className="text-xs uppercase tracking-wide" style={{ color: model.accent }}>
              Generation complete
            </span>
            <p className="max-w-md text-xs text-base-400">
              {model.name} generated this by repeating the entire pipeline once per token. Real models
              do this thousands of times per second, guided by billions of trained parameters instead of
              the random ones used here.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
