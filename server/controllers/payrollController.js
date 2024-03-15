const { Pool } = require("pg");

// Connection Pool
const pool = new Pool({
  max: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

exports.view = async (req, res) => {
  let selected_period = req.query.selected_period;

  console.log("Selected Period:", selected_period);
  console.log("GENERATED CURRENT PERIOD: ", await getCurrentPeriod());
  if (selected_period === undefined || selected_period === null) {
    current_period = await getCurrentPeriod();
    console.log("1")
    fetchPayrollData(current_period, res);
  } else {
    console.log("2")
    fetchPayrollData(selected_period, res);
  }
};

async function fetchSummary(period_id, emp_id) {
    // get active emp dtrs under the current period
    const dtrQuery = `
      SELECT 
        dtr.id AS dtr_id,
        dtr.emp_id,
        dtr.date_id,
        d.date,
        dtr.start_time, 
        dtr.end_time,
        dtr.status_id,
        dtr.hasot,
        dtr.hasbreak,
        d.day_type_id,
        dtr.branch_id,
      FROM 
        tbl_daily_time_records dtr
      JOIN
        tbl_dates d ON dtr.date_id = d.id
      WHERE
        d.date BETWEEN $1 AND $2
      ORDER BY
        dtr.emp_id,
        d.date;
    `;

}

exports.form = (req, res) => {
  res.render("convert-mbos");
};

async function fetchPayrollData(periodId, res) {
  const query = `SELECT * FROM tbl_payrolls WHERE period_id = $1`;
  try {
    let period_list = await populatePeriodDropDown();

    pool.connect((err, connection) => {
      if (err) {
        console.error("Error connecting to the database:", err);
        return;
      }

      connection.query(query, [periodId], (err, results) => {
        connection.release();

        if (err) {
          console.error("Error executing query:", err);
          return;
        }

        periodId = parseInt(periodId);
        const currPeriod = period_list.find(period => period.id === periodId);

        res.render("payroll", { periods: period_list, currPeriod: currPeriod });

      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}

function getCurrentPeriod() {
  const query = "SELECT id FROM tbl_periods WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE";

  return new Promise((resolve, reject) => {
    pool.query(query, (err, results) => {
      if (err) {
        console.error("Error executing query:", err);
        reject(err);
      } else {
        if (results.rows.length > 0) {
          resolve(results.rows[0].id);
        } else {
          reject("Current period not found");
        }
      }
    });
  });
}

function populatePeriodDropDown() {
  return new Promise((resolve, reject) => {
    const query = "SELECT id, start_date, end_date FROM tbl_periods";

    pool.connect((err, connection) => {
      if (err) {
        console.error("Error connecting to the database:", err);
        reject(err);
        return;
      }

      connection.query(query, (err, results) => {
        connection.release();

        if (err) {
          console.error("Error executing query:", err);
          reject(err);
          return;
        }

        const periods = formatPeriods(results.rows);
        console.log("Periods:", periods);
        resolve(periods);
      });
    });
  });
}

function formatPeriods(periods) {
  return periods.map((period) => {
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);

    const formattedStartDate = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const formattedEndDate = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return {
      id: period.id,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
    };
  });
}

