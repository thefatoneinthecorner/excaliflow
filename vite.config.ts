import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import rawPlugin from 'vite-raw-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr({ include: 'src/*.svg' }), rawPlugin({ fileRegex: /\.md$/ })],
  base: '/excaliflow/',
  define: {
    'process.env.IS_PREACT': JSON.stringify('false')
  },
  resolve: {
    alias: {
      assert: 'assert'
    }
  }
});
