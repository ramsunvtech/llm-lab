/** @type {import('next').NextConfig} */

// When building on GitHub Actions, GITHUB_REPOSITORY is auto-set to "owner/repo".
// We use the repo name as the basePath so assets resolve correctly on
// https://<owner>.github.io/<repo>/
const repo = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
const isGhActions = process.env.GITHUB_ACTIONS === 'true';
const basePath = isGhActions && repo ? `/${repo}` : '';

const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;
