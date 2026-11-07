import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:single` emits one self-contained index.html (JS, CSS and fonts inlined)
// into dist-single/, handy for sharing the dashboard as a single file.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
    build: {
      // Recharts is most of the bundle; one ~200 kB gzip chunk is fine for this app.
      chunkSizeWarningLimit: 900,
      ...(single ? { outDir: 'dist-single' } : {}),
    },
  };
});
