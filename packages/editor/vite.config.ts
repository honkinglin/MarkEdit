import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index', cssFileName: 'style' },
    rollupOptions: {
      external: (id) =>
        id === './math.css' || (!id.startsWith('.') && !id.startsWith('/') && !id.endsWith('.css')),
    },
  },
});
