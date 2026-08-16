'use client';

import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { EXAMPLES, Variant, TransformerExample, localAttentionRow } from '@/lib/transformer-diagram-data';
import { softmax } from '@/lib/math';
import { positionalEncoding } from '@/lib/engine';

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
      'The encoder gets the full ambiguous sentence at once. The decoder side is "shifted right" — it starts with just a start token and only ever sees the words it has already generated, never the answer in advance.',
    highlight: ['enc-input', 'dec-output'],
    visual: 'none',
  },
  {
    id: 'embed',
    title: 'Input & Output Embedding',
    description:
      'Every token — on both sides — is looked up in an embedding table and turned into a vector. Same mechanism, two separate embedding tables (encoder vocabulary in, decoder vocabulary out).',
    highlight: ['enc-embed', 'dec-embed'],
    visual: 'none',
  },
  {
    id: 'pe',
    title: 'Positional Encoding — on both sides',
    description:
      'Attention has no built-in sense of order, so a fixed sine/cosine wave unique to each position is added to every embedding — in the encoder AND the decoder, independently, since each has its own sequence of positions to track.',
    highlight: ['enc-pe', 'dec-pe'],
    visual: 'pe',
  },
  {
    id: 'enc-attn',
    title: 'Encoder Self-Attention — resolving "it"',
    description:
      'This is the famous case. Every token computes how much it should attend to every other token — a function of all the others, all at once. Watch what happens to "it" when only the last word changes.',
    highlight: ['enc-mha'],
    visual: 'encoder-attn',
  },
  {
    id: 'enc-ffn',
    title: 'Feed-Forward Network (×N)',
    description:
      'After Add & Norm stabilizes the residual sum, a small MLP — two linear layers with a GELU in between — is applied to every position independently, enriching each token\u2019s representation further. The whole block (attention → Add&Norm → FFN → Add&Norm) repeats N times, each layer refining the representation the last one built.',
    highlight: ['enc-addnorm1', 'enc-ffn', 'enc-addnorm2'],
    visual: 'none',
  },
  {
    id: 'dec-mask',
    title: 'Masked Multi-Head Attention — why "masked"?',
    description:
      'The decoder also self-attends over what it\u2019s generated so far — but it is forbidden from looking at any position after the one it\u2019s currently predicting. That\u2019s the mask: without it, predicting "animal" could just copy the answer instead of learning to infer it, and at real inference time those future words don\u2019t exist yet anyway.',
    highlight: ['dec-mmha'],
    visual: 'decoder-mask',
  },
  {
    id: 'dec-cross',
    title: 'Encoder-Decoder (Cross) Attention',
    description:
      'Now the decoder\u2019s queries meet the encoder\u2019s keys and values — the arrow crossing over from the encoder stack. To answer correctly, the decoder must reach back into the encoder\u2019s finished representation of "it", which by now already has the right referent baked in.',
    highlight: ['dec-cross'],
    visual: 'decoder-cross',
  },
  {
    id: 'dec-ffn',
    title: 'Feed-Forward Network (×N)',
    description:
      'Same as the encoder side: Add & Norm, a position-wise MLP, Add & Norm again — and the full three-sublayer decoder block (masked self-attn, cross-attn, FFN) repeats N times.',
    highlight: ['dec-addnorm1', 'dec-ffn', 'dec-addnorm2'],
    visual: 'none',
  },
  {
    id: 'linear',
    title: 'Linear — projecting to vocabulary size',
    description:
      'The final decoder representation (one vector) is projected by a single learned linear layer into a vector with one number — a logit — per word in the entire output vocabulary. Higher means more likely, but these aren\u2019t probabilities yet.',
    highlight: ['linear'],
    visual: 'logits',
  },
  {
    id: 'softmax',
    title: 'Softmax — logits become probabilities',
    description:
      'Softmax squashes every logit into a value between 0 and 1, all summing to exactly 1. Real softmax math runs right here on the logits above — nothing about this step is faked.',
    highlight: ['softmax'],
    visual: 'softmax',
  },
  {
    id: 'output',
    title: 'Predicting the next word — and looping back',
    description:
      'The highest-probability word is chosen, appended to the decoder\u2019s output-so-far, and fed back in as the next "shifted right" input — one word at a time, until the full answer is complete.',
    highlight: ['outputprobs', 'dec-output'],
    visual: 'softmax',
  },
];

const AUTO_MS = 3400;

export default function TransformerArchitecturePage() {
  const [variant, setVariant] = useState<Variant>('tired');
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const example = EXAMPLES[variant];
  const n = example.encoderTokens.length;

  useEffect(() => {
    if (!isPlaying) return;
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
  }, [isPlaying]);

  const active = (id: string) => STEPS[stepIdx].highlight.includes(id);
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

  return (
    <main className="min-h-screen bg-base-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm text-base-400 transition hover:text-base-100">
            <ArrowLeftIcon />
            Back to visualizer
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/attentions" className="text-xs text-base-500 transition hover:text-base-300">
              📖 Attention Bible
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-base-200 text-xs font-bold text-base-950">L</div>
              <span className="text-sm font-semibold text-base-100">LLM Lab</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-base-100 sm:text-3xl">
            Transformer Architecture
          </h1>
          <p className="max-w-2xl text-sm text-base-400 sm:text-base">
            The full encoder-decoder stack from &ldquo;Attention Is All You Need&rdquo;, animated —
            using the single most famous example in Transformer teaching instead of a translation demo.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-2xl glass-panel p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-base-500">Task</span>
            <p className="text-sm text-base-200">
              Encoder reads the sentence. Decoder answers: <span className="font-medium">what does &ldquo;it&rdquo; refer to?</span>
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-base-700 bg-base-900 p-1">
            <button
              onClick={() => changeVariant('tired')}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition"
              style={{
                backgroundColor: variant === 'tired' ? COLORS.attn : 'transparent',
                color: variant === 'tired' ? '#fff' : '#8B8576',
              }}
            >
              &hellip;too tired
            </button>
            <button
              onClick={() => changeVariant('wide')}
              className="rounded-full px-3 py-1.5 text-xs font-medium transition"
              style={{
                backgroundColor: variant === 'wide' ? COLORS.attn : 'transparent',
                color: variant === 'wide' ? '#fff' : '#8B8576',
              }}
            >
              &hellip;too wide
            </button>
          </div>
        </div>

        <div className="rounded-2xl border px-4 py-3 text-center font-mono text-sm text-base-200 shadow-panel" style={{ borderColor: `${COLORS.attn}55`, backgroundColor: `${COLORS.attn}0f` }}>
          &ldquo;{example.sentence}&rdquo;
        </div>

        {/* controls */}
        <div className="flex items-center justify-center gap-2 rounded-2xl glass-panel p-3 shadow-panel">
          <IconBtn onClick={() => { setIsPlaying(false); setStepIdx(0); }} label="Restart"><RestartIcon /></IconBtn>
          <IconBtn onClick={() => { setIsPlaying(false); setStepIdx((p: number) => Math.max(0, p - 1)); }} disabled={stepIdx === 0} label="Back"><BackIcon /></IconBtn>
          <button
            onClick={() => { if (stepIdx >= STEPS.length - 1) setStepIdx(0); setIsPlaying((p: boolean) => !p); }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-panel transition active:scale-95"
            style={{ backgroundColor: COLORS.attn }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <IconBtn onClick={() => { setIsPlaying(false); setStepIdx((p: number) => Math.min(STEPS.length - 1, p + 1)); }} disabled={stepIdx === STEPS.length - 1} label="Forward"><FwdIcon /></IconBtn>
          <span className="ml-2 font-tabular text-xs text-base-500">{stepIdx + 1}/{STEPS.length}</span>
        </div>

        {/* step explanation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl glass-panel p-5 shadow-panel"
          >
            <h2 className="mb-1.5 text-base font-semibold text-base-100">{step.title}</h2>
            <p className="text-sm leading-relaxed text-base-400">{step.description}</p>

            {step.visual === 'pe' && <PositionalEncodingVisual example={example} />}
            {step.visual === 'encoder-attn' && <EncoderAttentionVisual example={example} allRows={encoderRows} />}
            {step.visual === 'decoder-mask' && <DecoderMaskVisual example={example} />}
            {step.visual === 'decoder-cross' && <DecoderCrossVisual example={example} />}
            {(step.visual === 'logits' || step.visual === 'softmax') && (
              <LogitsVisual example={example} probs={step.visual === 'softmax' ? probs : null} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* diagram — mirrors the paper's figure: output at top, inputs at bottom */}
        <div className="flex flex-col items-center gap-3 rounded-2xl glass-panel p-5 shadow-panel sm:p-8">
          <DiagramBox label="Output Probabilities" color={COLORS.softmax} active={active('outputprobs')} />
          <ArrowUp />
          <DiagramBox label="Softmax" color={COLORS.softmax} active={active('softmax')} />
          <ArrowUp />
          <DiagramBox label="Linear" color={COLORS.linear} active={active('linear')} />
          <ArrowUp />

          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
            {/* encoder */}
            <div className="flex flex-col items-center gap-2">
              <NxWrap>
                <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('enc-addnorm2')} small />
                <DiagramBox label="Feed Forward" color={COLORS.ffn} active={active('enc-ffn')} />
                <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('enc-addnorm1')} small />
                <DiagramBox label="Multi-Head Attention" color={COLORS.attn} active={active('enc-mha')} />
              </NxWrap>
              <ArrowUp />
              <DiagramBox label="Positional Encoding ⊕" color={COLORS.pe} active={active('enc-pe')} small />
              <ArrowUp />
              <DiagramBox label="Input Embedding" color={COLORS.embed} active={active('enc-embed')} small />
              <ArrowUp />
              <DiagramBox label="Inputs (encoder)" color="#8B8576" active={active('enc-input')} small />
              <span className="text-[10px] uppercase tracking-wide text-base-500">Encoder</span>
            </div>

            {/* decoder */}
            <div className="flex flex-col items-center gap-2">
              <NxWrap>
                <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-addnorm2')} small />
                <DiagramBox label="Feed Forward" color={COLORS.ffn} active={active('dec-ffn')} />
                <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-addnorm1')} small />
                <DiagramBox label="Multi-Head Attention" sublabel="(encoder-decoder)" color={COLORS.attn} active={active('dec-cross')} />
                <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-mmha')} small />
                <DiagramBox label="Masked Multi-Head Attention" color={COLORS.attn} active={active('dec-mmha')} />
              </NxWrap>
              <ArrowUp />
              <DiagramBox label="Positional Encoding ⊕" color={COLORS.pe} active={active('dec-pe')} small />
              <ArrowUp />
              <DiagramBox label="Output Embedding" color={COLORS.embed} active={active('dec-embed')} small />
              <ArrowUp />
              <DiagramBox label="Outputs (shifted right)" color="#8B8576" active={active('dec-output')} small />
              <span className="text-[10px] uppercase tracking-wide text-base-500">Decoder</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-base-500">
          Encoder self-attention and softmax run on real math throughout. The attention weights for
          resolving &ldquo;it&rdquo; are hand-set to match how this example is actually documented —
          a random-weight simulation can&rsquo;t know what a pronoun refers to.
        </p>
      </div>
    </main>
  );
}

function NxWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-base-700 p-3">
      <span className="absolute -right-2 -top-3 rounded-full bg-base-900 px-2 py-0.5 text-[10px] font-bold text-base-400 shadow-panel">
        ×N
      </span>
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
      className={`w-full max-w-[220px] rounded-lg text-center font-medium ${small ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2.5 text-xs sm:text-sm'}`}
      style={{
        backgroundColor: `${color}1f`,
        color,
        boxShadow: active ? `0 0 0 2px ${color}, 0 10px 24px -10px ${color}88` : `0 0 0 1px ${color}33`,
      }}
    >
      {label}
      {sublabel && <div className="text-[9px] font-normal opacity-70">{sublabel}</div>}
    </motion.div>
  );
}

function ArrowUp() {
  return <div className="text-base-600">↑</div>;
}

function PositionalEncodingVisual({ example }: { example: TransformerExample }) {
  const n = example.encoderTokens.length;
  const width = 560;
  const height = 70;
  const wavePath = (dim: number) => {
    const pts: string[] = [];
    const steps = 100;
    for (let s = 0; s <= steps; s++) {
      const pos = (s / steps) * (n - 1);
      const val = positionalEncoding(pos, 16)[dim] ?? 0;
      const x = (s / steps) * width;
      const y = height / 2 - val * (height / 2 - 6);
      pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return (
    <div className="mt-4 flex flex-col gap-2">
      <p className="text-xs text-base-500">
        The real sin/cos formula, plotted across all {n} positions — every dimension oscillates at a
        different frequency, giving every position a unique fingerprint:
      </p>
      <div className="overflow-x-auto rounded-xl border border-base-700 bg-base-900 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 420 }}>
          {[0, 1, 2, 3].map((d) => (
            <path
              key={d}
              d={wavePath(d)}
              fill="none"
              stroke={COLORS.pe}
              strokeWidth={1.4}
              strokeOpacity={0.85 - d * 0.16}
            />
          ))}
          {example.encoderTokens.map((_, i) => (
            <circle key={i} cx={(i / (n - 1)) * width} cy={height / 2} r={2.8} fill={COLORS.pe} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function EncoderAttentionVisual({ example, allRows }: { example: TransformerExample; allRows: (number[] | null)[] }) {
  const n = example.encoderTokens.length;
  const cell = n > 9 ? 26 : 30;
  return (
    <div className="mt-4 flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-base-500">
          The full picture — every token attends to every other token (Head A shown; the outlined row is
          &ldquo;it&rdquo;):
        </p>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)` }}>
            {example.encoderTokens.map((_, r) => {
              const row = r === example.itIndex ? example.encoderAttentionHeadCoref : allRows[r]!;
              return row.map((w, c) => (
                <div
                  key={`${r}-${c}`}
                  className="rounded-sm"
                  style={{
                    width: cell - 2,
                    height: cell - 2,
                    backgroundColor: COLORS.attn,
                    opacity: 0.12 + w * 0.88,
                    outline: r === example.itIndex ? `2px solid ${COLORS.attn}` : 'none',
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
      <AttnBar label={`Head A — coreference (it → ${example.focusWord})`} tokens={example.encoderTokens} weights={example.encoderAttentionHeadCoref} color={COLORS.attn} winnerIdx={example.focusIndex} />
      <AttnBar label={`Head B — property (it → ${example.adjectiveWord})`} tokens={example.encoderTokens} weights={example.encoderAttentionHeadProperty} color="#c026d3" winnerIdx={example.encoderTokens.length - 1} />
    </div>
  );
}

function DecoderMaskVisual({ example }: { example: TransformerExample }) {
  const labels = ['⟨start⟩', 'The', example.focusWord];
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="grid" style={{ gridTemplateColumns: `70px repeat(${labels.length}, 60px)` }}>
        <div />
        {labels.map((l) => (
          <div key={l} className="pb-1 text-center font-mono text-[10px] text-base-500">{l}</div>
        ))}
        {labels.map((rowLabel, r) => (
          <Fragment key={r}>
            <div className="pr-2 text-right font-mono text-[10px] text-base-500">{rowLabel}</div>
            {labels.map((_, c) => {
              const visible = c <= r;
              return (
                <div
                  key={`${r}-${c}`}
                  className="m-0.5 flex h-9 items-center justify-center rounded text-xs"
                  style={{
                    backgroundColor: visible ? `${COLORS.attn}2a` : '#00000008',
                    color: visible ? COLORS.attn : '#B9B2A0',
                  }}
                >
                  {visible ? '✓' : '✕'}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
      <p className="max-w-sm text-center text-xs text-base-500">
        ✓ = allowed to attend · ✕ = masked out. Row = query position, column = key position.
      </p>
    </div>
  );
}

function DecoderCrossVisual({ example }: { example: TransformerExample }) {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-xs text-base-500">
        Decoder query (generating &ldquo;{example.focusWord}&rdquo;) attends over every encoder position:
      </p>
      <AttnBar label="Cross-attention" tokens={example.encoderTokens} weights={example.decoderCrossAttention} color={COLORS.attn} winnerIdx={example.itIndex} secondaryIdx={example.focusIndex} />
    </div>
  );
}

function LogitsVisual({ example, probs }: { example: TransformerExample; probs: number[] | null }) {
  const values = probs ?? example.candidateLogits;
  const max = Math.max(...values.map(Math.abs));
  return (
    <div className="mt-4 flex flex-col gap-1.5">
      {example.candidateVocab.map((word, i) => {
        const isWinner = word === example.focusWord;
        const v = values[i];
        const widthPct = probs ? v * 100 : (Math.abs(v) / max) * 100;
        return (
          <div key={word} className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-right font-mono text-xs" style={{ color: isWinner ? COLORS.softmax : '#8B8576' }}>
              {word}
            </span>
            <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-base-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ backgroundColor: isWinner ? COLORS.softmax : '#DDD7C6' }}
              />
            </div>
            <span className="w-12 shrink-0 font-mono text-[11px] text-base-500">
              {probs ? `${(v * 100).toFixed(0)}%` : v.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TokenRow({ tokens, highlightIdx }: { tokens: string[]; highlightIdx: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((t, i) => (
        <span
          key={i}
          className="rounded-md px-2 py-1 font-mono text-xs"
          style={{
            backgroundColor: i === highlightIdx ? `${COLORS.attn}2a` : 'transparent',
            color: i === highlightIdx ? COLORS.attn : '#4E4A3F',
            fontWeight: i === highlightIdx ? 700 : 400,
          }}
        >
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
}: {
  label: string;
  tokens: string[];
  weights: number[];
  color: string;
  winnerIdx: number;
  secondaryIdx?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-base-400">{label}</span>
      <div className="flex items-end gap-1">
        {tokens.map((t, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${weights[i] * 90 + 4}px` }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              className="w-full rounded-t"
              style={{ backgroundColor: i === winnerIdx || i === secondaryIdx ? color : `${color}33` }}
            />
            <span
              className="font-mono text-[9px]"
              style={{ color: i === winnerIdx ? color : '#8B8576', fontWeight: i === winnerIdx ? 700 : 400 }}
            >
              {t.length > 5 ? t.slice(0, 5) + '…' : t}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, disabled, label }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full text-base-400 transition hover:bg-base-800 hover:text-base-200 disabled:cursor-not-allowed disabled:opacity-30">
      {children}
    </button>
  );
}
function PlayIcon() { return (<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5-9-5.5z" /></svg>); }
function PauseIcon() { return (<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.5" width="3.2" height="11" rx="0.8" /><rect x="9.3" y="2.5" width="3.2" height="11" rx="0.8" /></svg>); }
function FwdIcon() { return (<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2.5v11l7-5.5-7-5.5z" /><rect x="11.5" y="2.5" width="1.6" height="11" rx="0.6" /></svg>); }
function BackIcon() { return (<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13 2.5v11l-7-5.5 7-5.5z" /><rect x="2.9" y="2.5" width="1.6" height="11" rx="0.6" /></svg>); }
function RestartIcon() { return (<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M13.5 8A5.5 5.5 0 1 1 11.8 4" strokeLinecap="round" /><path d="M13.7 2v3.3H10.4" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
function ArrowLeftIcon() { return (<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>); }