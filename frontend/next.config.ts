import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
    ],
  },

  // Requerido en Next.js 16: declarar turbopack aunque sea vacío
  // Turbopack maneja módulos browser-only (canvg, html2canvas) de forma nativa
  turbopack: {},

  // Fallback webpack para cuando se use con --webpack
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "canvg",
        "html2canvas",
        "dompurify",
      ];
    }
    return config;
  },
};

export default nextConfig;
