'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogitItem, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function LogitsStage({
  logits,
  model,
  prompt,
}: {
  logits: LogitItem[];
  model: ModelPreset;
  prompt?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(true);

  const maxAbsLogit = Math.max(...logits.map((l) => Math.abs(l.value)), 0.001);

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full max-w-3xl mx-auto">
      <StageHeading
        title="7. Output Logits Stage"
        description="The final hidden state vector (h_final) from the last sequence position is projected against the vocabulary output matrix (W_vocab), producing a raw score (logit) for every candidate next token."
      />

      {/* Sequence Context Bar */}
      {prompt && (
        <div className="w-full rounded-xl border border-base-800 bg-base-950/60 px-4 py-2.5 font-mono text-xs flex items-center justify-between text-base-300">
          <div className="flex items-center gap-2 truncate">
            <span className="text-base-500">Predicting next token for:</span>
            <span className="font-semibold text-emerald-400 truncate">&quot;{prompt}&quot;</span>
          </div>
          <span className="shrink-0 text-[10px] text-base-500 bg-base-900 border border-base-800 px-2 py-0.5 rounded">
            Target Pos: #{prompt.trim().split(/\s+/).length + 1}
          </span>
        </div>
      )}

      {/* Historical & Technical Insight Banner */}
      <div className="w-full rounded-xl border border-base-800 bg-base-950/90 p-4 font-mono text-xs text-base-300">
        <div className="flex items-center justify-between mb-2 border-b border-base-800 pb-2">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            What is a Logit? (Etymology &amp; History)
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
              <strong className="text-base-200">Why the name &quot;Logit&quot;?</strong> The term was coined by statistician Joseph Berkson in 1944 as a contraction of <span className="text-emerald-300">&quot;logistic unit.&quot;</span> In statistics, a logit represents the <em>log-odds</em> of an event: <code className="text-emerald-300">logit(p) = ln(p / (1 - p))</code>.
            </p>
            <p>
              <strong className="text-base-200">History in 3 lines:</strong> Originally developed for binary logistic regression, logits were adopted in 1980s neural networks to represent unconstrained linear outputs. In modern LLMs, logits are raw dot-product scores (<code className="text-emerald-300">z = W_vocab · h_final</code>) ranging from -∞ to +∞, where positive values indicate geometric alignment with candidate word vectors.
            </p>
          </div>
        )}
      </div>

      {/* Projection Matrix Equation Banner */}
      <div className="w-full bg-base-950/60 border border-base-800 rounded-xl p-3.5 font-mono text-xs flex flex-wrap items-center justify-between gap-2 text-base-300">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            Calculation
          </span>
          <span>Logits (z) = W_vocab × h_final</span>
        </div>
        <span className="text-[10px] text-base-500">
          Unnormalized scores in (-∞, +∞)
        </span>
      </div>

      {/* Diverging Bar Chart Matrix */}
      <div className="w-full bg-base-950/80 border border-base-800 rounded-2xl p-5 shadow-2xl flex flex-col gap-2">
        <div className="flex items-center text-[10px] font-mono text-base-500 pb-2 border-b border-base-800/80">
          <span className="w-24 shrink-0">Candidate Word</span>
          <div className="flex-1 text-center flex justify-between px-2">
            <span>Negative Logit</span>
            <span className="text-emerald-400 font-bold">0.0 (Baseline)</span>
            <span>Positive Logit</span>
          </div>
          <span className="w-16 shrink-0 text-right">Raw Score</span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto pr-1">
          {logits.map((l, i) => {
            const widthPct = (Math.abs(l.value) / maxAbsLogit) * 48;
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
                <div className="w-24 shrink-0 flex items-center gap-1.5">
                  <span className="text-[9px] text-base-500 font-bold w-4">#{i + 1}</span>
                  <span className="text-base-200 font-semibold truncate">
                    {JSON.stringify(l.word)}
                  </span>
                </div>

                <div className="relative h-5 flex-1 rounded bg-base-900/80 border border-base-800/60 overflow-hidden">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-base-700 z-10" />
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
    </div>
  );
}