/** @type {import('next').NextConfig} */

const basePath = process.env.PAGES_BASE_PATH || '';

const nextConfig = {
  output: 'export',

  basePath,

  assetPrefix: basePath ? `${basePath}/` : '',

  trailingSlash: true,

  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;