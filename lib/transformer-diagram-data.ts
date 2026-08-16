import { softmax } from './math';

// Hand-crafted, pedagogically-accurate data for the single most famous
// worked example in Transformer teaching: Vaswani et al.'s own Figure 3
// ("Transformer: A Novel Neural Network Architecture for Language
// Understanding"), popularized further by Jay Alammar's "The Illustrated
// Transformer". A random-weight simulation (like the rest of this app)
// cannot know that "tired" points back to "animal" — that's *learned*
// semantic knowledge, not mechanics — so this page hardcodes the attention
// pattern deliberately, matching how it's actually documented: one head
// resolves the coreference (it -> animal/street), a second head binds the
// adjective (it -> tired/wide). Everything else on this page (positional
// encoding, softmax, the causal mask shape) is real computed math.

export type Variant = 'tired' | 'wide';

export interface TransformerExample {
  sentence: string;
  encoderTokens: string[]; // 11 tokens, word-level (not subword) for pedagogical clarity
  decoderTargetTokens: string[]; // the generated answer, e.g. ["The", "animal"]
  itIndex: number; // position of "it"
  focusIndex: number; // position of the correct referent ("animal" or "street")
  focusWord: string;
  adjectiveWord: string;
  // Two encoder self-attention heads, both queried from "it", 11 weights each (sum to 1)
  encoderAttentionHeadCoref: number[];
  encoderAttentionHeadProperty: number[];
  // Decoder cross-attention when generating the 2nd output token: 11 weights
  // over the *encoder's* output positions (sum to 1)
  decoderCrossAttention: number[];
  // Candidate output vocabulary + raw logits for the final Linear layer.
  // Real softmax() is applied to these at render time — only the logits
  // themselves are hardcoded, matching the real, learned model behavior
  // this is meant to illustrate.
  candidateVocab: string[];
  candidateLogits: number[];
}

export const EXAMPLES: Record<Variant, TransformerExample> = {
  tired: {
    sentence: "The animal didn't cross the street because it was too tired.",
    encoderTokens: ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'],
    decoderTargetTokens: ['The', 'animal'],
    itIndex: 7,
    focusIndex: 1,
    focusWord: 'animal',
    adjectiveWord: 'tired',
    encoderAttentionHeadCoref: [0.08, 0.52, 0.02, 0.03, 0.03, 0.05, 0.03, 0.10, 0.05, 0.02, 0.07],
    encoderAttentionHeadProperty: [0.03, 0.22, 0.02, 0.02, 0.02, 0.03, 0.05, 0.08, 0.08, 0.05, 0.40],
    decoderCrossAttention: [0.02, 0.30, 0.02, 0.02, 0.02, 0.03, 0.02, 0.45, 0.03, 0.02, 0.07],
    candidateVocab: ['animal', 'street', 'the', 'dog', 'road', 'tired', 'wide', 'house', 'car', 'tree'],
    candidateLogits: [4.8, 1.2, 2.1, 1.8, 0.9, 1.5, 0.3, 0.5, 0.7, 0.4],
  },
  wide: {
    sentence: "The animal didn't cross the street because it was too wide.",
    encoderTokens: ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'wide'],
    decoderTargetTokens: ['The', 'street'],
    itIndex: 7,
    focusIndex: 5,
    focusWord: 'street',
    adjectiveWord: 'wide',
    encoderAttentionHeadCoref: [0.03, 0.05, 0.02, 0.03, 0.08, 0.52, 0.03, 0.10, 0.05, 0.02, 0.07],
    encoderAttentionHeadProperty: [0.03, 0.03, 0.02, 0.02, 0.03, 0.20, 0.05, 0.08, 0.09, 0.05, 0.40],
    decoderCrossAttention: [0.02, 0.03, 0.02, 0.02, 0.02, 0.30, 0.02, 0.45, 0.03, 0.02, 0.07],
    candidateVocab: ['animal', 'street', 'the', 'dog', 'road', 'tired', 'wide', 'house', 'car', 'tree'],
    candidateLogits: [1.2, 4.8, 2.1, 1.0, 2.5, 0.3, 1.5, 0.5, 0.7, 0.4],
  },
};

// For every encoder query token OTHER than "it" (which is hand-crafted above),
// generate a plausible, clearly-illustrative local-attention pattern: mostly
// self + nearby words, real softmax over negative distance. This is not
// claimed to be "correct" the way the "it" row is — it's there so the full
// 11x11 matrix looks like a real attention matrix rather than one lit-up row
// surrounded by blanks.
export function localAttentionRow(queryIdx: number, n: number): number[] {
  const scores = Array.from({ length: n }, (_, j) => {
    const dist = Math.abs(j - queryIdx);
    return (j === queryIdx ? 2.2 : 0) - dist * 0.4;
  });
  return softmax(scores, 1);
}