import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // logos de marca subidos por cada instituto (ver /admin, upload de branding) viven en
    // Vercel Blob — mismo store que ya se usa para materiales/galería.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
