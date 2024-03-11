const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
// const mysql = require('mysql');
const pgsql = require('pg');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Parsing middleware
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false}));

// Parse application/json
app.use(bodyParser.json());

// Static files
app.use(express.static('public'));

// Templating Engine
app.engine('hbs', exphbs.engine( {extname: '.hbs' }));
app.set('view engine', 'hbs');

// Connection Pool
const pool = pgsql.Pool({
  max: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// Connect to DB
pool.connect((err, connection) => {
  if (err) throw err; // not connected
  console.log('Connected as ID ' + connection.threadId);
})

const routes = require('./server/routes/mainroutes');
app.use('/', routes)

app.listen(port, () => console.log(`Listening on port ${port}`));