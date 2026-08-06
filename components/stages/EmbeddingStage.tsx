'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [selectedTokenIdx, setSelectedTokenIdx] = useState<number | null>(0);

  // Fallback to 16 dimensions if not explicitly set
  const dModel = model?.dModel ?? embeddings[0]?.length ?? 16;

  // 2D Projection logic using first two principal components/dimensions
  const points = embeddings.map((v) => ({ x: v[0] ?? 0, y: v[1] ?? 0 }));
  const range = 1.1;
  const toPct = (v: number) => Math.max(5, Math.min(95, ((v + range) / (2 * range)) * 100));

  return (
    <div className="flex flex-col items-center gap-8 py-6 w-full max-w-4xl mx-auto">
      <StageHeading
        title="Embedding Stage"
        description={`Each Token ID is looked up in a fixed embedding matrix and converted into a ${dModel}-dimensional vector (16 float values) representing its base semantic position.`}
      />

      {/* 1. Vector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {tokens.map((t, i) => {
          const vector = embeddings[i] ?? new Array(dModel).fill(0);
          const isSelected = selectedTokenIdx === i;

          return (
            <motion.div
              key={`${t.id}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedTokenIdx(i)}
              className={`cursor-pointer flex flex-col gap-3 rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-emerald-500/60 bg-emerald-950/10 shadow-lg ring-1 ring-emerald-500/30'
                  : 'border-base-800 bg-base-900/40 hover:border-base-700'
              }`}
            >
              {/* Token Header Info */}
              <div className="flex items-center justify-between border-b border-base-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 rounded-md font-mono text-xs font-semibold"
                    style={{
                      borderColor: `${t.color}44`,
                      backgroundColor: `${t.color}18`,
                      color: t.color,
                    }}
                  >
                    {t.text.replace(/ /g, '␣')}
                  </span>
                  <span className="font-mono text-[10px] text-base-500">
                    Seq #{i} · ID #{t.id}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400/80">
                  {dModel}-D Vector
                </span>
              </div>

              {/* Visual Bar Representation (16 height bars) */}
              <div className="flex h-12 items-end justify-between gap-1 px-1 bg-base-950/50 rounded-lg p-2 border border-base-800/40">
                {vector.map((v, d) => (
                  <div key={d} className="flex-1 flex flex-col items-center h-full justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min(100, Math.abs(v) * 80 + 10)}%` }}
                      transition={{ delay: i * 0.04 + d * 0.01, duration: 0.3 }}
                      className="w-full rounded-xs min-h-[3px]"
                      style={{
                        backgroundColor: v >= 0 ? t.color : '#f87171',
                        opacity: isSelected ? 1 : 0.65,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Exact 16-Float Values Vector */}
              <div className="font-mono text-[10px] text-base-400 bg-base-950/80 p-2 rounded-lg border border-base-800/80 overflow-x-auto">
                <span className="text-base-500">[</span>
                {vector.map((v, d) => (
                  <span key={d} className={v >= 0 ? 'text-base-300' : 'text-red-400'}>
                    {v >= 0 ? ` ${v.toFixed(2)}` : v.toFixed(2)}
                    {d < vector.length - 1 ? ', ' : ''}
                  </span>
                ))}
                <span className="text-base-500">]</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. Simplified 2D Meaning Space Projection */}
      <div className="flex w-full flex-col items-center gap-3 mt-4 border-t border-base-800/60 pt-6">
        <div className="text-center">
          <h4 className="text-xs font-semibold text-base-300">2D Vector Space Projection</h4>
          <p className="text-[11px] text-base-500">
            Plotting dimensions 1 & 2 of each token's 16-D embedding
          </p>
        </div>

        <div className="relative aspect-square w-full max-w-sm rounded-2xl border border-base-800 bg-base-950/60 p-4 shadow-inner overflow-hidden">
          {/* Axis Lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-full w-px bg-base-800/60 stroke-dashed" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-px w-full bg-base-800/60 stroke-dashed" />
          </div>

          {/* Points */}
          {points.map((p, i) => {
            const isSelected = selectedTokenIdx === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: isSelected ? 1.25 : 1 }}
                transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 200 }}
                onClick={() => setSelectedTokenIdx(i)}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center cursor-pointer group"
                style={{ left: `${toPct(p.x)}%`, top: `${100 - toPct(p.y)}%` }}
              >
                <div
                  className={`h-3 w-3 rounded-full ring-2 transition-all ${
                    isSelected ? 'ring-white scale-125 z-10' : 'ring-base-900 group-hover:scale-110'
                  }`}
                  style={{ backgroundColor: tokens[i].color }}
                />
                <span className="mt-1 whitespace-nowrap font-mono text-[10px] bg-base-900/90 px-1.5 py-0.5 rounded border border-base-800 text-base-300">
                  {tokens[i].text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}