/** @type {import('next').NextConfig} */

// GitHub Pages deployment support
// Example:
// https://username.github.io/llm-lab/

const repo = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split('/')[1]
  : 'llm-lab';

const isGhPages = process.env.GITHUB_ACTIONS === 'true';

const basePath = isGhPages ? `/${repo}` : '';

const nextConfig = {
  // Required for GitHub Pages (static export)
  output: 'export',

  // Deploy under /repository-name
  basePath,

  // Fix JS/CSS/image asset paths
  assetPrefix: basePath ? `${basePath}/` : '',

  // GitHub Pages works better with .html URLs
  trailingSlash: true,

  // Next Image optimization does not work on GitHub Pages
  images: {
    unoptimized: true,
  },

  // Optional: expose base path to frontend
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;