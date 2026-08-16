'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import attentionsData from '@/data/attentions.json';
import { AttentionEntry } from '@/lib/types';
import type { ChangeEvent, MouseEvent } from 'react';

// JSON import is inferred with plain `string` fields (e.g. status), which is
// wider than our literal union type — go through `unknown` for a safe cast.
const DATA = attentionsData as unknown as AttentionEntry[];

type SortKey = 'year' | 'name' | 'status' | 'category';

export default function AttentionsPage() {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = DATA;

    if (q) {
      rows = rows.filter((e) =>
        [
          e.name,
          e.abbreviation ?? '',
          e.summary,
          e.introducedBy,
          e.category,
          e.introducedFor,
        ]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }

    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;

      if (sortKey === 'year') {
        cmp = a.year - b.year;
      } else if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortKey === 'category') {
        cmp = a.category.localeCompare(b.category);
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d: 'asc' | 'desc') =>
        d === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <main className="min-h-screen bg-base-950">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-base-400 transition hover:text-base-100"
          >
            <ArrowLeftIcon />
            Back to visualizer
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-base-200 text-xs font-bold text-base-950">
              L
            </div>
            <span className="text-sm font-semibold text-base-100">
              LLM Lab
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-base-100 sm:text-3xl">
            Attention Bible
          </h1>

          <p className="max-w-2xl text-sm text-base-400 sm:text-base">
            Every major attention mechanism in Transformer history, from
            2014&apos;s original alignment models to 2026&apos;s
            hardware-co-designed kernels — searchable and sortable.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base-500" />

            <input
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setQuery(e.target.value)
              }
              placeholder="Search attention mechanisms…"
              className="w-full rounded-xl border border-base-700 bg-base-900 py-2.5 pl-9 pr-3 text-sm text-base-100 shadow-panel outline-none placeholder:text-base-500 focus:border-base-500"
            />
          </div>

          <span className="text-xs text-base-500">
            {filtered.length} of {DATA.length} mechanisms
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl glass-panel shadow-panel">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-base-700 text-xs uppercase tracking-wide text-base-500">
                <SortableHeader
                  label="Year"
                  active={sortKey === 'year'}
                  dir={sortDir}
                  onClick={() => toggleSort('year')}
                />

                <SortableHeader
                  label="Name"
                  active={sortKey === 'name'}
                  dir={sortDir}
                  onClick={() => toggleSort('name')}
                />

                <SortableHeader
                  label="Category"
                  active={sortKey === 'category'}
                  dir={sortDir}
                  onClick={() => toggleSort('category')}
                  className="hidden sm:table-cell"
                />

                <SortableHeader
                  label="Status"
                  active={sortKey === 'status'}
                  dir={sortDir}
                  onClick={() => toggleSort('status')}
                />

                <th className="px-4 py-3 font-medium">
                  Introduced for
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((entry: AttentionEntry, i: number) => (
                <AttentionRow
                  key={entry.id}
                  entry={entry}
                  index={i}
                  expanded={expandedId === entry.id}
                  onToggle={() =>
                    setExpandedId((cur: string | null) =>
                      cur === entry.id ? null : entry.id
                    )
                  }
                />
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-base-500"
                  >
                    No attention mechanisms match &ldquo;{query}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-base-500">
          Click any row for the paper, key idea, and where it&apos;s used.
          Data lives in a single JSON file — adding a new mechanism is a new
          entry, no code changes.
        </p>
      </div>
    </main>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={`px-4 py-3 font-medium ${className ?? ''}`}>
      <button
        onClick={onClick}
        className="flex items-center gap-1 transition hover:text-base-200"
      >
        {label}

        <span
          className={`text-[10px] transition ${
            active ? 'opacity-100' : 'opacity-30'
          }`}
        >
          {active && dir === 'desc' ? '▼' : '▲'}
        </span>
      </button>
    </th>
  );
}

function AttentionRow({
  entry,
  index,
  expanded,
  onToggle,
}: {
  entry: AttentionEntry;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: Math.min(index * 0.02, 0.4) }}
        onClick={onToggle}
        className={`cursor-pointer border-b border-base-700/60 transition hover:bg-base-800/60 ${
          expanded ? 'bg-base-800/40' : ''
        }`}
      >
        <td className="px-4 py-3 font-tabular text-base-400">
          {entry.year}
        </td>

        <td className="px-4 py-3">
          <div className="font-medium text-base-100">
            {entry.name}
          </div>

          {entry.abbreviation && (
            <div className="text-xs text-base-500">
              {entry.abbreviation}
            </div>
          )}
        </td>

        <td className="hidden px-4 py-3 text-base-400 sm:table-cell">
          {entry.category}
        </td>

        <td className="px-4 py-3">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor:
                entry.status === 'Active'
                  ? '#16a34a1a'
                  : '#6B675922',
              color:
                entry.status === 'Active'
                  ? '#16a34a'
                  : '#6B6759',
            }}
          >
            {entry.status}
          </span>
        </td>

        <td className="px-4 py-3 text-base-400">
          {entry.introducedFor}
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td
              colSpan={5}
              className="border-b border-base-700/60 bg-base-850/50 px-4 py-4"
            >
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-3 pb-1 text-sm">
                  <p className="text-base-300">
                    {entry.summary}
                  </p>

                  <p className="text-base-400">
                    <span className="font-medium text-base-300">
                      Key idea:{' '}
                    </span>
                    {entry.keyIdea}
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-base-500">
                    <span>
                      <span className="text-base-400">
                        Introduced by:
                      </span>{' '}
                      {entry.introducedBy}
                    </span>

                    <span>
                      <span className="text-base-400">
                        Complexity:
                      </span>{' '}
                      {entry.complexity}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {entry.usedIn.map((u) => (
                      <span
                        key={u}
                        className="rounded-full border border-base-700 bg-base-900 px-2 py-0.5 text-[11px] text-base-400"
                      >
                        {u}
                      </span>
                    ))}
                  </div>

                  <a
                    href={entry.paperUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: MouseEvent) =>
                      e.stopPropagation()
                    }
                    className="w-fit text-xs font-medium text-blue-600 underline-offset-2 hover:underline"
                  >
                    {entry.paperTitle} ↗
                  </a>
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M10 3L5 8l5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
    >
      <circle cx="7" cy="7" r="4.5" />
      <path
        d="M13.5 13.5L10.8 10.8"
        strokeLinecap="round"
      />
    </svg>
  );
}