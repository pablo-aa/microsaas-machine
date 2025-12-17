import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garantir que rotas dinâmicas funcionem no Vercel
  experimental: {
    // Desabilitar otimizações que podem causar problemas com rotas dinâmicas
  },
};

export default nextConfig;
