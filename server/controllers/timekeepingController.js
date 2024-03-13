// const mysql = require('mysql');
const { Pool } = require('pg');
const flatpickr = require('flatpickr');

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
    res.render("timekeeping");

    
};

exports.form = (req, res) => {
    res.render('add-timesheet')
};