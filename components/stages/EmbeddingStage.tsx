'use client';

import { motion } from 'framer-motion';
import { Token, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function EmbeddingStage({
  tokens,
  embeddings,
  model,
}: {
  tokens: Token[];
  embeddings: number[][];
  model: ModelPreset;
}) {
  const points = embeddings.map((v) => ({ x: v[0] ?? 0, y: v[1] ?? 0 }));
  const range = 1.1;
  const toPct = (v: number) => ((v + range) / (2 * range)) * 100;

  return (
    <div className="flex flex-col items-center gap-10 py-6">
      <StageHeading
        title="Embedding"
        description={`Each token ID is looked up in a table and turned into a vector of ${
          embeddings[0]?.length ?? 16
        } numbers — a point in a high-dimensional "meaning space".`}
      />

      <div className="flex flex-wrap items-start justify-center gap-3">
        {tokens.map((t, i) => (
          <motion.div
            key={`${t.id}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex flex-col items-center gap-2 rounded-xl border border-black/[0.06] bg-black/[0.02] p-2.5"
          >
            <span className="font-mono text-[11px]" style={{ color: t.color }}>{t.text}</span>
            <div className="flex h-14 items-end gap-[2px]">
              {embeddings[i]?.map((v, d) => (
                <motion.div
                  key={d}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.abs(v) * 48 + 4}px` }}
                  transition={{ delay: i * 0.06 + d * 0.015, duration: 0.4 }}
                  className="w-[3px] rounded-full"
                  style={{ backgroundColor: v >= 0 ? t.color : '#f87171', opacity: 0.85 }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <p className="text-xs text-base-500">A simplified 2D view of where each token landed in space</p>
        <div className="relative aspect-square w-full rounded-2xl border border-black/[0.06] bg-black/[0.015]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-px bg-black/[0.06]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-px w-full bg-black/[0.06]" />
          </div>
          {points.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 200 }}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${toPct(p.x)}%`, top: `${100 - toPct(p.y)}%` }}
            >
              <div
                className="h-2.5 w-2.5 rounded-full ring-2 ring-base-900"
                style={{ backgroundColor: tokens[i].color }}
              />
              <span className="mt-1 whitespace-nowrap font-mono text-[9px] text-base-400">
                {tokens[i].text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
