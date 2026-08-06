'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SkeletonStep {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  badge: string;
  dataIn: string;
  dataOut: string;
  concept: string;
  gradient: string;
  activeBorder: string;
  activeBg: string;
  badgeStyle: string;
  textAccent: string;
}

const SKELETON_STEPS: SkeletonStep[] = [
  {
    id: 1,
    key: 'input',
    title: 'Input Prompt',
    subtitle: 'User Natural Language',
    badge: 'Raw Text String',
    dataIn: '"Explain quantum computing in simple terms"',
    dataOut: '<|im_start|>user Explain quantum...<|im_end|>',
    concept: 'Takes human text input and formats it with chat template system headers.',
    gradient: 'from-emerald-400 to-teal-400',
    activeBorder: 'border-emerald-400',
    activeBg: 'bg-slate-900',
    badgeStyle: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    textAccent: 'text-emerald-400',
  },
  {
    id: 2,
    key: 'tokenizer',
    title: 'Tokenizer',
    subtitle: 'Text to ID Numbers',
    badge: 'No AI (Dictionary)',
    dataIn: '"Explain quantum"',
    dataOut: '[15496, 995, 342, 8821]',
    concept: 'NO AI HERE! A deterministic lookup table breaks text into sub-words and assigns fixed integer IDs.',
    gradient: 'from-teal-400 to-cyan-400',
    activeBorder: 'border-teal-400',
    activeBg: 'bg-slate-900',
    badgeStyle: 'bg-teal-950/80 text-teal-300 border-teal-500/40',
    textAccent: 'text-teal-400',
  },
  {
    id: 3,
    key: 'position',
    title: 'Positional Encoding',
    subtitle: 'Word Position Injection',
    badge: 'RoPE Rotation',
    dataIn: 'Token IDs',
    dataOut: 'Position-Aware Tokens (Word #1 vs #10)',
    concept: 'Injects word order into sequence data so the model knows word positions relative to each other.',
    gradient: 'from-cyan-400 to-sky-400',
    activeBorder: 'border-cyan-400',
    activeBg: 'bg-slate-900',
    badgeStyle: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
    textAccent: 'text-cyan-400',
  },
  {
    id: 4,
    key: 'embedding',
    title: 'Token Embedding',
    subtitle: 'IDs to Vectors',
    badge: 'Lookup Matrix',
    dataIn: 'Position-Aware IDs',
    dataOut: 'High-Dim Vector [0.55, 0.34, ... 16]',
    concept: 'Converts discrete integer IDs into high-dimensional geometric vectors representing semantic meaning.',
    gradient: 'from-sky-400 to-blue-400',
    activeBorder: 'border-sky-400',
    activeBg: 'bg-slate-900',
    badgeStyle: 'bg-sky-950/80 text-sky-300 border-sky-500/40',
    textAccent: 'text-sky-400',
  },
  {
    id: 5,
    key: 'transformer',
    title: 'Transformer Backbone',
    subtitle: 'Attention & FFN Core',
    badge: 'Repeat 30-N Layers',
    dataIn: 'Embedded Vectors',
    dataOut: 'Contextual Hidden State (h_final)',
    concept: 'THE BRAIN! Self-Attention mixes context across tokens, while FFN/MoE layers execute deep reasoning.',
    gradient: 'from-blue-400 to-indigo-400',
    activeBorder: 'border-indigo-400',
    activeBg: 'bg-slate-900',
    badgeStyle: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
    textAccent: 'text-indigo-400',
  },
  {
    id: 6,
    key: 'logits',
    title: 'Output Layers',
    subtitle: 'Predict Next Token',
    badge: 'Logits Matrix W_vocab',
    dataIn: 'Hidden Vector (h_final)',
    dataOut: '100,000 Word Scores (-∞ to +∞)',
    concept: 'Projects the final vector against the full vocabulary matrix to score candidate next words.',
    gradient: 'from-indigo-400 to-purple-400',
    activeBorder: 'border-purple-400',
    activeBg: 'bg-slate-900',
    badgeStyle: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    textAccent: 'text-purple-400',
  },
  {
    id: 7,
    key: 'decoder',
    title: 'Decoder & Softmax',
    subtitle: 'Numbers to Text',
    badge: 'Sampling Stage',
    dataIn: 'Logit Scores',
    dataOut: 'Probabilities: "Quantum" (84%)',
    concept: 'Applies Softmax and Temperature sampling to choose 1 winning token ID from the probability curve.',
    gradient: 'from-purple-400 to-pink-400',
    activeBorder: 'border-fuchsia-400',
    activeBg: 'bg-slate-900',
    badgeStyle: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/40',
    textAccent: 'text-fuchsia-400',
  },
  {
    id: 8,
    key: 'final',
    title: 'Final Answer & Loop',
    subtitle: 'Append & Re-enter Stage 1',
    badge: 'Autoregressive ↻',
    dataIn: 'Selected Token ID',
    dataOut: 'Decoded Text Word + Append to Sequence',
    concept: 'Outputs the word to screen, appends it into Step 1 as context, and restarts the pipeline for token #2.',
    gradient: 'from-pink-400 to-rose-400',
    activeBorder: 'border-pink-400',
    activeBg: 'bg-slate-900',
    badgeStyle: 'bg-pink-950/80 text-pink-300 border-pink-500/40',
    textAccent: 'text-pink-400',
  },
];

export default function EmptyState() {
  const [activeStepId, setActiveStepId] = useState<number>(5);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveStepId((prev) => (prev % SKELETON_STEPS.length) + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, [isHovered]);

  const activeStep = SKELETON_STEPS.find((s) => s.id === activeStepId) || SKELETON_STEPS[4];

  return (
    <div className="flex min-h-[80vh] w-full max-w-6xl flex-col justify-between gap-6 rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl mx-auto font-mono text-slate-100 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-lg shadow-inner">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base md:text-lg font-bold text-white">
                LLM Execution Skeleton (Strict 8-Step Flow)
              </h2>
              <span className="rounded-full bg-emerald-950 border border-emerald-500/50 px-2.5 py-0.5 text-[10px] text-emerald-300 font-bold whitespace-nowrap">
                Sequential Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any step below to inspect data inputs, outputs, and core transformations.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shrink-0">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Click step or press <strong className="text-emerald-400">&quot;Visualize&quot;</strong></span>
        </div>
      </div>

      {/* 8-Step Pipeline Diagram */}
      <div
        className="relative my-2 flex flex-col gap-5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Row 1: Steps 1 to 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative">
          {SKELETON_STEPS.slice(0, 4).map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isActive={step.id === activeStepId}
              onClick={() => setActiveStepId(step.id)}
              showArrow={step.id < 4}
            />
          ))}
        </div>

        {/* Explicit Row Bridge (Step 4 -> Step 5 Connector) */}
        <div className="hidden md:flex items-center justify-end pr-8 -my-2 text-slate-500 font-bold text-xs gap-2">
          <span>Row 1 (Input/Prep) ➔ Row 2 (Brain/Output)</span>
          <span className="text-cyan-400 text-sm">↴</span>
        </div>

        {/* Row 2: Steps 5 to 8 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 relative">
          {SKELETON_STEPS.slice(4, 8).map((step) => (
            <StepCard
              key={step.id}
              step={step}
              isActive={step.id === activeStepId}
              onClick={() => setActiveStepId(step.id)}
              showArrow={step.id < 8}
            />
          ))}
        </div>

        {/* Autoregressive Loop Box */}
        <div className="relative w-full rounded-2xl border border-pink-500/60 bg-slate-900/90 p-4 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-950 border border-pink-500/60 text-pink-300 font-bold text-xl shadow-md">
              ↻
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-300 bg-pink-950/80 border border-pink-500/50 px-2.5 py-0.5 rounded">
                  AUTOREGRESSIVE FEEDBACK LOOP
                </span>
                <span className="text-xs text-amber-300 font-bold">
                  Step 8 ➔ Re-enters Step 1
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                <strong className="text-pink-300">Stage 8</strong> outputs the newly predicted word token ➔ Appends it onto the prompt sequence ➔ Re-enters <strong className="text-emerald-300">Stage 1</strong> to generate word #2, word #3, etc.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveStepId(8)}
            className="shrink-0 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 border border-pink-400 px-4 py-2 rounded-xl transition-colors"
          >
            Inspect Step 8 Loop ➔
          </button>
        </div>
      </div>

      {/* Dynamic Inspector Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl flex flex-col gap-4 text-left"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black bg-gradient-to-r ${activeStep.gradient} text-slate-950 shadow-md`}>
                {activeStep.id}
              </span>
              <div>
                <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  Step {activeStep.id}: {activeStep.title}
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border ${activeStep.badgeStyle}`}>
                    {activeStep.badge}
                  </span>
                </h3>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Stage {activeStep.id} of 8
            </span>
          </div>

          {/* Transformation Data Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  Data Input (From Step {activeStep.id === 1 ? 8 : activeStep.id - 1})
                </span>
              </div>
              <p className="font-semibold text-slate-200">{activeStep.dataIn}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Data Output (To Step {activeStep.id === 8 ? 1 : activeStep.id + 1})
                </span>
              </div>
              <p className="font-semibold text-slate-200">{activeStep.dataOut}</p>
            </div>
          </div>

          {/* Student Pedagogical Core Concept */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs">
            <span className="text-base shrink-0">💡</span>
            <div>
              <span className={`font-bold ${activeStep.textAccent}`}>Student Takeaway:</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">{activeStep.concept}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StepCard({
  step,
  isActive,
  onClick,
  showArrow,
}: {
  step: SkeletonStep;
  isActive: boolean;
  onClick: () => void;
  showArrow: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col justify-between p-3.5 rounded-2xl border text-left min-h-[105px] transition-all ${
        isActive
          ? `${step.activeBorder} ${step.activeBg} ring-2 ring-emerald-500/30 shadow-xl`
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      {/* Top Badge & Step Number */}
      <div className="flex items-center justify-between w-full gap-1">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
            isActive
              ? `bg-gradient-to-r ${step.gradient} text-slate-950`
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          {step.id}
        </span>

        <span
          className={`text-[9px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${step.badgeStyle}`}
        >
          {step.badge}
        </span>
      </div>

      {/* Step Title & Subtitle */}
      <div className="mt-2">
        <h4 className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>
          {step.title}
        </h4>
        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{step.subtitle}</p>
      </div>

      {/* Sequence Arrow */}
      {showArrow && (
        <span className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 text-[11px] font-bold text-slate-500 bg-slate-950 px-0.5">
          ➔
        </span>
      )}
    </button>
  );
}