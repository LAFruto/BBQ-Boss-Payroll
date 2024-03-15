// const mysql = require('mysql');
const { Pool } = require("pg");

require("dotenv").config(); // Load environment variables from .env file

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
  const query = `SELECT 
  e.id AS employee_id,
  CONCAT(e.emp_fname, ' ', e.emp_lname) AS employee_name,
  d.dept_name AS department,
  p.name AS position,
  rc.rateclass_name AS rate_class,
  CONCAT('₱', p.salary_rate) AS salary_rate,
  TO_CHAR(e.date_hired, 'YYYY-MM-DD') AS date_hired
FROM 
  tbl_employees e
JOIN 
  tbl_positions p ON e.position_id = p.id
JOIN 
  tbl_departments d ON p.department_id = d.id
JOIN 
  tbl_rateclasses rc ON p.rateclass_id = rc.id
LEFT JOIN 
  tbl_emp_to_contacts etc ON e.id = etc.emp_id
ORDER BY
  e.id`;

  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log("Connected as ID " + connection.processID);

    connection.query(query, (err, { rows }) => {
      connection.release();

      if (!err) {
        res.render("employee", { rows: rows });
      } else {
        console.log(err);
      }
      
      console.log("The data from employee table: \n", rows);
    });
  });
};

// Find user by Search
exports.find = (req, res) => {
  const query = `SELECT 
  e.id AS employee_id,
  CONCAT(e.emp_fname, ' ', e.emp_lname) AS employee_name,
  d.dept_name AS department,
  p.name AS position,
  rc.rateclass_name AS rate_class,
  CONCAT('₱', p.salary_rate) AS salary_rate,
  TO_CHAR(e.date_hired, 'YYYY-MM-DD') AS date_hired
    FROM 
      tbl_employees e
    JOIN 
      tbl_positions p ON e.position_id = p.id
    JOIN 
      tbl_departments d ON p.department_id = d.id
    JOIN 
      tbl_rateclasses rc ON p.rateclass_id = rc.id
    LEFT JOIN 
      tbl_emp_to_contacts etc ON e.id = etc.emp_id
    WHERE 
      e.id ILIKE $1
      OR CONCAT(e.emp_fname, ' ', e.emp_lname) ILIKE $1
      OR d.dept_name ILIKE $1
      OR p.name ILIKE $1
      OR rc.rateclass_name ILIKE $1
      OR CONCAT('₱', p.salary_rate) ILIKE $1
      OR TO_CHAR(e.date_hired, 'YYYY-MM-DD') ILIKE $1`;

  // filtering through dates needs parsing, utmost caution is advised

  let searchTerm = req.body.search;

  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log("Connected as ID " + connection.threadId);

    // User the connection
    connection.query(query, ["%" + searchTerm + "%"], (err, { rows }) => {
      console.log(`searchTerm`);
      // When done with the connection, release it
      connection.release();

      if (!err) {
        res.render("employee", { rows: rows, searchValue: searchTerm });
      } else {
        console.log(err);
      }
      console.log("The data from filtered employees table: \n", rows);
    });
  });
};

exports.form = (req, res) => {
  res.render("add-employee");
};
