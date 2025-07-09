const authRoute = require("./auth.route");
const adminRoute = require("./admin.route");
const studentRoute = require("./student.route");

const initialRoutes = (app) => {
   app.get('/', (req, res) => {
      res.json({ 
         message: 'Quiz Admin Backend API',
         version: '1.0.0',
         endpoints: {
            auth: '/api/auth',
            admin: '/api/admin',
            student: '/api/student',
            students: '/api/students'
         }
      });
   });
   
   // Auth routes (public)
   app.use("/api/auth", authRoute);
   
   // Admin routes (web only)
   app.use("/api/admin", adminRoute);
   
   // Student routes (android only)
   app.use("/api/student", studentRoute);
   
}

module.exports = initialRoutes;