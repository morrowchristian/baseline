import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cache Components is off: pages read from SQLite on every request, so
     they render dynamically (classic behavior). Server actions revalidate
     paths after each create. */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
