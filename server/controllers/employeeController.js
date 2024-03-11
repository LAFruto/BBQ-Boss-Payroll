// const mysql = require('mysql');
const { Pool } = require('pg');

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
  const query = "SELECT emp_id, name, department, position, address, contact, email, DATE_FORMAT(date_hired, '%Y-%m-%d') AS date_hired FROM employees"

  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log("Connected as ID " + connection.threadId);
  
    connection.query(query, (err, rows) => {
      connection.release();
  
      if (!err) {
        res.render("employee", { rows });
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

