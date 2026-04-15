import 'dotenv/config';

// Debug logging for environment variables (runs after imports, but env is already loaded)
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ Warning: .env file might not be loaded correctly or GEMINI_API_KEY is missing.');
} else {
  console.log('✅ Environment variables loaded successfully');
}

import './server/firebaseAdmin.js'; // Initialize Firebase Admin first

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Import routes
import authRoutes from './server/routes/authRoutes.js';
import skillRoutes from './server/routes/skillRoutes.js';
import resumeRoutes from './server/routes/resumeRoutes.js';
import jobRoutes from './server/routes/jobRoutes.js';
import chatRoutes from './server/routes/chatRoutes.js';
import errorHandler from './server/middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for rate limiting behind load balancers/iframes
  app.set('trust proxy', 1);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Middleware
  app.use(helmet({ 
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false // Disable CSP for development with Vite
  }));
  
  // Update CORS to be more specific for the AI Studio environment
  const allowedOrigins = [
    process.env.APP_URL,
    'https://ais-dev-ro4pdk5kq3c23wguss3p46-233873514766.asia-east1.run.app',
    'https://ais-pre-ro4pdk5kq3c23wguss3p46-233873514766.asia-east1.run.app'
  ].filter(Boolean) as string[];

  app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Serve uploaded files BEFORE other middleware to ensure it's not caught by Vite or limiter
  const uploadsDir = process.env.UPLOAD_PATH
    ? path.resolve(process.env.UPLOAD_PATH)
    : path.join(__dirname, 'uploads');
  
  console.log(`Serving uploads from: ${uploadsDir}`);
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use('/api/', limiter);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/skills', skillRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/chat', chatRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CareerSync API is running', timestamp: new Date() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
