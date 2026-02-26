import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      // Browser polyfills for simple-peer (WebRTC)
      // Without these, Vite externalizes Node.js built-ins and
      // simple-peer's EventEmitter breaks → peer.on('signal') never fires
      events: 'events',
      util: 'util',
      stream: 'readable-stream',
    },
  },
})
