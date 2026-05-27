import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発インジケーター（Nボタン）を右上に移動してログアウトボタンと被らないようにする
  devIndicators: {
    position: 'top-right',
  },
};

export default nextConfig;
