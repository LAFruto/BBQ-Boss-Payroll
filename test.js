// const mysql = require('mysql');
const { Pool } = require('pg');

require('dotenv').config(); // Load environment variables from .env file

const pool = new Pool({
    max: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
  
function display(pool) {
    pool.connect((err, connection) => {
        if (err) {
          throw err; 
        } 
        console.log("Connected as " + connection.processID);
        
        // console.log(connection);
        connection.query(`SELECT * FROM users`, (err, { rows }) => { // alternative would be results instead of { rows }
        connection.release();

        if (err) {
            console.log(err);
        }
        // console.log(results);
        
        if (rows.length > 0) { // alternative would be results.rows.length
            console.log("Login successful");
            console.log(rows) // alternative would be results.rows

        } else {
            console.log("Login failed");
            console.log(rows) // alternative would be results.rows
        }
        });   
    });
}

display(pool);
