// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     unoptimized: false,
//     remotePatterns: [],
//   },
// };

// export default nextConfig;

import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
      return [
          {
              source: "/_next/:path*",
              headers: [
                  { key: "Access-Control-Allow-Origin", value: "https://fell-saint-advisor-align.trycloudflare.com" },
              ],
          },
      ];
  },
};


// const analyzer = withBundleAnalyzer({
//     enabled: process.env.ANALYZE === 'true',
//   });
  
//   export default analyzer(nextConfig);
export default nextConfig;
