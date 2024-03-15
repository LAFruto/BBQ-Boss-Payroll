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

  fetchSelectedDate(selectedDate, res, req);
};

exports.date = (req, res) => {
  selectedDate = req.body.timekeeping_date;
  fetchSelectedDate(selectedDate, res, req);
};

exports.record_form = (req, res) => {

  const query = `
  SELECT b.id AS branch_id, a.address AS branch_name
  FROM tbl_branches AS b
  INNER JOIN tbl_addresses AS a ON b.address_id = a.id
`;

  pool.connect((err, connection) => {
    if (err) throw err;

    connection.query(query, (err, { rows }) => {
      connection.release();
      if (!err) {
        const alertMessage = req.query.alert;

        res.render('add-record', { rows, alert: alertMessage });
      } else {
        console.log(err)
      }
    })
  })
};

exports.day_type = (req, res) => {
  let now = new Date();
  if (req.body.timekeeping_date === null || req.body.timekeeping_date === undefined) {
    const currentDate = new Date();
    const selectedDate = new Date(
      currentDate.getTime() - currentDate.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];
    now = selectedDate;
  } else {
    now = req.body.timekeeping_date;
  }

  const selectedDayType = req.body.dayType; 

  const dateQuery = `SELECT * FROM tbl_dates WHERE date = $1`;

  pool.connect((err, connection) => {
    if (err) throw err; 

    connection.query(dateQuery, [now], (err, { rows }) => {
      connection.release();
      if (err) throw err; 
      const date = rows[0].date;

      const updateQuery = `UPDATE tbl_dates SET day_type_id = $1 WHERE date = $2`;

      connection.query(updateQuery, [selectedDayType, date], (err, result) => {
        if (!err) {
          fetchSelectedDate(now, res, req)
        } else {
          console.error("Error updating day type:", err);
        }
      });
    });
  });
};


exports.record_create = (req, res) => {
  const { employee_id, record_date, branch_id, record_start_time, record_end_time } = req.body;
  const dateQuery = `SELECT * FROM tbl_dates WHERE date = $1`;
  const employeeQuery = `SELECT * FROM tbl_employees WHERE id = $1`;

  pool.connect((err, connection) => {
    if (err) throw err;

    connection.query(dateQuery, [record_date], (err, { rows }) => {
      connection.release();

      if (!err) {
        const date_id = rows[0].id;

        pool.connect((err, connection) => {
          if (err) throw err;

          connection.query(employeeQuery, [employee_id], (err, { rows }) => {
            connection.release();

            if (!err) {
              if (rows.length === 0) {
                // Employee not found, render a template page
                res.redirect('/timekeeping/add-record?alert=Employee%20does%20not%20exist');
                return;
              }

              // Employee found, proceed with inserting the record
              const DTRquery = `INSERT INTO tbl_daily_time_records (emp_id, date_id, branch_id, status_id, hasOT, hasBreak, start_time, end_time)
                VALUES ($1, $2, $3, 2, false, false, $4, $5)`;

              pool.connect((err, connection) => {
                if (err) throw err;

                connection.query(DTRquery, [employee_id, date_id, branch_id, record_start_time, record_end_time], (err, { rows }) => {
                  connection.release();

                  if (!err) {
                    res.redirect('/timekeeping?alert=Time%20record%20successfully%20added');
                  } else {
                    console.log(err);
                  }
                });
              });
            }
          });
        });
      }
    });
  });
};

exports.record_edit = (req, res) => {
  const branchQuery = `
    SELECT b.id AS branch_id, a.address AS branch_name
    FROM tbl_branches AS b
    INNER JOIN tbl_addresses AS a ON b.address_id = a.id
  `;

  pool.connect((err, connection) => {
    if (err) throw err;
    connection.query(branchQuery, (err, branches) => {
      connection.release();

      if (!err) {
        pool.connect((err, connection) => {
          if (err) throw err;
          const query = `
          SELECT dtr.id AS dtr_id, dtr.*, b.*, a.*
          FROM tbl_daily_time_records AS dtr
          INNER JOIN tbl_branches AS b ON dtr.branch_id = b.id
          INNER JOIN tbl_addresses AS a ON b.address_id = a.id
          WHERE dtr.id = $1
        `;

          connection.query(query, [req.params.id], (err, { rows }) => {
            connection.release();

            if (!err) {
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

exports.record_update = (req, res) => {

  const { branch_id, start_time, end_time } = req.body;

  const query = `UPDATE tbl_daily_time_records SET branch_id = $1, start_time = $2, end_time = $3 WHERE id = $4`;

  pool.connect((err, connection) => {
    if (err) throw err;
    connection.query(query, [branch_id, start_time, end_time, req.params.id], (err) => {
      connection.release();

      if (!err) {

        pool.connect((err, connection) => {
          if (err) throw err;
          const query = `
          SELECT dtr.id AS dtr_id, dtr.*, b.*, a.*
          FROM tbl_daily_time_records AS dtr
          INNER JOIN tbl_branches AS b ON dtr.branch_id = b.id
          INNER JOIN tbl_addresses AS a ON b.address_id = a.id
          WHERE dtr.id = $1
        `;

          connection.query(query, [req.params.id], (err, { rows }) => {
            connection.release();

            if (!err) {
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

      const date = rows[0].date;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
      const day = date.getDate().toString().padStart(2, '0');

      const selectedDate = `${year}-${month}-${day}`;

      pool.connect((err, connection) => {
        if (err) throw err;

        const deleteQuery = `
          DELETE FROM tbl_daily_time_records WHERE id = $1`;


        connection.query(deleteQuery, [req.params.id], (err) => {
          connection.release();

          if (!err) {
            fetchSelectedDate(selectedDate, res, req);
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
    if (err) throw err;
    const query = `
      SELECT d.date
      FROM tbl_daily_time_records dtr 
      JOIN tbl_dates d ON d.id = dtr.date_id
      WHERE dtr.id = $1`;

    connection.query(query, [req.params.id], (err, { rows }) => {
      connection.release();

      const date = rows[0].date;
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      const selectedDate = `${year}-${month}-${day}`;

      pool.connect((err, connection) => {
        if (err) throw err;
        const hasOT = req.body.hasOT === 'on';
        const hasBreak = req.body.hasBreak === 'on';

        const updateQuery = `
          UPDATE tbl_daily_time_records
          SET status_id = 1, hasot = $2, hasbreak = $3
          WHERE id = $1`;

        connection.query(updateQuery, [req.params.id, hasOT, hasBreak], (err) => {
          connection.release();

          if (!err) {
            fetchSelectedDate(selectedDate, res, req);
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

function fetchSelectedDate(selectedDate, res, req) {
  pool.connect((err, connection) => {
    if (err) throw err;

    const dateQuery = `
      SELECT * FROM tbl_dates WHERE date = $1`;

    connection.query(dateQuery, [selectedDate], (err, { rows }) => {
      if (err) throw err;

      const dateId = rows[0].id;
      const dayType = rows[0].day_type_id;
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
        dtr.date_id = $1 AND e.status = 'Active'`;

      connection.query(dtrQuery, [dateId], (err, { rows }) => {
        connection.release();

        let dayTypeName = 'Regular Day';
        if (dayType === 2) {
          dayTypeName = 'Special Holiday';
        } else if (dayType === 3) {
          dayTypeName = 'Regular Holiday';
        }

        if (!err) {
          const alertMessage = req.query.alert;
          res.render("timekeeping", { rows: rows, selectedDate, dayTypeName, alert : alertMessage });
          console.log(rows);
        } else {
          console.log(err);
        }
      });
    });
  });
};

exports.form = (req, res) => {

  const query = `
  SELECT b.id AS branch_id, a.address AS branch_name
  FROM tbl_branches AS b
  INNER JOIN tbl_addresses AS a ON b.address_id = a.id
`;

  pool.connect((err, connection) => {
    if (err) throw err;

    connection.query(query, (err, { rows }) => {
      connection.release();
      if (!err) {
        res.render('add-timesheet', { rows });
      } else {
        console.log(err)
      }
    })
  })
};

exports.submit = async (req, res) => {
  let branch_id = req.body.branch;

  if (!req.file) {
    const query = `
    SELECT b.id AS branch_id, a.address AS branch_name
    FROM tbl_branches AS b
    INNER JOIN tbl_addresses AS a ON b.address_id = a.id
  `;
      pool.connect((err, connection) => {
        if (err) throw err;
    
        connection.query(query, (err, { rows }) => {
          connection.release();
          if (!err) {
            res.render('add-timesheet', { rows, alert: 'No file uploaded' });
          } else {
            console.log(err)
          }
        })
      })
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
        const dateQuery = 'SELECT id FROM tbl_dates WHERE date = $1';
        const dateResult = await client.query(dateQuery, [Date]);

        if (dateResult.rows.length === 0) {
          continue;
        }

        const date_id = dateResult.rows[0].id;

        const insertQuery = `
          INSERT INTO tbl_daily_time_records (emp_id, date_id, branch_id, status_id, hasot, hasbreak, start_time, end_time)
          VALUES ($1, $2, $3, 2, false, false, $4, $5)
        `;

        const values = [Emp_ID, date_id, branch_id, Start_Time, End_Time];
        await client.query(insertQuery, values);

        console.log('Record inserted successfully');
        counter++;
      } finally {
        client.release(); 
      }
    } catch (error) {
      console.error('Error inserting record:', error);
    }
  }

  console.log("Expected Records: " + totalRows);
  console.log("Inserted Records: " + counter);

  res.redirect('/timekeeping?alert=Import%20successful');
};

function isWhitespaceOrEmpty(str) {
  return /^\s*$/.test(str);
}

function formatTime(timeString) {
  if (!isWhitespaceOrEmpty(timeString)) {
    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = hoursStr.padStart(2, '0');
    const minutes = minutesStr.padStart(2, '0');
    return `${hours}:${minutes}:00`;
  } else {
    return timeString;
  }
}

function formatDate(dateString) {
  if (!isWhitespaceOrEmpty(dateString)) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [day, monthStr, year] = dateString.split('-');
  const month = (months.indexOf(monthStr) + 1).toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
  } else {
    return dateString;
  }
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
