import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import studentsRouter from "./routes/students.js";
dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/students", studentsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Quiz Admin Backend' });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-admin';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
}

start();
