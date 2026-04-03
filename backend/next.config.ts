import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // 显式指定根目录以消除重复 lockfile 的警告
    root: path.join(__dirname, "../"),
  },
};

export default nextConfig;
