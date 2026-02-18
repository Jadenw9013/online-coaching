import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse uses pdfjs-dist/legacy internally. Externalizing both ensures
  // Node.js resolves them from node_modules at runtime (avoids Turbopack
  // bundling the pdfjs worker file and triggering missing browser APIs).
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default nextConfig;
