const mysql = require("mysql");

const pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

exports.view = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Internal Server Error");
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.render("login", { layout: "loginLayout" });
  });
};

exports.authenticate = (req, res) => {
  const query = `SELECT * FROM users WHERE user=? AND password=?`;
  const { user, password } = req.body;
  
  pool.getConnection((err, connection) => {
    if (err) {
      throw err; 
    }

    connection.query(query, [user, password], (err, results) => {
      connection.release();

      if (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
      }

      if (results.length > 0) {
				console.log("Login successful");
        const userData = results[0];
        
        console.log(userData);
        
        req.session.user = userData.user; // Set user session variable
        req.session.account_type = userData.account_type; // Set role session variable
        
        res.redirect("/dashboard");
      } else {
				res.render("login", { alert: 'Incorrect login details', layout: "loginLayout" } )
				console.log("Login failed");
      }
    });
  });
};