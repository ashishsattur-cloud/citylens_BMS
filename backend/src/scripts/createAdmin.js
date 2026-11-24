import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import User from '../models/User.js';
const [emailArg, password, ...nameParts] = process.argv.slice(2);
if (!emailArg || !password || !nameParts.length) {
  console.error('Usage: npm run create-admin -- admin@example.com StrongPassword "Admin Name"');
  process.exit(1);
}
if (password.length < 12) { console.error('Use an admin password of at least 12 characters.'); process.exit(1); }
try {
  await connectDatabase();
  await User.createIndexes();
  const email = emailArg.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate({ email }, { $set: { name: nameParts.join(' '), passwordHash, role: 'admin' } }, { upsert: true, new: true, runValidators: true });
  console.log(`Administrator account ready: ${user.email}`);
} catch (e) { console.error(e); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
