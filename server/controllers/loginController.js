// const mysql = require('mysql');
const pgsql = require('pg');

const pool = pgsql.createPool({
  max: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

exports.view = (req, res) => {
  res.render("login", { layout: "loginLayout" });
};

exports.authenticate = (req, res) => {
  const query = `SELECT * FROM users WHERE user=? AND password=?`;
  const { user, password } = req.body;
  
  pool.connect((err, connection) => {
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
        res.redirect("/dashboard");
      } else {
				res.render("login", { alert: 'Incorrect login details', layout: "loginLayout" } )
				console.log("Login failed");
      }
    });
  });
};
