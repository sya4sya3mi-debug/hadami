/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  experimental: {
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = [...(config.externals || []), "@resvg/resvg-js"];
    }
    config.module.rules.push({ test: /\.node$/, use: "ignore-loader" });
    return config;
  },
  images: {
    // Intentionally disabled: product images are served through authenticated API routes.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-76f5a75f96bf42b19e32eaa1edd58300.r2.dev",
        pathname: "/**",
      },
    ],
    formats: ["image/webp"],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          // CSP is set dynamically in middleware.ts (nonce-based)
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
