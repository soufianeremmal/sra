import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/routes';
import requestRoutes from './modules/requests/routes';
import { bikesGlobalRouter, bikesForRequestRouter } from './modules/bikes/routes';
import checklistRoutes from './modules/checklist/routes';
import feedbackRoutes from './modules/feedback/routes';

dotenv.config();

// Build the Express app — no side effects (no DB connection, no listen).
// Tests import this and mount it directly with supertest.
export function buildApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'SRA backend', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/bikes', bikesGlobalRouter);
  app.use('/api/requests/:id/bikes', bikesForRequestRouter);
  app.use('/api/requests/:id/checklist', checklistRoutes);
  app.use('/api/feedback', feedbackRoutes);

  return app;
}

// Only start the real server + connect to real Mongo when this file is run directly
// (i.e., npm run dev), not when it's imported by a test.
async function start() {
  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sra';

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB connected');
    const app = buildApp();
    app.listen(PORT, () => {
      console.log(`✓ SRA backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✗ Failed to start:', err);
    process.exit(1);
  }
}

// This runs only when the file is executed directly (tsx watch src/index.ts),
// not when imported (from tests). require.main is Node's way of detecting this.
if (require.main === module) {
  start();
}
