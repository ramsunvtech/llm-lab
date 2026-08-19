'use client';

import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { EXAMPLES, Variant, TransformerExample, localAttentionRow } from '@/lib/transformer-diagram-data';
import { EVOLUTION_STAGES, DEFAULT_STAGE_ID, EvolutionStage } from '@/lib/transformer-evolution-data';
import { softmax } from '@/lib/math';
import { positionalEncoding } from '@/lib/engine';
import Controls from '@/components/Controls';

const COLORS = {
  embed: '#db6f96',
  pe: '#0891b2',
  attn: '#d97706',
  addnorm: '#65a30d',
  ffn: '#2563eb',
  linear: '#7c3aed',
  softmax: '#059669',
};

interface Step {
  id: string;
  title: string;
  description: string;
  highlight: string[];
  visual: 'none' | 'pe' | 'encoder-attn' | 'decoder-mask' | 'decoder-cross' | 'logits' | 'softmax';
}

const STEPS: Step[] = [
  {
    id: 'input',
    title: 'Feeding in the input',
    description:
      'The encoder gets the full ambiguous sentence at once. The decoder side is "shifted right" — it starts with just a start token and only ever sees words it has already generated, never the answer in advance.',
    highlight: ['enc-input', 'dec-output'],
    visual: 'none',
  },
  {
    id: 'embed',
    title: 'Input & Output Embedding',
    description:
      'Every token — on both sides — is looked up in an embedding table and turned into a vector. Two separate tables: encoder vocabulary in, decoder vocabulary out.',
    highlight: ['enc-embed', 'dec-embed'],
    visual: 'none',
  },
  {
    id: 'pe',
    title: 'Positional Encoding — both sides',
    description:
      'Attention has no built-in sense of order, so a fixed sine/cosine wave unique to each position is added to every embedding — independently in the encoder and the decoder.',
    highlight: ['enc-pe', 'dec-pe'],
    visual: 'pe',
  },
  {
    id: 'enc-attn',
    title: 'Encoder Self-Attention — resolving "it"',
    description:
      'Every token computes how much it should attend to every other token — a function of all the others, at once. Watch "it" flip when only the last word changes.',
    highlight: ['enc-mha'],
    visual: 'encoder-attn',
  },
  {
    id: 'enc-ffn',
    title: 'Feed-Forward Network (×N)',
    description:
      'After Add & Norm stabilizes the residual sum, an MLP enriches each token\u2019s representation. The whole block repeats N times.',
    highlight: ['enc-addnorm1', 'enc-ffn', 'enc-addnorm2'],
    visual: 'none',
  },
  {
    id: 'dec-mask',
    title: 'Masked Multi-Head Attention — why "masked"?',
    description:
      'The decoder self-attends over what it\u2019s generated so far, but is forbidden from looking past its current position. Without that, predicting "animal" could just copy the answer instead of inferring it.',
    highlight: ['dec-mmha'],
    visual: 'decoder-mask',
  },
  {
    id: 'dec-cross',
    title: 'Encoder-Decoder (Cross) Attention',
    description:
      'The decoder\u2019s queries meet the encoder\u2019s keys and values — the arrow crossing over. To answer correctly it must reach back into the encoder\u2019s finished "it".',
    highlight: ['dec-cross'],
    visual: 'decoder-cross',
  },
  {
    id: 'dec-ffn',
    title: 'Feed-Forward Network (×N)',
    description: 'Same as the encoder side: Add & Norm, MLP, Add & Norm — the full decoder block repeats N times.',
    highlight: ['dec-addnorm1', 'dec-ffn', 'dec-addnorm2'],
    visual: 'none',
  },
  {
    id: 'linear',
    title: 'Linear — projecting to vocabulary size',
    description: 'The final decoder vector is projected into one logit per word in the entire output vocabulary.',
    highlight: ['linear'],
    visual: 'logits',
  },
  {
    id: 'softmax',
    title: 'Softmax — logits become probabilities',
    description: 'Every logit is squashed into a value between 0 and 1, all summing to exactly 1. Real math, right here.',
    highlight: ['softmax'],
    visual: 'softmax',
  },
  {
    id: 'output',
    title: 'Predicting the next word — and looping back',
    description: 'The highest-probability word is chosen, appended, and fed back in — one word at a time — until the answer is complete.',
    highlight: ['outputprobs', 'dec-output'],
    visual: 'softmax',
  },
];

const AUTO_MS = 3400;

export default function TransformerArchitecturePage() {
  const [evolutionId, setEvolutionId] = useState<string>(DEFAULT_STAGE_ID);
  const [evoOpen, setEvoOpen] = useState(false);
  const [variant, setVariant] = useState<Variant>('tired');
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stage: EvolutionStage = EVOLUTION_STAGES.find((s: EvolutionStage) => s.id === evolutionId) ?? EVOLUTION_STAGES[0];
  const example = EXAMPLES[variant];
  const n = example.encoderTokens.length;
  const animated = stage.hasAnimatedWalkthrough;

  const changeStage = (id: string) => {
    setEvolutionId(id);
    setEvoOpen(false);
    setStepIdx(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying || !animated) return;
    timerRef.current = setInterval(() => {
      setStepIdx((p: number) => {
        if (p >= STEPS.length - 1) {
          setIsPlaying(false);
          return p;
        }
        return p + 1;
      });
    }, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, animated]);

  const active = (id: string) => animated && STEPS[stepIdx].highlight.includes(id);
  const step = STEPS[stepIdx];

  const changeVariant = (v: Variant) => {
    setVariant(v);
    setIsPlaying(false);
  };

  const encoderRows = useMemo(() => {
    return example.encoderTokens.map((_: string, i: number) =>
      i === example.itIndex ? null : localAttentionRow(i, n)
    );
  }, [example, n]);

  const probs = useMemo(() => softmax(example.candidateLogits, 1), [example]);

  const showEncoder = stage.diagramType !== 'decoder-only';
  const showDecoder = stage.diagramType !== 'encoder-only';
  const showCross = stage.diagramType === 'encoder-decoder';
  const singleColumn = stage.diagramType !== 'encoder-decoder';
  const ffnBoxLabel = stage.moe ? 'Sparse MoE FFN' : 'Feed Forward';
  const decoderAttnLabel = stage.attnLabel ?? 'Masked Multi-Head Attention';
  const encoderAttnLabel = showDecoder ? 'Multi-Head Attention' : 'Multi-Head Attention (bidirectional)';

  return (
    <main className="flex min-h-screen flex-col bg-base-950 md:h-screen md:flex-row md:overflow-hidden">
      {/* LEFT SIDEBAR — everything but the diagram lives here */}
      <aside className="flex w-full shrink-0 flex-col gap-5 border-b border-base-700 bg-base-850 p-5 md:h-full md:w-[360px] md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-base-200 text-xs font-bold text-base-950">L</div>
          <span className="text-sm font-semibold text-base-100">LLM Lab</span>
          <span className="ml-auto text-xs font-medium text-base-300">Transformer Architecture</span>
        </div>
        <div className="-mt-3 flex flex-col gap-1">
          <Link href="/" className="flex w-fit items-center gap-1.5 text-xs text-base-500 transition hover:text-base-300">
            ← Back to visualizer
          </Link>
          <Link href="/attentions" className="flex w-fit items-center gap-1.5 text-xs text-base-500 transition hover:text-base-300">
            📖 Attention Bible
          </Link>
        </div>

        {/* Evolution dropdown */}
        <div className="flex flex-col gap-2">
          <label className="px-0.5 text-xs font-medium uppercase tracking-wide text-base-500">Transformer Evolution</label>
          <div className="relative">
            <button
              onClick={() => setEvoOpen((o: boolean) => !o)}
              className="flex w-full items-start justify-between gap-2 rounded-xl border border-base-700 bg-base-900 px-3 py-2.5 text-left shadow-panel transition hover:border-base-600"
            >
              <span className="text-xs font-medium leading-snug text-base-100">{stage.shortLabel}</span>
              <ChevronIcon open={evoOpen} />
            </button>
            {evoOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setEvoOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-base-700 bg-base-900 shadow-lg"
                >
                  {EVOLUTION_STAGES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => changeStage(s.id)}
                      className="flex w-full flex-col gap-0.5 border-b border-base-700 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-base-800"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-base-100">{s.shortLabel}</span>
                        {s.id === stage.id && <CheckIcon />}
                      </span>
                      <span className="text-[11px] text-base-500">{s.subtitle}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Stage title + details */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-base-700 bg-base-900 p-3 text-xs shadow-panel">
          <p className="font-semibold text-base-100">{stage.title}</p>
          <p><span className="font-medium text-base-300">Architecture: </span><span className="text-base-500">{stage.architecture}</span></p>
          <p><span className="font-medium text-base-300">Activations: </span><span className="text-base-500">{stage.activations}</span></p>
          <p><span className="font-medium text-base-300">Key models: </span><span className="text-base-500">{stage.keyModels}</span></p>
          <p><span className="font-medium text-base-300">Struggles: </span><span className="text-base-500">{stage.struggles}</span></p>
        </div>

        {animated && (
          <>
            <div className="flex flex-col gap-2">
              <label className="px-0.5 text-xs font-medium uppercase tracking-wide text-base-500">Task</label>
              <p className="text-xs leading-relaxed text-base-400">
                Encoder reads the sentence. Decoder answers: <span className="font-medium text-base-200">what does &ldquo;it&rdquo; refer to?</span>
              </p>
              <div className="flex items-center gap-1 rounded-full border border-base-700 bg-base-900 p-1">
                <button
                  onClick={() => changeVariant('tired')}
                  className="flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition"
                  style={{ backgroundColor: variant === 'tired' ? COLORS.attn : 'transparent', color: variant === 'tired' ? '#fff' : '#8B8576' }}
                >
                  &hellip;too tired
                </button>
                <button
                  onClick={() => changeVariant('wide')}
                  className="flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition"
                  style={{ backgroundColor: variant === 'wide' ? COLORS.attn : 'transparent', color: variant === 'wide' ? '#fff' : '#8B8576' }}
                >
                  &hellip;too wide
                </button>
              </div>
              <div className="rounded-xl border px-3 py-2 text-center font-mono text-[11px] leading-relaxed text-base-200" style={{ borderColor: `${COLORS.attn}55`, backgroundColor: `${COLORS.attn}0f` }}>
                &ldquo;{example.sentence}&rdquo;
              </div>
            </div>

            {/* step list */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-base-500">Pipeline</span>
                <span className="font-tabular text-xs text-base-500">{stepIdx + 1}/{STEPS.length}</span>
              </div>
              <nav className="flex flex-col gap-0.5">
                {STEPS.map((s, i) => {
                  const isActive = i === stepIdx;
                  const done = i < stepIdx;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setIsPlaying(false); setStepIdx(i); }}
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition"
                      style={{ backgroundColor: isActive ? `${COLORS.attn}17` : 'transparent' }}
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                        style={{
                          backgroundColor: isActive ? COLORS.attn : done ? `${COLORS.attn}2a` : 'transparent',
                          color: isActive ? '#fff' : done ? COLORS.attn : '#8B8576',
                          border: isActive || done ? 'none' : '1px solid #DDD7C6',
                        }}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <span className={`truncate text-[12px] ${isActive ? 'font-semibold text-base-100' : done ? 'text-base-300' : 'text-base-500'}`}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* current step detail — title, description, and its visual, all in the sidebar */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-2 rounded-xl border border-base-700 bg-base-900 p-3 shadow-panel"
              >
                <h2 className="text-xs font-semibold text-base-100">{step.title}</h2>
                <p className="text-[11px] leading-relaxed text-base-400">{step.description}</p>

                {step.visual === 'pe' && <PositionalEncodingVisual example={example} compact />}
                {step.visual === 'encoder-attn' && <EncoderAttentionVisual example={example} allRows={encoderRows} compact />}
                {step.visual === 'decoder-mask' && <DecoderMaskVisual example={example} compact />}
                {step.visual === 'decoder-cross' && <DecoderCrossVisual example={example} compact />}
                {(step.visual === 'logits' || step.visual === 'softmax') && (
                  <LogitsVisual example={example} probs={step.visual === 'softmax' ? probs : null} compact />
                )}
              </motion.div>
            </AnimatePresence>

            {/* player */}
            <div className="border-t border-base-700 pt-3">
              <Controls
                isPlaying={isPlaying}
                onTogglePlay={() => { if (stepIdx >= STEPS.length - 1) setStepIdx(0); setIsPlaying((p: boolean) => !p); }}
                onStepBack={() => { setIsPlaying(false); setStepIdx((p: number) => Math.max(0, p - 1)); }}
                onStepForward={() => { setIsPlaying(false); setStepIdx((p: number) => Math.min(STEPS.length - 1, p + 1)); }}
                onRestart={() => { setIsPlaying(false); setStepIdx(0); }}
                canStepBack={stepIdx > 0}
                canStepForward={stepIdx < STEPS.length - 1}
                accent={COLORS.attn}
              />
            </div>
          </>
        )}

        {!animated && (
          <p className="text-xs leading-relaxed text-base-500">
            The full animated step-by-step walkthrough (with a hand-verified worked example) runs on the 2017
            original — self-attention&rsquo;s math is the shared foundation every later variant builds on. This
            era is shown structurally: which pieces exist, and which activation / positional-encoding scheme replaced the original.
          </p>
        )}

        <p className="mt-auto px-0.5 text-[11px] leading-relaxed text-base-500">
          Positional encoding, softmax, and the causal mask shape are real computed math throughout.
        </p>
      </aside>

      {/* RIGHT — diagram only, fixed within the viewport, no scroll */}
      <section className="flex flex-1 items-center justify-center overflow-hidden md:h-full">
        <div className="flex w-full flex-col items-center gap-1 p-3 sm:p-4">
          <DiagramBox label="Output Probabilities" color={COLORS.softmax} active={active('outputprobs')} />
          <ArrowUp />
          <DiagramBox label="Softmax" color={COLORS.softmax} active={active('softmax')} />
          <ArrowUp />
          <DiagramBox label="Linear" color={COLORS.linear} active={active('linear')} />
          <ArrowUp />

          <div className={`grid w-full gap-3 ${singleColumn ? 'max-w-[210px] grid-cols-1' : 'max-w-xl grid-cols-1 sm:grid-cols-2'}`}>
            {showEncoder && (
              <div className="flex flex-col items-center gap-1">
                <NxWrap>
                  <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('enc-addnorm2')} small />
                  <DiagramBox label={ffnBoxLabel} sublabel={stage.ffnLabel} color={COLORS.ffn} active={active('enc-ffn')} />
                  <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('enc-addnorm1')} small />
                  <DiagramBox label={encoderAttnLabel} color={COLORS.attn} active={active('enc-mha')} />
                </NxWrap>
                <ArrowUp />
                <DiagramBox label="Positional Encoding ⊕" sublabel={stage.peLabel} color={COLORS.pe} active={active('enc-pe')} small />
                <ArrowUp />
                <DiagramBox label="Input Embedding" color={COLORS.embed} active={active('enc-embed')} small />
                <ArrowUp />
                <DiagramBox label="Inputs" color="#8B8576" active={active('enc-input')} small />
                <span className="text-[9px] uppercase tracking-wide text-base-500">{showDecoder ? 'Encoder' : 'Encoder (only)'}</span>
              </div>
            )}

            {showDecoder && (
              <div className="flex flex-col items-center gap-1">
                <NxWrap>
                  <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-addnorm2')} small />
                  <DiagramBox label={ffnBoxLabel} sublabel={stage.ffnLabel} color={COLORS.ffn} active={active('dec-ffn')} />
                  {showCross && (
                    <>
                      <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-addnorm1')} small />
                      <DiagramBox label="Multi-Head Attention" sublabel="(encoder-decoder)" color={COLORS.attn} active={active('dec-cross')} />
                    </>
                  )}
                  <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-mmha')} small />
                  <DiagramBox label={decoderAttnLabel} color={COLORS.attn} active={active('dec-mmha')} />
                </NxWrap>
                <ArrowUp />
                <DiagramBox label="Positional Encoding ⊕" sublabel={stage.peLabel} color={COLORS.pe} active={active('dec-pe')} small />
                <ArrowUp />
                <DiagramBox label="Output Embedding" color={COLORS.embed} active={active('dec-embed')} small />
                <ArrowUp />
                <DiagramBox label="Outputs (shifted right)" color="#8B8576" active={active('dec-output')} small />
                <span className="text-[9px] uppercase tracking-wide text-base-500">{showEncoder ? 'Decoder' : 'Decoder (only)'}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function NxWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-base-700 p-2">
      <span className="absolute -right-1.5 -top-2.5 rounded-full bg-base-900 px-1.5 py-0.5 text-[9px] font-bold text-base-400 shadow-panel">×N</span>
      {children}
    </div>
  );
}

function DiagramBox({
  label,
  sublabel,
  color,
  active,
  small,
}: {
  label: string;
  sublabel?: string;
  color: string;
  active: boolean;
  small?: boolean;
}) {
  return (
    <motion.div
      animate={{ scale: active ? 1.045 : 1 }}
      transition={{ duration: 0.3 }}
      className={`w-full max-w-[190px] rounded-md text-center font-medium leading-tight ${small ? 'px-2 py-1 text-[9px]' : 'px-2 py-1.5 text-[10px] sm:text-[11px]'}`}
      style={{
        backgroundColor: `${color}1f`,
        color,
        boxShadow: active ? `0 0 0 2px ${color}, 0 8px 18px -10px ${color}88` : `0 0 0 1px ${color}33`,
      }}
    >
      {label}
      {sublabel && <div className="text-[8px] font-normal opacity-70">{sublabel}</div>}
    </motion.div>
  );
}

function ArrowUp() {
  return <div className="text-[10px] leading-none text-base-600">↑</div>;
}

function PositionalEncodingVisual({ example, compact }: { example: TransformerExample; compact?: boolean }) {
  const n = example.encoderTokens.length;
  const width = compact ? 300 : 560;
  const height = compact ? 50 : 70;
  const wavePath = (dim: number) => {
    const pts: string[] = [];
    const steps = 100;
    for (let s = 0; s <= steps; s++) {
      const pos = (s / steps) * (n - 1);
      const val = positionalEncoding(pos, 16)[dim] ?? 0;
      const x = (s / steps) * width;
      const y = height / 2 - val * (height / 2 - 5);
      pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-base-500">Real sin/cos formula across all {n} positions:</p>
      <div className="overflow-x-auto rounded-lg border border-base-700 bg-base-950 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: compact ? 260 : 420 }}>
          {[0, 1, 2, 3].map((d) => (
            <path key={d} d={wavePath(d)} fill="none" stroke={COLORS.pe} strokeWidth={1.2} strokeOpacity={0.85 - d * 0.16} />
          ))}
          {example.encoderTokens.map((_, i) => (
            <circle key={i} cx={(i / (n - 1)) * width} cy={height / 2} r={2.2} fill={COLORS.pe} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function EncoderAttentionVisual({
  example,
  allRows,
  compact,
}: {
  example: TransformerExample;
  allRows: (number[] | null)[];
  compact?: boolean;
}) {
  const n = example.encoderTokens.length;
  const cell = compact ? 15 : n > 9 ? 26 : 30;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] text-base-500">Head A, all tokens (outlined row is &ldquo;it&rdquo;):</p>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)` }}>
            {example.encoderTokens.map((_, r) => {
              const row = r === example.itIndex ? example.encoderAttentionHeadCoref : allRows[r]!;
              return row.map((w, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-sm"
                  style={{
                    width: cell - 1,
                    height: cell - 1,
                    backgroundColor: COLORS.attn,
                    opacity: 0.12 + w * 0.88,
                    outline: r === example.itIndex ? `1.5px solid ${COLORS.attn}` : 'none',
                    outlineOffset: -1,
                  }}
                  title={`${example.encoderTokens[r]} → ${example.encoderTokens[c]}: ${(w * 100).toFixed(0)}%`}
                />
              ));
            })}
          </div>
        </div>
      </div>
      <TokenRow tokens={example.encoderTokens} highlightIdx={example.itIndex} />
      <AttnBar label={`Head A — coref (it → ${example.focusWord})`} tokens={example.encoderTokens} weights={example.encoderAttentionHeadCoref} color={COLORS.attn} winnerIdx={example.focusIndex} compact={compact} />
      <AttnBar label={`Head B — property (it → ${example.adjectiveWord})`} tokens={example.encoderTokens} weights={example.encoderAttentionHeadProperty} color="#c026d3" winnerIdx={example.encoderTokens.length - 1} compact={compact} />
    </div>
  );
}

function DecoderMaskVisual({ example, compact }: { example: TransformerExample; compact?: boolean }) {
  const labels = ['⟨s⟩', 'The', example.focusWord];
  const cell = compact ? 44 : 60;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid" style={{ gridTemplateColumns: `48px repeat(${labels.length}, ${cell}px)` }}>
        <div />
        {labels.map((l) => (
          <div key={l} className="pb-1 text-center font-mono text-[9px] text-base-500">{l}</div>
        ))}
        {labels.map((rowLabel, r) => (
          <Fragment key={r}>
            <div className="pr-1 text-right font-mono text-[9px] text-base-500">{rowLabel}</div>
            {labels.map((_, c) => {
              const visible = c <= r;
              return (
                <div
                  key={`${r}-${c}`}
                  className="m-0.5 flex items-center justify-center rounded text-[11px]"
                  style={{ height: cell - 6, backgroundColor: visible ? `${COLORS.attn}2a` : '#00000008', color: visible ? COLORS.attn : '#B9B2A0' }}
                >
                  {visible ? '✓' : '✕'}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
      <p className="text-center text-[10px] text-base-500">✓ allowed · ✕ masked</p>
    </div>
  );
}

function DecoderCrossVisual({ example, compact }: { example: TransformerExample; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-base-500">Decoder query (&ldquo;{example.focusWord}&rdquo;) over every encoder position:</p>
      <AttnBar label="Cross-attention" tokens={example.encoderTokens} weights={example.decoderCrossAttention} color={COLORS.attn} winnerIdx={example.itIndex} secondaryIdx={example.focusIndex} compact={compact} />
    </div>
  );
}

function LogitsVisual({ example, probs, compact }: { example: TransformerExample; probs: number[] | null; compact?: boolean }) {
  const values = probs ?? example.candidateLogits;
  const max = Math.max(...values.map(Math.abs));
  return (
    <div className="flex flex-col gap-1">
      {example.candidateVocab.map((word, i) => {
        const isWinner = word === example.focusWord;
        const v = values[i];
        const widthPct = probs ? v * 100 : (Math.abs(v) / max) * 100;
        return (
          <div key={word} className="flex items-center gap-1.5">
            <span className="w-11 shrink-0 text-right font-mono text-[10px]" style={{ color: isWinner ? COLORS.softmax : '#8B8576' }}>{word}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-base-800">
              <motion.div initial={{ width: 0 }} animate={{ width: `${widthPct}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ backgroundColor: isWinner ? COLORS.softmax : '#DDD7C6' }} />
            </div>
            <span className="w-9 shrink-0 font-mono text-[9px] text-base-500">{probs ? `${(v * 100).toFixed(0)}%` : v.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}

function TokenRow({ tokens, highlightIdx }: { tokens: string[]; highlightIdx: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((t, i) => (
        <span key={i} className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ backgroundColor: i === highlightIdx ? `${COLORS.attn}2a` : 'transparent', color: i === highlightIdx ? COLORS.attn : '#4E4A3F', fontWeight: i === highlightIdx ? 700 : 400 }}>
          {t}
        </span>
      ))}
    </div>
  );
}

function AttnBar({
  label,
  tokens,
  weights,
  color,
  winnerIdx,
  secondaryIdx,
  compact,
}: {
  label: string;
  tokens: string[];
  weights: number[];
  color: string;
  winnerIdx: number;
  secondaryIdx?: number;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium text-base-400">{label}</span>
      <div className="flex items-end gap-0.5 overflow-x-auto">
        {tokens.map((t, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-0.5" style={{ minWidth: compact ? 22 : undefined }}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${weights[i] * (compact ? 55 : 90) + 3}px` }} transition={{ duration: 0.5, delay: i * 0.02 }} className="w-full rounded-t" style={{ backgroundColor: i === winnerIdx || i === secondaryIdx ? color : `${color}33` }} />
            <span className="font-mono text-[8px]" style={{ color: i === winnerIdx ? color : '#8B8576', fontWeight: i === winnerIdx ? 700 : 400 }}>
              {t.length > 4 ? t.slice(0, 4) + '…' : t}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 shrink-0 text-base-500 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-emerald-600">
      <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}