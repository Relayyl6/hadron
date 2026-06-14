import express from 'express';
import cors from "cors"

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true
  })
);

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

const port = process.env.PORT || 6001;

const server = app.listen(port , () => {
  console.log(`[ auth serivce ready ] http://localhost:${port}/api/users`);
});

server.on("error", (err) => {
  console.error("Server Error:", err);
})