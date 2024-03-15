// const mysql = require('mysql');
const { Pool } = require("pg");
const multer = require('multer');
const xlsx = require('xlsx');

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
          WHEN EXTRACT(HOUR FROM dtr.end_time - dtr.start_time) > 8 THEN ROUND((EXTRACT(HOUR FROM dtr.end_time - dtr.start_time) - 8) + (EXTRACT(MINUTE FROM dtr.end_time - dtr.start_time) / 60), 2)
          ELSE 0
        END AS overtime_hours,
        CASE 
          WHEN EXTRACT(HOUR FROM dtr.end_time) < 22 AND EXTRACT(HOUR FROM dtr.end_time) < 2 THEN 
            ROUND(((EXTRACT(HOUR FROM dtr.end_time - '22:00:00') + EXTRACT(MINUTE FROM dtr.end_time - '22:00:00') / 60) + 23), 2)
          WHEN EXTRACT(HOUR FROM dtr.end_time) > 22 THEN 
            ROUND(((EXTRACT(HOUR FROM dtr.end_time - '22:00:00') + EXTRACT(MINUTE FROM dtr.end_time - '22:00:00') / 60)), 2)
          ELSE 
            0
        END AS night_differential_hours,
        CASE 
          WHEN EXTRACT(HOUR FROM dtr.end_time) < EXTRACT(HOUR FROM dtr.start_time) THEN 
            ROUND(((EXTRACT(HOUR FROM '24:00:00' - dtr.start_time) + EXTRACT(MINUTE FROM '24:00:00' - dtr.start_time) / 60) + (EXTRACT(HOUR FROM dtr.end_time) + EXTRACT(MINUTE FROM dtr.end_time) / 60)), 2)
          ELSE
            ROUND(((EXTRACT(HOUR FROM dtr.end_time - dtr.start_time) + EXTRACT(MINUTE FROM dtr.end_time - dtr.start_time) / 60)), 2)
        END AS total_hours
      FROM 
        tbl_daily_time_records AS dtr
      INNER JOIN tbl_employees AS e ON dtr.emp_id = e.id
      INNER JOIN tbl_branches AS b ON dtr.branch_id = b.id
      INNER JOIN tbl_addresses AS a ON b.address_id = a.id
      WHERE 
        dtr.date_id = $1`;

      connection.query(dtrQuery, [dateId], (err, { rows }) => {
        connection.release();
        if (!err) {
          res.render("timekeeping", { rows: rows, selectedDate });
          console.log(rows);
        } else {
          console.log(err);
        }
      });
    });
  });
};

exports.submit = async (req, res) => {
  const { branch } = req.body;

  let branch_id = null;

  switch (branch) {
    case "Quirino":
      branch_id = 10;
      break;
    case "Lanang":
      branch_id = 11;
      break;
    case "Matina":
      branch_id = 12;
      break;
    case "Quimpo":
      branch_id = 13;
      break;
  }

  if (!req.file) {
    res.render('add-timesheet', { alert: 'No file uploaded' });
    return;
  }

  const workbook = xlsx.readFile(req.file.path);
  const sheetName = workbook.SheetNames[0];
  let jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  const headers = jsonData[0].map(header => header.replace(/\s/g, '_'));
  jsonData = jsonData.slice(1);

  // Convert to JSON object with modified headers
  jsonData = jsonData.map(row => {
    const newRow = {};
    headers.forEach((header, index) => {
      newRow[header] = row[index];
    });
    return newRow;
  });

  // Format time and date
  jsonData.forEach(row => {
    row.Time = formatTime(row.Time);
    row.Date = formatDate(row.Date);
  });

  // Generate daily time records
  const dtrList = generateDailyTimeRecords(jsonData);

  let totalRows = dtrList.length;
  let counter = 0;

  for (const dtr of dtrList) {
    const { First_Name, Last_Name, Emp_ID, Date, Start_Time, End_Time } = dtr;

    try {
      const client = await pool.connect();

      try {
        // Get date_id from tbl_dates
        const dateQuery = 'SELECT id FROM tbl_dates WHERE date = $1';
        const dateResult = await client.query(dateQuery, [Date]);

        if (dateResult.rows.length === 0) {
          console.error('Date not found in tbl_dates');
          // Handle error: Date not found
          continue; // Skip to next iteration
        }

        const date_id = dateResult.rows[0].id;

        // Insert record into tbl_daily_time_records
        const insertQuery = `
          INSERT INTO tbl_daily_time_records (emp_id, date_id, branch_id, status_id, hasot, hasbreak, start_time, end_time)
          VALUES ($1, $2, $3, 2, false, false, $4, $5)
        `;

        const values = [Emp_ID, date_id, branch_id, Start_Time, End_Time];
        await client.query(insertQuery, values);

        console.log('Record inserted successfully');
        counter++;
      } finally {
        client.release(); // Release client after each query execution
      }
    } catch (error) {
      console.error('Error inserting record:', error);
      // Handle insertion error
    }
  }

  console.log("Expected Records: " + totalRows);
  console.log("Inserted Records: " + counter);

  res.render('add-timesheet', { alert: 'File uploaded to Database' });
};

function formatTime(timeString) {
  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = hoursStr.padStart(2, '0');
  const minutes = minutesStr.padStart(2, '0');
  return `${hours}:${minutes}:00`;
}

function formatDate(dateString) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [day, monthStr, year] = dateString.split('-');
  const month = (months.indexOf(monthStr) + 1).toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function findClosestTime(times, targetTime) {
  const toSeconds = time => time.split(':').reduce((acc, curr, index) => acc + curr * Math.pow(60, 2 - index), 0);
  const targetTotalSeconds = toSeconds(targetTime);
  let closestTime, minDifference = Infinity;
  for (const time of times) {
      const totalSeconds = toSeconds(time);
      const difference = Math.abs(targetTotalSeconds - totalSeconds);
      if (difference < minDifference) {
          minDifference = difference;
          closestTime = time;
      }
  }
  return closestTime;
}

function generateDailyTimeRecords(inputData) {
  const dtr = [];
  let currentEmpID = null, currentDate = null, dateList = null;
  const toSeconds = time => time.split(':').reduce((acc, curr, index) => acc + curr * Math.pow(60, 2 - index), 0);
  inputData.forEach(entry => {
      if (entry.Emp_ID !== currentEmpID || entry.Date !== currentDate) {
          currentEmpID = entry.Emp_ID;
          currentDate = entry.Date;
          let end = null;

          const start = inputData.find(e => e.Emp_ID === entry.Emp_ID && e.Date === entry.Date && toSeconds(e.Time) >= toSeconds('06:00:00'));
          dateList = inputData.filter(e => e.Emp_ID === entry.Emp_ID).map(entry => entry.Date);

          const nextDate = dateList.find(e => e > entry.Date);
          const nextDateEntries = inputData.filter(e => e.Emp_ID === entry.Emp_ID && e.Date === nextDate && toSeconds(e.Time) <= toSeconds('02:00:00'));
          
          if (nextDateEntries.length > 0)
              end = findClosestTime(nextDateEntries.map(row => row.Time), '01:30:00'); // look for entry close to end of shift
          else {
              const currentDateEntries = inputData.filter(e => e.Emp_ID === entry.Emp_ID && e.Date === entry.Date);
              end = findClosestTime(currentDateEntries.map(row => row.Time), '24:00:00'); // look for entry close to midnight
          }
          if (start !== undefined)
              dtr.push({ First_Name: entry.First_Name, Last_Name: entry.Last_Name, Emp_ID: entry.Emp_ID, Date: entry.Date, Start_Time: start.Time, End_Time: end });
      }
  });
  return dtr;
}
