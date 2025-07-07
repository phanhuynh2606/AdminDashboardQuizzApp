const express =  require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db'); // Import the database connection function
const initialRoutes = require('./routes/index.route'); // Import the initial routes
const cors = require('cors'); // Import CORS middleware

dotenv.config();

connectDB(); // Connect to MongoDB
const app = express();
app.use(express.json());
app.use(cors(
  {
    origin: '*', // Allow all origins, you can specify specific origins if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  }
)); // Use CORS middleware
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static('public')); // Serve static files from the 'public' directory


initialRoutes(app);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});