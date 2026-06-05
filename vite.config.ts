import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only: emulate the /api/upload serverless function so image uploads to
// Vercel Blob work under `vite dev` (Vite doesn't run /api functions).
// The RW token stays server-side, inside this middleware closure — it is
// never sent to the browser.
function vercelBlobUploadDev(token: string): Plugin {
  return {
    name: 'vercel-blob-upload-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/upload', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');

          const { handleUpload } = await import('@vercel/blob/client');
          const jsonResponse = await handleUpload({
            body,
            token,
            request: { headers: req.headers } as any,
            onBeforeGenerateToken: async () => ({
              allowedContentTypes: [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/gif',
                'image/avif',
                'image/svg+xml',
              ],
              addRandomSuffix: true,
              maximumSizeInBytes: 10 * 1024 * 1024,
            }),
            onUploadCompleted: async () => {},
          });

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(jsonResponse));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: (error as Error).message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), vercelBlobUploadDev(env.BLOB_READ_WRITE_TOKEN)],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID),
      'process.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID),
      'process.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(env.FIREBASE_MEASUREMENT_ID),
      'process.env.AMPLITUDE_API_KEY': JSON.stringify(env.AMPLITUDE_API_KEY),
      'process.env.AMPLITUDE_SERVER_ZONE': JSON.stringify(env.AMPLITUDE_SERVER_ZONE),
      // NOTE: BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID are intentionally NOT
      // exposed here — they are server-side only (api/upload + dev middleware).
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      modulePreload: false,
      cssCodeSplit: true,
    },
  };
});
