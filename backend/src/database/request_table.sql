DROP TABLE IF EXISTS owner_requests CASCADE;

CREATE TABLE owner_requests (
    id SERIAL PRIMARY KEY,
    renter_id INT NOT NULL,  -- 👈 ADD NOT NULL constraint
    renter_name VARCHAR(100) NOT NULL,
    apartment VARCHAR(50) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (renter_id) REFERENCES renters(id) ON DELETE CASCADE  -- 👈 ADD foreign key
);

-- Now insert with renter_id (use actual IDs from your renters table)
INSERT INTO owner_requests 
(renter_name, renter_id, apartment, subject, message, status, created_at)
VALUES
-- First, check your renters table to get correct IDs
-- SELECT id, name FROM renters;

-- Then insert with the correct IDs
('Ahmed Rahman', 6, 'A-101', 'Lease Extension Request', 
 'I would like to extend my lease for another year. Please advise on the process.',
 'pending', '2025-12-10'),

('Sadia Islam', 4, 'D-401', 'Renovation Permission',
 'I want to install custom kitchen cabinets. Seeking permission from owner.',
 'pending', '2025-12-08'),

('Fatima Begum', 1, 'B-205', 'Parking Space Request',
 'Requesting additional parking space for second vehicle.',
 'approved', '2025-12-06');