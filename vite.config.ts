import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const partnerApiUrl = process.env.PARTNER_API_URL ?? 'https://mimo-partner-api-222552461205.us-central1.run.app';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/partner-proxy': {
        target: partnerApiUrl,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/partner-proxy/, ''),
      },
    },
  },
});
