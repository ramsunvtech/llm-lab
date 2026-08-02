# LLM Lab

An interactive, animated walkthrough of what happens inside a large language
model — tokenizer → embeddings → positional encoding → self-attention →
transformer layers → logits → softmax → decoder/sampling — built with
Next.js, TypeScript, Tailwind CSS, and Framer Motion.

Enter any prompt, pick a model "flavor" (GPT, Claude, Grok, Gemini,
DeepSeek), and step through (or auto-play) every stage of the pipeline.

**How the math works:** this app runs a real, mechanically-accurate
transformer forward pass — real matrix multiplication, real scaled
dot-product attention, real softmax, real layer normalization, real GELU —
entirely in your browser. The only thing that isn't "real" is that the
weight matrices are deterministically seeded random numbers instead of the
result of training on trillions of tokens. That means the *mechanism* you
see is accurate, but the generated text is illustrative, not coherent
model output. Each "model" preset (GPT-5, Claude Opus, Grok, Gemini,
DeepSeek) uses its own fixed seed, so it behaves like a consistent, fixed
"brain" across different prompts — just not a trained one.

There is no backend. Nothing is sent anywhere. The whole thing is a static
site.

## Getting started locally

Requires Node.js 18.18+ (Node 20 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Building the static site

```bash
npm run build
```

This produces a fully static site in `./out` (thanks to `output: 'export'`
in `next.config.js`), ready to be hosted anywhere — including GitHub Pages.

## Deploying to GitHub Pages (already set up)

This repo includes `.github/workflows/deploy.yml`, which automatically
builds and deploys the site to GitHub Pages on every push to `main`.

1. Push this project to your GitHub repository.
2. In the repo, go to **Settings → Pages**, and under **Build and
   deployment → Source**, choose **GitHub Actions**.
3. Push (or re-run the workflow from the **Actions** tab). Once it
   finishes, your site will be live at:

   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

`next.config.js` automatically detects the repository name from GitHub
Actions' built-in `GITHUB_REPOSITORY` environment variable and sets the
correct `basePath`/`assetPrefix`, so you don't need to hard-code your repo
name anywhere.

> If you ever rename the repository, no code changes are needed — the next
> deploy will pick up the new name automatically.

## Project structure

```
app/                 Next.js app router (layout, page, global styles)
components/           Shared UI: header, prompt bar, model selector, timeline, controls
components/stages/    One component per pipeline stage
lib/
  engine.ts           The simulated transformer forward pass (attention, FFN, logits, softmax)
  math.ts             Seeded PRNG + vector/matrix math primitives
  tokenizer.ts         Simplified educational tokenizer (word + subword splitting)
  models.ts           Famous-model presets (GPT, Claude, Grok, Gemini, DeepSeek)
  stages.ts           Stage metadata used by the timeline
  types.ts             Shared TypeScript types
.github/workflows/    GitHub Actions CI/CD for GitHub Pages
```

## Customizing

- **Add a model**: add an entry to `lib/models.ts`. Give it a `moe` field
  to show the mixture-of-experts routing visualization.
- **Change vocabulary size / dims**: `dModel`, `numLayers`, `numHeads` on
  each model preset in `lib/models.ts`. Keep `dModel` divisible by
  `numHeads`.
- **Change the candidate output vocabulary**: edit `CANDIDATE_VOCAB` in
  `lib/engine.ts`.
- **Adjust autoplay speed**: `AUTO_ADVANCE_MS` in `app/page.tsx`.
