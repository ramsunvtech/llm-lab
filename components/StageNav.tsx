'use client';

import { motion } from 'framer-motion';
import { StageMeta, ModelPreset } from '@/lib/types';
import Controls from './Controls';

export default function StageNav({
  stages,
  activeIndex,
  onSelect,
  model,
  isPlaying,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onRestart,
}: {
  stages: StageMeta[];
  activeIndex: number;
  onSelect: (i: number) => void;
  model: ModelPreset;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-4 border-b border-base-700 bg-base-850/70 p-4 md:h-full md:w-[248px] md:overflow-y-auto md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium uppercase tracking-wide text-base-500">Pipeline</span>
        <span className="font-tabular text-xs text-base-500">
          {activeIndex + 1}/{stages.length}
        </span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {stages.map((s, i) => {
          const active = i === activeIndex;
          const done = i < activeIndex;
          return (
            <button
              key={s.key}
              onClick={() => onSelect(i)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition"
              style={{ backgroundColor: active ? `${model.accent}17` : 'transparent' }}
            >
              <motion.span
                animate={{
                  backgroundColor: active ? model.accent : done ? `${model.accent}2a` : 'transparent',
                  color: active ? '#FFFFFF' : done ? model.accent : '#8B8576',
                }}
                transition={{ duration: 0.2 }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-base-700 text-[10px] font-semibold"
                style={{ borderColor: active || done ? 'transparent' : undefined }}
              >
                {done ? '✓' : i + 1}
              </motion.span>
              <span
                className={`truncate text-[13px] ${
                  active ? 'font-semibold text-base-100' : done ? 'text-base-300' : 'text-base-500'
                }`}
              >
                {s.title}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-base-700 pt-3">
        <Controls
          isPlaying={isPlaying}
          onTogglePlay={onTogglePlay}
          onStepBack={onStepBack}
          onStepForward={onStepForward}
          onRestart={onRestart}
          canStepBack={activeIndex > 0}
          canStepForward={activeIndex < stages.length - 1}
          accent={model.accent}
        />
      </div>
    </div>
  );
}
