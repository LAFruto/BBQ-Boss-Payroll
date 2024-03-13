// const mysql = require('mysql');
const { Pool } = require('pg');
const flatpickr = require('flatpickr');

// Connection Pool
const pool = new Pool({
    max: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

exports.view = (req, res) => {
    const currentDate = new Date();
    const selectedDate = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    // Render the timekeeping page without any selected date
    res.render('timekeeping', { selectedDate });
};

exports.date = (req, res) => {
    const selectedDate = req.body.timekeeping_date;

    res.render('timekeeping', { selectedDate }); 
}

exports.form = (req, res) => {
    res.render('add-timesheet')
};
