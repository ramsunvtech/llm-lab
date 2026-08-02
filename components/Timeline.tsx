'use client';

import { motion } from 'framer-motion';
import { StageMeta, ModelPreset } from '@/lib/types';

export default function Timeline({
  stages,
  activeIndex,
  onSelect,
  model,
}: {
  stages: StageMeta[];
  activeIndex: number;
  onSelect: (i: number) => void;
  model: ModelPreset;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium uppercase tracking-wide text-base-400">
          {stages[activeIndex]?.title}
        </span>
        <span className="text-xs text-base-500">
          Step {activeIndex + 1} / {stages.length}
        </span>
      </div>

      <div className="relative flex items-center gap-1 overflow-x-auto pb-1">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        {stages.map((s, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <button
              key={s.key}
              onClick={() => onSelect(i)}
              className="group relative z-10 flex shrink-0 flex-col items-center gap-1.5 px-2.5 py-1"
              title={s.subtitle}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.25 : 1,
                  backgroundColor: isActive ? model.accent : isPast ? '#4a5262' : '#232833',
                }}
                transition={{ duration: 0.25 }}
                className="h-2.5 w-2.5 rounded-full ring-4 ring-base-900"
              />
              <span
                className={`whitespace-nowrap text-[10px] transition sm:text-[11px] ${
                  isActive ? 'font-semibold text-base-100' : 'text-base-500 group-hover:text-base-300'
                }`}
              >
                {s.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
