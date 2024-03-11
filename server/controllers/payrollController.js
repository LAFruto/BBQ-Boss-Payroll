// const mysql = require('mysql');
const { Pool } = require('pg');

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