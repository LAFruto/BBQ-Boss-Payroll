const { Pool } = require('pg');
const flatpickr = require('flatpickr');
const multer = require('multer');
const xlsx = require('xlsx');

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

exports.submit = (req, res) => {
    if (!req.file) {
        // needs fixing of alert on add-timesheet
        res.render('add-timesheet', { alert: 'No file uploaded' });
    } else {
      
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    let jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    // Replace spaces with underscores in headers
    const headers = jsonData[0].map(header => header.replace(/\s/g, '_'));

    // Remove headers from data array
    jsonData = jsonData.slice(1);

    // Convert to JSON object with modified headers
    jsonData = jsonData.map(row => {
        const newRow = {};
        headers.forEach((header, index) => {
            newRow[header] = row[index];
        });
        return newRow;
    });

    // Format Time and Date Values
    jsonData.forEach(row => {
        row.Time = formatTime(row.Time);
        row.Date = formatDate(row.Date);
    })

    // console.log("Retrieved and Parsed data:\n" + jsonData);
    console.log("DTR list:")
    console.log(generateDailyTimeRecords(jsonData));

    res.render('add-timesheet', { alert: 'File uploaded' } );  
    }
};

function formatTime(timeString) {
    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = hoursStr.padStart(2, '0');
    const minutes = minutesStr.padStart(2, '0');
    return `${hours}:${minutes}:00`;
}

function formatDate(dateString) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [day, monthStr, year] = dateString.split('-');
    const month = (months.indexOf(monthStr) + 1).toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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

// function sortDates(dates) {
//     return [...new Set(dates)].sort();
// }

function generateDailyTimeRecords(inputData) {
    const dtr = [];
    let currentEmpID = null, currentDate = null, dateList = null;
    const toSeconds = time => time.split(':').reduce((acc, curr, index) => acc + curr * Math.pow(60, 2 - index), 0);
    inputData.forEach(entry => {
        if (entry.Emp_ID !== currentEmpID || entry.Date !== currentDate) {
            currentEmpID = entry.Emp_ID;
            currentDate = entry.Date;
            let end = null;

            const start = inputData.find(e => e.Emp_ID === entry.Emp_ID && e.Date === entry.Date && toSeconds(e.Time) >= toSeconds('06:00:00'));
            dateList = inputData.filter(e => e.Emp_ID === entry.Emp_ID).map(entry => entry.Date);

            const nextDate = dateList.find(e => e > entry.Date);
            const nextDateEntries = inputData.filter(e => e.Emp_ID === entry.Emp_ID && e.Date === nextDate && toSeconds(e.Time) <= toSeconds('02:00:00'));
            
            if (nextDateEntries.length > 0)
                end = findClosestTime(nextDateEntries.map(row => row.Time), '01:30:00'); // look for entry close to end of shift
            else {
                const currentDateEntries = inputData.filter(e => e.Emp_ID === entry.Emp_ID && e.Date === entry.Date);
                end = findClosestTime(currentDateEntries.map(row => row.Time), '24:00:00'); // look for entry close to midnight
            }
            if (start !== undefined)
                dtr.push({ First_Name: entry.First_Name, Last_Name: entry.Last_Name, Emp_ID: entry.Emp_ID, Date: entry.Date, Start_Time: start.Time, End_Time: end });
        }
    });
    return dtr;
}
