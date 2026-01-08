// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     unoptimized: false,
//     remotePatterns: [],
//   },
// };

// export default nextConfig;

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

export default nextConfig;