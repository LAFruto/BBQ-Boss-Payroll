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
async function fetchSummary(targetPeriod, targetEmp) {
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
      dtr.branch_id,
	  e.status
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
      AND dtr.emp_id = $3 AND e.status = 'Active'
    ORDER BY
      dtr.emp_id,
      d.date;
  `;


  try {
    console.log("PERIOD: " + targetPeriod);
    let periodResult = await pool.query(periodQuery, [targetPeriod]);

    let periodStart = periodResult.rows[0].start_date;
    let periodEnd = periodResult.rows[0].end_date;

    let startYear = periodStart.getFullYear();
    let startMonth = (periodStart.getMonth() + 1).toString().padStart(2, '0');
    let startDay = periodStart.getDate().toString().padStart(2, '0');
    let startDateString = `${startYear}-${startMonth}-${startDay}`;

    let endYear = periodEnd.getFullYear();
    let endMonth = (periodEnd.getMonth() + 1).toString().padStart(2, '0');
    let endDay = periodEnd.getDate().toString().padStart(2, '0');
    let endDateString = `${endYear}-${endMonth}-${endDay}`;

    console.log("DATE START: " +startDateString);
    console.log("DATE END: " +endDateString);
    console.log("EMP ID: " + targetEmp);
    let dtrResult = await pool.query(dtrQuery, [startDateString, endDateString, targetEmp]);
    let dtrRows = dtrResult.rows;

    console.log("LENGTH: " + dtrRows.length);

    let totalHrs = 0;
    let totalOvertimeHrs = 0;
    let totalNightDiffHrs = 0;
    let grossPay = 0;
    let netPay = 0;
    let totalDeductions = 0;

    let baseTotal = 0; // total pay for base hrs (without overtime and nightdiff)
    let overTimeTotal = 0; // total pay for overtime hrs
    let nightDiffTotal = 0; // total pay for nightdiff hrs

    let name = dtrRows[0].employee_name;
    let dept = dtrRows[0].dept_name;
    let pos = dtrRows[0].position;
    let rate = parseInt(dtrRows[0].rate);

    // 2024 contribution basis (As of March)
    // Monthly contributions are divided into 2 since period is bi-monthly
    let philhealthDeduct = rate * 0.025; // 5% monthly
    let pagibigDeduct = rate > 1500 ? rate * 0.01 : rate * 0.005; // 2% monthly for 1500 above rates, else 1% monthly
    let sssDeduct = rate * 0.0225; // 4.5% monthly


    for (const dtr of dtrRows) {
      const { start_time, end_time, hasot, hasbreak, date } = dtr;
      let ref_time = '22:00:00'; // night diff reference
  
      let inputDate = new Date(date);
      let inputYear = inputDate.getFullYear();
      let inputMonth = (inputDate.getMonth() + 1).toString().padStart(2, '0');
      let inputDay = inputDate.getDate().toString().padStart(2, '0');
      let startDateString = `${inputYear}-${inputMonth}-${inputDay}`;
      let endDateString = null;
  
      // Adjust endDateString based on end_time
      let endHourCheck = parseInt(end_time.split(':')[0]);
      if (endHourCheck >= 0 && endHourCheck < 2) {
          // If end_time is between 12:00 AM and 2:00 AM, increment the date by one day
          let nextDate = new Date(inputYear, inputDate.getMonth(), inputDate.getDate() + 1);
          let nextYear = nextDate.getFullYear();
          let nextMonth = (nextDate.getMonth() + 1).toString().padStart(2, '0');
          let nextDay = nextDate.getDate().toString().padStart(2, '0');
          endDateString = `${nextYear}-${nextMonth}-${nextDay}`;
      } else {
          endDateString = startDateString;
      }
  
      // Split the date and time strings
      let [startHour, startMinute, startSecond] = start_time.split(':').map(Number);
      let [endHour, endMinute, endSecond] = end_time.split(':').map(Number);
      let [refHour, refMinute, refSecond] = ref_time.split(':').map(Number);
  
      let [startYear, startMonth, startDay] = startDateString.split('-');
      let [endYear, endMonth, endDay] = endDateString.split('-');
      let [refYear, refMonth, refDay] = startDateString.split('-'); // Using startDateString since refDate is based on start date
  
      // Construct Date objects for calculations
      let startDate = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, startSecond);
      let endDate = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, endSecond);
      let refDate = new Date(refYear, refMonth - 1, refDay, refHour, refMinute, refSecond);
  
      let hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  
      // Subtract break time if applicable
      hours -= hasbreak ? 1 : 0;
  
      // Calculating overtime hours
      let overtime = hasot ? Math.max(hours - 8, 0) : 0;
  
      // Calculating night differential hours
      let nightdiff = ((refDate.getTime() / (1000 * 60 * 60)) - (endDate.getTime() / (1000 * 60 * 60)));
  
      // if nightdiff is negative, there is night differential
      if (nightdiff < 0 && nightdiff > -4) {
          nightdiff = Math.abs(nightdiff);
      } else {
          nightdiff = 0;
      }
  
      // Adding to totals
      totalHrs += hours;
      totalOvertimeHrs += overtime;
      totalNightDiffHrs += nightdiff;
  
      // Calculating base pay
      baseTotal += rate * (hours - overtime - nightdiff);
  
      // Calculating overtime pay
      overTimeTotal += rate * 1.3 * overtime;
  
      // Calculating night differential pay
      nightDiffTotal += rate * 1.1 * nightdiff;
  }

    totalDeductions = sssDeduct + pagibigDeduct + philhealthDeduct;

    // Calculating gross pay
    grossPay = baseTotal + overTimeTotal + nightDiffTotal;

    // Calculating net pay (gross pay - total deductions)
    netPay = grossPay - totalDeductions;

    // console.log('Total Work Hours:', totalHrs.toFixed(2));
    // console.log('Total Overtime Hours:', totalOvertimeHrs.toFixed(2));
    // console.log('Total Night Differential Hours:', totalNightDiffHrs.toFixed(2));

    result = {
      ID: targetEmp,
      Employee: name,
      Department: dept,
      Position: pos,
      Rate: rate,
      Hours: totalHrs.toFixed(2),
      OverTime: totalOvertimeHrs.toFixed(2),
      NightDiff: totalNightDiffHrs.toFixed(2),
      Gross: grossPay.toFixed(2),
      Deductions: totalDeductions.toFixed(2),
      Net: netPay.toFixed(2),
      BaseTotal: baseTotal.toFixed(2),
      overTotal: overTimeTotal.toFixed(2),
      nightTotal: nightDiffTotal.toFixed(2)
    };

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
  console.log("FETCHPAYROLLDATA: " + periodId);
  const query = `SELECT p.*
  FROM tbl_payrolls p
  JOIN tbl_employees e ON p.emp_id = e.id
  JOIN tbl_periods pd ON p.period_id = pd.id
  WHERE pd.id = $1
  AND e.status = 'Active';
  `;

  try {
    let period_list = await populatePeriodDropDown();

    pool.connect((err, connection) => {
      if (err) {
        console.error("Error connecting to the database:", err);
        return;
      }

      connection.query(query, [periodId], async (err, results) => { // Make the callback function async
        connection.release();

        if (err) {
          console.error("Error executing query:", err);
          return;
        }

        const payrolls = results.rows;
        let finalList = [];

        // Map each payroll to a Promise that resolves with its summary
        const summaryPromises = payrolls.map(async (payroll) => {
          const {id, period_id, emp_id} = payroll;
          const summary = await fetchSummary(period_id, emp_id);
          return summary;
        });

        // Wait for all summaries to be fetched
        const summaries = await Promise.all(summaryPromises);

        // Push the summaries into the final list
        finalList.push(...summaries);

        periodId = parseInt(periodId);
        const currPeriod = period_list.find(period => period.id === periodId);

        console.log(finalList);

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

