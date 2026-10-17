import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import productFinderRoutes from './routes/productFinderRoutes.js';

dotenv.config();

const app = express();

// CORS: only the BIXA storefront (plus any extra origins in CORS_ORIGINS, comma-separated — e.g. the
// store's *.myshopify.com domain) may call the API from a browser. Local dev hosts are allowed
// outside production. Requests with no Origin header (curl, server-to-server) aren't affected.
const allowedOrigins = [
  'https://bixabotanical.in',
  'https://www.bixabotanical.in',
  ...(process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)
];
const devOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    const allowed = !origin
      || allowedOrigins.includes(origin)
      || (process.env.NODE_ENV !== 'production' && devOrigins.includes(origin));
    // Disallowed origins get no CORS headers (browser blocks the response) rather than a 500.
    callback(null, allowed);
  }
}));

app.use(express.json());

// Basic Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BIXA Product Finder Backend API',
    timestamp: new Date().toISOString()
  });
});

// Register Product Finder API Routes
app.use('/product-finder', productFinderRoutes);
app.use('/api/product-finder', productFinderRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Helper function to start server with fallback port handling
const startServer = (desiredPort) => {
  let port = parseInt(desiredPort, 10) || 5000;

  const server = app.listen(port, () => {
    console.log(`🌿 BIXA Product Finder API Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`API endpoints: http://localhost:${port}/product-finder/categories`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️ Port ${port} is currently in use. Attempting fallback port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server failed to start:', err);
    }
  });
};

// Auto start if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer(process.env.PORT || 5000);
}

export default app;
