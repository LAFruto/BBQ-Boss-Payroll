// const mysql = require('mysql');
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
    console.log(req.session)
    if (req.session.username && req.session.acc_type === 1) {
        res.render("dashboard");
    } else if (req.session.username && req.session.acc_type === 'viewer') {
        res.render("dashboard");
    } else {
        res.redirect('/')
    }
};