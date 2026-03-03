DROP TABLE IF EXISTS owner_requests CASCADE;

CREATE TABLE owner_requests (
    id SERIAL PRIMARY KEY,
    renter_id INT,
    renter_name VARCHAR(100) NOT NULL,
    apartment VARCHAR(50) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO owner_requests 
(renter_name, apartment, subject, message, status, created_at)
VALUES

-- 1️⃣ Lease Extension Request
(
 'Ahmed Rahman',
 'A-101',
 'Lease Extension Request',
 'I would like to extend my lease for another year. Please advise on the process.',
 'pending',
 '2025-12-10'
),

-- 2️⃣ Renovation Permission
(
 'Sadia Islam',
 'D-401',
 'Renovation Permission',
 'I want to install custom kitchen cabinets. Seeking permission from owner.',
 'pending',
 '2025-12-08'
),

-- 3️⃣ Parking Space Request
(
 'Fatima Begum',
 'B-205',
 'Parking Space Request',
 'Requesting additional parking space for second vehicle.',
 'approved',
 '2025-12-06'
);


