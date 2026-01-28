-- Drop tables if they exist
-- DROP TABLE IF EXISTS payment_confirmations CASCADE;
-- DROP TABLE IF EXISTS payments CASCADE;
-- DROP TABLE IF EXISTS apartments CASCADE;
-- DROP TABLE IF EXISTS renters CASCADE;

-- DROP TABLE IF EXISTS complaint_resolution CASCADE;
-- DROP TABLE IF EXISTS complaints CASCADE;
 --DROP TABLE IF EXISTS bills CASCADE;

-- Create renters table (basic info only)
CREATE TABLE IF NOT EXISTS renters (
  id SERIAL PRIMARY KEY,  -- ← INTEGER auto-increment
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Change apartments table  
CREATE TABLE IF NOT EXISTS apartments (
  id SERIAL PRIMARY KEY,  -- ← INTEGER auto-increment
  apartment_number VARCHAR(10) UNIQUE NOT NULL,
  floor INTEGER,
  rent_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'vacant',
  current_renter_id INTEGER REFERENCES renters(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Change payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,  -- ← INTEGER
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

-- Change payment_confirmations table
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id SERIAL PRIMARY KEY,  -- ← INTEGER
  payment_id INTEGER REFERENCES payments(id) NOT NULL,
  manager_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending_review',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('plumbing','electric','general')),
  priority VARCHAR(20) CHECK (priority IN ('low','medium','high')),

  apartment_id INT REFERENCES apartments(id),
  renter_id INT REFERENCES renters(id),

  workflow_status VARCHAR(20) CHECK (workflow_status IN ('pending','in-progress')) DEFAULT 'pending',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_resolution (
  complaint_id INT PRIMARY KEY REFERENCES complaints(id),
  manager_confirmed BOOLEAN DEFAULT FALSE,
  renter_confirmed BOOLEAN DEFAULT FALSE,
  manager_id INT,  -- optional, only if multiple managers
  resolved_at TIMESTAMP
);


CREATE TABLE  IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    manager_id INT ,

    title VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,

    due_date DATE NOT NULL,
    paid_date DATE,

    -- status VARCHAR(20) DEFAULT 'upcoming', -- upcoming | paid | pending | late
   status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);




-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
CREATE INDEX IF NOT EXISTS idx_payments_apartment ON payments(apartment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_renter ON payments(renter_id);
CREATE INDEX IF NOT EXISTS idx_apartments_status ON apartments(status);
CREATE INDEX IF NOT EXISTS idx_apartments_renter ON apartments(current_renter_id);
CREATE INDEX IF NOT EXISTS idx_renters_email ON renters(email);
CREATE INDEX IF NOT EXISTS idx_renters_status ON renters(status);

CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_manager_id ON bills(manager_id);

-- CREATE INDEX IF NOT EXISTS idx_complaints_apartment ON complaints(apartment_id);
-- CREATE INDEX IF NOT EXISTS idx_complaints_renter ON complaints(renter_id);
-- CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(workflow_status);

-- INSERT INTO renters (email, password_hash, name, phone, status) VALUES
-- ('john.doe@example.com', '$2b$10$hashedpassword1', 'John Doe', '01712345678', 'active'),
-- ('sarah.smith@example.com', '$2b$10$hashedpassword2', 'Sarah Smith', '01712345679', 'active'),
-- ('mike.johnson@example.com', '$2b$10$hashedpassword3', 'Mike Johnson', '01712345680', 'active'),
-- ('emily.wilson@example.com', '$2b$10$hashedpassword4', 'Emily Wilson', '01712345681', 'active'),
-- ('david.brown@example.com', '$2b$10$hashedpassword5', 'David Brown', '01712345682', 'inactive');

-- -- 2. Insert apartments (IDs will be 1, 2, 3, 4, 5 automatically)
-- INSERT INTO apartments (apartment_number, floor, rent_amount, status, current_renter_id) VALUES
-- ('101', 1, 5000.00, 'occupied', 1),   -- John Doe
-- ('102', 1, 5500.00, 'occupied', 2),   -- Sarah Smith
-- ('103', 1, 6000.00, 'vacant', NULL),
-- ('201', 2, 6500.00, 'occupied', 3),   -- Mike Johnson
-- ('202', 2, 7000.00, 'occupied', 4),   -- Emily Wilson
-- ('203', 2, 7500.00, 'under_maintenance', NULL),
-- ('301', 3, 8000.00, 'occupied', 5);   -- David Brown

-- -- 3. Insert payments for January 2025
-- INSERT INTO payments (apartment_id, renter_id, amount, month, status, payment_method, transaction_id, due_date, paid_at) VALUES
-- -- ✅ Paid & Verified
-- (1, 1, 5000.00, '2025-01-01', 'paid', 'bank_transfer', 'TRX-BANK-001', '2025-01-05', '2025-01-04 14:30:00'),
-- -- ✅ Paid & Verified
-- (2, 2, 5500.00, '2025-01-01', 'paid', 'bkash', '017XXXXXXXX123', '2025-01-05', '2025-01-03 10:15:00'),
-- -- ⏳ Paid but Pending Review
-- (4, 3, 6500.00, '2025-01-01', 'paid', 'cash', NULL, '2025-01-05', '2025-01-05 16:45:00'),
-- -- ❌ Overdue
-- (5, 4, 7000.00, '2025-01-01', 'overdue', NULL, NULL, '2025-01-05', NULL),
-- -- ❌ Pending (Not paid yet)
-- (1, 1, 5000.00, '2025-02-01', 'pending', NULL, NULL, '2025-02-05', NULL),

-- -- Payments for December 2024 (for testing month selector)
-- (1, 1, 5000.00, '2024-12-01', 'paid', 'bank_transfer', 'TRX-BANK-002', '2024-12-05', '2024-12-04 14:30:00'),
-- (2, 2, 5500.00, '2024-12-01', 'paid', 'nagad', '017XXXXXXXX456', '2024-12-05', '2024-12-03 10:15:00'),

-- -- Payments for November 2024
-- (1, 1, 5000.00, '2024-11-01', 'paid', 'rocket', '017XXXXXXXX789', '2024-11-05', '2024-11-04 14:30:00'),
-- (2, 2, 5500.00, '2024-11-01', 'paid', 'cash', NULL, '2024-11-05', '2024-11-03 10:15:00');

-- -- 4. Insert payment confirmations
-- INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at) VALUES
-- -- Verified payments (Jan 2025)
-- (1, 1, 'verified', '2025-01-04 15:00:00'),   -- Apartment 101, John
-- (2, 1, 'verified', '2025-01-03 11:00:00'),   -- Apartment 102, Sarah
-- -- Pending review (Jan 2025)
-- (3, 1, 'pending_review', NULL),               -- Apartment 201, Mike
-- -- Verified payments (Dec 2024)
-- (6, 1, 'verified', '2024-12-04 15:00:00'),   -- Apartment 101, John
-- (7, 1, 'verified', '2024-12-03 11:00:00'),   -- Apartment 102, Sarah
-- -- Verified payments (Nov 2024)
-- (8, 1, 'verified', '2024-11-04 15:00:00'),   -- Apartment 101, John
-- (9, 1, 'verified', '2024-11-03 11:00:00');   -- Apartment 102, 



-- INSERT INTO complaints (title, description, category, priority, apartment_id, renter_id)
-- VALUES
-- ('Leaky faucet', 'Kitchen faucet is dripping continuously', 'plumbing', 'medium', 1, 1),
-- ('Broken living room light', 'Ceiling light not working', 'electric', 'high', 2, 2),
-- ('Clogged bathroom drain', 'Water is not draining properly', 'plumbing', 'medium', 4, 3),
-- ('Heater not working', 'Central heater not turning on', 'electric', 'high', 5, 4),
-- ('Door lock issue', 'Front door lock is jammed', 'general', 'medium', 2, 2);


-- INSERT INTO complaint_resolution (complaint_id, manager_confirmed, renter_confirmed, manager_id)
-- VALUES
-- (1, FALSE, FALSE, NULL),
-- (2, TRUE, FALSE, NULL),
-- (3, FALSE, FALSE, NULL),
-- (4, FALSE, FALSE, NULL),
-- (5, TRUE, TRUE, NULL);

INSERT INTO bills (manager_id, title, amount, due_date, paid_date) VALUES
--Paid on time
(1, 'Electricity', 15000, '2026-01-05', '2026-01-04'),

-- Paid late
(1, 'Water', 6000, '2026-01-07', '2026-01-12'),

-- Pending (due date passed, not paid)
(1, 'Gas', 4000, '2026-01-05', NULL),

-- Upcoming (due date in future)
(2, 'Internet', 3000, '2026-01-29', NULL),

-- Another paid bill
(2, 'Maintenance', 10000, '2026-01-10', '2026-01-10'),

(2, 'Lift', 10000, '2026-01-30', NULL);

