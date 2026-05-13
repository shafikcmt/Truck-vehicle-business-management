const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    // Keep Turbopack rooted inside this frontend app even if another lockfile
    // exists higher up in C:\\Users or a parent folder.
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
