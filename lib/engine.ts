import { Token, ModelPreset, PipelineResult, LayerTrace, LogitItem } from './types';
import {
  seededVector, seededMatrix, matVec, addVec, softmax, layerNorm, gelu, hashString, dot,
} from './math';

// Fixed candidate vocabulary projected by the output head.
export const CANDIDATE_VOCAB = [
  'the', 'a', 'is', 'are', 'of', 'to', 'and', 'in', 'it', 'that',
  'model', 'learns', 'patterns', 'language', 'data', 'word', 'token', 'answer',
  'because', 'system', 'network', 'neural', 'predicts', 'next', 'meaning', 'context',
  'learning', 'deep', 'vector', 'space', 'attention', 'layer', 'output', 'input',
  'training', 'human', 'like', 'thinks', 'process', 'information', 'text', 'sentence',
  'world', 'number', 'future', 'idea', 'simple', 'complex', 'result',
];

// --- 1. TOKEN EMBEDDING LOOKUP ---
export function embed(token: Token, dModel: number): number[] {
  // Deterministic vector lookup table simulation
  return seededVector(token.id * 7919 + 13, dModel);
}

// --- 2. POSITIONAL ENCODINGS ---

// Classic Sinusoidal Positional Encoding (Vaswani et al. - Additive)
export function positionalEncoding(pos: number, dModel: number): number[] {
  const pe: number[] = [];
  for (let i = 0; i < dModel; i++) {
    const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
    pe.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
  }
  return pe;
}

// Rotary Position Embedding (RoPE - Applied dynamically to Q/K in modern LLMs)
export function applyRoPE(vec: number[], pos: number): number[] {
  const rotated = new Array(vec.length);
  for (let i = 0; i < vec.length; i += 2) {
    const freq = 1.0 / Math.pow(10000, i / vec.length);
    const theta = pos * freq;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    const x0 = vec[i];
    const x1 = vec[i + 1] ?? 0;

    // 2D Rotation matrix transformation
    rotated[i] = x0 * cos - x1 * sin;
    rotated[i + 1] = x0 * sin + x1 * cos;
  }
  return rotated;
}

// --- 3. CAUSAL MULTI-HEAD SELF-ATTENTION ---
function selfAttentionLayer(x: number[][], dModel: number, numHeads: number, layerSeed: number) {
  const headDim = Math.max(1, Math.floor(dModel / numHeads));
  const heads: number[][][] = [];
  const headOutputs: number[][][] = [];

  for (let h = 0; h < numHeads; h++) {
    const seed = layerSeed + h * 101;
    const Wq = seededMatrix(seed + 1, headDim, dModel);
    const Wk = seededMatrix(seed + 2, headDim, dModel);
    const Wv = seededMatrix(seed + 3, headDim, dModel);

    // Project input to Query, Key, and Value spaces
    const Q_raw = x.map((v) => matVec(Wq, v));
    const K_raw = x.map((v) => matVec(Wk, v));
    const V = x.map((v) => matVec(Wv, v));

    // Apply Rotary Position Embeddings (RoPE) to Query and Key
    const Q = Q_raw.map((q, pos) => applyRoPE(q, pos));
    const K = K_raw.map((k, pos) => applyRoPE(k, pos));

    // Calculate Causal Scaled Dot-Product Attention Scores
    const scores: number[][] = Q.map((q, i) => {
      const raw = K.map((k, j) => {
        // Causal Masking: Token 'i' cannot look into future token 'j' (j > i)
        if (j > i) return -Infinity;
        return dot(q, k) / Math.sqrt(headDim);
      });
      return softmax(raw);
    });

    // Compute weighted sum of Value vectors
    const out = scores.map((weightRow) => {
      const acc = new Array(headDim).fill(0);
      weightRow.forEach((w, j) => {
        if (w > 0) {
          V[j].forEach((val, d) => (acc[d] += w * val));
        }
      });
      return acc;
    });

    heads.push(scores);
    headOutputs.push(out);
  }

  // Concatenate Multi-Head Attention outputs across heads
  const seq = x.length;
  const concat: number[][] = [];
  for (let s = 0; s < seq; s++) {
    let row: number[] = [];
    headOutputs.forEach((ho) => {
      row = row.concat(ho[s]);
    });
    concat.push(row);
  }

  // Final Output Projection Projection (Wo)
  const Wo = seededMatrix(layerSeed + 999, dModel, headDim * numHeads);
  const proj = concat.map((v) => matVec(Wo, v));
  return { proj, heads };
}

// --- 4. FEED-FORWARD NETWORK (FFN) / MLP ---
function ffn(x: number[][], dModel: number, layerSeed: number) {
  const hidden = dModel * 4;
  const W1 = seededMatrix(layerSeed + 5001, hidden, dModel);
  const W2 = seededMatrix(layerSeed + 5002, dModel, hidden);
  return x.map((v) => {
    const h1 = matVec(W1, v).map(gelu);
    return matVec(W2, h1);
  });
}

// --- 5. TRANSFORMER FORWARD PASS (PRE-LAYERNORM) ---
export function runForward(tokens: Token[], model: ModelPreset) {
  const dModel = model.dModel;
  
  // Step A: Token Embeddings
  const embeddings = tokens.map((t) => embed(t, dModel));
  
  // Step B: Calculate optional additive PE trace for UI visualizer
  const posEncoded = embeddings.map((e, i) => addVec(e, positionalEncoding(i, dModel)));

  let x = embeddings;
  const layers: LayerTrace[] = [];

  // Step C: Pass through N Transformer Block Layers
  for (let l = 0; l < model.numLayers; l++) {
    const layerSeed = hashString(model.id) + l * 7777;

    // 1. Multi-Head Self Attention with Pre-LayerNorm & Residual Connection
    const normX1 = x.map((v) => layerNorm(v));
    const { proj, heads } = selfAttentionLayer(normX1, dModel, model.numHeads, layerSeed);
    const attnOut = x.map((v, i) => addVec(v, proj[i])); // Residual

    // 2. Feed-Forward Network with Pre-LayerNorm & Residual Connection
    const normX2 = attnOut.map((v) => layerNorm(v));
    const ffnOut = ffn(normX2, dModel, layerSeed + 3000);
    const layerOut = attnOut.map((v, i) => addVec(v, ffnOut[i])); // Residual

    const trace: LayerTrace = { headAttentions: heads };

    // Mixture of Experts (MoE) routing trace if active
    if (model.moe) {
      const gateSeed = layerSeed + 8000;
      const Wgate = seededMatrix(gateSeed, model.moe.numExperts, dModel);
      const gateScores = softmax(matVec(Wgate, layerNorm(x[x.length - 1])));
      const ranked = gateScores
        .map((v, i) => ({ expert: i, score: v }))
        .sort((a, b) => b.score - a.score)
        .slice(0, model.moe.topK);
      trace.expertInfo = { scores: gateScores, chosen: ranked.map((r) => r.expert) };
    }

    layers.push(trace);
    x = layerOut;
  }

  // --- 6. OUTPUT HEAD & LOGITS ---
  const finalHidden = layerNorm(x[x.length - 1]); // Final LayerNorm on last token
  const outSeed = hashString(model.id) + 999999;
  const Wout = seededMatrix(outSeed, CANDIDATE_VOCAB.length, dModel);
  const rawLogits = matVec(Wout, finalHidden);
  const logits: LogitItem[] = CANDIDATE_VOCAB.map((w, i) => ({ word: w, value: rawLogits[i] }));

  return { embeddings, posEncoded, layers, finalHidden, logits };
}

// --- 7. SAMPLING & PROBABILITIES ---
export function computeProbs(logits: LogitItem[], temperature = 0.8): LogitItem[] {
  const probsArr = softmax(logits.map((l) => l.value), temperature);
  return logits
    .map((l, i) => ({ word: l.word, value: probsArr[i] }))
    .sort((a, b) => b.value - a.value);
}

export function sampleNext(probs: LogitItem[]): string {
  const top = probs.slice(0, 5);
  const total = top.reduce((s, p) => s + p.value, 0) || 1;
  let r = Math.random() * total;
  for (const p of top) {
    r -= p.value;
    if (r <= 0) return p.word;
  }
  return top[0]?.word ?? CANDIDATE_VOCAB[0];
}

// --- 8. PIPELINE RUNNER ---
export function runPipeline(
  prompt: string,
  model: ModelPreset,
  tokenizeFn: (s: string) => Token[]
): PipelineResult {
  const tokens = tokenizeFn(prompt);
  const { embeddings, posEncoded, layers, finalHidden, logits } = runForward(tokens, model);
  const sortedLogits = [...logits].sort((a, b) => b.value - a.value).slice(0, 12);
  const probs = computeProbs(logits, 0.8).slice(0, 12);
  const nextToken = sampleNext(probs);

  return {
    tokens, embeddings, posEncoded, layers, finalHidden,
    logits: sortedLogits, probs, nextToken,
  };
}

// --- 9. DECODER AUTOREGRESSIVE GENERATION LOOP ---
export function generateSequence(
  prompt: string,
  model: ModelPreset,
  tokenizeFn: (s: string) => Token[],
  steps = 8
) {
  let tokens = tokenizeFn(prompt);
  const generated: { word: string; probs: LogitItem[] }[] = [];

  for (let i = 0; i < steps; i++) {
    const { logits } = runForward(tokens, model);
    const probs = computeProbs(logits, 0.8);
    const next = sampleNext(probs);
    generated.push({ word: next, probs: probs.slice(0, 6) });
    tokens = [...tokens, { id: hashString(next + i) % 50000, text: next, color: '#94a3b8' }];
    if (tokens.length > 28) break;
  }

  return generated;
}