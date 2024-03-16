const { Pool } = require("pg");

const pool = new Pool({
  max: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

exports.view = (req, res) => {
  const query = `SELECT 
  e.id AS employee_id,
  CONCAT(e.emp_fname, ' ', e.emp_lname) AS employee_name,
  d.dept_name AS department,
  p.name AS position,
  rc.rateclass_name AS rate_class,
  CONCAT('₱', p.salary_rate) AS salary_rate,
  TO_CHAR(e.date_hired, 'YYYY-MM-DD') AS date_hired
    FROM 
      tbl_employees e
    JOIN 
      tbl_positions p ON e.position_id = p.id
    JOIN 
      tbl_departments d ON p.department_id = d.id
    JOIN 
      tbl_rateclasses rc ON p.rateclass_id = rc.id
    LEFT JOIN 
      tbl_emp_to_contacts etc ON e.id = etc.emp_id
    WHERE
      e.status = 'Active'`;

  pool.connect((err, connection) => {
    if (err) throw err;

    connection.query(query, (err, { rows }) => {
      connection.release();

      if (!err) {
        res.render("employee", { rows: rows });
      } else {
        console.log(err);
      }
    });
  });
};

exports.find = (req, res) => {
  const query = `SELECT 
      e.id AS employee_id,
      CONCAT(e.emp_fname, ' ', e.emp_lname) AS employee_name,
      d.dept_name AS department,
      p.name AS position,
      rc.rateclass_name AS rate_class,
      CONCAT('₱', p.salary_rate) AS salary_rate,
      TO_CHAR(e.date_hired, 'YYYY-MM-DD') AS date_hired
    FROM 
      tbl_employees e
    JOIN 
      tbl_positions p ON e.position_id = p.id
    JOIN 
      tbl_departments d ON p.department_id = d.id
    JOIN 
      tbl_rateclasses rc ON p.rateclass_id = rc.id
    LEFT JOIN 
      tbl_emp_to_contacts etc ON e.id = etc.emp_id
    WHERE
      e.status = 'Active' AND
      (
        e.id::text ILIKE $1 OR
        CONCAT(e.emp_fname, ' ', e.emp_lname) ILIKE $1 OR
        d.dept_name ILIKE $1 OR
        p.name ILIKE $1 OR
        rc.rateclass_name ILIKE $1 OR
        CONCAT('₱', p.salary_rate) ILIKE $1 OR
        TO_CHAR(e.date_hired, 'YYYY-MM-DD') ILIKE $1
      );`;

  let searchTerm = req.body.search;

  pool.connect((err, connection) => {
    if (err) throw err; 

    connection.query(query, ["%" + searchTerm + "%"], (err, { rows }) => {
      connection.release();

      if (!err) {
        res.render("employee", { rows: rows, searchValue: searchTerm });
      } else {
        console.log(err);
      }
    });
  });
};

exports.form = (req, res) => {
  const query = `
    SELECT * FROM tbl_provinces;
    SELECT * FROM tbl_cities;
    SELECT * FROM tbl_barangays;
    SELECT * FROM tbl_genders;
    SELECT * FROM tbl_civil_statuses;
    SELECT * FROM tbl_departments;
    SELECT * FROM tbl_positions;
  `;

  pool.connect((err, connection) => {
    if (err) throw err;

    connection.query(query, (err, results) => {
      connection.release();

      if (!err) {
        const provinces = results[0].rows;
        const cities = results[1].rows;
        const barangays = results[2].rows;
        const genders = results[3].rows;
        const civil_statuses = results[4].rows;
        const departments = results[5].rows;
        const positions = results[6].rows;

        res.render("add-employee", {
          provinces,
          cities,
          barangays,
          genders,
          civil_statuses,
          departments,
          positions,
        });
      } else {
        console.log(err);
      }
    });
  });
};

exports.create = (req, res) => {
  const {
    positionId,
    genderId,
    civilStatusId,
    empFname,
    empLname,
    empMname,
    birthdate,
    email,
    sssNo,
    philhealthNo,
    pagibigNo,
    contactNo,
  } = req.body;

  const employeeQuery = `
    INSERT INTO tbl_employees (position_id, gender_id, civil_id, emp_fname, emp_lname, emp_mname, birthdate, email, sss_no, philhealth_no, pagibig_no, date_hired, date_end, status) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, NULL, 'Active')
    RETURNING id
  `;

  const contactQuery = `
    INSERT INTO tbl_contacts (contact_no) 
    VALUES ($1)
    RETURNING id
  `;

  const empToContactQuery = `
    INSERT INTO tbl_emp_to_contacts (emp_id, contact_id) 
    VALUES ($1, $2)
  `;

  pool.connect((err, connection) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      res.status(500).send("Error connecting to the database");
      return;
    }

    connection.query(
      employeeQuery,
      [
        positionId,
        genderId,
        civilStatusId,
        empFname,
        empLname,
        empMname,
        birthdate,
        email,
        sssNo,
        philhealthNo,
        pagibigNo,
      ],
      (err, employeeResult) => {
        const empId = employeeResult.rows[0].id;

        connection.query(contactQuery, [contactNo], (err, contactResult) => {
          if (err) {
            connection.rollback(() => {
              console.error("Error inserting into tbl_contacts:", err);
              res.status(500).send("Error inserting into tbl_contacts");
            });
            return;
          }

          const contactId = contactResult.rows[0].id;

          connection.query(empToContactQuery, [empId, contactId], (err) => {
            if (err) {
              connection.rollback(() => {
                console.error("Error committing transaction:", err);
                res.status(500).send("Error committing transaction");
              });
              return;
            }

            res.redirect("/employee");
          });
        });
      }
    );
  });
};

exports.edit = (req, res) => {
  const queries = [
    {
      text: `SELECT
      e.id AS employee_id,
      e.*,
      p.*,
      g.*,
      c.*,
      ct.*,
      d.*
  FROM
      tbl_employees e
  JOIN
      tbl_positions p ON e.position_id = p.id
  JOIN
      tbl_departments d ON p.department_id = d.id
  JOIN
      tbl_genders g ON e.gender_id = g.id
  JOIN
      tbl_civil_statuses c ON e.civil_id = c.id
  JOIN
      tbl_emp_to_contacts etc ON e.id = etc.emp_id
  JOIN
      tbl_contacts ct ON etc.contact_id = ct.id
  WHERE
      e.id = $1;
  `,
      values: [req.params.id],
    },
    "SELECT * FROM tbl_provinces",
    "SELECT * FROM tbl_cities",
    "SELECT * FROM tbl_barangays",
    "SELECT * FROM tbl_genders",
    "SELECT * FROM tbl_civil_statuses",
    "SELECT * FROM tbl_departments",
    "SELECT * FROM tbl_positions",
  ];

  pool.connect((err, connection) => {
    if (err) throw err;

    const results = [];

    const executeQuery = (index) => {
      if (index === queries.length) {
        connection.release();
        const [employees, ...data] = results;
        const [
          provinces,
          cities,
          barangays,
          genders,
          civil_statuses,
          departments,
          positions,
        ] = data;

        res.render("edit-employee", {
          employee: employees.rows,
          provinces: provinces.rows, 
          cities: cities.rows,
          barangays: barangays.rows,
          genders: genders.rows,
          civil_statuses: civil_statuses.rows,
          departments: departments.rows, 
          positions: positions.rows,
        });
        return;
      }

      const query = queries[index];
      connection.query(query, (err, result) => {
        if (err) {
          console.error(err);
          connection.release();
          return;
        }

        results.push(result);
        executeQuery(index + 1);
      });
    };

    executeQuery(0);
  });
};

exports.update = (req, res) => {
  const {
    positionId,
    genderId,
    civilStatusId,
    empFname,
    empLname,
    empMname,
    birthdate,
    email,
    sssNo,
    philhealthNo,
    pagibigNo,
    contactNo,
  } = req.body;

  const updateEmployeeQuery = `
    UPDATE tbl_employees 
    SET 
      position_id = $1,
      gender_id = $2,
      civil_id = $3,
      emp_fname = $4,
      emp_lname = $5,
      emp_mname = $6,
      birthdate = $7,
      email = $8,
      sss_no = $9,
      philhealth_no = $10,
      pagibig_no = $11
    WHERE 
      id = $12
  `;

  const updateContactQuery = `
    UPDATE tbl_contacts
    SET
      contact_no = $1
    WHERE
      id = (
        SELECT contact_id
        FROM tbl_emp_to_contacts
        WHERE emp_id = $2
      )
  `;

  pool.connect((err, connection) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      res.status(500).send("Error connecting to the database");
      return;
    }

    connection.query("BEGIN", (err) => {
      if (err) {
        console.error("Error beginning transaction:", err);
        res.status(500).send("Error beginning transaction");
        return;
      }

      connection.query(
        updateEmployeeQuery,
        [
          positionId,
          genderId,
          civilStatusId,
          empFname,
          empLname,
          empMname,
          birthdate,
          email,
          sssNo,
          philhealthNo,
          pagibigNo,
          req.params.id,
        ],
        (err) => {
          if (err) {
            return connection.query("ROLLBACK", () => {
              console.error("Error updating employee:", err);
              res.status(500).send("Error updating employee");
            });
          }

          connection.query(
            updateContactQuery,
            [contactNo, req.params.id],
            (err) => {
              if (err) {
                return connection.query("ROLLBACK", () => {
                  console.error("Error updating contact:", err);
                  res.status(500).send("Error updating contact");
                });
              }

              connection.query("COMMIT", (err) => {
                if (err) {
                  console.error("Error committing transaction:", err);
                  res.status(500).send("Error committing transaction");
                } else {
                  console.log("Transaction committed successfully");
                  res.redirect("/employee");
                }
              });
            }
          );
        }
      );
    });
  });
};

exports.delete = (req, res) => {
  const query = `UPDATE tbl_employees SET status = 'Inactive' WHERE id = $1`;
  
  pool.connect((err, connection) => {
    if (err) throw err;

    connection.query(query, [req.params.id], (err) => {
      if (!err) {
        res.redirect("/employee");
      } else {
        console.log(err);
      }
    })
  });
};

exports.getCitiesByProvince = (req, res) => {
  const provinceId = req.params.provinceId;
  const query = `SELECT * FROM tbl_cities WHERE province_id = $1`;
  pool.query(query, [provinceId], (err, result) => {
    if (err) {
      console.error("Error getting cities:", err);
      res.status(500).send("Error fetching cities");
    } else {
      res.json(result.rows);
    }
  });
};

exports.getBarangaysByCity = (req, res) => {
  const cityId = req.params.cityId;
  const query = `SELECT * FROM tbl_barangays WHERE city_id = $1`;
  pool.query(query, [cityId], (err, result) => {
    if (err) {
      console.error("Error getting barangays:", err);
      res.status(500).send("Error fetching barangays");
    } else {
      res.json(result.rows);
    }
  });
};

exports.getPositionsByDepartment = (req, res) => {
  const deptId = req.params.deptId;
  const query = `SELECT * FROM tbl_positions WHERE department_id = $1`;
  pool.query(query, [deptId], (err, result) => {
    if (err) {
      console.error("Error getting positions:", err);
      res.status(500).send("Error fetching positions");
    } else {
      res.json(result.rows);
    }
  });
};
