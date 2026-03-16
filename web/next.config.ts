import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PINATA_API_KEY:
      process.env.NEXT_PUBLIC_PINATA_API_KEY || "71a164c7ab05f08ee6cd",
    NEXT_PUBLIC_PINATA_SECRET_KEY:
      process.env.NEXT_PUBLIC_PINATA_SECRET_KEY ||
      "e7a0d6d386755bb582d3d60a5c2e1102eaf01e25371e6c559b2d2ec312e8af8c",
  },
};

export default nextConfig;
