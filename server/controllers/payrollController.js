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
  const periodQuery = `SELECT * FROM tbl_periods WHERE id = $1`;

  const dtrQuery = `
    SELECT 
      dtr.emp_id AS emp_id,
      CONCAT(e.emp_fname, ' ', e.emp_lname) AS employee_name,
      dpt.dept_name, 
      p.name AS position,
      p.salary_rate AS rate,
      d.date,
      dtr.start_time, 
      dtr.end_time,
      dtr.hasot,
      dtr.hasbreak,
      d.day_type_id,
      dtr.branch_id
    FROM 
      tbl_daily_time_records dtr
    JOIN
      tbl_dates d ON dtr.date_id = d.id
    JOIN 
      tbl_employees e ON dtr.emp_id = e.id
    JOIN 
      tbl_positions p ON e.position_id = p.id
    JOIN
      tbl_departments dpt ON p.department_id = dpt.id
    WHERE
      d.date BETWEEN $1 AND $2
      AND dtr.emp_id = $3
    ORDER BY
      dtr.emp_id,
      d.date;
  `;

  try {
    const periodResult = await pool.query(periodQuery, [period_id]);
    const periodStart = periodResult.rows[0].start_date;
    const periodEnd = periodResult.rows[0].end_date;

    const dtrResult = await pool.query(dtrQuery, [periodStart, periodEnd, emp_id]);
    const dtrRows = dtrResult.rows;

    let totalHrs = 0;
    let totalOvertimeHrs = 0;
    let totalNightDiffHrs = 0;
    let grossPay = 0;
    let netPay = 0;
    let totalDeductions = 0;

    let baseTotal = 0 // total pay for base hrs (without overtime and nightdiff)
    let overTimeTotal = 0 // total pay for overtime hrs
    let nightDiffTotal = 0 // total pay for nightdiff hrs

    const name = dtrRows[0].employee_name
    const dept = dtrRows[0].dept_name
    const pos = dtrRows[0].position
    const rate = dtrRows[0].salary_rate

    // 2024 contribution basis (As of March)
    // Monthly contributions are divided into 2 since period is bi-monthly
    const philhealthDeduct = rate * 0.025; // 5% monthly
    let pagibigDeduct = rate > 1500 ? rate * 0.01 : rate * 0.005; // 2% monthly for 1500 above rates, else 1% monthly
    let sssDeduct = rate * 0.0225 // 4.5% monthly

    for (const dtr of dtrRows) {
      const { start_time, end_time, hasot, hasbreak} = dtr;

      // Calculating work hours
      let hours = (new Date(end_time) - new Date(start_time)) / (1000 * 60 * 60);
      hours -= hasbreak ? 1 : 0; // Subtract break time if it exists

      // Calculating overtime hours
      let overtime = hasot ? Math.max(hours - 8, 0) : 0;

      // Calculating night differential hours
      let nightdiff = 0;
      const endHour = new Date(end_time).getHours();
      if (endHour < 22) {
        nightdiff = endHour >= 2 ? hours : hours + 23;
      } else {
        nightdiff = hours;
      }

      // Adding to totals
      totalHrs += hours; 
      totalOvertimeHrs += overtime;
      totalNightDiffHrs += nightdiff;

      // Calculating base pay
      baseTotal += rate * (hours - overtime - nightdiff);

      // Calculating overtime pay
      overTimeTotal += rate * 1.3 * overtime; // 30% higher than base rate

      // Calculating night differential pay
      nightDiffTotal += rate * 1.1 * nightdiff; // 10% higher than base rate
    }

    totalDeductions = sssDeduct + pagibigDeduct + philhealthDeduct;

    // Calculating gross pay
    grossPay = baseTotal + overTimeTotal + nightDiffTotal;

    // Calculating net pay (gross pay - total deductions)
    netPay = grossPay - totalDeductions;

  
    console.log('Total Work Hours:', totalHrs.toFixed(2));
    console.log('Total Overtime Hours:', totalOvertimeHrs.toFixed(2));
    console.log('Total Night Differential Hours:', totalNightDiffHrs.toFixed(2));

    result = {
      ID: emp_id,
      Employee: name,
      Department: dept,
      Position: pos,
      Rate: rate,
      Hours: totalHrs,
      OverTime: totalOvertimeHrs,
      NightDiff: totalNightDiffHrs,
      Gross: grossPay,
      Deductions: totalDeductions,
      Net: netPay,
      BaseTotal: baseTotal,
      overTotal: overTimeTotal,
      nightTotal: nightDiffTotal
    }

    return result;

  } catch (error) {
    console.error("Error fetching summary:", error);
    throw error;
  }
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

        const payrolls = results.rows;

        // FINAL HURR HURR DLE
        let finalList = [];

        for (const payroll of payrolls) {
          const {id, period_id, emp_id} = payroll;

          finalList.push(fetchSummary(period_id, emp_id));
        }

        periodId = parseInt(periodId);
        const currPeriod = period_list.find(period => period.id === periodId);

        res.render("payroll", {rows: finalList, periods: period_list, currPeriod: currPeriod });

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

