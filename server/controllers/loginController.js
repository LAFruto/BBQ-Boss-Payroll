// const mysql = require('mysql');
const { Pool } = require('pg');

require('dotenv').config(); // Load environment variables from .env file

const pool = new Pool({
  max: 100,
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
  const query = `SELECT * FROM users WHERE "user" = $1 AND "password" = $2`;
  const { user, password } = req.body;

  pool.connect((err, connection) => {
    if (err) {
      throw err; 
    }

    connection.query(query, [user, password], (err, { rows }) => {

      console.log(rows);
      connection.release();

      if (err) {
        console.log(err);
        return res.status(500).send("Internal Server Error");
      }

      if (rows.length > 0) {
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