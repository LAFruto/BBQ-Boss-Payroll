const { Pool } = require('pg');

require('dotenv').config(); // Load environment variables from .env file

// Connection Pool
const pool = new Pool({
    max: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

exports.view = (req, res) => {
    res.render("payroll");
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
    res.render('convert-mbos');
    
};