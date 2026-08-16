export interface Token {
  id: number;
  text: string;
  color: string;
}

export interface ModelPreset {
  id: string;
  name: string;
  org: string;
  accent: string;
  accentSoft: string;
  dModel: number;
  numLayers: number;
  numHeads: number;
  vocabLabel: string;
  contextLabel: string;
  description: string;
  moe?: { numExperts: number; topK: number };
}

export interface ExpertInfo {
  scores: number[];
  chosen: number[];
}

export interface LayerTrace {
  headAttentions: number[][][]; // [head][queryPos][keyPos]
  expertInfo?: ExpertInfo;
}

export interface LogitItem {
  word: string;
  value: number;
}

export interface PipelineResult {
  tokens: Token[];
  embeddings: number[][];
  posEncoded: number[][];
  layers: LayerTrace[];
  finalHidden: number[];
  logits: LogitItem[];
  probs: LogitItem[];
  nextToken: string;
}

export interface GeneratedStep {
  word: string;
  probs: LogitItem[];
}

export interface StageMeta {
  key: string;
  title: string;
  subtitle: string;
}

export interface AttentionEntry {
  id: string;
  name: string;
  abbreviation: string | null;
  year: number;
  introducedBy: string;
  introducedFor: string;
  paperTitle: string;
  paperUrl: string;
  status: 'Active' | 'Inactive';
  category: string;
  complexity: string;
  summary: string;
  keyIdea: string;
  usedIn: string[];
}