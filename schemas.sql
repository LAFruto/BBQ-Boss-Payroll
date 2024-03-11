CREATE TABLE province (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE city (
    id SERIAL PRIMARY KEY,
    province_id INT,
    FOREIGN KEY (province_id) REFERENCES province(id),
	name VARCHAR(255) NOT NULL
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

CREATE TABLE approve_status (
	id SERIAL PRIMARY KEY,
	status VARCHAR(30)
);

CREATE TABLE gender (
	id SERIAL PRIMARY KEY,
	gender VARCHAR(30)
);

CREATE TABLE civil_status ( 
	status VARCHAR(30)
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

CREATE TABLE period (
	id SERIAL PRIMARY KEY,
	start_date DATE,
	end_date DATE,
	payout_date DATE
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
	FOREIGN KEY(contrib_type_id) REFERENCES contrib_type(id)
);

CREATE TABLE position (
	id SERIAL PRIMARY KEY,
	department_id INT,
	FOREIGN KEY(department_id) REFERENCES department(id),
	name VARCHAR(50),
	details VARCHAR(255),
	salary_rate DECIMAL(9, 2)
	
	/* The following can be obtained: 
		hourly_rate DECIMAL(9, 2)
		daily_rate DECIMAL(9, 2)
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
    UNIQUE (account_type_id, activity_id)
);
 



