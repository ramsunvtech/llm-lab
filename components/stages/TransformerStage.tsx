'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Token, ModelPreset, LayerTrace } from '@/lib/types';
import StageHeading from './StageHeading';

export default function TransformerStage({
  tokens,
  layers,
  model,
}: {
  tokens: Token[];
  layers: LayerTrace[];
  model: ModelPreset;
}) {
  const [selectedLayer, setSelectedLayer] = useState<number>(0);

  return (
    <div className="flex flex-col items-center gap-8 py-6 w-full max-w-4xl mx-auto">
      <StageHeading
        title="6. Transformer Layers Stage"
        description={`The residual attention and feed-forward block repeats across ${model.numLayers} stacked layers. Tokens refine their hidden representation vector at each pass using Pre-LayerNorm and skip connections.`}
      />

      {/* Layer Stack Container */}
      <div className="flex w-full flex-col items-center gap-4">
        {layers.map((layer, i) => {
          const isSelected = selectedLayer === i;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, duration: 0.3 }}
              onClick={() => setSelectedLayer(i)}
              className={`w-full cursor-pointer rounded-2xl border p-4 transition-all shadow-lg ${
                isSelected
                  ? 'border-emerald-500/60 bg-emerald-950/10 ring-1 ring-emerald-500/30'
                  : 'border-base-800 bg-base-900/40 hover:border-base-700'
              }`}
            >
              {/* Layer Title Header */}
              <div className="mb-3 flex items-center justify-between border-b border-base-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    L{i + 1}
                  </span>
                  <span className="text-xs font-semibold text-base-200">
                    Transformer Block {i + 1} of {model.numLayers}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-base-400">
                  {model.numHeads} Heads · d_model={model.dModel}
                </span>
              </div>

              {/* Pre-LN Sequential Processing Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center font-mono text-[10px]">
                <Block label="Pre-LN" sub="Normalize" accent={model.accent} muted delay={i * 0.1 + 0.1} />
                <Arrow />
                <Block label="Self-Attention" sub={`RoPE (${model.numHeads} heads)`} accent={model.accent} delay={i * 0.1 + 0.2} />
                <Arrow />
                <Block label="+ Residual" sub="x = x + Attn(x)" accent={model.accent} highlight delay={i * 0.1 + 0.3} />
              </div>

              <div className="my-2 flex justify-center">
                <span className="text-base-600 font-mono text-xs">↓</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center font-mono text-[10px]">
                <Block label="Pre-LN" sub="Normalize" accent={model.accent} muted delay={i * 0.1 + 0.4} />
                <Arrow />
                <Block
                  label={model.moe ? 'MoE Router / FFN' : 'Feed-Forward (FFN)'}
                  sub={model.moe ? `${model.moe.numExperts} Experts` : 'SwiGLU / GELU'}
                  accent={model.accent}
                  delay={i * 0.1 + 0.5}
                />
                <Arrow />
                <Block label="+ Residual" sub="x = x + FFN(x)" accent={model.accent} highlight delay={i * 0.1 + 0.6} />
              </div>

              {/* Mixture of Experts (MoE) Routing Bar (if model has MoE) */}
              {model.moe && layer.expertInfo && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-base-800/80 pt-3">
                  <span className="font-mono text-[10px] text-base-400 font-semibold">
                    MoE Gating Router:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {layer.expertInfo.scores.map((s, e) => {
                      const chosen = layer.expertInfo!.chosen.includes(e);
                      return (
                        <motion.div
                          key={e}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.1 + 0.5 + e * 0.03 }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px] border ${
                            chosen
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold'
                              : 'bg-base-950/60 border-base-800 text-base-500'
                          }`}
                          title={`Expert ${e + 1} Score: ${(s * 100).toFixed(1)}%`}
                        >
                          <span>E{e + 1}</span>
                          <span className="text-[9px] opacity-80">{(s * 100).toFixed(0)}%</span>
                        </motion.div>
                      );
                    })}
                  </div>
                  <span className="font-mono text-[10px] text-base-500 ml-auto">
                    Top-{model.moe.topK} routed
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Layer State Context Summary */}
      <div className="w-full rounded-xl border border-base-800 bg-base-950/60 p-4 text-xs font-mono text-base-400">
        <strong className="text-base-200">Layer Propagation:</strong> As activations flow from Layer 1 through Layer {model.numLayers}, every token vector incorporates richer multi-hop semantics. The residual connections (<code className="text-emerald-400">x + SubLayer(x)</code>) prevent gradient vanishing during deep backpropagation.
      </div>
    </div>
  );
}

function Block({
  label,
  sub,
  accent,
  muted,
  highlight,
  delay,
}: {
  label: string;
  sub?: string;
  accent: string;
  muted?: boolean;
  highlight?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
      className={`col-span-1 md:col-span-1 rounded-lg border p-2 text-center transition-all ${
        highlight
          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
          : muted
          ? 'bg-base-950/50 border-base-800/80 text-base-400'
          : 'bg-base-900 border-base-700 text-base-200'
      }`}
    >
      <div className="font-semibold text-[11px]">{label}</div>
      {sub && <div className="text-[9px] text-base-500 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

function Arrow() {
  return (
    <div className="hidden md:flex justify-center text-base-600 font-mono text-xs">
      →
    </div>
  );
}