'use client';

import { useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import { Token, ModelPreset, LayerTrace } from '@/lib/types';
import StageHeading from './StageHeading';

export default function AttentionStage({
  tokens,
  layers,
  model,
}: {
  tokens: Token[];
  layers: LayerTrace[];
  model: ModelPreset;
}) {
  const [headIdx, setHeadIdx] = useState(0);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const weights = layers[0]?.headAttentions[headIdx] ?? [];
  const n = tokens.length;
  const cell = n > 10 ? 26 : n > 6 ? 32 : 40;

  return (
    <div className="flex flex-col items-center gap-7 py-6">
      <StageHeading
        title="Self-Attention"
        description="Every token asks: 'which other tokens matter to understanding me?' Brighter cells mean the row token is paying more attention to the column token."
      />

      <div className="flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] p-1">
        {Array.from({ length: model.numHeads }).map((_, h) => (
          <button
            key={h}
            onClick={() => setHeadIdx(h)}
            className="rounded-full px-3 py-1 text-xs font-medium transition"
            style={{
              backgroundColor: headIdx === h ? model.accent : 'transparent',
              color: headIdx === h ? '#FFFFFF' : '#8B8576',
            }}
          >
            Head {h + 1}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `${cell + 10}px repeat(${n}, ${cell}px)`,
          }}
        >
          <div />
          {tokens.map((t, c) => (
            <div key={c} className="flex items-end justify-center pb-1 font-mono text-[9px]" style={{ color: t.color }}>
              <span className="rotate-0">{t.text.length > 5 ? t.text.slice(0, 5) + '…' : t.text}</span>
            </div>
          ))}

          {weights.map((row, r) => (
            <Fragment key={r}>
              <div
                className="flex items-center justify-end pr-1.5 font-mono text-[9px]"
                style={{ color: tokens[r]?.color }}
              >
                {tokens[r]?.text.length > 6 ? tokens[r].text.slice(0, 6) + '…' : tokens[r]?.text}
              </div>
              {row.map((w, c) => (
                <motion.div
                  key={`${r}-${c}`}
                  onMouseEnter={() => setHoverRow(r)}
                  onMouseLeave={() => setHoverRow(null)}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (r * n + c) * 0.012, duration: 0.3 }}
                  className="rounded-[4px]"
                  style={{
                    width: cell - 3,
                    height: cell - 3,
                    backgroundColor: model.accent,
                    opacity: hoverRow === null || hoverRow === r ? 0.15 + w * 0.85 : 0.06,
                  }}
                  title={`${tokens[r]?.text} → ${tokens[c]?.text}: ${(w * 100).toFixed(1)}%`}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <p className="max-w-md text-center text-xs text-base-500">
        Hover a row's cells to isolate it. This repeats across {model.numHeads} heads and{' '}
        {model.numLayers} layers, each head learning to track a different kind of relationship.
      </p>
    </div>
  );
}
