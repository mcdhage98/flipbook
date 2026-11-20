import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    config.resolve.alias["page-flip"] = path.join(
      process.cwd(),
      "node_modules/page-flip/dist/js/page-flip.module.js",
    );
    return config;
  },
};

export default nextConfig;
