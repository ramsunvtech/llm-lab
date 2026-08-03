'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ModelPreset } from '@/lib/types';

const EXAMPLES = [
  'Why is the sky blue?',
  'Write a haiku about the ocean',
  'Explain gravity to a child',
  'The cat sat on the mat',
];

export default function Sidebar({
  prompt,
  setPrompt,
  onRun,
  hasResult,
  models,
  selectedModel,
  onSelectModel,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  onRun: () => void;
  hasResult: boolean;
  models: ModelPreset[];
  selectedModel: ModelPreset;
  onSelectModel: (m: ModelPreset) => void;
}) {
  const [modelOpen, setModelOpen] = useState(false);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-6 border-b border-base-700 bg-base-850 p-5 md:h-full md:w-[300px] md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-base-200 text-xs font-bold text-base-950">
          L
        </div>
        <span className="text-base font-semibold text-base-100">LLM Lab</span>
      </div>

      <div className="flex flex-col gap-2">
        <label className="px-0.5 text-xs font-medium uppercase tracking-wide text-base-500">
          Prompt
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-base-700 bg-base-900 p-2 shadow-panel transition focus-within:border-base-500">
          <textarea
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onRun();
              }
            }}
            placeholder="Type a prompt…"
            rows={3}
            className="w-full resize-none bg-transparent px-2 py-1.5 text-sm text-base-100 placeholder:text-base-500 outline-none"
          />
          <button
            onClick={onRun}
            disabled={!prompt.trim()}
            aria-label={hasResult ? 'Run again' : 'Visualize'}
            title={hasResult ? 'Run again' : 'Visualize'}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:bg-base-700 disabled:text-base-500"
            style={{ backgroundColor: prompt.trim() ? selectedModel.accent : undefined }}
          >
            <ArrowIcon />
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="truncate rounded-lg px-2 py-1.5 text-left text-xs text-base-500 transition hover:bg-base-800 hover:text-base-300"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="px-0.5 text-xs font-medium uppercase tracking-wide text-base-500">
          Model
        </label>
        <div className="relative">
          <button
            onClick={() => setModelOpen((o: boolean) => !o)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-base-700 bg-base-900 px-3 py-2.5 text-left shadow-panel transition hover:border-base-600"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: selectedModel.accent }}
              />
              <span className="truncate text-sm font-medium text-base-100">{selectedModel.name}</span>
              <span className="hidden shrink-0 truncate text-xs text-base-500 sm:inline">
                · {selectedModel.org}
              </span>
            </span>
            <ChevronIcon open={modelOpen} />
          </button>

          {modelOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-base-700 bg-base-900 shadow-lg"
              >
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m);
                      setModelOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-base-800"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: m.accent }}
                    />
                    <span className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-base-100">{m.name}</div>
                      <div className="truncate text-xs text-base-500">{m.org}</div>
                    </span>
                    {m.id === selectedModel.id && <CheckIcon />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
        <p className="px-0.5 text-xs leading-relaxed text-base-500">{selectedModel.description}</p>
      </div>

      <p className="mt-auto px-0.5 text-[11px] leading-relaxed text-base-500">
        Runs entirely in your browser. No servers, no API calls.
      </p>
    </aside>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 13V3M8 3L4 7M8 3l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="shrink-0 text-base-500 transition-transform"
      style={{ transform: open ? 'rotate(180deg)' : 'none' }}
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-emerald-600">
      <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
