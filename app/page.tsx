'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import { STAGES } from '@/lib/stages';
import { tokenize } from '@/lib/tokenizer';
import { runPipeline, generateSequence } from '@/lib/engine';
import { ModelPreset, PipelineResult, GeneratedStep } from '@/lib/types';

import Sidebar from '@/components/Sidebar';
import StageNav from '@/components/StageNav';
import EmptyState from '@/components/EmptyState';

import InputStage from '@/components/stages/InputStage';
import TokenizerStage from '@/components/stages/TokenizerStage';
import EmbeddingStage from '@/components/stages/EmbeddingStage';
import PositionStage from '@/components/stages/PositionStage';
import AttentionStage from '@/components/stages/AttentionStage';
import TransformerStage from '@/components/stages/TransformerStage';
import LogitsStage from '@/components/stages/LogitsStage';
import SoftmaxStage from '@/components/stages/SoftmaxStage';
import DecoderStage from '@/components/stages/DecoderStage';

const AUTO_ADVANCE_MS = 3000;

export default function Page() {
  const [prompt, setPrompt] = useState('');
  const [activePrompt, setActivePrompt] = useState('');
  const [model, setModel] = useState<ModelPreset>(DEFAULT_MODEL);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generated, setGenerated] = useState<GeneratedStep[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  // Bumped on every run/restart. Folded into the AnimatePresence key below so
  // the stage replays its entrance animation even when stageIndex is already
  // 0 (e.g. clicking "Run again" while sitting on the Input stage) — without
  // this, React sees an unchanged key and never remounts, so the new result
  // appears with zero visible motion, which reads as "nothing happened".
  const [runId, setRunId] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const genTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  const clearGenTimer = () => {
    if (genTimerRef.current) clearInterval(genTimerRef.current);
    genTimerRef.current = null;
  };

  const runFor = useCallback((text: string, m: ModelPreset) => {
    if (!text.trim()) return;
    const r = runPipeline(text, m, tokenize);
    setResult(r);
    setGenerated([]);
    setRevealedCount(0);
    setIsGenerating(false);
    setActivePrompt(text);
    setRunId((id: number) => id + 1);
    setIsPlaying(true); // start the walkthrough immediately — no second click needed
  }, []);

  const handleRun = () => {
    clearTimer();
    clearGenTimer();
    setStageIndex(0);
    runFor(prompt, model);
  };

  const handleModelChange = (m: ModelPreset) => {
    setModel(m);
    if (activePrompt) {
      clearTimer();
      clearGenTimer();
      setStageIndex(0);
      runFor(activePrompt, m);
    }
  };

  // autoplay stage-to-stage
  useEffect(() => {
    if (!isPlaying || !result) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setStageIndex((prev: number) => {
        if (prev >= STAGES.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, AUTO_ADVANCE_MS);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, result]);

  // when we land on the decoder stage, kick off generation
  useEffect(() => {
    const isDecoder = STAGES[stageIndex]?.key === 'decoder';
    if (isDecoder && result && generated.length === 0 && !isGenerating) {
      setIsGenerating(true);
      const seq = generateSequence(activePrompt, model, tokenize, 9);
      setGenerated(seq);
      let count = 0;
      clearGenTimer();
      genTimerRef.current = setInterval(() => {
        count += 1;
        setRevealedCount(count);
        if (count >= seq.length) {
          clearGenTimer();
          setIsGenerating(false);
        }
      }, 650);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageIndex, result]);

  useEffect(() => clearTimer, []);
  useEffect(() => clearGenTimer, []);

  const stepForward = () => {
    setIsPlaying(false);
    setStageIndex((p: number) => Math.min(STAGES.length - 1, p + 1));
  };
  const stepBack = () => {
    setIsPlaying(false);
    setStageIndex((p: number) => Math.max(0, p - 1));
  };
  const restart = () => {
    clearGenTimer();
    setGenerated([]);
    setRevealedCount(0);
    setIsGenerating(false);
    setStageIndex(0);
    setRunId((id: number) => id + 1);
    setIsPlaying(true);
  };
  const togglePlay = () => {
    if (!result) return;
    if (stageIndex >= STAGES.length - 1) {
      setStageIndex(0);
      setRunId((id: number) => id + 1);
    }
    setIsPlaying((p: boolean) => !p);
  };

  const stageKey = STAGES[stageIndex]?.key;

  return (
    <main className="flex min-h-screen flex-col bg-base-950 md:h-screen md:flex-row md:overflow-hidden">
      <Sidebar
        prompt={prompt}
        setPrompt={setPrompt}
        onRun={handleRun}
        hasResult={!!result}
        models={MODELS}
        selectedModel={model}
        onSelectModel={handleModelChange}
      />

      {result && (
        <StageNav
          stages={STAGES}
          activeIndex={stageIndex}
          onSelect={(i) => {
            setIsPlaying(false);
            setStageIndex(i);
          }}
          model={model}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onStepBack={stepBack}
          onStepForward={stepForward}
          onRestart={restart}
        />
      )}

      <section className="flex-1 md:h-full md:overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-6 p-5 sm:p-8">
          {!result ? (
            <EmptyState />
          ) : (
            <div className="flex-1 rounded-2xl glass-panel p-5 shadow-panel sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${stageKey}-${runId}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {stageKey === 'input' && <InputStage prompt={activePrompt} model={model} />}
                  {stageKey === 'tokenizer' && <TokenizerStage tokens={result.tokens} />}
                  {stageKey === 'embedding' && (
                    <EmbeddingStage tokens={result.tokens} embeddings={result.embeddings} model={model} />
                  )}
                  {stageKey === 'position' && <PositionStage tokens={result.tokens} model={model} />}
                  {stageKey === 'attention' && (
                    <AttentionStage tokens={result.tokens} layers={result.layers} model={model} />
                  )}
                  {stageKey === 'transformer' && (
                    <TransformerStage tokens={result.tokens} layers={result.layers} model={model} />
                  )}
                  {stageKey === 'logits' && <LogitsStage logits={result.logits} model={model} />}
                  {stageKey === 'softmax' && <SoftmaxStage probs={result.probs} model={model} />}
                  {stageKey === 'decoder' && (
                    <DecoderStage
                      prompt={activePrompt}
                      generated={generated}
                      revealedCount={revealedCount}
                      isGenerating={isGenerating}
                      model={model}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          <footer className="text-center text-xs leading-relaxed text-base-500">
            LLM Lab runs a real, mechanically accurate transformer forward pass entirely in your browser —
            tokenization, embeddings, attention, softmax, and sampling all really happen. The weights are
            randomly seeded rather than trained, so outputs are illustrative, not coherent model answers.
            No servers, no API calls, nothing leaves your device.
          </footer>
        </div>
      </section>
    </main>
  );
}
