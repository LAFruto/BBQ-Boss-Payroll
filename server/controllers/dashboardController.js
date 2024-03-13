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
    if (req.session.user && req.session.account_type === 'admin') {
        res.render("dashboard");
    } else if (req.session.user && req.session.account_type === 'viewer') {
        res.render("dashboard");
    } else {
        res.redirect('/')
    }
};