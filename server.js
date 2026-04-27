import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Hostinger Node.js environments usually provide process.env.PORT
  const PORT = process.env.PORT || 3000;

  // Add API routes here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Determine environment
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode with Vite
    console.log('Starting in Development Mode');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode - serve static files from 'public' folder
    // Note: Vite will be configured to output its build to the 'public' folder
    console.log('Starting in Production Mode');
    const publicPath = path.join(__dirname, 'public');
    
    app.use(express.static(publicPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
