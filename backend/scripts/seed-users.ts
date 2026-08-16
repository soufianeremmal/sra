import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createUser } from '../src/modules/auth/service';
import { User } from '../src/modules/auth/model';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sra';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠  ${existingCount} users already exist. Aborting to avoid duplicates.`);
      console.log('   If you want to reset, drop the users collection first.');
      await mongoose.disconnect();
      process.exit(0);
    }

    await createUser({
      email: 'sampling@fifteen.eu',
      password: 'sampling123',
      role: 'sampling_admin',
      name: 'Sampling Team',
    });
    console.log('✓ Created sampling@fifteen.eu (role: sampling_admin)');

    await createUser({
      email: 'marketing@fifteen.eu',
      password: 'marketing123',
      role: 'marketing',
      name: 'Marketing Team',
    });
    console.log('✓ Created marketing@fifteen.eu (role: marketing)');

    console.log('\n✅ Seed complete. Passwords are for local dev only — never use these anywhere real.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Seed failed:', err);
    process.exit(1);
  }
}

seed();