import * as path from "path";
// import fs from "fs";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

const unityCacheControlPlugin = () => ({
  name: 'unity-cache-control',
  configureServer(server: { middlewares: { use: (arg0: (req: any, res: any, next: any) => void) => void; }; }) {
    server.middlewares.use((req, res, next) => {
      if (
        req.url?.endsWith('.data') ||
        req.url?.endsWith('.wasm') ||
        req.url?.endsWith('.framework.js')
      ) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({ include: '**/*.svg' }),
    tsconfigPaths(),
    unityCacheControlPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['winection.ico', 'winection.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50MB
      },
      manifest: {
        name: 'Winection',
        short_name: 'Winection',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icons/winection_192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/winection_512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    /*
    https: {
      key: fs.readFileSync("./mkcert/key.pem"),
      cert: fs.readFileSync("./mkcert/cert.pem"),
    },
    */
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