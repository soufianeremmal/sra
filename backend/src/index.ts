import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/routes';
import requestRoutes from './modules/requests/routes';
import { bikesGlobalRouter, bikesForRequestRouter } from './modules/bikes/routes';
import checklistRoutes from './modules/checklist/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sra';

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

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✓ SRA backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('✗ Failed to start:', err);
    process.exit(1);
  }
}

start();