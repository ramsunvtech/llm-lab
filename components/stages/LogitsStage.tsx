'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogitItem, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function LogitsStage({
  logits,
  model,
}: {
  logits: LogitItem[];
  model: ModelPreset;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Find the max absolute logit value to scale bars relative to zero
  const maxAbsLogit = Math.max(...logits.map((l) => Math.abs(l.value)), 0.001);

  return (
    <div className="flex flex-col items-center gap-8 py-6 w-full max-w-3xl mx-auto">
      <StageHeading
        title="7. Output Logits Stage"
        description="The final hidden state vector (h_final) from the last sequence position is projected against the vocabulary output matrix (W_vocab), producing a raw score (logit) for every candidate next token."
      />

      {/* Projection Matrix Equation Banner */}
      <div className="w-full bg-base-950/60 border border-base-800 rounded-xl p-3.5 font-mono text-xs flex flex-wrap items-center justify-between gap-2 text-base-300">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            Projection
          </span>
          <span>Logits (z) = W_vocab × h_final</span>
        </div>
        <span className="text-[10px] text-base-500">
          Unnormalized scores in (-∞, +∞)
        </span>
      </div>

      {/* Diverging Bar Chart Matrix */}
      <div className="w-full bg-base-950/80 border border-base-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-2">
        {/* Axis Header */}
        <div className="flex items-center text-[10px] font-mono text-base-500 pb-2 border-b border-base-800/80">
          <span className="w-24 shrink-0">Candidate Word</span>
          <div className="flex-1 text-center flex justify-between px-2">
            <span>Negative Logit</span>
            <span className="text-emerald-400 font-bold">0.0 (Baseline)</span>
            <span>Positive Logit</span>
          </div>
          <span className="w-16 shrink-0 text-right">Raw Score</span>
        </div>

        {/* Logit Rows */}
        <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1">
          {logits.map((l, i) => {
            const widthPct = (Math.abs(l.value) / maxAbsLogit) * 48; // Max 48% width per side
            const isPositive = l.value >= 0;
            const isHovered = hoveredIdx === i;

            return (
              <motion.div
                key={l.word}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center gap-3 p-1.5 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                  isHovered ? 'bg-base-900 border border-base-700' : 'hover:bg-base-900/40'
                }`}
              >
                {/* Candidate Word & Rank */}
                <div className="w-24 shrink-0 flex items-center gap-1.5">
                  <span className="text-[9px] text-base-500 font-bold w-4">#{i + 1}</span>
                  <span className="text-base-200 font-semibold truncate">
                    {JSON.stringify(l.word)}
                  </span>
                </div>

                {/* Diverging Bar Area (0 centered at 50%) */}
                <div className="relative h-5 flex-1 rounded bg-base-900/80 border border-base-800/60 overflow-hidden">
                  {/* Zero Axis Line */}
                  <div className="absolute left-1/2 top-0 h-full w-px bg-base-700 z-10" />

                  {/* Dynamic Value Bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ delay: i * 0.03 + 0.05, duration: 0.4, ease: 'easeOut' }}
                    className="absolute top-0.5 bottom-0.5 rounded-xs"
                    style={{
                      backgroundColor: isPositive ? model.accent : '#f87171',
                      left: isPositive ? '50%' : undefined,
                      right: isPositive ? undefined : '50%',
                      opacity: isHovered ? 1 : 0.8,
                    }}
                  />
                </div>

                {/* Exact Numeric Logit Value */}
                <span
                  className={`w-16 shrink-0 text-right font-mono text-[11px] font-bold ${
                    isPositive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {l.value.toFixed(2)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Concept Explanatory Footer */}
      <div className="w-full bg-base-950/40 rounded-xl border border-base-800 p-4 text-xs font-mono text-base-400">
        <strong className="text-base-200">Logits vs. Probabilities:</strong> Logits are unconstrained dot-product scores. A score of <code className="text-emerald-400">+8.5</code> indicates high dot-product alignment with the output matrix vector, while <code className="text-red-400">-3.2</code> indicates orthogonality or opposition. In Stage 8, these scores pass through <code className="text-emerald-400">Softmax</code> to turn into normalized percentages summing to 100%.
      </div>
    </div>
  );
}