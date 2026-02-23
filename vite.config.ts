// @ts-nocheck
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    // --- Plugin Customizado para mostrar o IP da Rede Wi-Fi ---
    {
      name: 'log-wifi-ip',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          const hostIp = process.env.HOST_IP;
          if (hostIp) {
            // Um pequeno delay para imprimir logo abaixo das mensagens padrões do Vite
            setTimeout(() => {
              // Como você usa o basicSsl, forçamos o https na exibição
              console.log(`  ➜  Wi-Fi (Mobile): \x1b[1;36mhttps://${hostIp}:5173/\x1b[0m`);
            }, 100);
          }
        });
      }
    }
  ],
  server: {
    // HTTPS gerado pelo plugin basicSsl
    https: undefined,
    host: '0.0.0.0', // Permite acesso externo
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      // Em dev, o Vite precisa fazer proxy para as serverless functions.
      // Em produção, a Vercel cuida disso automaticamente.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  // --- ADICIONADO: Configuração de Code Splitting para Performance Máxima ---
  build: {
    // Deixamos o Vite gerenciar os chunks automaticamente para garantir 
    // que o Lazy Loading dos modais (Scanner/Cropper) funcione isoladamente.
  }
});