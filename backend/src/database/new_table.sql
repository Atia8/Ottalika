DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS payment_audit_log CASCADE;
DROP TABLE IF EXISTS renters_audit_log CASCADE;
DROP TABLE IF EXISTS maintenance_audit_log CASCADE;
DROP TABLE IF EXISTS manager_tasks CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS complaint_resolution CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS payment_confirmations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;
DROP TABLE IF EXISTS building_floors CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS renters CASCADE;
DROP TABLE IF EXISTS managers CASCADE;
DROP TABLE IF EXISTS owners CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS utility_bills CASCADE;
DROP TABLE IF EXISTS owner_expenses CASCADE;

DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS maintenance_priority CASCADE;
DROP TYPE IF EXISTS maintenance_status CASCADE;
DROP TYPE IF EXISTS apartment_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS renter_status CASCADE;
DROP TYPE IF EXISTS manager_task_priority CASCADE;
DROP TYPE IF EXISTS manager_task_status CASCADE;
DROP TYPE IF EXISTS bill_status CASCADE;

-- ========= CREATE TYPES ====================

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'renter');
CREATE TYPE renter_status AS ENUM ('active', 'inactive', 'pending', 'terminated');
CREATE TYPE apartment_status AS ENUM ('occupied', 'vacant', 'maintenance', 'reserved');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'partial');
CREATE TYPE maintenance_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE maintenance_status AS ENUM ('pending', 'in_progress', 'completed', 'resolved', 'cancelled');
CREATE TYPE manager_task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE manager_task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE bill_status AS ENUM ('upcoming', 'paid', 'pending', 'overdue');

-- ==================== CREATE ALL TABLES ====================

-- 1. Users table (for authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    "isActive" BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Owners table
CREATE TABLE owners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    tax_id VARCHAR(50),
    bank_account VARCHAR(100),
    emergency_contact VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Managers table
CREATE TABLE managers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    designation VARCHAR(100),
    salary DECIMAL(10,2),
    hire_date DATE,
    assigned_owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Renters table
CREATE TABLE renters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    nid_number VARCHAR(20),
    emergency_contact VARCHAR(20),
    occupation VARCHAR(100),
    status renter_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Buildings table
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    total_floors INTEGER DEFAULT 3,
    year_built INTEGER,
    amenities TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Apartments table
CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    apartment_number VARCHAR(20) NOT NULL,
    floor VARCHAR(10),
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    area_sqft DECIMAL(8,2),
    rent_amount DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) DEFAULT 0,
    status apartment_status DEFAULT 'vacant',
    current_renter_id INTEGER REFERENCES renters(id) ON DELETE SET NULL,
    lease_start DATE,
    lease_end DATE,
    amenities TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    renter_id INTEGER NOT NULL REFERENCES renters(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    month DATE NOT NULL,
    due_date DATE NOT NULL,
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'bank_transfer', 'bkash', 'nagad', 'rocket', 'card', 'check', 'other')),
    transaction_id VARCHAR(100),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (amount > 0)
);

-- 8. Payment confirmations table
CREATE TABLE payment_confirmations (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER UNIQUE NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    manager_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending_review',
    verified_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Maintenance requests table
CREATE TABLE maintenance_requests (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    renter_id INTEGER NOT NULL REFERENCES renters(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    type VARCHAR(50),
    priority maintenance_priority DEFAULT 'medium',
    status maintenance_status DEFAULT 'pending',
    assigned_to VARCHAR(100),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    completed_at TIMESTAMP,
    notes TEXT,
    manager_marked_resolved BOOLEAN DEFAULT FALSE,
    renter_marked_resolved BOOLEAN DEFAULT FALSE,
    resolution TEXT,
    resolution_notes TEXT,
    assigned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Manager tasks table
CREATE TABLE manager_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(50),
    priority manager_task_priority DEFAULT 'medium',
    status manager_task_status DEFAULT 'pending',
    assigned_to INTEGER,
    due_date DATE,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Complaints table
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('plumbing','electric','general')),
    priority VARCHAR(20) CHECK (priority IN ('low','medium','high')),
    apartment_id INTEGER REFERENCES apartments(id),
    renter_id INTEGER REFERENCES renters(id),
    workflow_status VARCHAR(20) CHECK (workflow_status IN ('pending','in-progress')) DEFAULT 'pending',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Complaint resolution table
CREATE TABLE complaint_resolution (
    complaint_id INTEGER PRIMARY KEY REFERENCES complaints(id),
    manager_confirmed BOOLEAN DEFAULT FALSE,
    renter_confirmed BOOLEAN DEFAULT FALSE,
    manager_id INTEGER,
    resolved_at TIMESTAMP
);

-- 13. Bills table (Manager-created bills)
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER REFERENCES managers(id) ON DELETE SET NULL,
    title VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status bill_status DEFAULT 'upcoming',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Utility bills table (WITH OWNER_ID for owner visibility)
CREATE TABLE utility_bills (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Building Maintenance', 'Maintenance Fee', 'Gas', 'Electricity', 'Water', 'Security', 'Internet', 'Garbage')),
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
    owner_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status bill_status DEFAULT 'upcoming',
    provider VARCHAR(100),
    account_number VARCHAR(50),
    month VARCHAR(20),
    consumption VARCHAR(50),
    description TEXT,
    paid_date DATE,
    paid_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Owner expenses table
CREATE TABLE owner_expenses (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('property_tax', 'insurance', 'repair', 'renovation', 'legal', 'marketing', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50),
    receipt_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== AUDIT LOG TABLES ====================

CREATE TABLE payment_audit_log (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT,
    changed_by INTEGER
);

CREATE TABLE renters_audit_log (
    id SERIAL PRIMARY KEY,
    renter_id INTEGER NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT,
    changed_by INTEGER
);

CREATE TABLE maintenance_audit_log (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT,
    changed_by INTEGER
);

-- Messages table for communication
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CREATE INDEXES ====================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_owners_user ON owners(user_id);
CREATE INDEX idx_managers_user ON managers(user_id);
CREATE INDEX idx_managers_owner ON managers(assigned_owner_id);
CREATE INDEX idx_renters_email ON renters(email);
CREATE INDEX idx_renters_status ON renters(status);
CREATE INDEX idx_renters_user ON renters(user_id);
CREATE INDEX idx_buildings_owner ON buildings(owner_id);
CREATE INDEX idx_apartments_building ON apartments(building_id);
CREATE INDEX idx_apartments_renter ON apartments(current_renter_id);
CREATE INDEX idx_apartments_status ON apartments(status);
CREATE INDEX idx_apartments_number ON apartments(apartment_number);
CREATE INDEX idx_payments_apartment ON payments(apartment_id);
CREATE INDEX idx_payments_renter ON payments(renter_id);
CREATE INDEX idx_payments_month ON payments(month);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payment_confirmations_payment ON payment_confirmations(payment_id);
CREATE INDEX idx_payment_confirmations_status ON payment_confirmations(status);
CREATE INDEX idx_maintenance_requests_apartment ON maintenance_requests(apartment_id);
CREATE INDEX idx_maintenance_requests_renter ON maintenance_requests(renter_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_manager_resolved ON maintenance_requests(manager_marked_resolved);
CREATE INDEX idx_maintenance_renter_resolved ON maintenance_requests(renter_marked_resolved);
CREATE INDEX idx_manager_tasks_status ON manager_tasks(status);
CREATE INDEX idx_manager_tasks_priority ON manager_tasks(priority);
CREATE INDEX idx_manager_tasks_due_date ON manager_tasks(due_date);
CREATE INDEX idx_complaints_apartment ON complaints(apartment_id);
CREATE INDEX idx_complaints_renter ON complaints(renter_id);
CREATE INDEX idx_complaints_status ON complaints(workflow_status);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_utility_bills_type ON utility_bills(type);
CREATE INDEX idx_utility_bills_status ON utility_bills(status);
CREATE INDEX idx_utility_bills_due_date ON utility_bills(due_date);
CREATE INDEX idx_utility_bills_building ON utility_bills(building_id);
CREATE INDEX idx_utility_bills_owner ON utility_bills(owner_id);
CREATE INDEX idx_owner_expenses_owner ON owner_expenses(owner_id);
CREATE INDEX idx_owner_expenses_category ON owner_expenses(category);
CREATE INDEX idx_owner_expenses_date ON owner_expenses(expense_date);
CREATE INDEX idx_payment_audit_payment ON payment_audit_log(payment_id);
CREATE INDEX idx_payment_audit_date ON payment_audit_log(changed_at);
CREATE INDEX idx_renters_audit_renter ON renters_audit_log(renter_id);
CREATE INDEX idx_maintenance_audit_request ON maintenance_audit_log(request_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Composite indexes
CREATE INDEX idx_maintenance_requests_manager_renter_resolved ON maintenance_requests(manager_marked_resolved, renter_marked_resolved);
CREATE INDEX idx_maintenance_requests_status_priority ON maintenance_requests(status, priority);
CREATE INDEX idx_payments_renter_status ON payments(renter_id, status);
CREATE INDEX idx_payments_month_status ON payments(month, status);
CREATE INDEX idx_renters_status_user ON renters(status, user_id);

-- ==================== INSERT DEMO USERS ====================

INSERT INTO users (username, password_hash, role, email, phone, "isActive") VALUES
('manager', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'manager', 'manager@ottalika.com', '01710000001', true),
('owner', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'owner', 'owner@ottalika.com', '01710000002', true),
('renter', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'renter', 'renter@ottalika.com', '01710000003', true),
('john_doe', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'renter', 'john.doe@example.com', '01712345678', true),
('sarah_smith', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'renter', 'sarah.smith@example.com', '01712345679', true),
('owner2', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'owner', 'owner2@ottalika.com', '01710000004', true),
('manager2', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'manager', 'manager2@ottalika.com', '01710000005', true);

-- Insert owners
INSERT INTO owners (user_id, name, address, tax_id, bank_account, emergency_contact) VALUES
(2, 'Demo Owner', '123 Owner Street, Dhaka', 'TAX-001', 'BANK-001', '01700000001'),
(6, 'Second Owner', '456 Owner Avenue, Dhaka', 'TAX-002', 'BANK-002', '01700000002');

-- Insert managers
INSERT INTO managers (user_id, name, designation, assigned_owner_id) VALUES
(1, 'Demo Manager', 'Property Manager', 1),
(7, 'Second Manager', 'Assistant Manager', 2);

-- Insert renters
INSERT INTO renters (name, email, phone, nid_number, emergency_contact, occupation, status, user_id) VALUES
('John Doe', 'john.doe@example.com', '01712345678', '1234567890123', '01711111111', 'Software Engineer', 'active', 4),
('Sarah Smith', 'sarah.smith@example.com', '01712345679', '2345678901234', '01722222222', 'Doctor', 'active', 5),
('Mike Johnson', 'mike.johnson@example.com', '01712345680', '3456789012345', '01733333333', 'Teacher', 'active', NULL),
('Emily Wilson', 'emily.wilson@example.com', '01712345681', '4567890123456', '01744444444', 'Accountant', 'active', NULL),
('David Brown', 'david.brown@example.com', '01712345682', '5678901234567', '01755555555', 'Marketing Manager', 'inactive', NULL),
('Demo Renter', 'renter@ottalika.com', '01710000003', '9876543210987', '01700000000', 'Software Developer', 'active', 3),
('Robert Davis', 'robert.davis@example.com', '01712345683', '6789012345678', '01766666666', 'Architect', 'active', NULL);

-- Insert buildings
INSERT INTO buildings (owner_id, name, address, total_floors, year_built, amenities) VALUES
(1, 'Green Valley Apartments', '123 Green Valley Rd, Dhaka', 3, 2020, ARRAY['gym', 'pool', 'parking']),
(1, 'Sky Tower', '456 Business Rd, City', 5, 2022, ARRAY['gym', 'pool', 'concierge', 'security']),
(2, 'Lakeview Residency', '789 Lake Road, Dhaka', 4, 2021, ARRAY['garden', 'playground', 'security']);

-- Insert apartments
INSERT INTO apartments (building_id, apartment_number, floor, bedrooms, bathrooms, rent_amount, status, current_renter_id, lease_start, lease_end) VALUES
(1, '101', '1', 2, 1, 12000.00, 'occupied', 1, '2024-01-01', '2024-12-31'),
(1, '102', '1', 1, 1, 8000.00, 'occupied', 2, '2024-02-01', '2024-11-30'),
(1, '103', '1', 1, 1, 8500.00, 'occupied', 6, '2024-01-01', '2024-12-31'),
(1, '201', '2', 2, 2, 15000.00, 'occupied', 3, '2024-03-01', '2024-10-31'),
(1, '202', '2', 1, 1, 9000.00, 'vacant', NULL, NULL, NULL),
(1, '301', '3', 3, 2, 18000.00, 'maintenance', NULL, NULL, NULL),
(1, '302', '3', 2, 1, 13000.00, 'occupied', 4, '2024-04-01', '2024-09-30'),
(2, '501', '5', 3, 2, 25000.00, 'occupied', 5, '2024-05-01', '2024-08-31'),
(2, '502', '5', 2, 2, 20000.00, 'vacant', NULL, NULL, NULL),
(3, '101', '1', 2, 1, 11000.00, 'occupied', 7, '2024-06-01', '2024-11-30'),
(3, '102', '1', 1, 1, 7500.00, 'vacant', NULL, NULL, NULL),
(3, '201', '2', 2, 2, 14000.00, 'occupied', NULL, NULL, NULL);

-- Insert payments
INSERT INTO payments (apartment_id, renter_id, amount, month, due_date, status, payment_method, transaction_id, paid_at) VALUES
(1, 1, 12000.00, '2025-01-01', '2025-01-05', 'paid', 'bkash', 'TRX001', '2025-01-04 14:30:00'),
(2, 2, 8000.00, '2025-01-01', '2025-01-05', 'paid', 'bank_transfer', 'TRX002', '2025-01-03 10:15:00'),
(4, 3, 15000.00, '2025-01-01', '2025-01-05', 'paid', 'cash', NULL, '2025-01-05 16:45:00'),
(7, 4, 13000.00, '2025-01-01', '2025-01-05', 'overdue', NULL, NULL, NULL),
(8, 5, 25000.00, '2025-01-01', '2025-01-05', 'pending', NULL, NULL, NULL),
(10, 7, 11000.00, '2025-01-01', '2025-01-05', 'paid', 'nagad', 'TRX012', '2025-01-04 12:00:00'),
(1, 1, 12000.00, '2024-12-01', '2024-12-05', 'paid', 'nagad', 'TRX003', '2024-12-04 15:00:00'),
(2, 2, 8000.00, '2024-12-01', '2024-12-05', 'paid', 'rocket', 'TRX004', '2024-12-03 11:00:00'),
(4, 3, 15000.00, '2024-12-01', '2024-12-05', 'paid', 'bkash', 'TRX005', '2024-12-06 14:00:00'),
(7, 4, 13000.00, '2024-12-01', '2024-12-05', 'paid', 'cash', NULL, '2024-12-04 10:30:00'),
(8, 5, 25000.00, '2024-12-01', '2024-12-05', 'paid', 'bank_transfer', 'TRX006', '2024-12-02 09:45:00'),
(1, 1, 12000.00, '2024-11-01', '2024-11-05', 'paid', 'bkash', 'TRX007', '2024-11-08 16:30:00'),
(2, 2, 8000.00, '2024-11-01', '2024-11-05', 'paid', 'nagad', 'TRX008', '2024-11-04 12:00:00'),
(4, 3, 15000.00, '2024-11-01', '2024-11-05', 'paid', 'cash', NULL, '2024-11-05 11:30:00'),
(7, 4, 13000.00, '2024-11-01', '2024-11-05', 'paid', 'rocket', 'TRX009', '2024-11-03 14:45:00'),
(8, 5, 25000.00, '2024-11-01', '2024-11-05', 'paid', 'bank_transfer', 'TRX010', '2024-11-01 10:00:00'),
(1, 1, 12000.00, '2024-10-01', '2024-10-05', 'paid', 'cash', NULL, '2024-10-04 14:00:00'),
(2, 2, 8000.00, '2024-10-01', '2024-10-05', 'paid', 'bkash', 'TRX011', '2024-10-07 09:30:00'),
(4, 3, 15000.00, '2024-10-01', '2024-10-05', 'paid', 'nagad', 'TRX013', '2024-10-05 11:00:00'),
(1, 1, 12000.00, '2025-02-01', '2025-02-05', 'pending', NULL, NULL, NULL),
(2, 2, 8000.00, '2025-02-01', '2025-02-05', 'pending', NULL, NULL, NULL),
(4, 3, 15000.00, '2025-02-01', '2025-02-05', 'pending', NULL, NULL, NULL),
(3, 6, 8500.00, '2025-02-01', '2025-02-05', 'pending', NULL, NULL, NULL),
(10, 7, 11000.00, '2025-02-01', '2025-02-05', 'pending', NULL, NULL, NULL),
(3, 6, 8500.00, '2025-01-01', '2025-01-05', 'paid', 'bkash', 'TRX-D001', '2025-01-03 11:30:00'),
(3, 6, 8500.00, '2024-12-01', '2024-12-05', 'paid', 'nagad', 'TRX-D002', '2024-12-02 14:45:00'),
(3, 6, 8500.00, '2024-11-01', '2024-11-05', 'paid', 'bank_transfer', 'TRX-D003', '2024-11-08 09:20:00'),
(3, 6, 8500.00, '2024-10-01', '2024-10-05', 'overdue', NULL, NULL, NULL),
(3, 6, 8500.00, '2024-09-01', '2024-09-05', 'paid', 'cash', NULL, '2024-09-04 13:15:00');

-- Insert payment confirmations
INSERT INTO payment_confirmations (payment_id, manager_id, status, verified_at) VALUES
(1, 1, 'verified', '2025-01-04 15:00:00'),
(2, 1, 'verified', '2025-01-03 11:00:00'),
(6, 1, 'verified', '2024-12-04 15:00:00'),
(7, 1, 'verified', '2024-12-03 11:00:00'),
(8, 1, 'pending_review', NULL),
(13, 1, 'verified', '2024-11-04 16:30:00'),
(22, 1, 'verified', '2025-01-03 12:00:00'),
(23, 1, 'verified', '2024-12-02 15:00:00'),
(26, 1, 'pending_review', NULL);

-- Insert maintenance requests
INSERT INTO maintenance_requests (apartment_id, renter_id, title, description, category, type, priority, status, assigned_to, estimated_cost, actual_cost, completed_at, notes, manager_marked_resolved, renter_marked_resolved, resolution, resolution_notes, assigned_at) VALUES
(1, 1, 'AC Not Working', 'Air conditioner not cooling properly', 'electric', 'repair', 'urgent', 'completed', 'HVAC Team', 5000, 4500, '2024-12-15 14:30:00', 'AC needs regular maintenance', TRUE, TRUE, 'AC compressor replaced and refrigerant refilled', 'Renter confirmed issue is resolved', '2024-12-10 09:00:00'),
(2, 2, 'Leaking Pipe', 'Kitchen pipe leaking under sink', 'plumbing', 'repair', 'high', 'in_progress', 'Plumbing Team', 3000, NULL, NULL, 'Water damage on cabinet floor', FALSE, FALSE, NULL, NULL, '2024-12-18 11:00:00'),
(4, 3, 'Paint Peeling', 'Wall paint peeling in living room', 'general', 'maintenance', 'medium', 'pending', NULL, 8000, NULL, NULL, 'Needs repainting of entire wall', FALSE, FALSE, NULL, NULL, NULL),
(7, 4, 'Door Lock Broken', 'Main door lock needs replacement', 'general', 'repair', 'high', 'completed', 'Locksmith', 2500, 2200, '2024-12-10 10:00:00', 'Lock cylinder damaged', TRUE, FALSE, 'Installed new digital lock', 'Waiting for renter confirmation', '2024-12-05 14:30:00'),
(1, 1, 'Light Fixture', 'Bedroom light not working', 'electric', 'repair', 'medium', 'resolved', 'Electrician', 1500, 1200, '2024-11-28 16:45:00', 'LED bulb and fixture replacement', TRUE, TRUE, 'Replaced faulty wiring and installed new LED fixture', 'All working properly now', '2024-11-25 10:00:00'),
(2, 2, 'Window Repair', 'Window glass cracked', 'general', 'repair', 'urgent', 'completed', 'Glass Company', 4000, 3800, '2024-12-05 11:30:00', 'Safety hazard - immediate fix needed', TRUE, TRUE, 'Replaced broken glass pane with tempered glass', 'Safety inspection passed', '2024-12-01 09:00:00'),
(4, 3, 'Water Heater', 'Water heater not heating properly', 'plumbing', 'repair', 'high', 'in_progress', 'Plumbing Team', 6000, NULL, NULL, 'Heating element might be faulty', FALSE, FALSE, NULL, NULL, '2024-12-20 13:00:00'),
(8, 5, 'Balcony Railings', 'Loose balcony railings need fixing', 'general', 'repair', 'urgent', 'pending', NULL, 3500, NULL, NULL, 'Safety issue - needs immediate attention', FALSE, FALSE, NULL, NULL, NULL),
(3, 6, 'AC Remote Not Working', 'AC remote needs new batteries', 'general', 'repair', 'medium', 'pending', NULL, 500, NULL, NULL, 'Simple battery replacement', FALSE, FALSE, NULL, NULL, NULL),
(3, 6, 'Kitchen Cabinet Loose', 'Bottom cabinet door hinge broken', 'general', 'repair', 'medium', 'in_progress', 'Carpenter Team', 1500, NULL, NULL, 'Needs hinge replacement', FALSE, FALSE, NULL, NULL, '2025-01-20 10:00:00'),
(3, 6, 'Bathroom Fan Noisy', 'Exhaust fan making loud noise', 'electric', 'repair', 'high', 'completed', 'Electrician', 2000, 1800, '2025-01-15 14:30:00', 'Fan motor issue', TRUE, FALSE, 'Lubricated fan motor', 'Awaiting renter confirmation', '2025-01-10 09:00:00'),
(3, 6, 'Window Curtain Rod', 'Living room curtain rod fell down', 'general', 'repair', 'medium', 'resolved', 'Maintenance Team', 800, 750, '2024-12-10 11:00:00', 'Wall anchors broken', TRUE, TRUE, 'Replaced wall anchors', 'Renter confirmed fixed', '2024-12-05 14:00:00');

-- ============ INSERT UTILITY BILLS (8 items with correct status) ============
TRUNCATE utility_bills;

INSERT INTO utility_bills (type, building_id, owner_id, amount, due_date, status, provider, account_number, month, consumption, description, paid_date, paid_amount) VALUES
('Building Maintenance', 1, 1, 2000.00, '2025-02-10', 'upcoming', 'Building Management', NULL, 'February 2025', NULL, 'Feb 2025 Maintenance Bill', NULL, NULL),
('Gas', 1, 1, 4000.00, '2025-11-30', 'upcoming', 'Titas Gas', NULL, 'November 2025', NULL, 'Gas Supply Bill', NULL, NULL),
('Electricity', 1, 1, 15000.00, '2025-12-05', 'paid', 'National Grid', 'NG-123456', 'December 2025', '1200 kWh', 'Monthly Electricity Bill', '2025-12-01', 15000.00),
('Water', 1, 1, 6000.00, '2025-12-07', 'paid', 'WASA', NULL, 'December 2025', NULL, 'Water Supply Bill', '2025-12-05', 6000.00),
('Maintenance Fee', 1, 1, 10000.00, '2025-12-10', 'paid', 'Building Management', NULL, 'December 2025', NULL, 'Monthly Maintenance Fee', '2025-12-08', 10000.00),
('Security', 1, 1, 8000.00, '2025-12-15', 'paid', 'SecureGuard Ltd.', NULL, 'December 2025', NULL, 'Security Service Bill', '2025-12-12', 8000.00),
('Internet', 1, 1, 3000.00, '2026-01-05', 'upcoming', 'Bdcom Online', NULL, 'January 2026', NULL, 'Monthly Internet Bill', NULL, NULL),
('Garbage', 1, 1, 2500.00, '2026-01-10', 'upcoming', 'City Corporation', NULL, 'January 2026', NULL, 'Garbage Collection Bill', NULL, NULL);

-- Insert manager bills
INSERT INTO bills (manager_id, title, amount, due_date, paid_date, status, description) VALUES
(1, 'Electricity Bill', 15000.00, '2025-12-05', '2025-12-04', 'paid', 'Monthly electricity bill'),
(1, 'Water Bill', 6000.00, '2025-12-07', '2025-12-12', 'paid', 'Monthly water bill'),
(1, 'Gas Bill', 4000.00, '2025-11-30', NULL, 'overdue', 'Monthly gas bill'),
(1, 'Internet Bill', 3000.00, '2026-01-05', NULL, 'upcoming', 'Monthly internet bill'),
(1, 'Maintenance Fee', 10000.00, '2025-12-10', '2025-12-10', 'paid', 'Monthly maintenance fee'),
(1, 'Security Service', 8000.00, '2025-12-15', '2025-12-14', 'paid', 'Security service bill'),
(1, 'Garbage Collection', 2000.00, '2026-01-10', NULL, 'upcoming', 'Garbage collection bill'),
(1, 'Building Maintenance - Jan 2025', 2000.00, '2025-01-10', '2025-01-09', 'paid', 'January maintenance'),
(1, 'Building Maintenance - Feb 2025', 2000.00, '2025-02-10', NULL, 'upcoming', 'February maintenance'),
(1, 'Parking Fee - Jan 2025', 1000.00, '2025-01-15', '2025-01-14', 'paid', 'Parking fee');

-- Insert owner expenses
INSERT INTO owner_expenses (owner_id, category, description, amount, expense_date, payment_method, receipt_number, notes) VALUES
(1, 'property_tax', 'Annual property tax for Green Valley', 50000.00, '2025-01-15', 'bank_transfer', 'TAX-RCPT-001', 'Paid for 2025'),
(1, 'insurance', 'Building insurance premium', 35000.00, '2025-01-10', 'check', 'INS-RCPT-001', 'Annual insurance'),
(1, 'repair', 'Roof repair work', 25000.00, '2024-12-20', 'cash', 'REP-RCPT-001', 'Emergency roof repair'),
(1, 'renovation', 'Lobby renovation', 80000.00, '2024-11-15', 'bank_transfer', 'REN-RCPT-001', 'Complete lobby makeover'),
(2, 'property_tax', 'Annual property tax for Lakeview', 45000.00, '2025-01-15', 'bank_transfer', 'TAX-RCPT-002', 'Paid for 2025'),
(2, 'insurance', 'Building insurance premium', 30000.00, '2025-01-10', 'check', 'INS-RCPT-002', 'Annual insurance'),
(1, 'legal', 'Legal consultation fees', 15000.00, '2024-12-05', 'bank_transfer', 'LEG-RCPT-001', 'Contract review'),
(1, 'marketing', 'Property advertising', 12000.00, '2024-11-20', 'cash', 'MKT-RCPT-001', 'Online and print ads');

-- Insert manager tasks
INSERT INTO manager_tasks (title, description, task_type, priority, status, due_date, completed_at) VALUES
('Collect Rent January', 'Collect rent from all tenants for January', 'collection', 'high', 'completed', '2025-01-05', '2025-01-04 15:00:00'),
('Building Inspection', 'Monthly building safety inspection', 'inspection', 'medium', 'completed', '2024-12-10', '2024-12-09 11:00:00'),
('Contract Renewal', 'Renew contracts for expiring tenants', 'administrative', 'high', 'in_progress', '2024-12-31', NULL),
('Budget Planning 2025', 'Plan next year budget', 'planning', 'medium', 'pending', '2025-01-25', NULL),
('Vendor Payment', 'Pay utility bills and vendor invoices', 'financial', 'urgent', 'completed', '2024-12-01', '2024-12-01 14:30:00'),
('Maintenance Schedule Q1', 'Create maintenance schedule for Q1 2025', 'planning', 'medium', 'pending', '2025-01-20', NULL),
('Safety Audit', 'Conduct fire safety audit', 'inspection', 'high', 'in_progress', '2025-01-15', NULL),
('Collect Rent February', 'Collect rent from all tenants for February', 'collection', 'high', 'pending', '2025-02-05', NULL),
('Tax Preparation', 'Prepare tax documents for 2024', 'financial', 'medium', 'pending', '2025-01-31', NULL);

-- Insert complaints
INSERT INTO complaints (title, description, category, priority, apartment_id, renter_id, workflow_status) VALUES
('Leaky faucet', 'Kitchen faucet is dripping continuously', 'plumbing', 'medium', 1, 1, 'pending'),
('Broken living room light', 'Ceiling light not working', 'electric', 'high', 2, 2, 'in-progress'),
('Clogged bathroom drain', 'Water is not draining properly', 'plumbing', 'medium', 4, 3, 'pending'),
('Heater not working', 'Central heater not turning on', 'electric', 'high', 7, 4, 'pending'),
('Door lock issue', 'Front door lock is jammed', 'general', 'medium', 2, 2, 'pending');

-- Insert complaint resolutions
INSERT INTO complaint_resolution (complaint_id, manager_confirmed, renter_confirmed, manager_id) VALUES
(1, FALSE, FALSE, NULL),
(2, TRUE, FALSE, NULL),
(3, FALSE, FALSE, NULL),
(4, FALSE, FALSE, NULL),
(5, TRUE, TRUE, NULL);

-- Insert audit logs
INSERT INTO payment_audit_log (payment_id, old_status, new_status, change_reason) VALUES
(1, 'pending', 'paid', 'Payment received via bkash'),
(2, 'pending', 'paid', 'Bank transfer received'),
(3, 'pending', 'paid', 'Cash payment received'),
(4, 'pending', 'overdue', 'Payment not received by due date'),
(6, 'pending', 'paid', 'Payment received via nagad'),
(7, 'pending', 'paid', 'Payment received via rocket'),
(8, 'pending', 'paid', 'Payment received via bkash (late)'),
(22, 'pending', 'paid', 'Demo renter payment via bkash'),
(23, 'pending', 'paid', 'Demo renter payment via nagad');

INSERT INTO renters_audit_log (renter_id, old_status, new_status, change_reason) VALUES
(1, 'pending', 'active', 'Contract signed and verified'),
(2, 'pending', 'active', 'Document verification complete'),
(3, 'pending', 'active', 'Background check passed'),
(4, 'active', 'active', 'Contract renewed'),
(5, 'active', 'inactive', 'Contract terminated'),
(6, 'pending', 'active', 'Demo account activated'),
(6, 'active', 'active', 'Contract renewal'),
(7, 'pending', 'active', 'New renter approved');

INSERT INTO maintenance_audit_log (request_id, old_status, new_status, change_reason) VALUES
(1, 'pending', 'in_progress', 'Technician assigned'),
(1, 'in_progress', 'completed', 'Repair completed successfully'),
(2, 'pending', 'in_progress', 'Plumber assigned'),
(4, 'pending', 'in_progress', 'Locksmith assigned'),
(4, 'in_progress', 'completed', 'Lock replaced successfully'),
(9, 'pending', 'in_progress', 'Assigned to electrician'),
(9, 'in_progress', 'completed', 'Repair completed');