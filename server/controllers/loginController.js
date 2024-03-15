const { Pool } = require('pg');

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
  const query = `SELECT * FROM tbl_accounts WHERE "username" = $1 AND "password" = $2`;
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

        const userData = rows[0]
        
        console.log(userData);
        console.log(userData.username);
        console.log(userData.acc_type);
        
        req.session.username = userData.username;
        req.session.acc_type = userData.acc_type;
        
        res.redirect("/timekeeping");
      } else {
				res.render("login", { alert: 'Incorrect login details', layout: "loginLayout" } )
				console.log("Login failed");
      } 
    });
  });
};