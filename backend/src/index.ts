import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/routes';

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