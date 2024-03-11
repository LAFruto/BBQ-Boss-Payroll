// const mysql = require('mysql');
const pgsql = require('pg');

// Connection Pool
const pool = mysql.createPool({
    max: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

exports.view = (req, res) => {
    res.render("timekeeping");
};