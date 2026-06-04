import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    proxy: {
      // Proxy API requests to backend. Configure options to better support
      // long-lived Server-Sent Events (SSE) connections used by /api/events.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // Allow very long-lived connections; prevent http-proxy from timing out
        timeout: 0,
        proxyTimeout: 0,
        // Prefer keep-alive to avoid intermediaries closing connections
        headers: {
          Connection: 'keep-alive',
        },
        configure(proxy) {
          // Ensure proxy forwards keep-alive header to the target
          proxy.on && proxy.on('proxyReq', (proxyReq) => {
            try { proxyReq.setHeader('Connection', 'keep-alive'); } catch (e) {}
          });
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
