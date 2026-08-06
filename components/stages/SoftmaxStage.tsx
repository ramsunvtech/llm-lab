'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogitItem, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function SoftmaxStage({
  probs,
  model,
}: {
  probs: LogitItem[];
  model: ModelPreset;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const top = probs[0];

  // Calculate cumulative probability up to hover index
  const cumulativeProb =
    hoveredIdx !== null
      ? probs.slice(0, hoveredIdx + 1).reduce((acc, p) => acc + p.value, 0)
      : null;

  return (
    <div className="flex flex-col items-center gap-8 py-6 w-full max-w-3xl mx-auto">
      <StageHeading
        title="8. Softmax Normalization Stage"
        description="Softmax exponentiates every logit and divides by the total sum. This turns arbitrary unnormalized real numbers into a strict probability distribution ranging from 0% to 100% that sums to exactly 1.0."
      />

      {/* Formula & Exponentiation Banner */}
      <div className="w-full bg-base-950/60 border border-base-800 rounded-xl p-3.5 font-mono text-xs flex flex-wrap items-center justify-between gap-3 text-base-300">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            Formula
          </span>
          <span>P(w_i) = e^(z_i) / Σ e^(z_j)</span>
        </div>
        <div className="text-[10px] text-base-400">
          Σ P(w_i) = <span className="text-emerald-400 font-bold">100.0%</span>
        </div>
      </div>

      {/* Probability Distribution Container */}
      <div className="w-full bg-base-950/80 border border-base-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
        {/* Table Header */}
        <div className="flex items-center font-mono text-[10px] text-base-500 pb-2 border-b border-base-800/80">
          <span className="w-28 shrink-0">Candidate Token</span>
          <span className="flex-1 text-center">Normalized Probability Bar</span>
          <span className="w-20 shrink-0 text-right">Probability</span>
        </div>

        {/* Probability Rows */}
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
          {probs.map((p, i) => {
            const isTop = i === 0;
            const pct = p.value * 100;
            const isHovered = hoveredIdx === i;

            return (
              <motion.div
                key={p.word}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center gap-3 p-2 rounded-xl font-mono text-xs transition-all border ${
                  isTop
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : isHovered
                    ? 'bg-base-900 border-base-700 text-base-200'
                    : 'bg-base-950/40 border-base-800/60 text-base-400'
                }`}
              >
                {/* Word & Rank */}
                <div className="w-28 shrink-0 flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ${
                      isTop
                        ? 'bg-emerald-500 text-base-950'
                        : 'bg-base-800 text-base-400'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-semibold truncate">
                    {JSON.stringify(p.word)}
                  </span>
                </div>

                {/* Progress Bar Container */}
                <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-base-900 border border-base-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      delay: i * 0.04 + 0.1,
                      duration: 0.5,
                      ease: 'easeOut',
                    }}
                    className="h-full rounded-full transition-colors"
                    style={{
                      backgroundColor: isTop
                        ? model.accent
                        : isHovered
                        ? 'rgba(16, 185, 129, 0.4)'
                        : 'rgba(255, 255, 255, 0.15)',
                    }}
                  />
                </div>

                {/* Percentage readout */}
                <span
                  className={`w-20 shrink-0 text-right font-mono text-xs font-bold ${
                    isTop ? 'text-emerald-400' : 'text-base-400'
                  }`}
                >
                  {pct.toFixed(2)}%
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Hovered Cumulative Info Pill */}
        {cumulativeProb !== null && hoveredIdx !== null && (
          <div className="mt-1 flex items-center justify-between border-t border-base-800/80 pt-2 font-mono text-[10px] text-base-400">
            <span>Cumulative mass (Top-{hoveredIdx + 1}):</span>
            <span className="text-emerald-400 font-bold">
              {(cumulativeProb * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Top Choice Winner Highlight */}
      {top && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: probs.length * 0.04 + 0.2, type: 'spring', stiffness: 180 }}
          className="flex items-center gap-3 rounded-full border border-emerald-500/40 bg-emerald-950/30 px-5 py-2 text-xs font-mono text-emerald-300 shadow-lg"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Most Likely Next Token:</span>
          <span className="font-bold text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
            {JSON.stringify(top.word)}
          </span>
          <span className="text-emerald-400 font-bold">
            ({(top.value * 100).toFixed(1)}%)
          </span>
        </motion.div>
      )}

      {/* Conceptual Footer */}
      <div className="w-full bg-base-950/40 rounded-xl border border-base-800 p-4 text-xs font-mono text-base-400">
        <strong className="text-base-200">Sampling & Temperature:</strong> While the highest probability token is <code className="text-emerald-400">{JSON.stringify(top?.word)}</code>, greedy decoding always chooses #1. In Stage 9, techniques like Temperature ($T$), Top-$K$, and Top-$P$ (Nucleus) sampling introduce controlled randomness to prevent repetitive loops.
      </div>
    </div>
  );
}