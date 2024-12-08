import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr({ include: 'src/*.svg' })],
  define: {
    'process.env.IS_PREACT': JSON.stringify('false')
  },
  resolve: {
    alias: {
      assert: 'assert'
    }
  }
});
