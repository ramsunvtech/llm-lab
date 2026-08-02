import { Token, ModelPreset, PipelineResult, LayerTrace, LogitItem } from './types';
import {
  seededVector, seededMatrix, matVec, addVec, softmax, layerNorm, gelu, hashString, dot,
} from './math';

// A small, fixed candidate vocabulary the "output head" projects onto.
// Real models score against 100K+ tokens — we shrink this so the bars
// stay legible, and say so in the UI.
export const CANDIDATE_VOCAB = [
  'the', 'a', 'is', 'are', 'of', 'to', 'and', 'in', 'it', 'that',
  'model', 'learns', 'patterns', 'language', 'data', 'word', 'token', 'answer',
  'because', 'system', 'network', 'neural', 'predicts', 'next', 'meaning', 'context',
  'learning', 'deep', 'vector', 'space', 'attention', 'layer', 'output', 'input',
  'training', 'human', 'like', 'thinks', 'process', 'information', 'text', 'sentence',
  'world', 'number', 'future', 'idea', 'simple', 'complex', 'result',
];

export function embed(token: Token, dModel: number): number[] {
  // Same token id -> same vector, every time. This simulates a fixed
  // embedding lookup table.
  return seededVector(token.id * 7919 + 13, dModel);
}

export function positionalEncoding(pos: number, dModel: number): number[] {
  const pe: number[] = [];
  for (let i = 0; i < dModel; i++) {
    const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
    pe.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
  }
  return pe;
}

function selfAttentionLayer(x: number[][], dModel: number, numHeads: number, layerSeed: number) {
  const headDim = Math.max(1, Math.floor(dModel / numHeads));
  const heads: number[][][] = [];
  const headOutputs: number[][][] = [];

  for (let h = 0; h < numHeads; h++) {
    const seed = layerSeed + h * 101;
    const Wq = seededMatrix(seed + 1, headDim, dModel);
    const Wk = seededMatrix(seed + 2, headDim, dModel);
    const Wv = seededMatrix(seed + 3, headDim, dModel);

    const Q = x.map((v) => matVec(Wq, v));
    const K = x.map((v) => matVec(Wk, v));
    const V = x.map((v) => matVec(Wv, v));

    const scores: number[][] = Q.map((q) => {
      const raw = K.map((k) => dot(q, k) / Math.sqrt(headDim));
      return softmax(raw);
    });

    const out = scores.map((weightRow) => {
      const acc = new Array(headDim).fill(0);
      weightRow.forEach((w, j) => {
        V[j].forEach((val, d) => (acc[d] += w * val));
      });
      return acc;
    });

    heads.push(scores);
    headOutputs.push(out);
  }

  const seq = x.length;
  const concat: number[][] = [];
  for (let s = 0; s < seq; s++) {
    let row: number[] = [];
    headOutputs.forEach((ho) => {
      row = row.concat(ho[s]);
    });
    concat.push(row);
  }

  const Wo = seededMatrix(layerSeed + 999, dModel, headDim * numHeads);
  const proj = concat.map((v) => matVec(Wo, v));
  return { proj, heads };
}

function ffn(x: number[][], dModel: number, layerSeed: number) {
  const hidden = dModel * 4;
  const W1 = seededMatrix(layerSeed + 5001, hidden, dModel);
  const W2 = seededMatrix(layerSeed + 5002, dModel, hidden);
  return x.map((v) => {
    const h1 = matVec(W1, v).map(gelu);
    return matVec(W2, h1);
  });
}

export function runForward(tokens: Token[], model: ModelPreset) {
  const dModel = model.dModel;
  const embeddings = tokens.map((t) => embed(t, dModel));
  const posEncoded = embeddings.map((e, i) => addVec(e, positionalEncoding(i, dModel)));

  let x = posEncoded;
  const layers: LayerTrace[] = [];

  for (let l = 0; l < model.numLayers; l++) {
    const layerSeed = hashString(model.id) + l * 7777;
    const { proj, heads } = selfAttentionLayer(x, dModel, model.numHeads, layerSeed);
    const attnOut = x.map((v, i) => layerNorm(addVec(v, proj[i])));
    const ffnOut = ffn(attnOut, dModel, layerSeed + 3000);
    const layerOut = attnOut.map((v, i) => layerNorm(addVec(v, ffnOut[i])));

    const trace: LayerTrace = { headAttentions: heads };

    if (model.moe) {
      const gateSeed = layerSeed + 8000;
      const Wgate = seededMatrix(gateSeed, model.moe.numExperts, dModel);
      const gateScores = softmax(matVec(Wgate, x[x.length - 1]));
      const ranked = gateScores
        .map((v, i) => ({ expert: i, score: v }))
        .sort((a, b) => b.score - a.score)
        .slice(0, model.moe.topK);
      trace.expertInfo = { scores: gateScores, chosen: ranked.map((r) => r.expert) };
    }

    layers.push(trace);
    x = layerOut;
  }

  const finalHidden = x[x.length - 1];
  const outSeed = hashString(model.id) + 999999;
  const Wout = seededMatrix(outSeed, CANDIDATE_VOCAB.length, dModel);
  const rawLogits = matVec(Wout, finalHidden);
  const logits: LogitItem[] = CANDIDATE_VOCAB.map((w, i) => ({ word: w, value: rawLogits[i] }));

  return { embeddings, posEncoded, layers, finalHidden, logits };
}

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

// Lightweight autoregressive loop used by the Decoder stage: each step
// reuses the same fixed model "brain" (seeded weights) but a growing
// sequence of tokens, exactly like real generation.
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
