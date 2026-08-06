'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Token } from '@/lib/types';
import StageHeading from './StageHeading';

export default function TokenizerStage({ tokens }: { tokens: Token[] }) {
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full max-w-3xl mx-auto">
      <StageHeading
        title="Tokenizer"
        description="The model cannot read letters directly. The text is split into subword chunks (tokens) and mapped to integer IDs from a fixed vocabulary."
      />

      {/* View Switcher Controls */}
      <div className="flex items-center gap-1 p-1 bg-base-900/50 rounded-lg border border-base-800 text-xs font-mono">
        <button
          onClick={() => setViewMode('visual')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            viewMode === 'visual'
              ? 'bg-base-700 text-white shadow-sm'
              : 'text-base-400 hover:text-base-200'
          }`}
        >
          Visual Badges
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            viewMode === 'table'
              ? 'bg-base-700 text-white shadow-sm'
              : 'text-base-400 hover:text-base-200'
          }`}
        >
          Paired ID Table
        </button>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'visual' ? (
          /* Visual Badge Grid */
          <motion.div
            key="visual-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center justify-center gap-3 w-full min-h-[120px]"
          >
            {tokens.map((t, i) => (
              <motion.div
                key={`${t.id}-${i}`}
                initial={{ opacity: 0, y: 16, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 18 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="rounded-xl border px-3.5 py-2 font-mono text-sm font-medium shadow-lg transition-transform hover:scale-105"
                  style={{
                    borderColor: `${t.color}55`,
                    backgroundColor: `${t.color}1a`,
                    color: t.color,
                    boxShadow: `0 8px 24px -12px ${t.color}88`,
                  }}
                >
                  {/* Escape whitespace for visibility */}
                  {t.text.replace(/ /g, '␣')}
                </div>
                <span className="font-mono text-[11px] text-base-400 font-semibold">
                  #{t.id}
                </span>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* Token ID Mapping Table */
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full overflow-hidden rounded-xl border border-base-800 bg-base-900/40 shadow-xl"
          >
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-base-800 bg-base-950/60 text-base-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 w-16">Seq #</th>
                  <th className="py-2.5 px-4">Token Piece (Subword)</th>
                  <th className="py-2.5 px-4 text-right">Vocab Token ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-800/60 text-base-200">
                {tokens.map((t, i) => (
                  <tr key={`${t.id}-${i}`} className="hover:bg-base-800/30 transition-colors">
                    <td className="py-2 px-4 text-base-500 font-mono">{i}</td>
                    <td className="py-2 px-4 flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span
                        className="px-2 py-0.5 rounded border text-sm"
                        style={{
                          borderColor: `${t.color}44`,
                          backgroundColor: `${t.color}15`,
                          color: t.color,
                        }}
                      >
                        {JSON.stringify(t.text)}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-emerald-400">
                      {t.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-xs text-base-400 max-w-lg"
      >
        <strong className="text-base-200">{tokens.length} tokens generated.</strong> Real LLMs use algorithms like <code className="text-emerald-400 font-mono">BPE</code> or <code className="text-emerald-400 font-mono">WordPiece</code> to balance subword frequency and context window size.
      </motion.p>
    </div>
  );
}