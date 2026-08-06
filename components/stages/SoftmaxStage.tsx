'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogitItem, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function SoftmaxStage({
  probs,
  model,
  prompt,
}: {
  probs: LogitItem[];
  model: ModelPreset;
  prompt?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(true);

  const top = probs[0];

  const cumulativeProb =
    hoveredIdx !== null
      ? probs.slice(0, hoveredIdx + 1).reduce((acc, p) => acc + p.value, 0)
      : null;

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full max-w-3xl mx-auto">
      <StageHeading
        title="8. Softmax Normalization Stage"
        description="Softmax exponentiates every logit and divides by the total sum. This turns arbitrary unnormalized real numbers into a strict probability distribution ranging from 0% to 100% that sums to exactly 1.0."
      />

      {/* Sequence Context Bar */}
      {prompt && (
        <div className="w-full rounded-xl border border-base-800 bg-base-950/60 px-4 py-2.5 font-mono text-xs flex items-center justify-between text-base-300">
          <div className="flex items-center gap-2 truncate">
            <span className="text-base-500">Normalizing probabilities for:</span>
            <span className="font-semibold text-emerald-400 truncate">&quot;{prompt}&quot;</span>
          </div>
          <span className="shrink-0 text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
            Σ P = 100.0%
          </span>
        </div>
      )}

      {/* Historical & Technical Insight Banner */}
      <div className="w-full rounded-xl border border-base-800 bg-base-950/90 p-4 font-mono text-xs text-base-300">
        <div className="flex items-center justify-between mb-2 border-b border-base-800 pb-2">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Why Softmax? (Etymology &amp; History)
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] text-base-500 hover:text-base-300 underline"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-2 text-[11px] leading-relaxed text-base-400">
            <p>
              <strong className="text-base-200">Why &quot;Softmax&quot;?</strong> It is a smooth, differentiable approximation of the <code className="text-emerald-300">argmax</code> (hard max) function. Instead of choosing 1 for the highest logit and 0 for all others, Softmax assigns non-zero probabilities to all candidates while dramatically exaggerating the gap between top choices.
            </p>
            <p>
              <strong className="text-base-200">History in 3 lines:</strong> Adapted from Ludwig Boltzmann&apos;s 1868 statistical mechanics formula for particle energy states, Softmax was formally introduced to neural network literature by John S. Bridle in 1989. Exponentiation (<code className="text-emerald-300">e^(z_i)</code>) ensures all values become positive, enabling gradient-based backpropagation learning.
            </p>
          </div>
        )}
      </div>

      {/* Formula Banner */}
      <div className="w-full bg-base-950/60 border border-base-800 rounded-xl p-3.5 font-mono text-xs flex flex-wrap items-center justify-between gap-3 text-base-300">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            Formula
          </span>
          <span>P(w_i) = e^(z_i) / Σ e^(z_j)</span>
        </div>
        <div className="text-[10px] text-base-400">
          Top candidate: <span className="text-emerald-400 font-bold">{JSON.stringify(top?.word)}</span>
        </div>
      </div>

      {/* Probability Distribution Container */}
      <div className="w-full bg-base-950/80 border border-base-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
        <div className="flex items-center font-mono text-[10px] text-base-500 pb-2 border-b border-base-800/80">
          <span className="w-28 shrink-0">Candidate Token</span>
          <span className="flex-1 text-center">Normalized Probability Bar</span>
          <span className="w-20 shrink-0 text-right">Probability</span>
        </div>

        <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
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

        {cumulativeProb !== null && hoveredIdx !== null && (
          <div className="mt-1 flex items-center justify-between border-t border-base-800/80 pt-2 font-mono text-[10px] text-base-400">
            <span>Cumulative mass (Top-{hoveredIdx + 1}):</span>
            <span className="text-emerald-400 font-bold">
              {(cumulativeProb * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}