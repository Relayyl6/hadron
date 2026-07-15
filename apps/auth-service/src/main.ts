import express from 'express';
import cors from "cors"
import { errorMiddleware } from '../../../packages/error-handler/error.middleware.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.route.js';
import swaggerUi from "swagger-ui-express"
const swaggerDocument = require("./swagger-output.json")

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser())

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.get("/docs-json", (req, res) => {
  res.json(swaggerDocument)
})

app.use("/auth", authRouter)

app.use(errorMiddleware)

const port = process.env.PORT || 6001;

const server = app.listen(port , () => {
  console.log(`[ auth serivce ready ] http://localhost:${port}/api/users`);
  console.log(`[ swagger docs ready ] available at http://localhost:${port}/api-docs`)
});

server.on("error", (err) => {
  console.error("Server Error:", err);
})