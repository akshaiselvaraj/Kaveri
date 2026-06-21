-- Database Optimization Migration Script
-- Creates indexes for performance-critical columns

-- Location indexes
CREATE INDEX IF NOT EXISTS idx_location_district ON location(district);

-- FIR indexes
CREATE INDEX IF NOT EXISTS idx_fir_crime_type ON fir(crime_type);
CREATE INDEX IF NOT EXISTS idx_fir_status ON fir(status);
CREATE INDEX IF NOT EXISTS idx_fir_date ON fir(date);
CREATE INDEX IF NOT EXISTS idx_fir_location ON fir(location_id);

-- Accused name search optimization
CREATE INDEX IF NOT EXISTS idx_accused_name ON accused(name);
CREATE INDEX IF NOT EXISTS idx_accused_risk ON accused(risk_score);

-- Victim name search optimization
CREATE INDEX IF NOT EXISTS idx_victim_name ON victim(name);

-- Transaction optimization
CREATE INDEX IF NOT EXISTS idx_transaction_accounts ON transaction_table(from_account, to_account);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transaction_table(date);

-- Link table optimizations
CREATE INDEX IF NOT EXISTS idx_crime_link_accused ON crime_link(accused_id);
CREATE INDEX IF NOT EXISTS idx_crime_link_victim ON crime_link(victim_id);
