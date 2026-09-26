import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import initialiseConfig from './libs/initializeSiteConfig';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const app = express();

// --- 1. Security & Basics ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'x-csrf-token',
      'X-CSRF-Token',
    ],
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(cookieParser());
app.set('trust proxy', 1);

// NOTE: Avoid global app.use(express.json()) *before* proxies if it interferes with body streaming,
// or use it strictly on routes that don't get proxied.
// express-http-proxy handles the raw body streaming for us.
const bodyLimit = process.env.BODY_LIMIT || '50mb';

// --- 2. Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: AuthenticatedRequest) => (req.user ? 1000 : 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later!' },
});
app.use(limiter);

// --- 3. Health Check ---
app.get('/api/gateway-health', (req: Request, res: Response) => {
  res.send({ status: 'OK', service: 'API Gateway' });
});

// --- 4. Microservice Routing with Proxy Options ---
const proxyOptions = {
  limit: bodyLimit,
  proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => {
    // Forward the x-csrf-token header down to the microservice
    if (srcReq.headers['x-csrf-token']) {
      proxyReqOpts.headers['x-csrf-token'] = srcReq.headers['x-csrf-token'];
    }
    // Forward cookies (including the csrf cookie) down to the microservice
    if (srcReq.headers['cookie']) {
      proxyReqOpts.headers['cookie'] = srcReq.headers['cookie'];
    }
    return proxyReqOpts;
  },
  changeOrigin: true,
};

app.use(
  '/api/users',
  proxy(
    process.env.USER_SERVICE_URL || 'http://localhost:6001', 
    proxyOptions
  ),
);
app.use(
  '/api/products',
  proxy(
    process.env.PRODUCT_SERVICE_URL || 'http://localhost:6002',
    proxyOptions,
  ),
);

// --- 5. Error Handling ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Gateway Error:', err);
  if (res.headersSent) return next(err);
  res.status(err?.status || 500).json({ error: 'Internal Server Error' });
});

// --- 6. Server & Graceful Shutdown ---
const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`🚀 API Gateway running at http://localhost:${port}/api`);
  try {
    initialiseConfig();
    console.log('Site configuration initialised successfully');
  } catch (error) {
    console.error('Failed to initialise site configuration', error);
  }
});
server.on('error', console.error);

const shutdown = (signal: string) => {
  console.log(`\nReceived ${signal}, closing gateway...`);
  server.close((err?: Error) => {
    if (err) {
      console.error('Error during gateway close', err);
      process.exit(1);
    }
    console.log('Gateway closed safely');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
