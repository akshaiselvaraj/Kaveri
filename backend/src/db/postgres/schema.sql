-- Kaveri Crime Intelligence Platform Database Schema (PostgreSQL)

-- 1. Location Table
CREATE TABLE IF NOT EXISTS location (
    location_id SERIAL PRIMARY KEY,
    district VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL
);

-- 2. FIR (First Information Report) Table
CREATE TABLE IF NOT EXISTS fir (
    fir_id VARCHAR(50) PRIMARY KEY,
    crime_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    location_id INTEGER REFERENCES location(location_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Investigation', 'Completed', 'Closed')),
    description TEXT
);

-- 3. Accused Table
CREATE TABLE IF NOT EXISTS accused (
    accused_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0),
    gender VARCHAR(20) NOT NULL,
    occupation VARCHAR(100),
    risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100)
);

-- 4. Victim Table
CREATE TABLE IF NOT EXISTS victim (
    victim_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 0),
    gender VARCHAR(20) NOT NULL,
    occupation VARCHAR(100)
);

-- 5. Transaction Table (Financial Audits)
CREATE TABLE IF NOT EXISTS transaction_table (
    transaction_id VARCHAR(100) PRIMARY KEY,
    from_account VARCHAR(50) NOT NULL,
    to_account VARCHAR(50) NOT NULL,
    amount DOUBLE PRECISION NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL
);

-- 6. Crime Link Table (Many-to-Many links)
CREATE TABLE IF NOT EXISTS crime_link (
    fir_id VARCHAR(50) REFERENCES fir(fir_id) ON DELETE CASCADE,
    accused_id INTEGER REFERENCES accused(accused_id) ON DELETE CASCADE,
    victim_id INTEGER REFERENCES victim(victim_id) ON DELETE CASCADE,
    PRIMARY KEY (fir_id, accused_id, victim_id)
);
