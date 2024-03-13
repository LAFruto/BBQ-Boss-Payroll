const mysql = require('mysql');
const flatpickr = require('flatpickr');

// Connection Pool
const pool = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

exports.view = (req, res) => {
    res.render("timekeeping");
};

exports.form = (req, res) => {
    res.render('add-timesheet')
};