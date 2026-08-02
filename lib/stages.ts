import { StageMeta } from './types';

export const STAGES: StageMeta[] = [
  { key: 'input', title: 'Input Prompt', subtitle: 'The raw text a user types in' },
  { key: 'tokenizer', title: 'Tokenizer', subtitle: 'Splitting text into tokens' },
  { key: 'embedding', title: 'Embedding', subtitle: 'Tokens become vectors in space' },
  { key: 'position', title: 'Positional Encoding', subtitle: 'Injecting word order' },
  { key: 'attention', title: 'Self-Attention', subtitle: 'Tokens look at each other' },
  { key: 'transformer', title: 'Transformer Layers', subtitle: 'Deep contextual processing' },
  { key: 'logits', title: 'Output Logits', subtitle: 'Scoring every candidate next word' },
  { key: 'softmax', title: 'Softmax', subtitle: 'Turning scores into probabilities' },
  { key: 'decoder', title: 'Decoder & Sampling', subtitle: 'Picking tokens, one at a time' },
];
