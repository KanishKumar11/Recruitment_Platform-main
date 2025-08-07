import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "**/.next/**",
      ],
    },
  },
  css: {
    postcss: null,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/app": resolve(__dirname, "./src/app"),
      "@/components": resolve(__dirname, "./src/app/components"),
      "@/lib": resolve(__dirname, "./src/app/lib"),
      "@/models": resolve(__dirname, "./src/app/models"),
      "@/store": resolve(__dirname, "./src/app/store"),
    },
  },
});
