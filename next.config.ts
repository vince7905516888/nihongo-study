import type { NextConfig } from "next";

const GAS_URL = "https://script.google.com/macros/s/AKfycbxCi-mIw3hBgUfBkEhSP_SqubTUGu4O9ZZqeUzYorSORLW8qozA1BUvyeFdH0ZehtuK/exec";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/gas",
        destination: GAS_URL,
      },
    ];
  },
};

export default nextConfig;
