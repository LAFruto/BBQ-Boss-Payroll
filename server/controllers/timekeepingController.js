// const mysql = require('mysql');
const { Pool } = require("pg");

// Connection Pool
const pool = new Pool({
  max: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

exports.view = (req, res) => {
  checkAndCreatePayrolls();

  const currentDate = new Date();
  const selectedDate = new Date(
    currentDate.getTime() - currentDate.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  fetchSelectedDate(selectedDate, res);
};

exports.date = (req, res) => {
  selectedDate = req.body.timekeeping_date;
  fetchSelectedDate(selectedDate, res);
};

exports.form = (req, res) => {
  res.render("add-timesheet");
};

exports.record_form = (req, res) =>  {

  const query = `
  SELECT b.id AS branch_id, a.address AS branch_name
  FROM tbl_branches AS b
  INNER JOIN tbl_addresses AS a ON b.address_id = a.id
`;

  pool.connect((err, connection) => {
    if (err) throw err;


    connection.query(query, (err, { rows }) => {
      connection.release();

      console.log(rows);

      if(!err) {
        res.render('add-record', { rows } );
      } else {
        console.log(err)
      }
    })
  })

};

exports.record_create = (req, res) =>  {
  const { employee_id, record_date, branch_id, record_start_time, record_end_time } = req.body;
  
  console.log(employee_id);
  console.log(record_date.toString());
  console.log(branch_id);
  console.log(record_start_time);
  console.log(record_end_time)

  const dateQuery = `SELECT * FROM tbl_dates WHERE date = $1`;

  pool.connect((err, connection) => {
    if (err) throw err;
    
    connection.query(dateQuery, [record_date], (err, { rows }) => {
      connection.release();

      if(!err) {

        const date_id = rows[0].id;    
        console.log(date_id);

        pool.connect((err, connection) => {

          const DTRquery = `INSERT INTO tbl_daily_time_records (emp_id, date_id, branch_id, status_id, hasOT, hasBreak, start_time, end_time)
          VALUES ($1, $2, $3, 2, false, false, $4, $5)`;
          if (err) throw err;
          
          connection.query(DTRquery, [employee_id, date_id, branch_id, record_start_time, record_end_time], (err, { rows }) => {
            connection.release();
      
            if(!err) {
              res.redirect('/timekeeping');
            } else {
              console.log(err);
            }
          });
        });

      } else {
        console.log(err);
      }
    });
  });
};

exports.record_edit = (req, res) =>  {
  const branchQuery = `
    SELECT b.id AS branch_id, a.address AS branch_name
    FROM tbl_branches AS b
    INNER JOIN tbl_addresses AS a ON b.address_id = a.id
  `;

  pool.connect((err, connection) => {
    if (err) throw err;
    connection.query(branchQuery, (err, branches) => {
      connection.release();

      console.log(branches);
      
      if(!err) {
        pool.connect((err, connection) => {
          if (err) throw err;
          const query = `
          SELECT dtr.id AS dtr_id, dtr.*, b.*, a.*
          FROM tbl_daily_time_records AS dtr
          INNER JOIN tbl_branches AS b ON dtr.branch_id = b.id
          INNER JOIN tbl_addresses AS a ON b.address_id = a.id
          WHERE dtr.id = $1
        `;
        
          connection.query(query, [req.params.id],(err, { rows } ) => {
            connection.release();
            
            if(!err) {
              res.render('edit-record', { rows });
            } else {
              console.log(err)
            }
          })
        })
        
      } else {
        console.log(err)
      }
    })
  })
};

exports.record_update  = (req, res) => {
  
  console.log("HELLOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
  const { branch_id, start_time, end_time } = req.body;
  console.log(branch_id);
  console.log(start_time);
  console.log(end_time);
  console.log(req.params.id);

  const query = `UPDATE tbl_daily_time_records SET branch_id = $1, start_time = $2, end_time = $3 WHERE id = $4`;

  pool.connect((err, connection) => {
    if (err) throw err;
    connection.query(query, [branch_id, start_time, end_time, req.params.id ], (err) => {
      connection.release();

      if(!err) {
        
        pool.connect((err, connection) => {
          if (err) throw err;
          const query = `
          SELECT dtr.id AS dtr_id, dtr.*, b.*, a.*
          FROM tbl_daily_time_records AS dtr
          INNER JOIN tbl_branches AS b ON dtr.branch_id = b.id
          INNER JOIN tbl_addresses AS a ON b.address_id = a.id
          WHERE dtr.id = $1
        `;
        
          connection.query(query, [req.params.id], (err, { rows } ) => {
            connection.release();
            console.log(rows);

            if(!err) {
              res.render('edit-record', { rows });
            } else {
              console.log(err);
            }
          })
        })

      } else {
        console.log(err);
      }
    })
  })
}

exports.delete = (req, res) => {
  pool.connect((err, connection) => {
    if (err) throw err; 
    const query = `
      SELECT d.date
      FROM tbl_daily_time_records dtr 
      JOIN tbl_dates d ON d.id = dtr.date_id
      WHERE dtr.id = $1`;
      
    connection.query(query, [req.params.id], (err, { rows }) => {
      connection.release();
      if (err) throw err; 


      console.log(req.params.id);
      
      const date = rows[0].date;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
      const day = date.getDate().toString().padStart(2, '0');

      const selectedDate = `${year}-${month}-${day}`;

      pool.connect((err, connection) => {
        if (err) throw err;
        
        const deleteQuery = `
          DELETE FROM tbl_daily_time_records WHERE id = $1`;
        
    
        console.log("Connected as ID " + connection.processID);
    
        connection.query(deleteQuery, [req.params.id], (err) => {
          connection.release();

          if (!err) {
            fetchSelectedDate(selectedDate, res);
          } else {
            console.log(err);
          }
        });
      });
    });
  });
};

exports.approve = (req, res) => {
  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    const query = `
      SELECT d.date
      FROM tbl_daily_time_records dtr 
      JOIN tbl_dates d ON d.id = dtr.date_id
      WHERE dtr.id = $1`;

    connection.query(query, [req.params.id], (err, { rows }) => {
      connection.release();
      console.log(req.params.id);
      console.log(rows);

      const date = rows[0].date;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
      const day = date.getDate().toString().padStart(2, '0');

      const selectedDate = `${year}-${month}-${day}`;


      pool.connect((err, connection) => {
        if (err) throw err;
        const hasOT = req.body.hasOT === 'on'; 
        const hasBreak = req.body.hasBreak === 'on';

        console.log(hasOT, hasBreak);
        
        const updateQuery = `
          UPDATE tbl_daily_time_records
          SET status_id = 1, hasot = $2, hasbreak = $3
          WHERE id = $1`;
    
        console.log("Connected as ID " + connection.processID);
    
        connection.query(updateQuery, [req.params.id, hasOT, hasBreak], (err) => {
          connection.release();

          if (!err) {
            fetchSelectedDate(selectedDate, res);
          } else {
            console.log(err);
          }
        });
      });
    });
  });
};

async function checkAndCreatePayrolls() {
  try {
    // Fetch current period ID
    const currentPeriodQuery =
      "SELECT id FROM tbl_periods WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE";
    const currentPeriodResult = await pool.query(currentPeriodQuery);
    const currentPeriodId = currentPeriodResult.rows[0].id;

    // Fetch all active employees
    const employeesQuery = "SELECT id FROM tbl_employees WHERE status = $1";
    const employeesResult = await pool.query(employeesQuery, ["Active"]);
    const employees = employeesResult.rows;

    // Loop through each employee and check if they have a payroll instance for the current period
    for (const employee of employees) {
      const { id: empId } = employee;

      // Check if the employee already has a payroll instance for the current period
      const existingPayrollQuery =
        "SELECT COUNT(*) AS count FROM tbl_payrolls WHERE period_id = $1 AND emp_id = $2";
      const existingPayrollResult = await pool.query(existingPayrollQuery, [
        currentPeriodId,
        empId,
      ]);
      const existingPayrollCount = parseInt(
        existingPayrollResult.rows[0].count
      );

      // If no payroll instance exists for the employee and current period, create a new one
      if (existingPayrollCount === 0) {
        const attachPayrollQuery =
          "INSERT INTO tbl_payrolls (period_id, emp_id) VALUES ($1, $2)";
        await pool.query(attachPayrollQuery, [currentPeriodId, empId]);
      }
    }
  } catch (error) {
    console.error("Error checking and creating payrolls:", error);
    throw error;
  }
}

function fetchSelectedDate(selectedDate, res) {
  pool.connect((err, connection) => {
    if (err) throw err;

    const dateQuery = `
    SELECT * FROM tbl_dates WHERE date = $1`;

    connection.query(dateQuery, [selectedDate], (err, { rows }) => {
      if (err) throw err;

      const dateId = rows[0].id;
      const dtrQuery = `
		SELECT 
		dtr.id AS dtr_id,
		CONCAT(e.emp_fname, ' ', e.emp_lname) AS employee_name,
		a.address AS branch_name,
		TO_CHAR(dtr.start_time, 'HH24:MI') AS start_time,
		TO_CHAR(dtr.end_time, 'HH24:MI') AS close_time,
    dtr.hasot AS hasot,
    dtr.hasbreak AS hasbreak,
    dtr.status_id AS status,
		CASE 
			WHEN dtr.hasOT = false THEN 0
			WHEN EXTRACT(HOUR FROM dtr.end_time - dtr.start_time) > 8 THEN EXTRACT(HOUR FROM dtr.end_time - dtr.start_time) - 8
			ELSE 0
		END AS overtime_hours,
		CASE 
			WHEN dtr.end_time > '22:00' THEN EXTRACT(HOUR FROM dtr.end_time - '22:00')
			ELSE 0
		END AS night_differential_hours,
			EXTRACT(HOUR FROM dtr.end_time - dtr.start_time) AS total_hours
		FROM 
			tbl_daily_time_records AS dtr
		INNER JOIN tbl_employees AS e ON dtr.emp_id = e.id
		INNER JOIN tbl_branches AS b ON dtr.branch_id = b.id
		INNER JOIN tbl_addresses AS a ON b.address_id = a.id
		WHERE 
			dtr.date_id = $1;
        `;

      connection.query(dtrQuery, [dateId], (err, { rows }) => {
        connection.release();
        if (!err) {
          res.render("timekeeping", { rows: rows, selectedDate });
        } else {
          console.log(err);
        }
      });
    });
  });
};
