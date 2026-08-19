'use client';

import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { EXAMPLES, Variant, TransformerExample, localAttentionRow } from '@/lib/transformer-diagram-data';
import { EVOLUTION_STAGES, DEFAULT_STAGE_ID, EvolutionStage } from '@/lib/transformer-evolution-data';
import { softmax } from '@/lib/math';
import { positionalEncoding } from '@/lib/engine';
import Controls from '@/components/Controls';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const COLORS = {
    embed: '#db6f96',
    pe: '#0891b2',
    attn: '#d97706',
    addnorm: '#65a30d',
    ffn: '#2563eb',
    linear: '#7c3aed',
    softmax: '#059669',
};

interface Step {
    id: string;
    title: string;
    description: string;
    highlight: string[];
    visual: 'none' | 'pe' | 'encoder-attn' | 'decoder-mask' | 'decoder-cross' | 'logits' | 'softmax';
}

interface ExternalLink {
    title: string;
    url: string;
    description: string;
}

interface ComponentDetail {
    id: string;
    title: string;
    subtitle: string;
    color: string;
    inputShape: string;
    outputShape: string;
    mathFormula: string;
    activationDetails: string;
    contractDescription: string;
    links: ExternalLink[];
}

function getStepsForStage(stage: EvolutionStage): Step[] {
    if (stage.diagramType === 'encoder-decoder') {
        return [
            {
                id: 'input',
                title: 'Feeding in the input',
                description:
                    'The encoder receives the full context at once. The decoder is shifted right, seeing generated context up to the current token.',
                highlight: ['enc-input', 'dec-output'],
                visual: 'none',
            },
            {
                id: 'embed',
                title: 'Input & Output Embedding',
                description: 'Tokens are looked up in embedding tables to project discrete vocabulary indices into vector representations.',
                highlight: ['enc-embed', 'dec-embed'],
                visual: 'none',
            },
            {
                id: 'pe',
                title: `Positional Encoding (${stage.peLabel})`,
                description: `Positional information (${stage.peLabel}) is injected into token embeddings so the network retains order awareness.`,
                highlight: ['enc-pe', 'dec-pe'],
                visual: 'pe',
            },
            {
                id: 'enc-attn',
                title: 'Encoder Self-Attention',
                description: 'Bidirectional multi-head attention aggregates full context across all input positions simultaneously.',
                highlight: ['enc-mha'],
                visual: 'encoder-attn',
            },
            {
                id: 'enc-ffn',
                title: stage.moe ? 'Encoder Sparse MoE Routing' : `Encoder FFN (${stage.ffnLabel})`,
                description: stage.moe
                    ? 'Gating networks dynamically route each token to specialized expert Feed-Forward sub-networks.'
                    : `Dense MLP block processes representations with non-linear activation (${stage.ffnLabel}).`,
                highlight: ['enc-addnorm1', 'enc-ffn', 'enc-addnorm2'],
                visual: 'none',
            },
            {
                id: 'dec-mask',
                title: 'Masked Multi-Head Attention',
                description: 'Causal masking prevents decoder positions from attending to future tokens during sequence generation.',
                highlight: ['dec-mmha'],
                visual: 'decoder-mask',
            },
            {
                id: 'dec-cross',
                title: 'Encoder-Decoder (Cross) Attention',
                description: 'Decoder queries cross-attend over encoder key/value outputs to pull context from the input sequence.',
                highlight: ['dec-cross'],
                visual: 'decoder-cross',
            },
            {
                id: 'dec-ffn',
                title: stage.moe ? 'Decoder Sparse MoE Routing' : `Decoder FFN (${stage.ffnLabel})`,
                description: stage.moe
                    ? 'Selected top-k decoder expert networks transform intermediate representations.'
                    : 'Dense Feed-Forward network applies element-wise non-linear expansions.',
                highlight: ['dec-addnorm1', 'dec-ffn', 'dec-addnorm2'],
                visual: 'none',
            },
            {
                id: 'linear',
                title: 'Linear Projection',
                description: 'Final decoder hidden state is projected back onto the vocabulary dimension.',
                highlight: ['linear'],
                visual: 'logits',
            },
            {
                id: 'softmax',
                title: 'Softmax Probabilities',
                description: 'Raw logit scores are normalized into a discrete target word probability distribution.',
                highlight: ['softmax'],
                visual: 'softmax',
            },
            {
                id: 'output',
                title: 'Autoregressive Loop',
                description: 'The highest-probability token is selected, appended to sequence history, and fed back into the decoder.',
                highlight: ['outputprobs', 'dec-output'],
                visual: 'softmax',
            },
        ];
    }

    if (stage.diagramType === 'decoder-only') {
        return [
            {
                id: 'input',
                title: 'Sequence Input',
                description: 'Prompt tokens enter the autoregressive stack shifted right, ready to predict the subsequent token.',
                highlight: ['dec-output'],
                visual: 'none',
            },
            {
                id: 'embed',
                title: 'Token Embedding',
                description: 'Tokens are mapped to dense vector representations using a shared token embedding matrix.',
                highlight: ['dec-embed'],
                visual: 'none',
            },
            {
                id: 'pe',
                title: `Positional Encoding (${stage.peLabel})`,
                description: `${stage.peLabel} embeds relative sequence order directly into key/query inner products or token vectors.`,
                highlight: ['dec-pe'],
                visual: 'pe',
            },
            {
                id: 'dec-mask',
                title: stage.attnLabel ?? 'Causal Masked Self-Attention',
                description: 'Causal attention ensures tokens only compute dot products against current and past token positions.',
                highlight: ['dec-mmha'],
                visual: 'decoder-mask',
            },
            {
                id: 'dec-ffn',
                title: stage.moe ? 'Sparse MoE Expert Routing' : `Feed-Forward Layer (${stage.ffnLabel})`,
                description: stage.moe
                    ? 'A router directs each token to a subset of specialized expert FFNs (e.g. Top-2 or fine-grained MoE).'
                    : `Dense transformation using non-linear activation functions (${stage.ffnLabel}).`,
                highlight: ['dec-addnorm1', 'dec-ffn', 'dec-addnorm2'],
                visual: 'none',
            },
            {
                id: 'linear',
                title: 'Vocabulary Projection',
                description: 'Final decoder representations are projected via the unembedding matrix to produce vocabulary logits.',
                highlight: ['linear'],
                visual: 'logits',
            },
            {
                id: 'softmax',
                title: 'Softmax Distribution',
                description: 'Logits are exponentiated and normalized to generate next-token sampling probabilities.',
                highlight: ['softmax'],
                visual: 'softmax',
            },
            {
                id: 'output',
                title: 'Next Token Generation',
                description: 'Sampled token is appended to the KV cache/context window to predict the following word iteratively.',
                highlight: ['outputprobs', 'dec-output'],
                visual: 'softmax',
            },
        ];
    }

    return [
        {
            id: 'input',
            title: 'Full Context Input',
            description: 'Input sentence with [MASK] tokens is ingested simultaneously without causal masking constraints.',
            highlight: ['enc-input'],
            visual: 'none',
        },
        {
            id: 'embed',
            title: 'Token & Segment Embeddings',
            description: 'Vocabulary token embeddings are combined with segment and token type identifiers.',
            highlight: ['enc-embed'],
            visual: 'none',
        },
        {
            id: 'pe',
            title: `Positional Encoding (${stage.peLabel})`,
            description: `${stage.peLabel} positional encodings are added to preserve sequence structure.`,
            highlight: ['enc-pe'],
            visual: 'pe',
        },
        {
            id: 'enc-attn',
            title: 'Bidirectional Self-Attention',
            description: 'Every token attends to every other token (left and right) simultaneously across all sequence positions.',
            highlight: ['enc-mha'],
            visual: 'encoder-attn',
        },
        {
            id: 'enc-ffn',
            title: `Feed-Forward Network (${stage.ffnLabel})`,
            description: `Point-wise Feed-Forward networks refine bidirectional token context with non-linear activation (${stage.ffnLabel}).`,
            highlight: ['enc-addnorm1', 'enc-ffn', 'enc-addnorm2'],
            visual: 'none',
        },
        {
            id: 'linear',
            title: 'Masked Projection Head',
            description: 'Hidden state corresponding to the [MASK] position is projected to vocabulary dimensions.',
            highlight: ['linear'],
            visual: 'logits',
        },
        {
            id: 'softmax',
            title: 'Softmax Evaluation',
            description: 'Softmax computes exact probabilities across all candidates for the masked token position.',
            highlight: ['softmax'],
            visual: 'softmax',
        },
        {
            id: 'output',
            title: 'Masked Token Prediction',
            description: 'The highest probability token fills the masked position in parallel.',
            highlight: ['outputprobs'],
            visual: 'softmax',
        },
    ];
}

function getComponentDetails(type: string, stage: EvolutionStage): ComponentDetail {
    switch (type) {
        case 'embed':
            return {
                id: 'embed',
                title: 'Token Embedding Matrix',
                subtitle: 'Discrete Token IDs → Continuous Vector Space',
                color: COLORS.embed,
                inputShape: '(Batch Size B, Sequence Length T) — Integer Token IDs',
                outputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                mathFormula: '$$X_{\\text{embed}} = \\text{Embedding}(W_{\\text{vocab}}) \\cdot \\sqrt{d_{\\text{model}}}$$',
                activationDetails: 'Linear lookup operation. In the 2017 Transformer, embeddings are multiplied by $\\sqrt{d_{\\text{model}}}$ to scale magnitude before positional addition.',
                contractDescription: 'Maps each integer token index into a dense continuous embedding vector of size $d_{\\text{model}}$. Weights are often shared with the final linear unembedding layer (Weight Tying).',
                links: [
                    { title: 'Attention Is All You Need (Section 3.4)', url: 'https://arxiv.org/abs/1706.03762', description: 'Original details on embedding scaling and tied weights.' },
                    { title: 'Using Weight Tying in Language Models', url: 'https://arxiv.org/abs/1608.05859', description: 'Foundational paper on sharing token and output embeddings.' },
                ],
            };

        case 'pe':
            return {
                id: 'pe',
                title: `Positional Encoding (${stage.peLabel})`,
                subtitle: 'Injecting Sequence Order Context',
                color: COLORS.pe,
                inputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                outputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                mathFormula:
                    stage.peLabel.includes('RoPE')
                        ? '$$R_{\\Theta, m}^d x_m = \\begin{pmatrix} \\cos m\\theta_i & -\\sin m\\theta_i \\\\ \\sin m\\theta_i & \\cos m\\theta_i \\end{pmatrix} \\begin{pmatrix} x_{m,2i} \\\\ x_{m,2i+1} \\end{pmatrix}$$'
                        : '$$\\text{PE}_{(\\text{pos}, 2i)} = \\sin\\left(\\frac{\\text{pos}}{10000^{2i/d_{\\text{model}}}}\\right), \\quad \\text{PE}_{(\\text{pos}, 2i+1)} = \\cos\\left(\\frac{\\text{pos}}{10000^{2i/d_{\\text{model}}}}\\right)$$',
                activationDetails: `Active Scheme: ${stage.peLabel}. Absolute sinusoidal additions or relative rotary rotations applied to Key and Query vectors.`,
                contractDescription: 'Transformers compute self-attention symmetrically without inherent awareness of token position. Positional encoding adds trigonometric functions or applies 2D rotation matrices (RoPE) to maintain sequence order.',
                links: [
                    { title: 'RoFormer: Enhanced Transformer with Rotary Position Embedding', url: 'https://arxiv.org/abs/2104.09864', description: 'Modern standard RoPE positional encoding formulation.' },
                    { title: 'Transformer Relative Position Representations', url: 'https://arxiv.org/abs/1803.02155', description: 'Early relative position bias mechanisms.' },
                ],
            };

        case 'attn':
            return {
                id: 'attn',
                title: stage.attnLabel ?? 'Multi-Head Attention (MHA)',
                subtitle: 'Context Aggregation & Token Interaction',
                color: COLORS.attn,
                inputShape: 'Queries Q, Keys K, Values V ∈ (B, T, d_model)',
                outputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                mathFormula: '$$\\text{Attention}(Q, K, V) = \\text{Softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}} + M\\right) V$$',
                activationDetails: 'Softmax applied along the key sequence dimension ($T_{keys}$) for attention probability normalization.',
                contractDescription: 'Computes scaled dot-product similarity between all query-key pairs to produce attention weights, which then weight-average the value vectors. Mask matrix $M$ is filled with $-\\infty$ for causal positions.',
                links: [
                    { title: 'FlashAttention: Fast and Memory-Efficient Exact Attention', url: 'https://arxiv.org/abs/2205.14135', description: 'IO-aware hardware acceleration for attention.' },
                    { title: 'DeepSeek-V3 Technical Report (MLA Section)', url: 'https://arxiv.org/abs/2412.19437', description: 'Multi-Head Latent Attention KV-cache compression.' },
                ],
            };

        case 'ffn':
            return {
                id: 'ffn',
                title: stage.moe ? 'Sparse Mixture-of-Experts (MoE) FFN' : `Feed-Forward Network (${stage.ffnLabel})`,
                subtitle: stage.moe ? 'Top-k Gated Expert Activation' : `Pointwise MLP with ${stage.ffnLabel}`,
                color: COLORS.ffn,
                inputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                outputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                mathFormula: stage.moe
                    ? '$$y = \\sum_{i \\in \\text{TopK}(G(x))} \\text{Softmax}(G(x))_i \\cdot \\text{Expert}_i(x)$$'
                    : stage.ffnLabel.includes('SwiGLU')
                        ? '$$\\text{SwiGLU}(x) = \\left(\\text{Swish}_{1}(x W_g) \\odot x W_1\\right) W_2$$'
                        : stage.ffnLabel.includes('GELU')
                            ? '$$\\text{GELU}(x) = x \\cdot \\Phi(x) = x \\cdot P(X \\le x), \\quad X \\sim \\mathcal{N}(0, 1)$$'
                            : '$$\\text{ReLU}(x) = \\max(0, x W_1 + b_1) W_2 + b_2$$',
                activationDetails: `Active Activation: ${stage.ffnLabel}. ${stage.moe ? 'Tokens are dynamically routed via a softmax gating function $G(x)$ to specific experts.' : 'Element-wise expansion and compression.'
                    }`,
                contractDescription: 'Processes each token position independently. Expands hidden dimension (typically $4 \\times d_{model}$ or GLU equivalent $8/3 \\times d_{model}$) to store non-linear factual representations.',
                links: [
                    { title: 'GLU Variants Improve Transformer', url: 'https://arxiv.org/abs/2002.05202', description: 'Shazeer paper introducing SwiGLU activations.' },
                    { title: 'Switch Transformers: Scaling to Trillion Parameter Models', url: 'https://arxiv.org/abs/2101.03961', description: 'Foundational sparse top-1 MoE architecture.' },
                ],
            };

        case 'addnorm':
            return {
                id: 'addnorm',
                title: 'Residual Add & Normalization',
                subtitle: 'Gradient Highway & Training Stability',
                color: COLORS.addnorm,
                inputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                outputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                mathFormula: stage.id.includes('2022') || stage.id.includes('2024')
                    ? '$$\\text{RMSNorm}(x) = \\frac{x}{\\sqrt{\\frac{1}{d} \\sum_{i=1}^d x_i^2 + \\epsilon}} \\odot \\gamma$$'
                    : '$$\\text{LayerNorm}(x) = \\frac{x - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}} \\odot \\gamma + \\beta$$',
                activationDetails: 'No non-linear activation. Computes mean/variance or root-mean-square along hidden dimension $d_{model}$.',
                contractDescription: 'Residual connections ($x + \\text{SubLayer}(x)$) prevent vanishing gradients during backpropagation. Pre-LN / RMSNorm standardizes activations before sub-layers in modern LLMs.',
                links: [
                    { title: 'Layer Normalization', url: 'https://arxiv.org/abs/1607.06450', description: 'Original LayerNorm formulation.' },
                    { title: 'Root Mean Square Layer Normalization (RMSNorm)', url: 'https://arxiv.org/abs/1910.07467', description: 'Faster normalization variant without mean-centering.' },
                ],
            };

        case 'linear':
            return {
                id: 'linear',
                title: 'Linear Unembedding Layer',
                subtitle: 'Hidden Dimensions → Vocabulary Logits',
                color: COLORS.linear,
                inputShape: '(Batch Size B, Sequence Length T, Model Dimension d_model)',
                outputShape: '(Batch Size B, Sequence Length T, Vocabulary Size |V|)',
                mathFormula: '$$Z_{\\text{logits}} = X_{decoder} \\cdot W_{vocab}^T + b$$',
                activationDetails: 'Linear transformation without activation function. Outputs raw unnormalized log-odds (logits).',
                contractDescription: 'Projects the final contextualized token representation from the model dimension $d_{model}$ back to the full vocabulary dimension $|V|$ (e.g. 32,000 to 128,000 logits).',
                links: [
                    { title: 'The Tokenization & Unembedding Pipeline', url: 'https://huggingface.co/docs/transformers', description: 'Hugging Face overview of LM heads.' },
                ],
            };

        case 'softmax':
            return {
                id: 'softmax',
                title: 'Softmax Probability Normalization',
                subtitle: 'Logits → Valid Probability Distribution',
                color: COLORS.softmax,
                inputShape: '(Batch Size B, Sequence Length T, Vocabulary Size |V|)',
                outputShape: '(Batch Size B, Sequence Length T, Vocabulary Size |V|)',
                mathFormula: '$$P(y_i \\mid x) = \\frac{\\exp(z_i / T)}{\\sum_{j=1}^{|V|} \\exp(z_j / T)}$$',
                activationDetails: 'Softmax normalization. Parameterized by temperature $T > 0$ to control distribution entropy.',
                contractDescription: 'Exponentiates raw logits and divides by the partition sum $\\sum \\exp(z_j)$ to guarantee outputs lie in $[0, 1]$ and sum to $1.0$.',
                links: [
                    { title: 'Temperature and Top-p Sampling in LLMs', url: 'https://arxiv.org/abs/1904.09751', description: 'Analysis of sampling dynamics from probability outputs.' },
                ],
            };

        default:
            return {
                id: 'outputprobs',
                title: 'Token Generation & Autoregressive Sampling',
                subtitle: 'Sampling Next Token & KV Cache Append',
                color: COLORS.softmax,
                inputShape: '(Batch Size B, Vocabulary Size |V|)',
                outputShape: 'Selected Discrete Token ID $\\in \\mathbb{N}$',
                mathFormula: '$$y_{t} \\sim \\text{NucleusSample}(P(y \\mid y_{<t}), p_{top}, k_{top})$$',
                activationDetails: 'Argmax (Greedy), Top-k, or Nucleus (Top-p) stochastic sampling strategies.',
                contractDescription: 'Selects the output token index based on the probability distribution, appends it to the token history/KV cache, and loops back to input for the next autoregressive decoding step.',
                links: [
                    { title: 'The Curious Case of Neural Text Degeneration', url: 'https://arxiv.org/abs/1904.09751', description: 'Pioneered Top-p (Nucleus) sampling for modern text generation.' },
                ],
            };
    }
}

const AUTO_MS = 3400;

function MathRenderer({ formula }: { formula: string }) {
    // Strip surrounding $$ delimiters if present
    const cleanFormula = formula.replace(/^\$\$/g, '').replace(/\$\$$/g, '').trim();
    const html = katex.renderToString(cleanFormula, {
        displayMode: true,
        throwOnError: false,
    });

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function TransformerArchitecturePage() {
    const [evolutionId, setEvolutionId] = useState<string>(DEFAULT_STAGE_ID);
    const [evoOpen, setEvoOpen] = useState(false);
    const [variant, setVariant] = useState<Variant>('tired');
    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedBoxType, setSelectedBoxType] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stage: EvolutionStage = EVOLUTION_STAGES.find((s: EvolutionStage) => s.id === evolutionId) ?? EVOLUTION_STAGES[0];
    const steps = useMemo(() => getStepsForStage(stage), [stage]);
    const example = EXAMPLES[variant];
    const n = example.encoderTokens.length;

    const changeStage = (id: string) => {
        setEvolutionId(id);
        setEvoOpen(false);
        setStepIdx(0);
        setIsPlaying(false);
    };

    useEffect(() => {
        if (!isPlaying) return;
        timerRef.current = setInterval(() => {
            setStepIdx((p: number) => {
                if (p >= steps.length - 1) {
                    setIsPlaying(false);
                    return p;
                }
                return p + 1;
            });
        }, AUTO_MS);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, steps.length]);

    const active = (id: string) => steps[stepIdx]?.highlight.includes(id) ?? false;
    const step = steps[stepIdx] || steps[0];

    const changeVariant = (v: Variant) => {
        setVariant(v);
        setIsPlaying(false);
    };

    const encoderRows = useMemo(() => {
        return example.encoderTokens.map((_: string, i: number) =>
            i === example.itIndex ? null : localAttentionRow(i, n)
        );
    }, [example, n]);

    const probs = useMemo(() => softmax(example.candidateLogits, 1), [example]);

    const showEncoder = stage.diagramType !== 'decoder-only';
    const showDecoder = stage.diagramType !== 'encoder-only';
    const showCross = stage.diagramType === 'encoder-decoder';
    const singleColumn = stage.diagramType !== 'encoder-decoder';
    const ffnBoxLabel = stage.moe ? 'Sparse MoE FFN' : 'Feed Forward';
    const decoderAttnLabel = stage.attnLabel ?? 'Masked Multi-Head Attention';
    const encoderAttnLabel = showDecoder ? 'Multi-Head Attention' : 'Multi-Head Attention (bidirectional)';

    const selectedModalData = useMemo(() => {
        if (!selectedBoxType) return null;
        return getComponentDetails(selectedBoxType, stage);
    }, [selectedBoxType, stage]);

    return (
        <main className="flex min-h-screen flex-col bg-base-950 md:h-screen md:flex-row md:overflow-hidden">
            {/* LEFT SIDEBAR */}
            <aside className="flex w-full shrink-0 flex-col gap-5 border-b border-base-700 bg-base-850 p-5 md:h-full md:w-[360px] md:overflow-y-auto md:border-b-0 md:border-r">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-base-200 text-xs font-bold text-base-950">L</div>
                    <span className="text-sm font-semibold text-base-100">LLM Lab</span>
                    <span className="ml-auto text-xs font-medium text-base-300">Transformer Architecture</span>
                </div>
                <div className="-mt-3 flex flex-col gap-1">
                    <Link href="/" className="flex w-fit items-center gap-1.5 text-xs text-base-500 transition hover:text-base-300">
                        ← Back to visualizer
                    </Link>
                    <Link href="/attentions" className="flex w-fit items-center gap-1.5 text-xs text-base-500 transition hover:text-base-300">
                        📖 Attention Bible
                    </Link>
                </div>

                {/* Evolution dropdown */}
                <div className="flex flex-col gap-2">
                    <label className="px-0.5 text-xs font-medium uppercase tracking-wide text-base-500">Transformer Evolution</label>
                    <div className="relative">
                        <button
                            onClick={() => setEvoOpen((o: boolean) => !o)}
                            className="flex w-full items-start justify-between gap-2 rounded-xl border border-base-700 bg-base-900 px-3 py-2.5 text-left shadow-panel transition hover:border-base-600"
                        >
                            <span className="text-xs font-medium leading-snug text-base-100">{stage.shortLabel}</span>
                            <ChevronIcon open={evoOpen} />
                        </button>
                        {evoOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setEvoOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-base-700 bg-base-900 shadow-lg"
                                >
                                    {EVOLUTION_STAGES.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => changeStage(s.id)}
                                            className="flex w-full flex-col gap-0.5 border-b border-base-700 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-base-800"
                                        >
                                            <span className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-medium text-base-100">{s.shortLabel}</span>
                                                {s.id === stage.id && <CheckIcon />}
                                            </span>
                                            <span className="text-[11px] text-base-500">{s.subtitle}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>

                {/* Stage details */}
                <div className="flex flex-col gap-1.5 rounded-xl border border-base-700 bg-base-900 p-3 text-xs shadow-panel">
                    <p className="font-semibold text-base-100">{stage.title}</p>
                    <p><span className="font-medium text-base-300">Architecture: </span><span className="text-base-500">{stage.architecture}</span></p>
                    <p><span className="font-medium text-base-300">Activations: </span><span className="text-base-500">{stage.activations}</span></p>
                    <p><span className="font-medium text-base-300">Key models: </span><span className="text-base-500">{stage.keyModels}</span></p>
                    <p><span className="font-medium text-base-300">Struggles: </span><span className="text-base-500">{stage.struggles}</span></p>
                </div>

                {/* Task description & variant selection */}
                <div className="flex flex-col gap-2">
                    <label className="px-0.5 text-xs font-medium uppercase tracking-wide text-base-500">Era Task</label>
                    <p className="text-xs leading-relaxed text-base-400">{stage.task}</p>

                    <div className="flex items-center gap-1 rounded-full border border-base-700 bg-base-900 p-1">
                        <button
                            onClick={() => changeVariant('tired')}
                            className="flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition"
                            style={{ backgroundColor: variant === 'tired' ? COLORS.attn : 'transparent', color: variant === 'tired' ? '#fff' : '#8B8576' }}
                        >
                            &hellip;too tired
                        </button>
                        <button
                            onClick={() => changeVariant('wide')}
                            className="flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition"
                            style={{ backgroundColor: variant === 'wide' ? COLORS.attn : 'transparent', color: variant === 'wide' ? '#fff' : '#8B8576' }}
                        >
                            &hellip;too wide
                        </button>
                    </div>
                    <div className="rounded-xl border px-3 py-2 text-center font-mono text-[11px] leading-relaxed text-base-200" style={{ borderColor: `${COLORS.attn}55`, backgroundColor: `${COLORS.attn}0f` }}>
                        &ldquo;{example.sentence}&rdquo;
                    </div>
                </div>

                {/* Pipeline Navigation */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-0.5">
                        <span className="text-xs font-medium uppercase tracking-wide text-base-500">Pipeline</span>
                        <span className="font-tabular text-xs text-base-500">{stepIdx + 1}/{steps.length}</span>
                    </div>
                    <nav className="flex flex-col gap-0.5">
                        {steps.map((s, i) => {
                            const isActive = i === stepIdx;
                            const done = i < stepIdx;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => { setIsPlaying(false); setStepIdx(i); }}
                                    className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition"
                                    style={{ backgroundColor: isActive ? `${COLORS.attn}17` : 'transparent' }}
                                >
                                    <span
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                                        style={{
                                            backgroundColor: isActive ? COLORS.attn : done ? `${COLORS.attn}2a` : 'transparent',
                                            color: isActive ? '#fff' : done ? COLORS.attn : '#8B8576',
                                            border: isActive || done ? 'none' : '1px solid #DDD7C6',
                                        }}
                                    >
                                        {done ? '✓' : i + 1}
                                    </span>
                                    <span className={`truncate text-[12px] ${isActive ? 'font-semibold text-base-100' : done ? 'text-base-300' : 'text-base-500'}`}>
                                        {s.title}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Current Step Detail View */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id + stage.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col gap-2 rounded-xl border border-base-700 bg-base-900 p-3 shadow-panel"
                    >
                        <h2 className="text-xs font-semibold text-base-100">{step.title}</h2>
                        <p className="text-[11px] leading-relaxed text-base-400">{step.description}</p>

                        {step.visual === 'pe' && <PositionalEncodingVisual example={example} compact />}
                        {step.visual === 'encoder-attn' && <EncoderAttentionVisual example={example} allRows={encoderRows} compact />}
                        {step.visual === 'decoder-mask' && <DecoderMaskVisual example={example} compact />}
                        {step.visual === 'decoder-cross' && <DecoderCrossVisual example={example} compact />}
                        {(step.visual === 'logits' || step.visual === 'softmax') && (
                            <LogitsVisual example={example} probs={step.visual === 'softmax' ? probs : null} compact />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Player Controls */}
                <div className="border-t border-base-700 pt-3">
                    <Controls
                        isPlaying={isPlaying}
                        onTogglePlay={() => { if (stepIdx >= steps.length - 1) setStepIdx(0); setIsPlaying((p: boolean) => !p); }}
                        onStepBack={() => { setIsPlaying(false); setStepIdx((p: number) => Math.max(0, p - 1)); }}
                        onStepForward={() => { setIsPlaying(false); setStepIdx((p: number) => Math.min(steps.length - 1, p + 1)); }}
                        onRestart={() => { setIsPlaying(false); setStepIdx(0); }}
                        canStepBack={stepIdx > 0}
                        canStepForward={stepIdx < steps.length - 1}
                        accent={COLORS.attn}
                    />
                </div>

                <p className="mt-auto px-0.5 text-[11px] leading-relaxed text-base-500">
                    Click any block in the architecture diagram to inspect its exact math contract, activation formulas, and external research links.
                </p>
            </aside>

            {/* RIGHT — DIAGRAM VIEWPORT */}
            <section className="flex flex-1 items-center justify-center overflow-hidden md:h-full">
                <div className="flex w-full flex-col items-center gap-1 p-3 sm:p-4">
                    <DiagramBox label="Output Probabilities" color={COLORS.softmax} active={active('outputprobs')} onClick={() => setSelectedBoxType('outputprobs')} />
                    <ArrowUp />
                    <DiagramBox label="Softmax" color={COLORS.softmax} active={active('softmax')} onClick={() => setSelectedBoxType('softmax')} />
                    <ArrowUp />
                    <DiagramBox label="Linear" color={COLORS.linear} active={active('linear')} onClick={() => setSelectedBoxType('linear')} />
                    <ArrowUp />

                    <div className={`grid w-full gap-3 ${singleColumn ? 'max-w-[210px] grid-cols-1' : 'max-w-xl grid-cols-1 sm:grid-cols-2'}`}>
                        {showEncoder && (
                            <div className="flex flex-col items-center gap-1">
                                <NxWrap>
                                    <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('enc-addnorm2')} onClick={() => setSelectedBoxType('addnorm')} small />
                                    <DiagramBox label={ffnBoxLabel} sublabel={stage.ffnLabel} color={COLORS.ffn} active={active('enc-ffn')} onClick={() => setSelectedBoxType('ffn')} />
                                    <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('enc-addnorm1')} onClick={() => setSelectedBoxType('addnorm')} small />
                                    <DiagramBox label={encoderAttnLabel} color={COLORS.attn} active={active('enc-mha')} onClick={() => setSelectedBoxType('attn')} />
                                </NxWrap>
                                <ArrowUp />
                                <DiagramBox label="Positional Encoding ⊕" sublabel={stage.peLabel} color={COLORS.pe} active={active('enc-pe')} onClick={() => setSelectedBoxType('pe')} small />
                                <ArrowUp />
                                <DiagramBox label="Input Embedding" color={COLORS.embed} active={active('enc-embed')} onClick={() => setSelectedBoxType('embed')} small />
                                <ArrowUp />
                                <DiagramBox label="Inputs" color="#8B8576" active={active('enc-input')} onClick={() => setSelectedBoxType('embed')} small />
                                <span className="text-[9px] uppercase tracking-wide text-base-500">{showDecoder ? 'Encoder' : 'Encoder (only)'}</span>
                            </div>
                        )}

                        {showDecoder && (
                            <div className="flex flex-col items-center gap-1">
                                <NxWrap>
                                    <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-addnorm2')} onClick={() => setSelectedBoxType('addnorm')} small />
                                    <DiagramBox label={ffnBoxLabel} sublabel={stage.ffnLabel} color={COLORS.ffn} active={active('dec-ffn')} onClick={() => setSelectedBoxType('ffn')} />
                                    {showCross && (
                                        <>
                                            <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-addnorm1')} onClick={() => setSelectedBoxType('addnorm')} small />
                                            <DiagramBox label="Multi-Head Attention" sublabel="(encoder-decoder)" color={COLORS.attn} active={active('dec-cross')} onClick={() => setSelectedBoxType('attn')} />
                                        </>
                                    )}
                                    <DiagramBox label="Add & Norm" color={COLORS.addnorm} active={active('dec-mmha')} onClick={() => setSelectedBoxType('addnorm')} small />
                                    <DiagramBox label={decoderAttnLabel} color={COLORS.attn} active={active('dec-mmha')} onClick={() => setSelectedBoxType('attn')} />
                                </NxWrap>
                                <ArrowUp />
                                <DiagramBox label="Positional Encoding ⊕" sublabel={stage.peLabel} color={COLORS.pe} active={active('dec-pe')} onClick={() => setSelectedBoxType('pe')} small />
                                <ArrowUp />
                                <DiagramBox label="Output Embedding" color={COLORS.embed} active={active('dec-embed')} onClick={() => setSelectedBoxType('embed')} small />
                                <ArrowUp />
                                <DiagramBox label="Outputs (shifted right)" color="#8B8576" active={active('dec-output')} onClick={() => setSelectedBoxType('embed')} small />
                                <span className="text-[9px] uppercase tracking-wide text-base-500">{showEncoder ? 'Decoder' : 'Decoder (only)'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* MATHEMATICAL & CONTRACT DETAIL MODAL */}
            <AnimatePresence>
                {selectedModalData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBoxType(null)}
                            className="absolute inset-0 bg-base-950/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 flex w-full max-w-2xl flex-col gap-5 rounded-2xl border border-base-700 bg-base-900 p-6 shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedModalData.color }} />
                                        <h2 className="text-lg font-bold text-base-100">{selectedModalData.title}</h2>
                                    </div>
                                    <p className="text-xs text-base-400">{selectedModalData.subtitle}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedBoxType(null)}
                                    className="rounded-lg p-1.5 text-base-400 transition hover:bg-base-800 hover:text-base-100"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Tensor Contract */}
                            <div className="flex flex-col gap-2 rounded-xl border border-base-800 bg-base-950/60 p-3.5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-base-300">Tensor Contract</span>
                                <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                                    <div>
                                        <span className="font-medium text-base-400">Input Shape: </span>
                                        <span className="font-mono text-base-200">{selectedModalData.inputShape}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-base-400">Output Shape: </span>
                                        <span className="font-mono text-base-200">{selectedModalData.outputShape}</span>
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-base-400">{selectedModalData.contractDescription}</p>
                            </div>

                            {/* Mathematical Specification */}
                            <div className="flex flex-col gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-base-300">Mathematical Formula</span>
                                <div
                                    className="overflow-x-auto rounded-xl border px-4 py-3 text-base-100 shadow-inner"
                                    style={{ borderColor: `${selectedModalData.color}44`, backgroundColor: `${selectedModalData.color}0d` }}
                                >
                                    <MathRenderer formula={selectedModalData.mathFormula} />
                                </div>
                                <p className="text-xs leading-relaxed text-base-400">{selectedModalData.activationDetails}</p>
                            </div>

                            {/* Useful External Links */}
                            <div className="flex flex-col gap-2 border-t border-base-800 pt-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-base-300">Useful Links & Research Papers</span>
                                <div className="flex flex-col gap-2">
                                    {selectedModalData.links.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex flex-col gap-0.5 rounded-lg border border-base-800 bg-base-850/50 p-2.5 transition hover:border-base-600 hover:bg-base-800"
                                        >
                                            <div className="flex items-center justify-between text-xs font-medium text-base-200 group-hover:text-base-100">
                                                <span>{link.title}</span>
                                                <span className="text-[10px] text-base-500 group-hover:text-base-300">↗</span>
                                            </div>
                                            <span className="text-[11px] text-base-500">{link.description}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}

function NxWrap({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed border-base-700 p-2">
            <span className="absolute -right-1.5 -top-2.5 rounded-full bg-base-900 px-1.5 py-0.5 text-[9px] font-bold text-base-400 shadow-panel">×N</span>
            {children}
        </div>
    );
}

function DiagramBox({
    label,
    sublabel,
    color,
    active,
    onClick,
    small,
}: {
    label: string;
    sublabel?: string;
    color: string;
    active: boolean;
    onClick?: () => void;
    small?: boolean;
}) {
    return (
        <motion.button
            onClick={onClick}
            animate={{ scale: active ? 1.045 : 1 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            className={`w-full max-w-[190px] cursor-pointer rounded-md text-center font-medium leading-tight transition-all ${small ? 'px-2 py-1 text-[9px]' : 'px-2 py-1.5 text-[10px] sm:text-[11px]'
                }`}
            style={{
                backgroundColor: `${color}1f`,
                color,
                boxShadow: active ? `0 0 0 2px ${color}, 0 8px 18px -10px ${color}88` : `0 0 0 1px ${color}33`,
            }}
        >
            {label}
            {sublabel && <div className="text-[8px] font-normal opacity-70">{sublabel}</div>}
        </motion.button>
    );
}

function ArrowUp() {
    return <div className="text-[10px] leading-none text-base-600">↑</div>;
}

function PositionalEncodingVisual({ example, compact }: { example: TransformerExample; compact?: boolean }) {
    const n = example.encoderTokens.length;
    const width = compact ? 300 : 560;
    const height = compact ? 50 : 70;
    const wavePath = (dim: number) => {
        const pts: string[] = [];
        const steps = 100;
        for (let s = 0; s <= steps; s++) {
            const pos = (s / steps) * (n - 1);
            const val = positionalEncoding(pos, 16)[dim] ?? 0;
            const x = (s / steps) * width;
            const y = height / 2 - val * (height / 2 - 5);
            pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
        }
        return pts.join(' ');
    };
    return (
        <div className="flex flex-col gap-1">
            <p className="text-[10px] text-base-500">Real sin/cos formula across all {n} positions:</p>
            <div className="overflow-x-auto rounded-lg border border-base-700 bg-base-950 p-2">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: compact ? 260 : 420 }}>
                    {[0, 1, 2, 3].map((d) => (
                        <path key={d} d={wavePath(d)} fill="none" stroke={COLORS.pe} strokeWidth={1.2} strokeOpacity={0.85 - d * 0.16} />
                    ))}
                    {example.encoderTokens.map((_, i) => (
                        <circle key={i} cx={(i / (n - 1)) * width} cy={height / 2} r={2.2} fill={COLORS.pe} />
                    ))}
                </svg>
            </div>
        </div>
    );
}

function EncoderAttentionVisual({
    example,
    allRows,
    compact,
}: {
    example: TransformerExample;
    allRows: (number[] | null)[];
    compact?: boolean;
}) {
    const n = example.encoderTokens.length;
    const cell = compact ? 15 : n > 9 ? 26 : 30;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <p className="text-[10px] text-base-500">Head A, all tokens (outlined row is &ldquo;it&rdquo;):</p>
                <div className="overflow-x-auto">
                    <div className="inline-grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${n}, ${cell}px)` }}>
                        {example.encoderTokens.map((_, r) => {
                            const row = r === example.itIndex ? example.encoderAttentionHeadCoref : allRows[r]!;
                            return row.map((w, c) => (
                                <div
                                    key={`${r}-${c}`}
                                    className="rounded-sm"
                                    style={{
                                        width: cell - 1,
                                        height: cell - 1,
                                        backgroundColor: COLORS.attn,
                                        opacity: 0.12 + w * 0.88,
                                        outline: r === example.itIndex ? `1.5px solid ${COLORS.attn}` : 'none',
                                        outlineOffset: -1,
                                    }}
                                    title={`${example.encoderTokens[r]} → ${example.encoderTokens[c]}: ${(w * 100).toFixed(0)}%`}
                                />
                            ));
                        })}
                    </div>
                </div>
            </div>
            <TokenRow tokens={example.encoderTokens} highlightIdx={example.itIndex} />
            <AttnBar label={`Head A — coref (it → ${example.focusWord})`} tokens={example.encoderTokens} weights={example.encoderAttentionHeadCoref} color={COLORS.attn} winnerIdx={example.focusIndex} compact={compact} />
            <AttnBar label={`Head B — property (it → ${example.adjectiveWord})`} tokens={example.encoderTokens} weights={example.encoderAttentionHeadProperty} color="#c026d3" winnerIdx={example.encoderTokens.length - 1} compact={compact} />
        </div>
    );
}

function DecoderMaskVisual({ example, compact }: { example: TransformerExample; compact?: boolean }) {
    const labels = ['⟨s⟩', 'The', example.focusWord];
    const cell = compact ? 44 : 60;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="grid" style={{ gridTemplateColumns: `48px repeat(${labels.length}, ${cell}px)` }}>
                <div />
                {labels.map((l) => (
                    <div key={l} className="pb-1 text-center font-mono text-[9px] text-base-500">{l}</div>
                ))}
                {labels.map((rowLabel, r) => (
                    <Fragment key={r}>
                        <div className="pr-1 text-right font-mono text-[9px] text-base-500">{rowLabel}</div>
                        {labels.map((_, c) => {
                            const visible = c <= r;
                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className="m-0.5 flex items-center justify-center rounded text-[11px]"
                                    style={{ height: cell - 6, backgroundColor: visible ? `${COLORS.attn}2a` : '#00000008', color: visible ? COLORS.attn : '#B9B2A0' }}
                                >
                                    {visible ? '✓' : '✕'}
                                </div>
                            );
                        })}
                    </Fragment>
                ))}
            </div>
            <p className="text-center text-[10px] text-base-500">✓ allowed · ✕ masked</p>
        </div>
    );
}

function DecoderCrossVisual({ example, compact }: { example: TransformerExample; compact?: boolean }) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-[10px] text-base-500">Decoder query (&ldquo;{example.focusWord}&rdquo;) over every encoder position:</p>
            <AttnBar label="Cross-attention" tokens={example.encoderTokens} weights={example.decoderCrossAttention} color={COLORS.attn} winnerIdx={example.itIndex} secondaryIdx={example.focusIndex} compact={compact} />
        </div>
    );
}

function LogitsVisual({ example, probs, compact }: { example: TransformerExample; probs: number[] | null; compact?: boolean }) {
    const values = probs ?? example.candidateLogits;
    const max = Math.max(...values.map(Math.abs));
    return (
        <div className="flex flex-col gap-1">
            {example.candidateVocab.map((word, i) => {
                const isWinner = word === example.focusWord;
                const v = values[i];
                const widthPct = probs ? v * 100 : (Math.abs(v) / max) * 100;
                return (
                    <div key={word} className="flex items-center gap-1.5">
                        <span className="w-11 shrink-0 text-right font-mono text-[10px]" style={{ color: isWinner ? COLORS.softmax : '#8B8576' }}>{word}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-base-800">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${widthPct}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ backgroundColor: isWinner ? COLORS.softmax : '#DDD7C6' }} />
                        </div>
                        <span className="w-9 shrink-0 font-mono text-[9px] text-base-500">{probs ? `${(v * 100).toFixed(0)}%` : v.toFixed(1)}</span>
                    </div>
                );
            })}
        </div>
    );
}

function TokenRow({ tokens, highlightIdx }: { tokens: string[]; highlightIdx: number }) {
    return (
        <div className="flex flex-wrap gap-1">
            {tokens.map((t, i) => (
                <span key={i} className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ backgroundColor: i === highlightIdx ? `${COLORS.attn}2a` : 'transparent', color: i === highlightIdx ? COLORS.attn : '#4E4A3F', fontWeight: i === highlightIdx ? 700 : 400 }}>
                    {t}
                </span>
            ))}
        </div>
    );
}

function AttnBar({
    label,
    tokens,
    weights,
    color,
    winnerIdx,
    secondaryIdx,
    compact,
}: {
    label: string;
    tokens: string[];
    weights: number[];
    color: string;
    winnerIdx: number;
    secondaryIdx?: number;
    compact?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-base-400">{label}</span>
            <div className="flex items-end gap-0.5 overflow-x-auto">
                {tokens.map((t, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-0.5" style={{ minWidth: compact ? 22 : undefined }}>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${weights[i] * (compact ? 55 : 90) + 3}px` }} transition={{ duration: 0.5, delay: i * 0.02 }} className="w-full rounded-t" style={{ backgroundColor: i === winnerIdx || i === secondaryIdx ? color : `${color}33` }} />
                        <span className="font-mono text-[8px]" style={{ color: i === winnerIdx ? color : '#8B8576', fontWeight: i === winnerIdx ? 700 : 400 }}>
                            {t.length > 4 ? t.slice(0, 4) + '…' : t}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="mt-0.5 shrink-0 text-base-500 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-emerald-600">
            <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}