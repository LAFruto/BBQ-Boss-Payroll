CREATE TABLE tbl_provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE tbl_cities (
    id SERIAL PRIMARY KEY,
    province_id INT,
    FOREIGN KEY (province_id) REFERENCES tbl_provinces(id),
	name VARCHAR(255) NOT NULL,
	zip_code VARCHAR(10)
);

CREATE TABLE tbl_barangays (
    id SERIAL PRIMARY KEY,
	city_id INT,
    FOREIGN KEY (city_id) REFERENCES tbl_cities(id),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE tbl_addresses (
    id SERIAL PRIMARY KEY,
	barangay_id INT,
    FOREIGN KEY (barangay_id) REFERENCES tbl_barangays(id),
	address TEXT NOT NULL
); 

CREATE TABLE tbl_branches (
	id SERIAL PRIMARY KEY,
	address_id INT,
	FOREIGN KEY(address_id) REFERENCES tbl_addresses(id),
	starting_hrs TIME,
	closing_hrs TIME
);

CREATE TABLE tbl_genders (
	id SERIAL PRIMARY KEY,
	gender VARCHAR(30)
);

CREATE TABLE tbl_civil_statuses (
	id SERIAL PRIMARY KEY,
	status VARCHAR(30),
	details TEXT
);

CREATE TABLE tbl_leave_types (
	id SERIAL PRIMARY KEY,
	type VARCHAR(30)
);

CREATE TABLE tbl_contacts (
	id SERIAL PRIMARY KEY,
	contact_no VARCHAR(30)	
);

CREATE TABLE tbl_departments (
	id SERIAL PRIMARY KEY,
	dept_name VARCHAR(30),
	details VARCHAR(255)
);

CREATE TABLE tbl_day_types (
	id SERIAL PRIMARY KEY,
	type VARCHAR(50),
	details VARCHAR(255)
);

CREATE TABLE tbl_contrib_types (
	id SERIAL PRIMARY KEY,
	type VARCHAR(30)
);

CREATE TABLE tbl_contributions (
	id SERIAL PRIMARY KEY,
	contrib_type_id INT,
	FOREIGN KEY(contrib_type_id) REFERENCES tbl_contrib_types(id),
	start_range DECIMAL(6,2),
	end_range DECIMAL(6,2),
	employee_percent DECIMAL(2, 5),
	employer_percent DECIMAL(2,5)
);


CREATE TABLE tbl_rateclasses (
	id SMALLSERIAL PRIMARY KEY,
	rateclass_name VARCHAR(50)
);

CREATE TABLE tbl_positions (
	id SERIAL PRIMARY KEY,
	department_id INT,
	rateclass_id INT, 
	FOREIGN KEY(department_id) REFERENCES tbl_departments(id),
	FOREIGN KEY(rateclass_id) REFERENCES tbl_rateclasses(id),
	name VARCHAR(50),
	details VARCHAR(255),
	salary_rate DECIMAL(9, 2)
	
	/* The following are derived: 
		hourly_rate 
		daily_rate 
	*/
);

CREATE TABLE tbl_trainees (
	id SERIAL PRIMARY KEY,
	amount DECIMAL(6, 2),
	details VARCHAR(255)
);

CREATE TABLE tbl_account_types (
	id SERIAL PRIMARY KEY,
	type VARCHAR(30),
	details VARCHAR(255)
);

CREATE TABLE tbl_activity_types (
	id SERIAL PRIMARY KEY,
	type VARCHAR(30)
);

CREATE TABLE tbl_activities (
	id SERIAL PRIMARY KEY,
	activity_type_id INT,
	FOREIGN KEY(activity_type_id) REFERENCES tbl_activity_types(id),
	date DATE
);

CREATE TABLE tbl_account_to_activities (
    account_type_id INT,
    activity_id INT,
    FOREIGN KEY (account_type_id) REFERENCES tbl_account_types(id),
    FOREIGN KEY (activity_id) REFERENCES tbl_activities(id),
    UNIQUE (account_type_id, activity_id) -- composite key
);
 
CREATE TABLE tbl_employees (
	id BIGSERIAL PRIMARY KEY,
	position_id INT,
	FOREIGN KEY(position_id) REFERENCES tbl_positions(id),
	gender_id INT,
	FOREIGN KEY(gender_id) REFERENCES tbl_genders(id),
	civil_id INT,
	FOREIGN KEY(civil_id) REFERENCES tbl_civil_statuses(id),
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

CREATE TABLE tbl_emp_to_trainees (
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES tbl_employees(id),
	trainee_id INT,
	FOREIGN KEY(trainee_id) REFERENCES tbl_trainees(id),
	UNIQUE (emp_id, trainee_id)
);

CREATE TABLE tbl_emp_to_contacts (
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES tbl_employees(id),
	contact_id INT,
	FOREIGN KEY(contact_id) REFERENCES tbl_contacts(id),
	UNIQUE (emp_id, contact_id)
);

CREATE TABLE tbl_statuses (
	id SMALLSERIAL PRIMARY KEY,
	status VARCHAR(30)
);

CREATE TABLE tbl_leaves (
	id SERIAL PRIMARY KEY,
	leave_type_id INT,
	FOREIGN KEY(leave_type_id) REFERENCES tbl_leave_types(id),
	status_id INT,
	FOREIGN KEY(status_id) REFERENCES tbl_statuses(id),
	reason TEXT
);

CREATE TABLE tbl_dates (
	id SERIAL PRIMARY KEY,
	day_type_id INT,
	FOREIGN KEY(day_type_id) REFERENCES tbl_day_types(id),
	date DATE
);

CREATE TABLE tbl_date_to_leaves (
	date_id INT,
	FOREIGN KEY(date_id) REFERENCES tbl_dates(id),
	leave_id INT,
	FOREIGN KEY(leave_id) REFERENCES tbl_leaves(id),
	UNIQUE (date_id, leave_id)
);

CREATE TABLE tbl_periods (
	id SERIAL PRIMARY KEY,
	start_date DATE,
	end_date DATE,
	payout_date DATE
);

CREATE TABLE tbl_accounts (
	id SERIAL PRIMARY KEY,
	acc_type INT, 
	FOREIGN KEY(acc_type) REFERENCES tbl_account_types(id),
	username VARCHAR(30),
	password VARCHAR(30)
);

CREATE TABLE tbl_payrolls (
	id SERIAL PRIMARY KEY,
	period_id INT,
	FOREIGN KEY(period_id) REFERENCES tbl_periods(id),
	account_id INT,
	FOREIGN KEY(account_id) REFERENCES tbl_accounts(id)
	-- net pay is derived
);

CREATE TABLE tbl_charges (
	id SERIAL PRIMARY KEY,
	charge_amt DECIMAL(6,2),
	details VARCHAR(50)
);

CREATE TABLE tbl_emp_to_charges (
	charge_id INT,
	FOREIGN KEY(charge_id) REFERENCES tbl_charges(id),
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES tbl_employees(id),
	date_id INT,
	FOREIGN KEY(date_id) REFERENCES tbl_dates(id),
	UNIQUE (charge_id, emp_id, date_id)
);

CREATE TABLE tbl_daily_time_records (
	id SERIAL PRIMARY KEY,
	payroll_id INT,
	FOREIGN KEY(payroll_id) REFERENCES tbl_payrolls(id),
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES tbl_employees(id),
	date_id INT,
	FOREIGN KEY(date_id) REFERENCES tbl_dates(id),
	branch_id INT,
	FOREIGN KEY(branch_id) REFERENCES tbl_branches(id),
	status_id INT,
	FOREIGN KEY(status_id) REFERENCES tbl_statuses(id),
	hasOT Boolean,
	hasBreak Boolean
);

CREATE TABLE tbl_sss (
	contrib_id INT,
	FOREIGN KEY(contrib_id) REFERENCES tbl_contributions(id),
	employee_compensation DECIMAL(6,2)
);

CREATE TABLE tbl_emp_to_contribs (
	contrib_id INT,
	FOREIGN KEY(contrib_id) REFERENCES tbl_contributions(id),
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES tbl_employees(id)
);

CREATE TABLE tbl_dole_rates (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50),
	rate DECIMAL(2, 5)
);

-----------------------QUERIES-------------------------

-- period --
INSERT INTO tbl_periodS(start_date, end_date, payout_date) values 
('2024-03-01', '2024-03-15', '2024-03-20'),
('2024-03-16', '2024-03-31', '2024-04-05'),

('2024-04-01', '2024-04-15', '2024-04-20'),
('2024-04-16', '2024-04-30', '2024-05-05'),

('2024-05-01', '2024-05-15', '2024-05-20'),
('2024-05-16', '2024-05-31', '2024-06-05'),

('2024-06-01', '2024-06-15', '2024-06-20'),
('2024-06-16', '2024-06-30', '2024-07-05'),

('2024-07-01', '2024-07-15', '2024-07-20'),
('2024-07-16', '2024-07-31', '2024-08-05'),

('2024-08-01', '2024-08-15', '2024-08-20'),
('2024-08-16', '2024-08-31', '2024-09-05'),

('2024-09-01', '2024-09-15', '2024-09-20'),
('2024-09-16', '2024-09-30', '2024-10-05'),

('2024-10-01', '2024-10-15', '2024-10-20'),
('2024-10-16', '2024-10-31', '2024-11-05'),

('2024-11-01', '2024-11-15', '2024-11-20'),
('2024-11-16', '2024-11-30', '2024-12-05'),

('2024-12-01', '2024-12-15', '2024-12-20'),
('2024-12-16', '2024-12-31', '2025-01-05'),

('2025-01-01', '2025-01-15', '2025-01-20'),
('2025-01-16', '2025-01-31', '2025-02-05');

-- leave type --
INSERT INTO tbl_leave_types(type) values
('vacation'),
('sick');

-- acc type --
INSERT INTO tbl_account_types(type, details) values
('admin', 'can approve, view, edit, add accounts, check audit'),
('approver', 'can approve and edit'),
('viewer', 'view only and download');

-- status --
INSERT INTO tbl_statuses(status) values
('approved'),
('declined');

-- day type --
INSERT INTO tbl_day_types(type, details) values
('REG', 'Regular Working Day'),
('SH', 'Special Holiday'),
('RH', 'Regular Holiday');

-- civil status --
INSERT INTO tbl_civil_statuses(status, details) values
('Single', 'An individual who has never been married or is not currently married'),
('Married', 'A person who is legally wedded to another person'),
('Widowed', 'A person who has lost their spouse through death and has not remarried'),
('Annulled', 'A marriage that has been declared legally invalid, as if it never existed'),
('Divorced', 'An individual who went through legal process of divorce and is no longer married'),
('Separated', 'Individuals who are legally married but are apart, often with the goal of divorce');

-- gender --
INSERT INTO tbl_genders(gender) values
('Male'),
('Female'),
('N/A');

-- province -- 
INSERT INTO tbl_provinces(name) values
('Davao del Sur'),
('Davao Oriental'),
('Davao Occidental'),
('Davao del Norte'),
('Davao de Oro');

-- city --
INSERT INTO tbl_cities(province_id, name, zip_code) values
(1, 'Davao', '8000'),
(4, 'Tagum', '8100'),
(4, 'Panabo', '8105'),
(1, 'Digos', '8002'),
(2, 'Mati', '8200'),
(3, 'Sarangani', '8015'),
(5, 'Compostela', '8803'),
(5, 'Mabini', '8807'),
(1, 'Bansalan', '8005');

-- barangay --
INSERT INTO tbl_barangays(city_id, name) values
(1, 'Dacudao'),
(1, 'Daliao'),
(1, 'Panacan'),
(1, 'Tibungco'),
(1, 'Cabantian'),
(1, 'Agdao'),
(1, 'Lapu-Lapu'),
(1, 'Rafael Castillo'),
(1, 'Sasa'),
(1, 'Tigatto'),
(1, 'Matina Aplaya'),
(1, 'Maa'),
(1, 'Catalunan Grande'),
(1, 'Catalunan Pequeño'),
(1, 'Bucana');

-- activity type --
INSERT INTO tbl_activity_types(type) values 
('added user'),
('edited settings'),
('approved overtime');


ALTER SEQUENCE tbl_employees_id_seq RESTART WITH 10001;
ALTER SEQUENCE tbl_positions_id_seq RESTART WITH 1001;
ALTER SEQUENCE tbl_departments_id_seq RESTART WITH 101;
ALTER SEQUENCE tbl_branches_id_seq RESTART WITH 10;
ALTER SEQUENCE tbl_dates_id_seq RESTART WITH 200001;
ALTER SEQUENCE tbl_periods_id_seq RESTART WITH 30001;
ALTER SEQUENCE tbl_payrolls_id_seq RESTART WITH 40001;
ALTER SEQUENCE tbl_daily_time_records_id_seq RESTART WITH 500001;
ALTER SEQUENCE tbl_leaves_id_seq RESTART WITH 60001;
ALTER SEQUENCE tbl_charges_id_seq RESTART WITH 70001;
ALTER SEQUENCE tbl_activities_id_seq RESTART WITH 800001;
ALTER SEQUENCE tbl_accounts_id_seq RESTART WITH 901;

-----------------------QUERIES-------------------------

-- admin --
INSERT INTO tbl_accounts(acc_type, username, password) values
(1, 'admin', 123);

-- period --
INSERT INTO tbl_periods(start_date, end_date, payout_date) values 
('2024-03-01', '2024-03-15', '2024-03-20'),
('2024-03-16', '2024-03-31', '2024-04-05');

INSERT INTO tbl_periods(start_date, end_date, payout_date) values 
('2024-03-01', '2024-03-15', '2024-03-20'),
('2024-03-16', '2024-03-31', '2024-04-05'),

('2024-04-01', '2024-04-15', '2024-04-20'),
('2024-04-16', '2024-04-30', '2024-05-05'),

('2024-05-01', '2024-05-15', '2024-05-20'),
('2024-05-16', '2024-05-31', '2024-06-05'),

('2024-06-01', '2024-06-15', '2024-06-20'),
('2024-06-16', '2024-06-30', '2024-07-05'),

('2024-07-01', '2024-07-15', '2024-07-20'),
('2024-07-16', '2024-07-31', '2024-08-05'),

('2024-08-01', '2024-08-15', '2024-08-20'),
('2024-08-16', '2024-08-31', '2024-09-05'),

('2024-09-01', '2024-09-15', '2024-09-20'),
('2024-09-16', '2024-09-30', '2024-10-05'),

('2024-10-01', '2024-10-15', '2024-10-20'),
('2024-10-16', '2024-10-31', '2024-11-05'),

('2024-11-01', '2024-11-15', '2024-11-20'),
('2024-11-16', '2024-11-30', '2024-12-05'),

('2024-12-01', '2024-12-15', '2024-12-20'),
('2024-12-16', '2024-12-31', '2025-01-05'),

('2025-01-01', '2025-01-15', '2025-01-20'),
('2025-01-16', '2025-01-31', '2025-02-05');

-- leave type --
INSERT INTO tbl_leave_types(type) values
('vacation'),
('sick');
INSERT INTO tbl_leave_types(type) values
('vacation'),
('sick');

-- acc type --
INSERT INTO tbl_account_types(type, details) values
('admin', 'can approve, view, edit, add accounts, check audit'),
('approver', 'can approve and edit'),
('viewer', 'view only and download');
INSERT INTO tbl_account_types(type, details) values
('admin', 'can approve, view, edit, add accounts, check audit'),
('approver', 'can approve and edit'),
('viewer', 'view only and download');
-- status --
INSERT INTO tbl_statuses(status) values
('approved'),
('declined');

-- day type --
INSERT INTO tbl_day_types(type, details) values
('REG', 'Regular Working Day'),
('SH', 'Special Holiday'),
('RH', 'Regular Holiday');
INSERT INTO tbl_day_types(type, details) values
('REG', 'Regular Working Day'),
('SH', 'Special Holiday'),
('RH', 'Regular Holiday');

-- civil status --
INSERT INTO tbl_civil_statuses(status, details) values
('Single', 'An individual who has never been married or is not currently married'),
('Married', 'A person who is legally wedded to another person'),
('Widowed', 'A person who has lost their spouse through death and has not remarried'),
('Annulled', 'A marriage that has been declared legally invalid, as if it never existed'),
('Divorced', 'An individual who went through legal process of divorce and is no longer married'),
('Separated', 'Individuals who are legally married but are apart, often with the goal of divorce');

-- gender --
INSERT INTO tbl_genders(gender) values
('Male'),
('Female'),
('N/A');


-- province -- 
INSERT INTO tbl_provinces(name) values
('Davao del Sur'),
('Davao Oriental'),
('Davao Occidental'),
('Davao del Norte'),
('Davao de Oro');

-- city --
INSERT INTO tbl_cities(province_id, name, zip_code) values
(1, 'Davao', '8000'),
(4, 'Tagum', '8100'),
(4, 'Panabo', '8105'),
(1, 'Digos', '8002'),
(2, 'Mati', '8200'),
(3, 'Sarangani', '8015'),
(5, 'Compostela', '8803'),
(5, 'Mabini', '8807'),
(1, 'Bansalan', '8005');

-- barangay --
INSERT INTO tbl_barangays(city_id, name) values
(1, 'Dacudao'),
(1, 'Daliao'),
(1, 'Panacan'),
(1, 'Tibungco'),
(1, 'Cabantian'),
(1, 'Agdao'),
(1, 'Lapu-Lapu'),
(1, 'Rafael Castillo'),
(1, 'Sasa'),
(1, 'Tigatto'),
(1, 'Matina Aplaya'),
(1, 'Maa'),
(1, 'Catalunan Grande'),
(1, 'Catalunan Pequeño'),
(1, 'Bucana');

-- activity type --
INSERT INTO tbl_activity_types(type) values 
('added user'),
('edited settings'),
('approved overtime');

INSERT INTO tbl_rateclasses(rateclass_name) values 
('Daily'),
('Monthly');

-- Departments
INSERT INTO tbl_departments (dept_name, details) VALUES
('Kitchen', 'Responsible for food preparation and cooking'),
('Service', 'Responsible for customer service and serving food'),
('Management', 'Responsible for overall restaurant operations and administration');

-- Positions
INSERT INTO tbl_positions (id, department_id, rateclass_id, name, details, salary_rate) VALUES
(1001, 101, 1, 'Chef', 'Head of the kitchen, responsible for menu creation and food quality', 450.00),
(1002, 101, 1, 'Sous Chef', 'Assists the head chef in kitchen operations', 450.00),
(1003, 101, 1, 'Cook', 'Responsible for cooking and food preparation', 450.00),
(1004, 102, 1, 'Waiter/Waitress', 'Responsible for taking orders and serving food to customers', 450.00),
(1005, 103, 2, 'Restaurant Manager', 'Oversees overall restaurant operations and staff management', 12000.00);

-- Employees
INSERT INTO tbl_employees (id, position_id, gender_id, civil_id, emp_fname, emp_lname, emp_mname, birthdate, email, sss_no, philhealth_no, pagibig_no, date_hired, status, emp_type) VALUES
(10001, 1001, 1, 2, 'Juan', 'Dela Cruz', 'Santos', '1990-05-15', 'juan@example.com', '123456789', '123-456789-00', '123456789000', '2023-01-15', 'Active', 1),
(10002, 1004, 2, 1, 'Maria', 'Santos', 'Reyes', '1995-08-20', 'maria@example.com', '987654321', '987-654321-00', '987654321000', '2023-02-20', 'Active', 1),
(10003, 1004, 2, 1, 'Pedro', 'Garcia', 'Ramos', '1992-11-10', 'pedro@example.com', '456123789', '456-123789-00', '456123789000', '2023-03-10', 'Active', 1),
(10004, 1005, 1, 3, 'Ana', 'Reyes', 'Lopez', '1988-03-25', 'ana@example.com', '654987321', '654-987321-00', '654987321000', '2023-04-05', 'Active', 1);

-- Contacts
INSERT INTO tbl_contacts (contact_no) VALUES
('09123456789'),
('09234567890'),
('09345678901'),
('09456789012');

-- Linking Employees with Contacts
INSERT INTO tbl_emp_to_contacts (emp_id, contact_id) VALUES
(10001, 1),
(10002, 2),
(10003, 3),
(10004, 4);
