'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MODELS, DEFAULT_MODEL } from '@/lib/models';
import { STAGES } from '@/lib/stages';
import { tokenize } from '@/lib/tokenizer';
import { runPipeline, generateSequence } from '@/lib/engine';
import { ModelPreset, PipelineResult, GeneratedStep } from '@/lib/types';

import Header from '@/components/Header';
import PromptBar from '@/components/PromptBar';
import ModelSelector from '@/components/ModelSelector';
import Timeline from '@/components/Timeline';
import Controls from '@/components/Controls';
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

const AUTO_ADVANCE_MS = 3400;

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
  }, []);

  const handleRun = () => {
    clearTimer();
    clearGenTimer();
    setIsPlaying(false);
    setStageIndex(0);
    runFor(prompt, model);
  };

  const handleModelChange = (m: ModelPreset) => {
    setModel(m);
    if (activePrompt) {
      clearTimer();
      clearGenTimer();
      setIsPlaying(false);
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
    setIsPlaying(false);
    clearGenTimer();
    setGenerated([]);
    setRevealedCount(0);
    setIsGenerating(false);
    setStageIndex(0);
  };
  const togglePlay = () => {
    if (!result) return;
    if (stageIndex >= STAGES.length - 1) setStageIndex(0);
    setIsPlaying((p: boolean) => !p);
  };

  const stageKey = STAGES[stageIndex]?.key;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-base-950">
      <div className="pointer-events-none fixed inset-0 bg-grid bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none fixed -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <Header />

        <div className="flex flex-col gap-4">
          <PromptBar
            prompt={prompt}
            setPrompt={setPrompt}
            onRun={handleRun}
            hasResult={!!result}
          />
          <ModelSelector models={MODELS} selected={model} onSelect={handleModelChange} />
        </div>

        {!result ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-2xl glass-panel p-3 shadow-panel sm:p-4">
              <Timeline stages={STAGES} activeIndex={stageIndex} onSelect={(i) => { setIsPlaying(false); setStageIndex(i); }} model={model} />
              <Controls
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onStepBack={stepBack}
                onStepForward={stepForward}
                onRestart={restart}
                canStepBack={stageIndex > 0}
                canStepForward={stageIndex < STAGES.length - 1}
              />
            </div>

            <div className="min-h-[520px] rounded-2xl glass-panel p-5 shadow-panel sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stageKey}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {stageKey === 'input' && <InputStage prompt={activePrompt} model={model} />}
                  {stageKey === 'tokenizer' && <TokenizerStage tokens={result.tokens} />}
                  {stageKey === 'embedding' && <EmbeddingStage tokens={result.tokens} embeddings={result.embeddings} model={model} />}
                  {stageKey === 'position' && <PositionStage tokens={result.tokens} model={model} />}
                  {stageKey === 'attention' && <AttentionStage tokens={result.tokens} layers={result.layers} model={model} />}
                  {stageKey === 'transformer' && <TransformerStage tokens={result.tokens} layers={result.layers} model={model} />}
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
          </div>
        )}

        <footer className="mt-6 text-center text-xs leading-relaxed text-base-400">
          LLM Lab runs a real, mechanically accurate transformer forward pass entirely in your browser —
          tokenization, embeddings, attention, softmax, and sampling all really happen. The weights are
          randomly seeded rather than trained, so outputs are illustrative, not coherent model answers.
          No servers, no API calls, nothing leaves your device.
        </footer>
      </div>
    </main>
  );
}
