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
	id BIGSERIAL PRIMARY KEY,
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
	emp_id INT,
	FOREIGN KEY(period_id) REFERENCES tbl_periods(id),
	FOREIGN KEY(emp_id) REFERENCES tbl_employees(id)
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
	emp_id INT,
	FOREIGN KEY(emp_id) REFERENCES tbl_employees(id),
	date_id INT,
	FOREIGN KEY(date_id) REFERENCES tbl_dates(id),
	branch_id INT,
	FOREIGN KEY(branch_id) REFERENCES tbl_branches(id),
	status_id INT,
	FOREIGN KEY(status_id) REFERENCES tbl_statuses(id),
	hasOT Boolean,
	hasBreak Boolean,

	start_time Time,
	end_time Time
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

CREATE TABLE tbl_dole_times (
	id SERIAL PRIMARY KEY,
	name VARCHAR(50),
	"time" Time
);

-----------------------QUERIES-------------------------

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
-- day type --
INSERT INTO tbl_day_types(type, details) values
('REG', 'Regular Working Day'),
('SH', 'Special Holiday'),
('RH', 'Regular Holiday');

-- DATES -- 
-- Delete existing data from tbl_dates (if any)
DELETE FROM tbl_dates;

-- Insert dates for the year 2024
WITH RECURSIVE dates AS (
  SELECT 
    200001 AS id, 
    1 AS day_type_id, 
    CAST('2024-01-01' AS TIMESTAMP) AS date -- Cast to TIMESTAMP here
  UNION ALL
  SELECT 
    id + 1, 
    1, 
    date + INTERVAL '1 day' AS date
  FROM dates
  WHERE date < '2025-01-01'
)
INSERT INTO tbl_dates (id, day_type_id, date)
SELECT id, day_type_id, date::DATE
FROM dates;

-- acc type --
INSERT INTO tbl_account_types(type, details) values
('admin', 'can approve, view, edit, add accounts, check audit'),
('approver', 'can approve and edit'),
('viewer', 'view only and download');

-- admin --
INSERT INTO tbl_accounts(acc_type, username, password) values
(1, 'admin', 123);

-- period --
INSERT INTO tbl_periods(start_date, end_date, payout_date) values 
('2024-01-01', '2024-01-15', '2024-01-20'),
('2024-01-16', '2024-01-31', '2024-02-05'),

('2024-02-01', '2024-02-15', '2024-02-20'),
('2024-02-16', '2024-02-29', '2024-03-05'),

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


-- status --
INSERT INTO tbl_statuses(status) values
('approved'),
('pending'),
('declined');



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
(1, 'Acacia'),
(1, 'Agdao'),
(1, 'Alambre'),
(1, 'Alejandra Navarro (Lasang)'),
(1, 'Alfonso Angliongto Sr.'),
(1, 'Angalan'),
(1, 'Atan-Awe'),
(1, 'Baganihan'),
(1, 'Bago Aplaya'),
(1, 'Bago Gallera'),
(1, 'Bago Oshiro'),
(1, 'Baguio'),
(1, 'Balengaeng'),
(1, 'Baliok'),
(1, 'Bangkas Heights'),
(1, 'Bantol'),
(1, 'Baracatan'),
(1, 'Barangay 10-A'),
(1, 'Barangay 11-A'),
(1, 'Barangay 12-B'),
(1, 'Barangay 13-B'),
(1, 'Barangay 14-B'),
(1, 'Barangay 15-B'),
(1, 'Barangay 16-B'),
(1, 'Barangay 17-B'),
(1, 'Barangay 18-B'),
(1, 'Barangay 19-B'),
(1, 'Barangay 1-A'),
(1, 'Barangay 20-B'),
(1, 'Barangay 21-C'),
(1, 'Barangay 22-C'),
(1, 'Barangay 23-C'),
(1, 'Barangay 24-C'),
(1, 'Barangay 25-C'),
(1, 'Barangay 26-C'),
(1, 'Barangay 27-C'),
(1, 'Barangay 28-C'),
(1, 'Barangay 29-C'),
(1, 'Barangay 2-A'),
(1, 'Barangay 30-C'),
(1, 'Barangay 31-D'),
(1, 'Barangay 32-D'),
(1, 'Barangay 33-D'),
(1, 'Barangay 34-D'),
(1, 'Barangay 35-D'),
(1, 'Barangay 36-D'),
(1, 'Barangay 37-D'),
(1, 'Barangay 38-D'),
(1, 'Barangay 39-D'),
(1, 'Barangay 3-A'),
(1, 'Barangay 40-D'),
(1, 'Barangay 4-A'),
(1, 'Barangay 5-A'),
(1, 'Barangay 6-A'),
(1, 'Barangay 7-A'),
(1, 'Barangay 8-A'),
(1, 'Barangay 9-A'),
(1, 'Bato'),
(1, 'Bayabas'),
(1, 'Biao Escuela'),
(1, 'Biao Guianga'),
(1, 'Biao Joaquin'),
(1, 'Binugao'),
(1, 'Bucana'),
(1, 'Buda'),
(1, 'Buhangin'),
(1, 'Bunawan'),
(1, 'Cabantian'),
(1, 'Cadalian'),
(1, 'Calinan'),
(1, 'Callawa'),
(1, 'Camansi'),
(1, 'Carmen'),
(1, 'Catalunan Grande'),
(1, 'Catalunan Pequeño'),
(1, 'Catigan'),
(1, 'Cawayan'),
(1, 'Centro (San Juan)'),
(1, 'Colosas'),
(1, 'Communal'),
(1, 'Crossing Bayabas'),
(1, 'Dacudao'),
(1, 'Dalag'),
(1, 'Dalagdag'),
(1, 'Daliao'),
(1, 'Daliaon Plantation'),
(1, 'Datu Salumay'),
(1, 'Dominga'),
(1, 'Dumoy'),
(1, 'Eden'),
(1, 'Fatima (Benowang)'),
(1, 'Gatungan'),
(1, 'Gov. Paciano Bangoy'),
(1, 'Gov. Vicente Duterte'),
(1, 'Gumalang'),
(1, 'Gumitan'),
(1, 'Ilang'),
(1, 'Inayangan'),
(1, 'Indangan'),
(1, 'Kap. Tomas Monteverde Sr.'),
(1, 'Kilate'),
(1, 'Lacson'),
(1, 'Lamanan'),
(1, 'Lampianao'),
(1, 'Langub'),
(1, 'Lapu-lapu'),
(1, 'Leon Garcia Sr.'),
(1, 'Lizada'),
(1, 'Los Amigos'),
(1, 'Lubogan'),
(1, 'Lumiad'),
(1, 'Ma-a'),
(1, 'Mabuhay'),
(1, 'Magsaysay'),
(1, 'Magtuod'),
(1, 'Mahayag'),
(1, 'Malabog'),
(1, 'Malagos'),
(1, 'Malamba'),
(1, 'Manambulan'),
(1, 'Mandug'),
(1, 'Manuel Guianga'),
(1, 'Mapula'),
(1, 'Marapangi'),
(1, 'Marilog'),
(1, 'Matina Aplaya'),
(1, 'Matina Biao'),
(1, 'Matina Crossing'),
(1, 'Matina Pangi'),
(1, 'Megkawayan'),
(1, 'Mintal'),
(1, 'Mudiang'),
(1, 'Mulig'),
(1, 'New Carmen'),
(1, 'New Valencia'),
(1, 'Pampanga'),
(1, 'Panacan'),
(1, 'Panalum'),
(1, 'Pandaitan'),
(1, 'Pangyan'),
(1, 'Paquibato'),
(1, 'Paradise Embak'),
(1, 'Rafael Castillo'),
(1, 'Riverside'),
(1, 'Salapawan'),
(1, 'Salaysay'),
(1, 'Saloy'),
(1, 'San Antonio'),
(1, 'San Isidro (Licanan)'),
(1, 'Santo Niño'),
(1, 'Sasa'),
(1, 'Sibulan'),
(1, 'Sirawan'),
(1, 'Sirib'),
(1, 'Suawan (Tuli)'),
(1, 'Subasta'),
(1, 'Sumimao'),
(1, 'Tacunan'),
(1, 'Tagakpan'),
(1, 'Tagluno'),
(1, 'Tagurano'),
(1, 'Talandang'),
(1, 'Talomo'),
(1, 'Talomo River'),
(1, 'Tamayong'),
(1, 'Tambobong'),
(1, 'Tamugan'),
(1, 'Tapak'),
(1, 'Tawan-tawan'),
(1, 'Tibuloy'),
(1, 'Tibungco'),
(1, 'Tigatto'),
(1, 'Toril'),
(1, 'Tugbok'),
(1, 'Tungakalan'),
(1, 'Ubalde'),
(1, 'Ula'),
(1, 'Vicente Hizon Sr.'),
(1, 'Waan'),
(1, 'Wangan'),
(1, 'Wilfredo Aquino'),
(1, 'Wines');

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
(1004, 102, 1, 'Waiter', 'Responsible for taking orders and serving food to customers', 450.00),
(1005, 103, 2, 'Supervisor', 'Oversees overall restaurant operations and staff management', 12000.00);

-- Employees
INSERT INTO tbl_employees (id, position_id, gender_id, civil_id, emp_fname, emp_lname, emp_mname, birthdate, email, sss_no, philhealth_no, pagibig_no, date_hired, status, emp_type) VALUES
(10001, 1001, 2, 2, 'Diayanalie', 'Abecino', 'Santos', '1990-05-15', 'dsa@example.com', '123456789', '123-456789-00', '123456789000', '2023-01-15', 'Active', 1),
(10002, 1004, 2, 1, 'Chaylie', 'Andoc', 'Reyes', '1995-08-20', 'dra@example.com', '987654321', '987-654321-00', '987654321000', '2023-02-20', 'Active', 1),
(10003, 1004, 1, 1, 'Hedmi', 'Aquino', 'Ramos', '1992-11-10', 'hra@example.com', '456123789', '456-123789-00', '456123789000', '2023-03-10', 'Active', 1),
(10004, 1002, 1, 3, 'Remy', 'Bugtong', 'Lopez', '1988-03-25', 'rlb@example.com', '654987321', '654-987321-00', '654987321000', '2023-04-05', 'Active', 1),

(10005, 1001, 2, 2, 'Jeshriel', 'Cadungog', 'Lim', '1992-06-21', 'jlc@example.com', '246810999', '231-524624-00', '123456549000', '2023-02-17', 'Active', 1),
(10006, 1004, 2, 1, 'Bryan', 'Calunsag', 'Cruz', '1995-10-30', 'bcc@example.com', '132524267', '675-758675-00', '654654321000', '2023-06-22', 'Active', 1),
(10007, 1004, 1, 1, 'Jimboy', 'Catihan', 'Tolentino', '1994-11-17', 'jtc@example.com', '968735462', '454-675893-00', '654123789000', '2023-04-19', 'Active', 1),

(10008, 1001, 2, 2, 'Jeannelyn', 'Cortel', 'Magsaysay', '1999-01-16', 'jmc@example.com', '224268967', '776-536356-00', '444456789000', '2023-07-06', 'Active', 1),
(10009, 1003, 2, 1, 'Jessica', 'Coyoca', 'Hao', '1999-02-01', 'jhc@example.com', '857632543', '987-886742-00', '565654321000', '2023-07-06', 'Active', 1);

-- Contacts
INSERT INTO tbl_contacts (contact_no) VALUES
('09123456789'),
('09234567890'),
('09345478501'),
('09452289012'),
('09123151789'),
('09234777890'),
('09345678991'),
('09256789912'),
('09375678912');

-- Linking Employees with Contacts
INSERT INTO tbl_emp_to_contacts (emp_id, contact_id) VALUES
(10001, 1),
(10002, 2),
(10003, 3),
(10004, 4),
(10005, 5),
(10006, 6),
(10007, 7),
(10008, 8),
(10009, 9);

INSERT INTO tbl_addresses(address) VALUES
('Quirino'),
('Lanang'),
('Matina'),
('Quimpo');

INSERT INTO tbl_branches(address_id, starting_hrs, closing_hrs) 
VALUES
( 1, '10:30', '01:30'),
( 2, '10:00', '00:00'),
( 3, '10:30', '01:30'),
( 4, '10:30', '01:30');

-- DTR ENTRIES -- 

-- INSERT INTO tbl_daily_time_records (emp_id, date_id, branch_id, status_id, hasOT, hasBreak, start_time, end_time)
-- VALUES
-- (10001, 200061, 10, 2, false, false, '10:10', '18:00'),
-- (10001, 200062, 10, 2, false, false, '09:30', '17:30'),
-- (10001, 200063, 10, 2, false, false, '10:15', '18:15');

-- INSERT INTO tbl_daily_time_records (emp_id, date_id, branch_id, status_id, hasOT, hasBreak, start_time, end_time)
-- VALUES
-- (10002, 200061, 10, 2, false, false, '09:00', '17:00'),
-- (10002, 200062, 10, 2, false, false, '09:45', '17:45'),
-- (10002, 200063, 10, 2, false, false, '08:30', '16:30');

-- INSERT INTO tbl_daily_time_records (emp_id, date_id, branch_id, status_id, hasOT, hasBreak, start_time, end_time)
-- VALUES
-- (10003, 200061, 10, 2, false, false, '08:00', '16:00'),
-- (10003, 200062, 10, 2, false, false, '08:45', '16:45'),
-- (10003, 200063, 10, 2, false, false, '09:15', '17:15');

-- INSERT INTO tbl_daily_time_records (emp_id, date_id, branch_id, status_id, hasOT, hasBreak, start_time, end_time)
-- VALUES
-- (10004, 200061, 10, 2, false, false, '07:30', '15:30'),
-- (10004, 200062, 10, 2, false, false, '07:45', '15:45'),
-- (10004, 200063, 10, 2, false, false, '07:15', '15:15');

-- INSERT INTO tbl_dole_rates(id, name, rate) VALUES
-- (1, 'OT ADDITIONAL PAY', 0.30)
-- (2, 'ND ADDITIONAL PAY', 0.30)
-- (3, 'RH ADDITIONAL PAY', 1.00)
-- (4, 'RHOT ADDITIONAL PAY', 0.30)
-- (5, 'RH ADDITIONAL PAY', 0.30)
-- (6, 'RHOT ADDITIONAL PAY', 0.30)

-- INSERT INTO tbl_dole_times(id, name, time) VALUES
-- (1, 'START ND', '22:00')

-- INSERT INTO tbl_dole_(id, name, rate) VALUES
-- (1, "OT ADDITIONAL PAY", 0.30)