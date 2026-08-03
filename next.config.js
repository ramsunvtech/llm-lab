/** @type {import('next').NextConfig} */
const basePath = process.env.PAGES_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  basePath: basePath || undefined,          // empty string → undefined is safer
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;