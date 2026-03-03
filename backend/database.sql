-- ================================
-- MUNICIPAL SMART PUBLIC SERVICE CRM
-- ================================

-- USERS (Citizen, Officer, Admin)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL -- citizen | officer | admin
);

-- WARDS (Replaces Block)
CREATE TABLE IF NOT EXISTS wards (
    ward_id SERIAL PRIMARY KEY,
    ward_name TEXT NOT NULL
);

-- DEPARTMENTS (Road, Water, Electricity, etc.)
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name TEXT NOT NULL,
    sla_hours INT DEFAULT 72
);

-- OFFICERS (Replaces Warden)
CREATE TABLE IF NOT EXISTS officers (
    officer_id INT PRIMARY KEY,
    ward_id INT,
    department_id INT,
    workload INT DEFAULT 0,
    FOREIGN KEY (officer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
);

-- COMPLAINTS (Upgraded)
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id SERIAL PRIMARY KEY,
    citizen_id INT,
    ward_id INT,
    department_id INT,
    description TEXT NOT NULL,
    location TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- AI Fields
    category TEXT,
    sentiment TEXT,
    priority_score FLOAT DEFAULT 0,
    
    -- Workflow
    status TEXT DEFAULT 'submitted',
    assigned_officer INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,

    FOREIGN KEY (citizen_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (ward_id) REFERENCES wards(ward_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_officer) REFERENCES officers(officer_id)
);

-- ESCALATIONS (For SLA Breach)
CREATE TABLE IF NOT EXISTS escalations (
    escalation_id SERIAL PRIMARY KEY,
    complaint_id INT,
    escalated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE
);