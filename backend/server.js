const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const initialRoutes = require('./routes/index.route');
const cors = require('cors');
const morgan = require('morgan');
dotenv.config();

connectDB();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.ANDROID_CLIENT_URL || 'http://10.0.2.2:5000',
    'http://localhost:3000',
    'http://localhost:5173',  // Vite default port
    'http://127.0.0.1:5173',  // Alternative localhost
    'http://10.0.2.2:5000'
  ],
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added PATCH method
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
// Routes
initialRoutes(app);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});