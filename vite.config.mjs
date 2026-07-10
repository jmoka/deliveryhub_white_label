import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000,
  },
  plugins: [tsconfigPaths(), react(), tagger()],
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    // true = permite qualquer IP/hostname (LAN, Cloudflare Tunnel, etc.)
    allowedHosts: true,
    proxy: {
      // Backend NestJS
      '/api': {
        target: 'http://148.230.76.22:3000/projects/app_desenvolvimento/app/server_delivery:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Supabase local — proxeado para funcionar via IP de rede (LAN/Tunnel)
      // Sem isso, VITE_SUPABASE_URL=127.0.0.1 quebra em outros dispositivos
      '/rest/v1': { target: 'http://127.0.0.1:54331', changeOrigin: true },
      '/auth/v1': { target: 'http://127.0.0.1:54331', changeOrigin: true },
      '/storage/v1': { target: 'http://127.0.0.1:54331', changeOrigin: true },
      '/realtime/v1': { target: 'http://127.0.0.1:54331', changeOrigin: true, ws: true },
    }
  }
});