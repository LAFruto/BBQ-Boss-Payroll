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
  // needs fixing
  const query = `SELECT id, emp_fname, emp_mname, emp_lname from tbl_employees`;

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

// 

// Find user by Search
exports.find = (req, res) => { 
  const query = `SELECT * FROM tbl_employees WHERE "emp_fname" ILIKE $1 
  OR "emp_lname" ILIKE $1 
  OR "emp_mname" ILIKE $1 
  OR "emp_lname" ILIKE $1 
  OR "email" ILIKE $1 
  OR "sss_no" ILIKE $1 
  OR "philhealth_no" ILIKE $1 
  OR "pagibig_no" ILIKE $1`;

  // filtering through dates needs parsing, utmost caution is advised

  let searchTerm = req.body.search
  
  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log('Connected as ID ' + connection.threadId);

    // User the connection
    connection.query(query, ['%' + searchTerm + '%'], (err, { rows }) => {
      console.log(`searchTerm`);
      // When done with the connection, release it
      connection.release();
      
      if(!err) {
        res.render('employee', { rows: rows, searchValue: searchTerm })
      } else {
        console.log(err);
      }
      console.log('The data from filtered employees table: \n', rows);

    });
  });
}


