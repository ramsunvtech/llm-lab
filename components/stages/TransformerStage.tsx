'use client';

import { motion } from 'framer-motion';
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
  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <StageHeading
        title="Transformer Layers"
        description={`The attention step above repeats ${model.numLayers} times, each layer followed by a small "feed-forward" network. Every pass lets tokens refine their understanding using everyone else's context.`}
      />

      <div className="flex w-full max-w-xl flex-col items-center gap-3">
        {layers.map((layer, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.18, duration: 0.4 }}
            className="w-full rounded-xl border border-black/[0.07] bg-black/[0.02] p-3.5"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-base-200">Layer {i + 1}</span>
              <span className="text-[10px] text-base-500">
                {model.numHeads} attention heads → feed-forward
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Block label="Self-Attn" accent={model.accent} delay={i * 0.18 + 0.1} />
              <Arrow />
              <Block label="Add & Norm" accent={model.accent} muted delay={i * 0.18 + 0.2} />
              <Arrow />
              <Block label="Feed-Forward" accent={model.accent} delay={i * 0.18 + 0.3} />
              <Arrow />
              <Block label="Add & Norm" accent={model.accent} muted delay={i * 0.18 + 0.4} />
            </div>

            {model.moe && layer.expertInfo && (
              <div className="mt-3 flex items-center gap-1.5 border-t border-black/[0.05] pt-2.5">
                <span className="mr-1 text-[10px] text-base-500">Router →</span>
                {layer.expertInfo.scores.map((s, e) => {
                  const chosen = layer.expertInfo!.chosen.includes(e);
                  return (
                    <motion.div
                      key={e}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.18 + 0.5 + e * 0.03 }}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-medium"
                      style={{
                        backgroundColor: chosen ? model.accent : 'rgba(20,18,12,0.05)',
                        color: chosen ? '#FFFFFF' : '#6B6759',
                        outline: chosen ? `1px solid ${model.accent}` : 'none',
                      }}
                      title={`Expert ${e + 1}: ${(s * 100).toFixed(1)}%`}
                    >
                      {e + 1}
                    </motion.div>
                  );
                })}
                <span className="ml-1.5 text-[10px] text-base-500">
                  top-{model.moe.topK} of {model.moe.numExperts} experts active
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <p className="max-w-md text-center text-xs text-base-500">
        By the final layer, each token's vector encodes not just its own meaning but its full
        surrounding context — ready to help predict what comes next.
      </p>
    </div>
  );
}

function Block({
  label,
  accent,
  muted,
  delay,
}: {
  label: string;
  accent: string;
  muted?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex-1 rounded-lg border px-2 py-2 text-center text-[10px] font-medium"
      style={{
        borderColor: muted ? 'rgba(20,18,12,0.10)' : `${accent}66`,
        backgroundColor: muted ? 'rgba(20,18,12,0.03)' : `${accent}1a`,
        color: muted ? '#6B6759' : accent,
      }}
    >
      {label}
    </motion.div>
  );
}

function Arrow() {
  return <span className="text-base-600">→</span>;
}
