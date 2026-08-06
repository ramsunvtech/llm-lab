'use client';

import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [layerIdx, setLayerIdx] = useState(0);
  const [headIdx, setHeadIdx] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Safely extract weights for selected layer & head
  const currentLayer = layers[layerIdx] ?? layers[0];
  const weights = currentLayer?.headAttentions?.[headIdx] ?? [];
  const n = tokens.length;

  // Responsive grid cell sizing
  const cell = n > 10 ? 32 : n > 6 ? 40 : 48;

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full max-w-4xl mx-auto">
      <StageHeading
        title="5. Self-Attention Stage"
        description="Using position-aware vectors (from Step 4), each token generates Queries (Q) and Keys (K). Attention scores quantify how much context each token gathers from preceding positions."
      />

      {/* Layer & Head Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full bg-base-950/60 p-3 rounded-xl border border-base-800 text-xs font-mono">
        {/* Layer Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-base-400">Layer:</span>
          <div className="flex items-center gap-1 bg-base-900 p-1 rounded-lg border border-base-800">
            {Array.from({ length: model.numLayers }).map((_, l) => (
              <button
                key={l}
                onClick={() => setLayerIdx(l)}
                className={`px-2.5 py-1 rounded transition-all ${
                  layerIdx === l
                    ? 'bg-emerald-500 text-black font-bold shadow-sm'
                    : 'text-base-400 hover:text-white'
                }`}
              >
                L{l + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Head Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-base-400">Attention Head:</span>
          <div className="flex items-center gap-1 bg-base-900 p-1 rounded-lg border border-base-800">
            {Array.from({ length: model.numHeads }).map((_, h) => (
              <button
                key={h}
                onClick={() => setHeadIdx(h)}
                className={`px-2.5 py-1 rounded transition-all ${
                  headIdx === h
                    ? 'bg-emerald-500 text-black font-bold shadow-sm'
                    : 'text-base-400 hover:text-white'
                }`}
              >
                Head {h + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Causal Attention Heatmap Matrix */}
      <div className="w-full overflow-x-auto bg-base-950/80 p-6 rounded-2xl border border-base-800 shadow-2xl flex flex-col items-center">
        <div className="mb-3 text-[11px] font-mono text-base-400 text-center">
          <span className="text-emerald-400 font-semibold">Rows = Queries (Q)</span> looking back at{' '}
          <span className="text-emerald-400 font-semibold">Columns = Keys (K)</span>
        </div>

        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `80px repeat(${n}, ${cell}px)`,
          }}
        >
          {/* Header Row: Column Labels (Keys - Keys have Seq #) */}
          <div className="flex items-end justify-end pb-2 pr-2 font-mono text-[10px] text-base-500">
            Q \ K
          </div>
          {tokens.map((t, c) => (
            <div
              key={`col-${c}`}
              className="flex flex-col items-center justify-end pb-2 font-mono text-[10px] leading-tight"
            >
              <span className="text-emerald-400 font-bold text-[9px]">#{c}</span>
              <span className="truncate max-w-[40px]" style={{ color: t.color }}>
                {t.text.replace(/ /g, '␣')}
              </span>
            </div>
          ))}

          {/* Matrix Rows (Queries) */}
          {weights.map((row, r) => (
            <Fragment key={`row-${r}`}>
              {/* Row Label (Query - with Seq #) */}
              <div className="flex items-center justify-end pr-2.5 font-mono text-[10px] leading-tight text-right">
                <div>
                  <span className="text-emerald-400 font-bold text-[9px] mr-1">#{r}</span>
                  <span style={{ color: tokens[r]?.color }}>
                    {tokens[r]?.text.replace(/ /g, '␣')}
                  </span>
                </div>
              </div>

              {/* Attention Cells */}
              {row.map((w, c) => {
                const isCausalMasked = c > r; // Causal constraint: future position masked
                const isHovered = hoveredCell?.row === r && hoveredCell?.col === c;

                return (
                  <motion.div
                    key={`${r}-${c}`}
                    onMouseEnter={() => setHoveredCell({ row: r, col: c })}
                    onMouseLeave={() => setHoveredCell(null)}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (r * n + c) * 0.008, duration: 0.2 }}
                    className={`relative rounded-md flex items-center justify-center font-mono text-[10px] transition-all cursor-pointer ${
                      isCausalMasked
                        ? 'bg-base-900/30 border border-base-900 text-base-700 opacity-40'
                        : 'border border-emerald-500/20'
                    }`}
                    style={{
                      width: cell - 4,
                      height: cell - 4,
                      backgroundColor: isCausalMasked
                        ? undefined
                        : `rgba(16, 185, 129, ${Math.max(0.08, w * 0.85)})`,
                    }}
                  >
                    {isCausalMasked ? (
                      <span className="text-[9px] text-base-700 select-none">✕</span>
                    ) : (
                      <span
                        className={`font-mono text-[9px] ${
                          w > 0.3 ? 'text-black font-bold' : 'text-emerald-200/80'
                        }`}
                      >
                        {(w * 100).toFixed(0)}%
                      </span>
                    )}

                    {/* Hover Highlight Ring */}
                    {isHovered && (
                      <div className="absolute inset-0 border-2 border-white rounded-md pointer-events-none z-10" />
                    )}
                  </motion.div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Interactive Detail Box */}
      <AnimatePresence mode="wait">
        {hoveredCell ? (
          <motion.div
            key="inspector"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full bg-base-900/60 border border-emerald-500/40 rounded-xl p-4 font-mono text-xs text-base-300 flex flex-col gap-1 shadow-lg"
          >
            <div className="flex justify-between items-center text-emerald-400 font-bold border-b border-base-800 pb-2">
              <span>
                Attention Score: Seq #{hoveredCell.row} → Seq #{hoveredCell.col}
              </span>
              <span>
                {hoveredCell.col > hoveredCell.row
                  ? '0.00% (Masked)'
                  : `${((weights[hoveredCell.row]?.[hoveredCell.col] ?? 0) * 100).toFixed(2)}%`}
              </span>
            </div>
            <div className="pt-1 text-[11px] text-base-400">
              {hoveredCell.col > hoveredCell.row ? (
                <span className="text-red-400/90">
                  <strong>Causal Masked:</strong> Token #{hoveredCell.row} ({JSON.stringify(tokens[hoveredCell.row]?.text)}) occurs earlier in time, so it is strictly forbidden from looking forward into Token #{hoveredCell.col} ({JSON.stringify(tokens[hoveredCell.col]?.text)}).
                </span>
              ) : (
                <span>
                  Query at <code className="text-emerald-400">Seq #{hoveredCell.row}</code> ({JSON.stringify(tokens[hoveredCell.row]?.text)}) computes dot product with Key at <code className="text-emerald-400">Seq #{hoveredCell.col}</code> ({JSON.stringify(tokens[hoveredCell.col]?.text)}). Rotary position angles ($pos_{hoveredCell.row} - pos_{hoveredCell.col}$) weight this relationship.
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="w-full bg-base-950/40 border border-base-800/80 rounded-xl p-3 text-center text-xs font-mono text-base-500">
            Hover over any grid cell to inspect the position-aware Query / Key dot-product weight.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}