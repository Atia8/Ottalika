-- Drop tables if they exist
DROP TABLE IF EXISTS payment_confirmations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS renters CASCADE;

-- Create renters table (basic info only)
CREATE TABLE renters (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create apartments table
CREATE TABLE apartments (
  id SERIAL PRIMARY KEY,
  apartment_number VARCHAR(10) UNIQUE NOT NULL,
  floor INTEGER,
  rent_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'vacant',
  current_renter_id INTEGER REFERENCES renters(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  apartment_id INTEGER REFERENCES apartments(id) NOT NULL,
  renter_id INTEGER REFERENCES renters(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  month DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'bkash', 'nagad', 'rocket', 'card', 'check', 'other')),
  transaction_id VARCHAR(100),
  due_date DATE NOT NULL,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_confirmations table
CREATE TABLE payment_confirmations (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(id) NOT NULL,
  manager_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending_review',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_payments_month ON payments(month);
CREATE INDEX idx_payments_apartment ON payments(apartment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_renter ON payments(renter_id);
CREATE INDEX idx_apartments_status ON apartments(status);
CREATE INDEX idx_apartments_renter ON apartments(current_renter_id);
CREATE INDEX idx_renters_email ON renters(email);
CREATE INDEX idx_renters_status ON renters(status);

-- Insert sample renters
INSERT INTO renters (email, password_hash, name, phone, status) VALUES
('john.doe@example.com', '$2b$10$hashedpassword1', 'John Doe', '01712345678', 'active'),
('sarah.smith@example.com', '$2b$10$hashedpassword2', 'Sarah Smith', '01712345679', 'active'),
('mike.johnson@example.com', '$2b$10$hashedpassword3', 'Mike Johnson', '01712345680', 'active'),
('emily.wilson@example.com', '$2b$10$hashedpassword4', 'Emily Wilson', '01712345681', 'active'),
('david.brown@example.com', '$2b$10$hashedpassword5', 'David Brown', '01712345682', 'inactive');

-- Insert apartments
INSERT INTO apartments (apartment_number, floor, rent_amount, status, current_renter_id) VALUES
('101', 1, 5000.00, 'occupied', 1),
('102', 1, 5500.00, 'occupied', 2),
('103', 1, 6000.00, 'vacant', NULL),
('201', 2, 6500.00, 'occupied', 3),
('202', 2, 7000.00, 'occupied', 4),
('203', 2, 7500.00, 'under_maintenance', NULL),
('301', 3, 8000.00, 'occupied', 5);

-- Insert payments for January 2025
INSERT INTO payments (apartment_id, renter_id, amount, month, status, payment_method, transaction_id, due_date, paid_at) VALUES
(1, 1, 5000.00, '2025-01-01', 'paid', 'bank_transfer', 'TRX-BANK-001', '2025-01-05', '2025-01-04 14:30:00'),
(2, 2, 5500.00, '2025-01-01', 'paid', 'bkash', '017XXXXXXXX123', '2025-01-05', '2025-01-03 10:15:00'),
(4, 3, 6500.00, '2025-01-01', 'paid', 'cash', NULL, '2025-01-05', '2025-01-05 16:45:00'),
(5, 4, 7000.00, '2025-01-01', 'overdue', NULL, NULL, '2025-01-05', NULL),
(1, 1, 5000.00, '2025-02-01', 'pending', NULL, NULL, '2025-02-05', NULL),
(1, 1, 5000.00, '2024-12-01', 'paid', 'bank_transfer', 'TRX-BANK-002', '2024-12-05', '2024-12-04 14:30:00'),
(2, 2, 5500.00, '2024-12-01', 'paid', 'nagad', '017XXXXXXXX456', '2024-12-05', '2024-12-03 10:15:00'),
(1, 1, 5000.00, '2024-11-01', 'paid', 'rocket', '017XXXXXXXX789', '2024-11-05', '2024-11-04 14:30:00'),
(2, 2, 5500.00, '2024-11-01', 'paid', 'cash', NULL, '2024-11-05', '2024-11-03 10:15:00');

-- Insert payment confirmations
INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at) VALUES
(1, 1, 'verified', '2025-01-04 15:00:00'),
(2, 1, 'verified', '2025-01-03 11:00:00'),
(3, 1, 'pending_review', NULL),
(6, 1, 'verified', '2024-12-04 15:00:00'),
(7, 1, 'verified', '2024-12-03 11:00:00'),
(8, 1, 'verified', '2024-11-04 15:00:00'),
(9, 1, 'verified', '2024-11-03 11:00:00');