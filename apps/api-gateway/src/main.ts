import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// Extend Express Request to include user for TypeScript
interface AuthenticatedRequest extends Request {
  user?: any; // Replace 'any' with your actual User interface
}

const app = express();

// --- 1. Security & Basics ---
app.use(helmet()); // Adds sensible default security headers
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.set("trust proxy", 1); // Trust first proxy if behind a load balancer

const bodyLimit = process.env.BODY_LIMIT || "10mb";
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ limit: bodyLimit, extended: true }));


// --- 2. Authentication ---
// Example: app.use(yourAuthMiddleware); 

// --- 3. Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: AuthenticatedRequest) => (req.user ? 1000 : 100),
  standardHeaders: true,
  legacyHeaders: false, // You can safely turn this off for newer APIs
  message: { error: "Too many requests. Please try again later!" },
  // keyGenerator: (req: Request) => req.ip as string
});
app.use(limiter);


// --- 4. Health Check ---
app.get('/api/gateway-health', (req: Request, res: Response) => {
  res.send({ status: 'OK', service: 'API Gateway' });
});


// --- 5. Microservice Routing ---
// Route specific paths to specific downstream microservices
app.use("/api/users", proxy(process.env.USER_SERVICE_URL || "http://localhost:6001"));
app.use("/api/products", proxy(process.env.PRODUCT_SERVICE_URL || "http://localhost:6002"));


// --- 6. Error Handling ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Gateway Error:', err);
  if (res.headersSent) return next(err);
  res.status(err?.status || 500).json({ error: 'Internal Server Error' });
});


// --- 7. Server & Graceful Shutdown ---
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`🚀 API Gateway running at http://localhost:${port}`);
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