// Historically-verified milestones in Transformer architecture evolution.
// Architecture / Activations / Key Models / Struggles text is the user's own
// (typo "Activities"->"Activations" fixed, one garbled sentence in the 2018
// entry clarified without changing its meaning). diagramType / ffnLabel /
// peLabel / attnLabel / moe are engineering fields added to make the diagram
// genuinely reconfigure per era, cross-checked against primary sources:
// Switch Transformer is confirmed built on T5's encoder-decoder (not
// decoder-only) with top-1 routing; SwiGLU traces to Shazeer's Feb 2020
// "GLU Variants Improve Transformer".

export type DiagramType = 'encoder-decoder' | 'decoder-only' | 'encoder-only';

export interface EvolutionStage {
  id: string;
  shortLabel: string;
  subtitle: string;
  title: string;
  architecture: string;
  activations: string;
  keyModels: string;
  struggles: string;
  task: string; // what a walkthrough for this era would demonstrate — data is ready, not yet wired into the UI (see note at bottom of file)
  diagramType: DiagramType;
  ffnLabel: string;
  peLabel: string;
  attnLabel?: string; // overrides the attention box's default label when set
  moe: boolean; // true = FFN box renders as a sparse MoE layer
  hasAnimatedWalkthrough: boolean;
}

export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    id: 'original-2017',
    shortLabel: '2017 — Original Transformer (Encoder-Decoder)',
    subtitle: '"Attention Is All You Need". Softmax attention + ReLU in FFN.',
    title: 'Original Transformer (Encoder-Decoder)',
    architecture: 'Full Encoder-Decoder framework.',
    activations: 'Softmax (in attention layers) and ReLU (in the FFNN).',
    keyModels: 'Vaswani et al. baseline model.',
    struggles: 'Slow sequential decoding and high computational cost for long sequences.',
    diagramType: 'encoder-decoder',
    ffnLabel: 'ReLU',
    peLabel: 'Sinusoidal',
    moe: false,
    task: 'Encoder reads a sentence; decoder answers what an ambiguous pronoun in it refers to, one word at a time.',
    hasAnimatedWalkthrough: true,
  },
  {
    id: 'bert-2018',
    shortLabel: '2018 — BERT (Encoder-Only)',
    subtitle: '"BERT: Pre-training of Deep Bidirectional Transformers". Bidirectional self-attention, no causal mask.',
    title: 'BERT (Encoder-Only)',
    architecture:
      'Encoder-only — drops the decoder and cross-attention entirely. Self-attention is bidirectional (no causal mask), so every token sees every other token, including ones after it.',
    activations: 'Softmax (in attention) and GELU (introduced to replace ReLU for smoother gradient flow).',
    keyModels: 'Google BERT, RoBERTa.',
    struggles: "Can't generate text autoregressively — no causal structure to predict a next token from; ReLU's dying-neuron problem motivated the GELU switch.",
    diagramType: 'encoder-only',
    ffnLabel: 'GELU',
    peLabel: 'Learned',
    moe: false,
    task: 'Given a sentence with a word masked out, use full bidirectional context to predict the missing word — not next-word generation.',
    hasAnimatedWalkthrough: false,
  },
  {
    id: 'gpt1-2018',
    shortLabel: '2018 — GPT-1 (Decoder-Only)',
    subtitle: '"Improving Language Understanding by Generative Pre-Training". Masked self-attention kept, encoder + cross-attention removed.',
    title: 'GPT-1 (Decoder-Only)',
    architecture:
      'Decoder-only — removes the encoder stack and cross-attention layers from the original Transformer while keeping masked self-attention, so the model can only look backward and generate one token at a time.',
    activations: 'Softmax (in attention) and GELU (introduced to replace ReLU for smoother gradient flow).',
    keyModels: 'OpenAI GPT-1.',
    struggles: "ReLU's dying-neuron problem motivated the GELU switch; trades away BERT's bidirectional understanding for generative speed.",
    diagramType: 'decoder-only',
    ffnLabel: 'GELU',
    peLabel: 'Learned',
    moe: false,
    task: 'Given a prompt, predict the next word one token at a time, autoregressively.',
    hasAnimatedWalkthrough: false,
  },
  {
    id: 'dense-scaling-2019-2020',
    shortLabel: '2019–2020 — Dense Scaling & MoE Foundations',
    subtitle: 'GPT-2/3 scale decoder-only; T5 scales encoder-decoder; GShard pioneers sparse MoE routing.',
    title: 'Dense Scaling & MoE Foundations',
    architecture:
      'Decoder-only dominates text generation (GPT-2, GPT-3); Encoder-Decoder scales up (T5); GShard introduces sparse MoE routing.',
    activations: 'GELU becomes standard over ReLU; SwiGLU proposed in a 2020 paper.',
    keyModels: 'OpenAI GPT-2 & GPT-3 (dense), Google T5 (dense encoder-decoder), Google GShard (MoE pioneer).',
    struggles: 'Massive compute/VRAM bottlenecks of dense scaling; early MoE routing instability.',
    diagramType: 'decoder-only',
    ffnLabel: 'GELU',
    peLabel: 'Learned',
    moe: false,
    task: 'Given a prompt, predict the next word one token at a time — the same autoregressive generation as GPT-1, now at much larger scale.',
    hasAnimatedWalkthrough: false,
  },
  {
    id: 'switch-2021',
    shortLabel: '2021 — Early Sparse MoE (Switch Transformer)',
    subtitle: 'Switch Transformer — first major large-scale MoE, built on T5, with top-1 expert routing.',
    title: 'Early Sparse MoE — Switch Transformer',
    architecture:
      'Sparse MoE scaling using top-1 routing, built on the T5 encoder-decoder — each token goes to one selected expert network instead of activating the full parameter count, replacing dense FFNs for scaling efficiency.',
    activations: 'Softmax (attention), GELU (FFN experts).',
    keyModels: 'Switch Transformer (1.6 trillion parameters), BASE-Layer.',
    struggles: 'Severe expert routing instability, load imbalance (some experts overloaded, others idle), and high fine-tuning difficulty.',
    diagramType: 'encoder-decoder',
    ffnLabel: 'GELU',
    peLabel: 'Relative Position Bias',
    moe: true,
    task: 'Encoder resolves the input while routing each token through one selected expert FFN; decoder generates output the same way, expert-routed.',
    hasAnimatedWalkthrough: false,
  },
  {
    id: 'rlhf-moe-2022-2023',
    shortLabel: '2022–2023 — RLHF & Open-Source MoE',
    subtitle: 'ChatGPT/Llama with RLHF alignment; Mixtral brings open-source top-2 MoE.',
    title: 'RLHF & Open-Source MoE',
    architecture: 'Decoder-only with RLHF alignment for instruction-following; emergence of top-2 gated open-source MoE.',
    activations: 'Softmax, SwiGLU / SiLU (officially replaced GELU in modern LLMs).',
    keyModels: 'ChatGPT (GPT-3.5/GPT-4), Llama 1 & 2 (dense), Mixtral 8x7B (sparse MoE).',
    struggles: 'Massive KV-cache memory overhead during high-concurrency inference and high deployment VRAM requirements.',
    diagramType: 'decoder-only',
    ffnLabel: 'SwiGLU / SiLU',
    peLabel: 'RoPE (Rotary)',
    moe: true,
    task: 'Given a prompt, predict the next word one token at a time, now guided by RLHF alignment and (for Mixtral) top-2 expert routing.',
    hasAnimatedWalkthrough: false,
  },
  {
    id: 'advanced-moe-2024-2026',
    shortLabel: '2024–2026 — Advanced Sparse MoE & Reasoning Era',
    subtitle: 'DeepSeek-V3/R1, Llama 4 MoE — fine-grained experts, MLA, native reasoning.',
    title: 'Advanced Sparse MoE & Reasoning Era',
    architecture:
      'Highly optimized sparse MoE with fine-grained experts, Multi-Head Latent Attention (MLA) for a light KV-cache footprint, and native chain-of-thought reasoning integration.',
    activations: 'Softmax, SwiGLU / SiLU (industry standard for modern LLMs).',
    keyModels: 'DeepSeek-V3/R1, Llama 4 MoE variants.',
    struggles: 'Inter-GPU/inter-node communication latency during expert routing (all-to-all bottleneck) and complex deployment orchestration.',
    diagramType: 'decoder-only',
    ffnLabel: 'SwiGLU / SiLU',
    peLabel: 'RoPE (Rotary)',
    attnLabel: 'Masked Multi-Head Latent Attention (MLA)',
    moe: true,
    task: 'Given a prompt, predict the next word one token at a time, using latent-compressed attention and fine-grained expert routing.',
    hasAnimatedWalkthrough: false,
  },
];

export const DEFAULT_STAGE_ID = 'original-2017';

// NOTE for the next iteration: `task` is populated for every stage above,
// but page.tsx currently only renders the Task / sample-prompt / step-list /
// player block when `hasAnimatedWalkthrough` is true (2017 only). Wiring
// `task` in for every era means either (a) generalizing that block to show
// `stage.task` as static text with player controls disabled for eras without
// a hand-verified worked example, or (b) building real per-diagramType step
// lists so the walkthrough is actually accurate for encoder-only/decoder-only
// architectures too, not just relabeled. (b) is the honest fix; (a) is the
// fast one. Needs a page.tsx change either way — not resolvable from this
// file alone.