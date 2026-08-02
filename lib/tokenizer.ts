import { hashString } from './math';
import { Token } from './types';

const PALETTE = [
  '#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#4ade80',
  '#facc15', '#60a5fa', '#f87171', '#34d399', '#c084fc',
];

function makeToken(text: string): Token {
  const h = hashString(text.toLowerCase());
  return {
    id: h % 50000,
    text,
    color: PALETTE[h % PALETTE.length],
  };
}

// A simplified, educational stand-in for a real BPE/WordPiece tokenizer:
// words, numbers, and punctuation are split apart, and longer words are
// broken into smaller "subword" pieces (prefixed with ##) the way real
// tokenizers fragment uncommon words.
export function tokenize(input: string): Token[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const rough = trimmed.match(/[A-Za-z]+|[0-9]+|[^\sA-Za-z0-9]/g) || [];
  const tokens: Token[] = [];

  rough.forEach((word) => {
    if (/^[A-Za-z]+$/.test(word) && word.length > 6) {
      const chunks: string[] = [word.slice(0, 4)];
      let i = 4;
      while (i < word.length) {
        chunks.push('##' + word.slice(i, i + 3));
        i += 3;
      }
      chunks.forEach((c) => tokens.push(makeToken(c)));
    } else {
      tokens.push(makeToken(word));
    }
  });

  return tokens;
}
