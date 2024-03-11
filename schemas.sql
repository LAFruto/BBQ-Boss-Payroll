CREATE TABLE province (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE city (
    id SERIAL PRIMARY KEY,
    province_id INT,
    FOREIGN KEY (province_id) REFERENCES province(id),
	name VARCHAR(255) NOT NULL,
	zip_code VARCHAR(10)
);

CREATE TABLE barangay (
    id SERIAL PRIMARY KEY,
	city_id INT,
    FOREIGN KEY (city_id) REFERENCES city(id),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE address (
    id SERIAL PRIMARY KEY,
	barangay_id INT,
    FOREIGN KEY (barangay_id) REFERENCES barangay(id),
	address TEXT NOT NULL
); 

CREATE TABLE branch (
	id SERIAL PRIMARY KEY,
	address_id INT,
	FOREIGN KEY(address_id) REFERENCES address(id),
	starting_hrs TIME,
	closing_hrs TIME
);

CREATE TABLE gender (
	id SERIAL PRIMARY KEY,
	gender VARCHAR(30)
);

CREATE TABLE civil_status (
	id SERIAL PRIMARY KEY,
	status VARCHAR(30),
	details TEXT
);

CREATE TABLE leave_type (
	id SERIAL PRIMARY KEY,
	type VARCHAR(30)
);

CREATE TABLE contact (
	id SERIAL PRIMARY KEY,
	contact_no VARCHAR(30)	
);

CREATE TABLE department (
	id SERIAL PRIMARY KEY,
	dept_name VARCHAR(30),
	details VARCHAR(255)
);

CREATE TABLE day_type (
	id SERIAL PRIMARY KEY,
	type VARCHAR(50),
	details VARCHAR(255)
);

CREATE TABLE contrib_type (
	id SERIAL PRIMARY KEY,
	type VARCHAR(30)
);

CREATE TABLE contribution (
	id SERIAL PRIMARY KEY,
	contrib_type_id INT,
	FOREIGN KEY(contrib_type_id) REFERENCES contrib_type(id),
	start_range DECIMAL(6,2),
	end_range DECIMAL(6,2),
	employee_percent DECIMAL(2, 5),
	employer_percent DECIMAL(2,5);
);

CREATE TABLE position (
	id SERIAL PRIMARY KEY,
	department_id INT,
	FOREIGN KEY(department_id) REFERENCES department(id),
	name VARCHAR(50),
	details VARCHAR(255),
	salary_rate DECIMAL(9, 2)
	
	/* The following are derived: 
		hourly_rate 
		daily_rate 
	*/
);

CREATE TABLE trainee (
	id SERIAL PRIMARY KEY,
	amount DECIMAL(6, 2),
	details VARCHAR(255)
);

CREATE TABLE account_type (
	id SERIAL PRIMARY KEY,
	type VARCHAR(30),
	details VARCHAR(255)
);

CREATE TABLE activity_type (
	id SERIAL PRIMARY KEY,
	type VARCHAR(30)
);

CREATE TABLE activity(
	id SERIAL PRIMARY KEY,
	activity_type_id INT,
	FOREIGN KEY(activity_type_id) REFERENCES activity_type(id),
	date DATE
);

CREATE TABLE account_to_activity (
    account_type_id INT,
    activity_id INT,
    FOREIGN KEY (account_type_id) REFERENCES account_type(id),
    FOREIGN KEY (activity_id) REFERENCES activity(id),
    UNIQUE (account_type_id, activity_id) -- composite key
);
 
CREATE TABLE employee(
	id BIGSERIAL PRIMARY KEY,
	position_id INT,
	FOREIGN KEY(position_id) REFERENCES position(id),
	gender_id INT,
	FOREIGN KEY(gender_id) REFERENCES gender(id),
	civil_id INT,
	FOREIGN KEY(civil_id) REFERENCES civil_status(id),
	emp_fname VARCHAR(50),
	emp_lname VARCHAR(50),	
	emp_mname VARCHAR(50),
	birthdate DATE,
	email VARCHAR(50),
	sss_no VARCHAR(30),
	philhealth_no VARCHAR(30),
	pagibig_no VARCHAR(30),
	date_hired DATE,
	date_end DATE,
	status VARCHAR(50),
	emp_type SMALLINT
);

CREATE TABLE emp_to_trainee (
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES employee(id),
	trainee_id INT,
	FOREIGN KEY(trainee_id) REFERENCES trainee(id),
	UNIQUE (emp_id, trainee_id)
);

CREATE TABLE emp_to_contact (
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES employee(id),
	contact_id INT,
	FOREIGN KEY(contact_id) REFERENCES contact(id),
	UNIQUE (emp_id, contact_id)
);

CREATE TABLE status (
	id SMALLSERIAL PRIMARY KEY,
	status VARCHAR(30)
)

CREATE TABLE leave (
	id SERIAL PRIMARY KEY,
	leave_type_id INT,
	FOREIGN KEY(leave_type_id) REFERENCES leave_type(id),
	status_id INT,
	FOREIGN KEY(status_id) REFERENCES status(id),
	reason TEXT
);

CREATE TABLE date (
	id SERIAL PRIMARY KEY,
	day_type_id INT,
	FOREIGN KEY(day_type_id) REFERENCES day_type(id),
	date DATE
);

CREATE TABLE date_to_leave (
	date_id INT,
	FOREIGN KEY(date_id) REFERENCES date(id),
	leave_id INT,
	FOREIGN KEY(leave_id) REFERENCES leave(id),
	UNIQUE (date_id, leave_id)
);

CREATE TABLE period (
	id SERIAL PRIMARY KEY,
	start_date DATE,
	end_date DATE,
	payout_date DATE
);

CREATE TABLE account (
	id SERIAL PRIMARY KEY,
	acc_type INT, 
	FOREIGN KEY(acc_type) REFERENCES account_type(id),
	username VARCHAR(30),
	password VARCHAR(30)
);

CREATE TABLE payroll (
	id SERIAL PRIMARY KEY,
	period_id INT,
	FOREIGN KEY(period_id) REFERENCES period(id),
	account_id INT,
	FOREIGN KEY(account_id) REFERENCES account(id)
	-- net pay is derived
);

CREATE TABLE charge (
	id SERIAL PRIMARY KEY,
	charge_amt DECIMAL(6,2),
	details VARCHAR(50)
);

CREATE TABLE emp_to_charge (
	charge_id INT,
	FOREIGN KEY(charge_id) REFERENCES charge(id),
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES employee(id),
	date_id INT,
	FOREIGN KEY(date_id) REFERENCES date(id),
	UNIQUE (charge_id, emp_id, date_id)
);

CREATE TABLE daily_time_record (
	id SERIAL PRIMARY KEY,
	payroll_id INT,
	FOREIGN KEY(payroll_id) REFERENCES payroll(id),
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES employee(id),
	date_id INT,
	FOREIGN KEY(date_id) REFERENCES date(id),
	branch_id INT,
	FOREIGN KEY(branch_id) REFERENCES branch(id),
	status_id INT,
	FOREIGN KEY(status_id) REFERENCES status(id),
	hasOT Boolean,
	hasBreak Boolean
);

CREATE TABLE sss (
	contrib_id INT,
	FOREIGN KEY(contrib_id) REFERENCES contribution(id),
	employee_compensation DECIMAL(6,2)
);

CREATE TABLE emp_to_contrib (
	contrib_id INT,
	FOREIGN KEY(contrib_id) REFERENCES contribution(id),
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES employee(id)
);

-----------------------QUERIES-------------------------

-- period --
INSERT INTO period values 
(1, '2024-03-01', '2024-03-15', '2024-03-20'),
(2, '2024-03-16', '2024-03-31', '2024-04-05'),

(3, '2024-04-01', '2024-04-15', '2024-04-20'),
(4, '2024-04-16', '2024-04-30', '2024-05-05'),

(5, '2024-05-01', '2024-05-15', '2024-05-20'),
(6, '2024-05-16', '2024-05-31', '2024-06-05'),

(7, '2024-06-01', '2024-06-15', '2024-06-20'),
(8, '2024-06-16', '2024-06-30', '2024-07-05'),

(9, '2024-07-01', '2024-07-15', '2024-07-20'),
(10, '2024-07-16', '2024-07-31', '2024-08-05'),

(11, '2024-08-01', '2024-08-15', '2024-08-20'),
(12, '2024-08-16', '2024-08-31', '2024-09-05'),

(13, '2024-09-01', '2024-09-15', '2024-09-20'),
(14, '2024-09-16', '2024-09-30', '2024-10-05'),

(15, '2024-10-01', '2024-10-15', '2024-10-20'),
(16, '2024-10-16', '2024-10-31', '2024-11-05'),

(17, '2024-11-01', '2024-11-15', '2024-11-20'),
(18, '2024-11-16', '2024-11-30', '2024-12-05'),

(19, '2024-12-01', '2024-12-15', '2024-12-20'),
(20, '2024-12-16', '2024-12-31', '2025-01-05'),

(21, '2025-01-01', '2025-01-15', '2025-01-20'),
(22, '2025-01-16', '2025-01-31', '2025-02-05');

-- leave type --
INSERT INTO leave_type values
(1, 'vacation'),
(2, 'sick');

-- acc type --
INSERT INTO account_type values
(1, 'admin', 'can approve, view, edit, add accounts, check audit'),
(2, 'approver', 'can approve and edit'),
(3, 'viewer', 'view only and download');

-- status --
INSERT INTO status values
(1, 'approved'),
(2, 'declined');

-- day type --
INSERT INTO status values
(1, 'approved'),
(2, 'declined');

-- civil status --
INSERT INTO civil_status values
(1, 'Single', 'An individual who has never been married or is not currently married'),
(2, 'Married', 'A person who is legally wedded to another person'),
(3, 'Widowed', 'A person who has lost their spouse through death and has not remarried'),
(4, 'Annulled', 'A marriage that has been declared legally invalid, as if it never existed'),
(5, 'Divorced', 'An individual who went through legal process of divorce and is no longer married'),
(6, 'Separated', 'Individuals who are legally married but are apart, often with the goal of divorce');

-- gender --
INSERT INTO gender values
(1, 'Male'),
(2, 'Female'),
(3, 'N/A');

-- province -- 
INSERT INTO province values
(1, 'Davao del Sur'),
(2, 'Davao Oriental'),
(3, 'Davao Occidental'),
(4, 'Davao del Norte'),
(5, 'Davao de Oro'),

-- city --
INSERT INTO city values
(1, 1, 'Davao', '8000'),
(2, 4, 'Tagum', '8100'),
(3, 4, 'Panabo', '8105'),
(4, 1, 'Digos', '8002'),
(5, 2, 'Mati', '8200'),
(6, 3, 'Sarangani', '8015'),
(7, 5, 'Compostela', '8803'),
(8, 5, 'Mabini', '8807'),
(9, 1, 'Bansalan', '8005');

-- barangay --
INSERT INTO barangay values
(1, 1, 'Dacudao'),
(2, 1, 'Daliao'),
(3, 1, 'Panacan'),
(4, 1, 'Tibungco'),
(5, 1, 'Cabantian'),
(6, 1, 'Agdao'),
(7, 1, 'Lapu-Lapu'),
(8, 1, 'Rafael Castillo'),
(9, 1, 'Sasa'),
(10, 1, 'Tigatto'),
(11, 1, 'Matina Aplaya'),
(12, 1, 'Maa'),
(13, 1, 'Catalunan Grande'),
(14, 1, 'Catalunan Pequeño'),
(15, 1, 'Bucana'),

-- activity type --
INSERT INTO activity_type values 
(1, 'added user'),
(2, 'edited settings'),
(3, 'approved overtime')





