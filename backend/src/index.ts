import express from 'express';
import cors from 'cors';
import { config } from './config';
import apiRouter from './routes/api.routes';
import './db/sqlite'; // Import to trigger SQLite DB init and seeding

const app = express();

app.use(cors({
  origin: '*', // For hackathon purposes, open access to all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Kaveri Crime Intelligence Backend' });
});

app.listen(config.PORT, () => {
  console.log(`===========================================================`);
  console.log(`Kaveri Crime Intelligence Backend is running on port ${config.PORT}`);
  console.log(`API base endpoint: http://localhost:${config.PORT}/api`);
  console.log(`===========================================================`);
});
