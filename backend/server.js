import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import studentsRouter from './routes/students.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/students', studentsRouter);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Quiz Admin Backend' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
}

start();
