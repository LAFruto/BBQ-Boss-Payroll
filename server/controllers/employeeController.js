// const mysql = require('mysql');
const { Pool } = require('pg');

require('dotenv').config(); // Load environment variables from .env file

// Connection Pool
const pool = new Pool({
  max: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// exports.view = (req, res) => {
//     res.render("employee");
// };

exports.view = (req, res) => {
  // needs fixing
  const query = `SELECT id, emp_fname, emp_mname, emp_lname from employee`;

  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log("Connected as ID " + connection.processID);
  
    connection.query(query, (err, { rows }) => {
      connection.release();
  
      if (!err) {
        res.render("employee", {rows: rows});
      } else {
        console.log(err);
      }
      console.log("The data from employee table: \n", rows);
    });
  });
};

exports.form = (req, res) => {
  res.render('add-employee')
};

// exports.view = (req, res) => {
//     res.render("employee");
// };

