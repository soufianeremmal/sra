import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';

// Set env vars BEFORE any code imports them
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.SLACK_SAMPLING_CHANNEL = '#test-sampling';
process.env.GMAIL_SAMPLING_ADDRESS = 'test-sampling@example.com';
process.env.SRA_BASE_URL = 'http://localhost:3000';

// Use a SEPARATE database from your dev DB (note: /sra_test at the end).
// Tests wipe collections after each test, so this DB is safe to blow away anytime.
const TEST_MONGO_URI = 'mongodb://localhost:27017/sra_test';

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
});

// After every test, wipe all collections so tests can't pollute each other
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});