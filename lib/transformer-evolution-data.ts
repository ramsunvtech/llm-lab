// Historically-verified milestones in Transformer architecture evolution.
// Each stage genuinely reconfigures the diagram (which stacks exist, whether
// self-attention is masked, which activation/positional-encoding label shows)
// — this isn't just swapping caption text.

export type DiagramType = 'encoder-decoder' | 'decoder-only' | 'encoder-only';

export interface EvolutionStage {
  id: string;
  shortLabel: string;
  subtitle: string;
  title: string;
  architecture: string;
  activations: string;
  keyModels: string;
  diagramType: DiagramType;
  ffnLabel: string;
  peLabel: string;
  hasAnimatedWalkthrough: boolean;
}

export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    id: 'original-2017',
    shortLabel: '2017 — Original Transformer (Encoder + Decoder)',
    subtitle: '"Attention Is All You Need". Softmax attention + ReLU in FFN.',
    title: 'Original Transformer (Encoder-Decoder)',
    architecture: 'Full Encoder-Decoder framework.',
    activations: 'Softmax (in attention layers) and ReLU (in the FFNN).',
    keyModels: 'Vaswani et al. baseline model (built primarily for language translation).',
    diagramType: 'encoder-decoder',
    ffnLabel: 'ReLU',
    peLabel: 'Sinusoidal',
    hasAnimatedWalkthrough: true,
  },
  {
    id: 'gpt-2018',
    shortLabel: '2018 — GPT (Decoder-Only)',
    subtitle: '"Improving Language Understanding by Generative Pre-Training". Softmax attention + GELU in FFN.',
    title: 'GPT (Decoder-Only)',
    architecture:
      'Decoder-only — the encoder and cross-attention are dropped entirely; every layer is just masked self-attention + FFN.',
    activations: "Softmax (in attention layers) and GELU (in the FFNN) — GELU's smoother curve replaced ReLU.",
    keyModels: 'GPT-1/2/3, and the blueprint nearly every modern LLM (GPT-4+, Claude, Llama, Gemini) still follows.',
    diagramType: 'decoder-only',
    ffnLabel: 'GELU',
    peLabel: 'Learned',
    hasAnimatedWalkthrough: false,
  },
  {
    id: 'bert-2018',
    shortLabel: '2018 — BERT (Encoder-Only)',
    subtitle: '"BERT: Pre-training of Deep Bidirectional Transformers". Softmax attention + GELU in FFN, no causal mask.',
    title: 'BERT (Encoder-Only)',
    architecture:
      'Encoder-only — bidirectional self-attention (every token sees every other token, no masking), no decoder at all.',
    activations: 'Softmax (in attention layers) and GELU (in the FFNN).',
    keyModels: 'BERT, RoBERTa — built for understanding tasks (classification, search, embeddings), not text generation.',
    diagramType: 'encoder-only',
    ffnLabel: 'GELU',
    peLabel: 'Learned',
    hasAnimatedWalkthrough: false,
  },
  {
    id: 't5-2019',
    shortLabel: '2019 — T5 (Text-to-Text, Encoder-Decoder)',
    subtitle:
      '"Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer". Relative position biases, not sinusoidal PE.',
    title: 'T5 (Text-to-Text Transformer)',
    architecture:
      'Full Encoder-Decoder, like the original — but every task (translation, classification, summarization) is reframed as text-in, text-out.',
    activations: 'Softmax (in attention layers) and ReLU (in the FFNN; later variants used GEGLU).',
    keyModels: 'T5, Flan-T5.',
    diagramType: 'encoder-decoder',
    ffnLabel: 'ReLU',
    peLabel: 'Relative Position Bias',
    hasAnimatedWalkthrough: false,
  },
  {
    id: 'modern-2023',
    shortLabel: '2023+ — Modern Open-Weight Era (Decoder-Only)',
    subtitle: 'Llama, Mistral, DeepSeek, Qwen. RoPE + SwiGLU + RMSNorm + GQA/MLA.',
    title: 'Modern Optimized Decoder-Only',
    architecture: 'Same decoder-only backbone as GPT, with efficiency-focused component swaps throughout the stack.',
    activations:
      'Softmax attention (often GQA or MLA to shrink the KV cache) and SwiGLU — a gated FFN variant — in place of plain ReLU/GELU.',
    keyModels: 'Llama 2/3/4, Mistral, DeepSeek, Qwen, Gemma.',
    diagramType: 'decoder-only',
    ffnLabel: 'SwiGLU',
    peLabel: 'RoPE (Rotary)',
    hasAnimatedWalkthrough: false,
  },
];

export const DEFAULT_STAGE_ID = 'original-2017';