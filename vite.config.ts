import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],
  
  // 🔧 Path aliases
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  
  // 🚀 Production optimizations
  build: {
    // Use esbuild for faster builds (terser not installed)
    minify: 'esbuild',
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    },
    // Target modern browsers
    target: 'esnext',
    // Source maps for debugging (optional)
    sourcemap: false
  },
  
  // 🔧 Esbuild options
  esbuild: {
    // Remove console.* in production
    drop: ['console', 'debugger'],
    // Minify identifiers
    minifyIdentifiers: true,
    // Minify syntax
    minifySyntax: true,
    // Minify whitespace
    minifyWhitespace: true
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1422,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1423,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: [
        "**/src-tauri/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/.git/**",
        "**/build/**"
      ],
      // 🔧 Dosya değişikliklerini topla, restart'ı azalt
      usePolling: false,
      // 🔧 Birden fazla dosya değişikliğini bekle
      awaitWriteFinish: {
        stabilityThreshold: 1000, // 1 saniye bekle
        pollInterval: 100
      }
    },
  },
}));
