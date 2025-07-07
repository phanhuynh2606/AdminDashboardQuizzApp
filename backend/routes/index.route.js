const authRoute = require("./auth.route")
const studentsRoute = require("./students.route")
const initialRoutes = (app) =>{
   app.get('/', (req, res) => {
      res.json({ message: 'Quiz Admin Backend' });
   });
   
   app.get("/auth", authRoute);
   app.get("/students", studentsRoute);

   // Add more routes here as needed
}

module.exports = initialRoutes;