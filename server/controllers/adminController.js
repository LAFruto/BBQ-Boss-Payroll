// const mysql = require('mysql');
const pgsql = require('pg');

// Connection Pool
const pool = pgsql.Pool({
    max: 100,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

// View Users
exports.view = (req, res) => {
  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log('Connected as ID ' + connection.threadId);

    // User the connection
    connection.query('SELECT * FROM tbl_pet', (err, rows) => {
      // When done with the connection, release it
      console.log('HELLO');
      connection.release();
      
      if(!err) {
        res.render('home', { rows })
      } else {
        console.log(err);
      }
      console.log('The data from pet table: \n', rows);

    });
  });
}

// Find user by Search
exports.find = (req, res) => { 

  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log('Connected as ID ' + connection.threadId);

    // User the connection
    connection.query('SELECT * FROM tbl_pet WHERE pet_name LIKE ?', ['%' + searchTerm + '%'], (err, rows) => {
      // When done with the connection, release it
      connection.release();
      
      if(!err) {
        res.render('home', { rows })
      } else {
        console.log(err);
      }
      console.log('The data from pet table: \n', rows);

    });
  });
}

exports.form = (req, res) => {
  res.render('add-user');
}

// Add new user
exports.create = (req, res) => { 
  // Retrieve form data from req.body
  const { pet_name, owner_id, pet_age, pet_gender, pet_price, pet_color, pet_breed, status_id, date_added } = req.body;

  // Construct INSERT query
  const query = `INSERT INTO tbl_pet (pet_name, owner_id, pet_age, pet_gender, pet_price, pet_color, pet_breed, status_id, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [pet_name, owner_id, pet_age, pet_gender, pet_price, pet_color, pet_breed, status_id, date_added];

  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log('Connected as ID ' + connection.threadId);

    // User the connection
    connection.query(query, values, (err, rows) => {
      // When done with the connection, release it
      connection.release();
      
      if(!err) {
        res.render('add-user', { alert: 'User added successfully'})
      } else {
        console.log(err);
      }
      console.log('The data from pet table: \n', rows);

    });
  });
}

// Edit user
exports.edit = (req, res) => {
    
  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log('Connected as ID ' + connection.threadId);

    // User the connection
    connection.query('SELECT * FROM tbl_pet WHERE pet_id = ?', [req.params.id], (err, rows) => {
      // When done with the connection, release it
      console.log(req.params.id);
      connection.release();
      
      if(!err) {
        res.render('edit-user', { rows })
      } else {
        console.log(err);
      }
      console.log('The data from pet table: \n', rows);

    });
  });
}

// Update user
exports.update = (req, res) => {
    // Retrieve form data from req.body
    const { pet_name, owner_id, pet_age, pet_gender, pet_price, pet_color, pet_breed, status_id, date_added } = req.body;
    const values = [pet_name, owner_id, pet_age, pet_gender, pet_price, pet_color, pet_breed, status_id, date_added, req.params.id];
    // Construct the update query
    const query = `
      UPDATE tbl_pet 
      SET 
        pet_name = ?, 
        owner_id = ?, 
        pet_age = ?, 
        pet_gender = ?, 
        pet_price = ?, 
        pet_color = ?, 
        pet_breed = ?, 
        status_id = ?, 
        date_added = ? 
      WHERE 
        pet_id = ?
    `;

    pool.connect((err, connection) => {
      if (err) throw err; // not connected
      console.log('Connected as ID ' + connection.threadId);
  
      // User the connection
      connection.query(query, values, (err, rows) => {
        // When done with the connection, release it
        console.log(req.params.id);
        connection.release();
        
        if(!err) {
          pool.connect((err, connection) => {
            if (err) throw err; // not connected
            console.log('Connected as ID ' + connection.threadId);
        
            // User the connection
            connection.query('SELECT * FROM tbl_pet WHERE pet_id = ?', [req.params.id], (err, rows) => {
              // When done with the connection, release it
              console.log(req.params.id);
              connection.release();
              
              if(!err) {
                res.render('edit-user', { rows, alert: `${pet_name} has been updated.` })
              } else {
                console.log(err);
              }
              console.log('The data from pet table: \n', rows);
        
            });
          });
        } else {
          console.log(err);
        }
        console.log('The data from pet table: \n', rows);
  
      });
    });
}

// Delete User
exports.delete = (req, res) => {
    
  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log('Connected as ID ' + connection.threadId);

    // User the connection
    connection.query('DELETE FROM tbl_pet WHERE pet_id = ?', [req.params.id], (err, rows) => {
      // When done with the connection, release it
      console.log(req.params.id);
      connection.release();
      
      if(!err) {
        res.redirect('/');
      } else {
        console.log(err);
      }
      console.log('The data from pet table: \n', rows);

    });
  });
}

// View Users
exports.viewall = (req, res) => {
  
  pool.connect((err, connection) => {
    if (err) throw err; // not connected
    console.log('Connected as ID ' + connection.threadId);

    // User the connection
    connection.query('SELECT * FROM tbl_pet WHERE pet_id = ?', [req.params.id], (err, rows) => {
      // When done with the connection, release it
      console.log('HELLO');
      connection.release();
      
      if(!err) {
        res.render('view-user', { rows })
      } else {
        console.log(err);
      }
      console.log('The data from pet table: \n', rows);

    });
  });
}
