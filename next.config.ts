import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/surec-yonetim-paneli",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
