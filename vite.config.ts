import * as path from "path";

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr({ include: '**/*.svg' }), tsconfigPaths()],
  server: {
    host: true,
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  preview: {
    allowedHosts: ["winection.kro.kr", "www.winection.kro.kr"],
  }
})