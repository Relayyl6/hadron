import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '../../../packages/error-handler/error.middleware.js';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import authRouter from './routes/auth.route.js';
import paymentRouter from './routes/payment.route.js';
import shopRouter from './routes/shop.route.js';
import swaggerUi from 'swagger-ui-express';
const swaggerDocument = require('./swagger-output.json');

const app = express();

app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'x-csrf-token',
      'X-CSRF-Token',
    ], // Allowed both variants
    credentials: true,
  }),
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// 2. Setup CSRF Protection with Local Development Adjustments
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'your_secret_key',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: false,
    sameSite: 'lax', // <-- CHANGED from "strict" to allow cross-port requests on localhost
    secure: process.env.NODE_ENV === 'production', // false on localhost, true in production
  },
  getSessionIdentifier: (req) => req.cookies?.sessionId || 'stateless',
});

// 3. Create an endpoint so your frontend can fetch the CSRF token
app.get('/api/csrf-token', (req, res) => {
  /* #swagger.ignore = true */
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

// 4. Apply CSRF middleware to all routes below this line
app.use(doubleCsrfProtection);

app.get('/', (req, res) => {
  /* #swagger.ignore = true */
  res.send({ message: 'Hello API' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/docs-json', (req, res) => {
  /* #swagger.ignore = true */
  res.json(swaggerDocument);
});

app.use('/auth', authRouter);
app.use('/payment', paymentRouter);
app.use('/shop', shopRouter);

app.use(errorMiddleware);

const port = process.env.PORT || 6001;

const server = app.listen(port, () => {
  console.log(`[ auth service ready ] http://localhost:${port}`);
  console.log(
    `[ swagger docs ready ] available at http://localhost:${port}/api-docs`,
  );
});

server.on('error', (err) => {
  console.error('Server Error:', err);
});
