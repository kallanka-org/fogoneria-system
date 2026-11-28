import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` es solo para el Dockerfile (copia `.next/standalone`). En Vercel
  // rompe `onBuildComplete` con ENOENT de `next-server.js.nft.json` (Next 16.3 +
  // adapter de Vercel), así que allí se deja el output por defecto.
  output: process.env.VERCEL ? undefined : "standalone",
  // Paquetes del monorepo que se compilan dentro de Next (TypeScript directo).
  transpilePackages: ["@fogoneria/kernel", "@fogoneria/sdk", "@fogoneria/contracts"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Los términos del servicio se publican en la landing (el portal es interno).
  // Se mantiene el redirect para no romper enlaces viejos al portal.
  async redirects() {
    return [
      {
        source: "/terminos",
        destination: "https://fogoneria-landing.vercel.app/terminos/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
