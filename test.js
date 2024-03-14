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

// display(pool);
function findClosestTime(times, targetTime) {
    const toSeconds = time => time.split(':').reduce((acc, curr, index) => acc + curr * Math.pow(60, 2 - index), 0);
    const targetTotalSeconds = toSeconds(targetTime);
    let closestTime, minDifference = Infinity;
    for (const time of times) {
        const totalSeconds = toSeconds(time);
        const difference = Math.abs(targetTotalSeconds - totalSeconds);
        if (difference < minDifference) {
            minDifference = difference;
            closestTime = time;
        }
    }
    return closestTime;
}

function sortDates(dates) {
    return [...new Set(dates)].sort();
}

function generateDailyTimeRecords(inputData) {
    const dtr = [];
    let currentEmpID = null, currentDate = null, dateList = null;
    const toSeconds = time => time.split(':').reduce((acc, curr, index) => acc + curr * Math.pow(60, 2 - index), 0);
    inputData.forEach(entry => {
        if (entry.Emp_ID !== currentEmpID || entry.Date !== currentDate) {
            currentEmpID = entry.Emp_ID;
            currentDate = entry.Date;
            let end = null;
            const start = inputData.find(e => e.Emp_ID === entry.Emp_ID && e.Date === entry.Date && toSeconds(e.Time) >= toSeconds('10:00:00'));
            dateList = sortDates(inputData.filter(e => e.Emp_ID === entry.Emp_ID).map(entry => entry.Date));
            const nextDate = dateList.find(e => e > entry.Date);
            const nextDateEntries = inputData.filter(e => e.Emp_ID === entry.Emp_ID && e.Date === nextDate && toSeconds(e.Time) <= toSeconds('01:30:00'));
            if (nextDateEntries.length > 0)
                end = findClosestTime(nextDateEntries.map(row => row.Time), '01:30:00');
            else {
                const currentDateEntries = inputData.filter(e => e.Emp_ID === entry.Emp_ID && e.Date === entry.Date);
                end = findClosestTime(currentDateEntries.map(row => row.Time), '24:00:00');
            }
            if (start !== undefined)
                dtr.push({ First_Name: entry.First_Name, Last_Name: entry.Last_Name, Date: entry.Date, Start_Time: start.Time, End_Time: end });
        }
    });
    return dtr;
}

const test = [
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '11:00:00', Date: '2024-03-10' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '11:00:00', Date: '2024-03-10' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '11:01:00', Date: '2024-03-10' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '11:02:00', Date: '2024-03-10' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '19:00:00', Date: '2024-03-10' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '20:00:00', Date: '2024-03-10' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '20:00:00', Date: '2024-03-10' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '20:01:00', Date: '2024-03-10' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '20:00:00', Date: '2024-03-11' },
    { First_Name: 'John', Last_Name: 'Lim', Emp_ID: 134, Time: '01:30:00', Date: '2024-03-12' },
    { First_Name: 'Mark', Last_Name: 'Te', Emp_ID: 135, Time: '10:00:00', Date: '2024-03-10' },
    { First_Name: 'Mark', Last_Name: 'Te', Emp_ID: 135, Time: '16:00:00', Date: '2024-03-10' },
    { First_Name: 'Mark', Last_Name: 'Te', Emp_ID: 135, Time: '20:00:00', Date: '2024-03-11' },
    { First_Name: 'Mark', Last_Name: 'Te', Emp_ID: 135, Time: '20:01:00', Date: '2024-03-11' },
    { First_Name: 'Mark', Last_Name: 'Te', Emp_ID: 135, Time: '23:00:00', Date: '2024-03-11' },
    { First_Name: 'Bob', Last_Name: 'Lee', Emp_ID: 136, Time: '14:30:00', Date: '2024-03-10' },
    { First_Name: 'Bob', Last_Name: 'Lee', Emp_ID: 136, Time: '15:00:00', Date: '2024-03-10' },
    { First_Name: 'Bob', Last_Name: 'Lee', Emp_ID: 136, Time: '15:00:00', Date: '2024-03-11' },
    { First_Name: 'Bob', Last_Name: 'Lee', Emp_ID: 136, Time: '20:00:00', Date: '2024-03-11' },
    { First_Name: 'Bob', Last_Name: 'Lee', Emp_ID: 136, Time: '20:05:00', Date: '2024-03-11' },
    { First_Name: 'Bob', Last_Name: 'Lee', Emp_ID: 136, Time: '01:10:00', Date: '2024-03-12' },
    { First_Name: 'Bob', Last_Name: 'Lee', Emp_ID: 136, Time: '13:00:00', Date: '2024-03-12' }
];

console.log(generateDailyTimeRecords(test));

// function convertFloatToTime(floatTime) {
//     const hours = Math.floor(floatTime * 24);
//     let minutes = Math.floor((floatTime * 24 - hours) * 60);
//     let seconds = Math.round(((floatTime * 24 - hours) * 60 - minutes) * 60);

//     // Check if seconds exceeds 59
//     if (seconds >= 60) {
//         minutes += Math.floor(seconds / 60);
//         seconds %= 60;
//     }

//     // Append leading zero to hours if necessary
//     const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
//     const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
//     const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

//     return `${hoursStr}:${minutesStr}:${secondsStr}`;
// };

// function convertExcelDateToFormat(excelDate) {
//     // Convert Excel date number to JavaScript Date object
//     const date = new Date((excelDate - 1) * 24 * 60 * 60 * 1000 + new Date(1899, 11, 30).getTime());

//     // Extract year, month, and day components
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
//     const day = String(date.getDate() + 1).padStart(2, '0');

//     // Construct the desired date format
//     return `${year}-${month}-${day}`;

// };