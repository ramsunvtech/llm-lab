Build "LLM Lab" — a polished, interactive web app that visualizes what
happens inside a large language model, step by step, so a non-technical
user can build real intuition by typing their own prompt.

## Tech stack (non-negotiable)
- Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion
- Static export (`output: 'export'`) — no backend, everything computed
  client-side in the browser
- Deploy target: GitHub Pages via a GitHub Actions workflow that builds +
  deploys automatically on every push to main. basePath must auto-detect
  the repo name from the GITHUB_REPOSITORY env var — don't hardcode it.

## Layout — a 3-pane app shell like ChatGPT/Claude, not a scrolling page
- Left sidebar (~280–320px, fixed on desktop): prompt textarea + send
  button, and a model picker styled as a real dropdown (click to open,
  checkmark on the selected one) — not tabs or pills.
- Middle rail (~220–260px, fixed): a VERTICAL list of pipeline stages
  that doubles as navigation (click any stage to jump to it), with
  play / pause / step-forward / step-back / restart docked below it.
- Right pane (flexible, majority of the screen): the animated
  visualization for the current stage. This should dominate the screen —
  full viewport height, independently scrolling — not a narrow centered
  column with dead space on either side.
- Desktop: all three panes full-height, independent scroll. Mobile:
  collapse to a single stacked column — no fixed-height tricks that
  break on mobile viewports.

## Theme
- Warm, light "paper" palette — like Claude.ai / ChatGPT's real UI.
  Cream/white backgrounds, soft borders, warm dark-gray text. Never pure
  black, never a dark theme.
- Each model preset has its own accent color, used dynamically for the
  send button, the active pipeline step, progress bars — so switching
  models visibly re-themes the accent against the same light backdrop.
- Apple-level polish: generous spacing, soft shadows over harsh borders,
  subtle motion on every state change.

## Pipeline stages, in order
Input Prompt → Tokenizer → Embedding → Positional Encoding →
Self-Attention → Transformer Layers → Output Logits → Softmax →
Decoder & Sampling (autoregressive — loops back to generate several
tokens)

## Model presets
Let the user pick between named real LLMs — GPT, Claude/Opus, Grok,
Gemini, DeepSeek — as thematic presets, each with its own accent color
and a one-line description of its real architecture (mixture-of-experts
for Grok/DeepSeek, with a small expert-routing visual for those two).

## Computation approach (this is what makes it honest AND simple)
Run a REAL, mechanically accurate transformer forward pass client-side —
real scaled dot-product attention, softmax, layer norm, GELU, matrix
multiplication — but with DETERMINISTIC SEEDED RANDOM weights (seeded
per model + layer + head) instead of trained ones. Keep dimensions small
enough to visualize clearly (e.g. ~16 dims, 4 layers, 4 heads). Effects:
the mechanism is genuinely accurate, not faked; the same model behaves
consistently across different prompts; generated text will NOT be
coherent English — disclose that plainly in the UI so it reads as an
honest simplification, not a bug.

## Interaction requirements
- Clicking "Visualize" must immediately and visibly start animating
  through the stages (auto-play by default) — don't just prepare stage 1
  and silently wait for a second click; that reads as broken.
- Re-running (same prompt, new prompt, or new model) must ALWAYS visibly
  replay the animation, even landing on the same stage index as before.
  Gotcha: if the stage animation is keyed only by stage name, re-running
  onto the same stage won't remount, and it'll silently update with zero
  visible motion. Key it by stage name + a run counter that increments
  on every run.
- Clicking a stage in the nav list jumps straight to it and pauses
  autoplay.

## Content details
- The Tokenizer stage should visibly show each token's assigned ID.
- Curate starter/example prompts deliberately: at least one with a
  long/uncommon word (to show subword splitting into ## continuation
  pieces), one with punctuation, one with a number, and one plain simple
  sentence as a baseline contrast — not four generic sentences that all
  tokenize into plain single-word tokens with nothing interesting to see.

## Implementation gotcha
When scripting the initial folder structure via shell commands, create
directories individually — avoid brace-expansion shortcuts like
`mkdir -p {a,b,c}`, which can silently fail to expand in restricted
shells and create one garbage literal-named folder instead. Verify the
structure afterward.

## Deployment
After the first push, remind me of the one-time manual step: repo →
Settings → Pages → Source → GitHub Actions. Every push after that
redeploys automatically with no further steps.

## Working with me on this
When making changes to this project, paste full updated file contents
directly in chat (in code blocks I can copy) rather than zipping the
whole project.