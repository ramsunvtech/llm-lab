'use client';

import { motion } from 'framer-motion';
import { Token, ModelPreset } from '@/lib/types';
import { positionalEncoding } from '@/lib/engine';
import StageHeading from './StageHeading';

export default function PositionStage({ tokens, model }: { tokens: Token[]; model: ModelPreset }) {
  const dModel = model.dModel;
  const width = 640;
  const height = 90;
  const n = tokens.length || 1;

  const wavePath = (dimIndex: number) => {
    const pts: string[] = [];
    const steps = 120;
    for (let s = 0; s <= steps; s++) {
      const pos = (s / steps) * (n - 1 || 1);
      const pe = positionalEncoding(pos, dModel);
      const val = pe[dimIndex] ?? 0;
      const x = (s / steps) * width;
      const y = height / 2 - val * (height / 2 - 6);
      pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      <StageHeading
        title="Positional Encoding"
        description="Attention alone can't tell word order. So a wave-shaped pattern — unique to each position — is added to every embedding, telling the model 'this token comes 1st, this one comes 2nd', etc."
      />

      <div className="w-full max-w-2xl overflow-x-auto rounded-2xl border border-black/[0.06] bg-black/[0.015] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 480 }}>
          {[0, 1, 2, 3].map((d) => (
            <motion.path
              key={d}
              d={wavePath(d)}
              fill="none"
              stroke={model.accent}
              strokeWidth={1.4}
              strokeOpacity={0.85 - d * 0.16}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 - d * 0.16 }}
              transition={{ duration: 1.1, delay: d * 0.15, ease: 'easeInOut' }}
            />
          ))}
          {tokens.map((t, i) => {
            const x = n > 1 ? (i / (n - 1)) * width : width / 2;
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={height / 2}
                r={3.5}
                fill={t.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 + i * 0.05 }}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {tokens.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 + i * 0.05 }}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-black/[0.02] px-2.5 py-1 text-[11px]"
          >
            <span className="font-mono" style={{ color: t.color }}>{t.text}</span>
            <span className="text-base-500">pos {i}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
