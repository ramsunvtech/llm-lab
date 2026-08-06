'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedStep, ModelPreset } from '@/lib/types';
import StageHeading from './StageHeading';

export default function DecoderStage({
  prompt,
  generated,
  revealedCount,
  isGenerating,
  model,
}: {
  prompt: string;
  generated: GeneratedStep[];
  revealedCount: number;
  isGenerating: boolean;
  model: ModelPreset;
}) {
  const revealed = generated.slice(0, revealedCount);
  const current = generated[revealedCount - 1];

  return (
    <div className="flex flex-col items-center gap-8 py-6 w-full max-w-3xl mx-auto">
      <StageHeading
        title="9. Autoregressive Decoder & Sampling Stage"
        description="One token is sampled from the Softmax distribution and appended to the context. The model then executes the full forward pass on the updated sequence — generating text one token at a time."
      />

      {/* Autoregressive Feedback Loop Banner */}
      <div className="w-full bg-base-950/60 border border-base-800 rounded-xl p-3.5 font-mono text-xs flex flex-wrap items-center justify-between gap-3 text-base-300">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            Autoregressive Loop
          </span>
          <span>Context(t+1) = [Context(t), Token_sampled]</span>
        </div>
        <div className="text-[10px] text-base-400 font-mono">
          Tokens Generated: <span className="text-emerald-400 font-bold">{revealed.length}</span> / {generated.length}
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-6">
        {/* Growing Sequence Visualizer Box */}
        <div className="w-full rounded-2xl border border-base-800 bg-base-950/80 p-6 shadow-2xl">
          <div className="mb-3 flex items-center justify-between border-b border-base-800/80 pb-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-base-400">
              Active Context Window
            </span>
            <span className="font-mono text-[10px] text-base-500">
              {isGenerating ? 'Sampling active...' : 'Sequence idle'}
            </span>
          </div>

          <p className="font-mono text-sm leading-relaxed text-base-200 sm:text-base break-words">
            <span className="text-base-400 font-medium">{prompt}</span>{' '}
            <AnimatePresence>
              {revealed.map((g, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="inline-block rounded px-1.5 py-0.5 font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 mr-1"
                >
                  {g.word}
                </motion.span>
              ))}
            </AnimatePresence>
            {isGenerating && (
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block h-5 w-2 translate-y-1 bg-emerald-400 rounded-xs"
              />
            )}
          </p>
        </div>

        {/* Current Sampling Event Details */}
        <div className="w-full min-h-[72px] rounded-xl border border-base-800/80 bg-base-950/40 p-4 flex flex-col items-center justify-center gap-2">
          {current ? (
            <motion.div
              key={revealedCount}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2.5 w-full"
            >
              <div className="flex items-center gap-2 font-mono text-[10px] text-base-400">
                <span>Sampled at Step {revealedCount}:</span>
                <span className="font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                  {JSON.stringify(current.word)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {current.probs.map((p) => {
                  const isSelected = p.word === current.word;
                  return (
                    <span
                      key={p.word}
                      className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold shadow-md shadow-emerald-950'
                          : 'bg-base-900/60 border-base-800 text-base-400'
                      }`}
                    >
                      {JSON.stringify(p.word)}: {(p.value * 100).toFixed(1)}%
                    </span>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <span className="font-mono text-xs text-base-500 italic">
              {isGenerating ? 'Preparing next token pass...' : 'Start generation to view sampling breakdown.'}
            </span>
          )}
        </div>

        {/* Generation Complete Modal/Banner */}
        {!isGenerating && revealedCount >= generated.length && generated.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 180 }}
            className="w-full flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center shadow-xl"
          >
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Generation Pipeline Complete
            </div>
            <p className="max-w-lg font-mono text-xs leading-relaxed text-base-300">
              <strong className="text-emerald-300">{model.name}</strong> completed text generation by repeating all 9 pipeline stages sequentially for each token. In production LLM inference engines (e.g. vLLM, TensorRT-LLM), <code className="text-emerald-400">KV Caching</code> retains key/value matrices from prior tokens so only the newly appended token vector is processed on each forward pass.
            </p>
          </motion.div>
        )}
      </div>

      {/* Concept Summary Footer */}
      <div className="w-full bg-base-950/40 rounded-xl border border-base-800 p-4 text-xs font-mono text-base-400">
        <strong className="text-base-200">The 9-Stage Transformer Pipeline Complete:</strong> Prompt String $\rightarrow$ Sub-word Tokenization $\rightarrow$ Positional Vector Embedding $\rightarrow$ Multi-Head Attention $\rightarrow$ Stacked Transformer Layers $\rightarrow$ Vocabulary Projection Logits $\rightarrow$ Softmax Distribution $\rightarrow$ Autoregressive Sampling.
      </div>
    </div>
  );
}