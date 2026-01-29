-- Sample Data for Ottalika Database
-- Test data for development and presentation

-- Insert Sample Users
-- Password for all users: password123
INSERT INTO users (email, password_hash, full_name, phone, address, city, state, zip_code, role) VALUES
('admin@ottalika.com', '$2b$10$rZ7QIYKp3Y9KlJxMx8K5puZvW5gF5YxGxKxKxKxKxKxKxKxKxKxKx', 'Admin User', '+880-1234-567890', '123 Admin Street', 'Dhaka', 'Dhaka Division', '1000', 'admin'),
('john.doe@email.com', '$2b$10$rZ7QIYKp3Y9KlJxMx8K5puZvW5gF5YxGxKxKxKxKxKxKxKxKxKxKx', 'John Doe', '+880-1711-111111', 'Apt 101, Green View', 'Dhaka', 'Dhaka Division', '1205', 'resident'),
('jane.smith@email.com', '$2b$10$rZ7QIYKp3Y9KlJxMx8K5puZvW5gF5YxGxKxKxKxKxKxKxKxKxKxKx', 'Jane Smith', '+880-1722-222222', 'Apt 205, Green View', 'Dhaka', 'Dhaka Division', '1205', 'resident'),
('manager@ottalika.com', '$2b$10$rZ7QIYKp3Y9KlJxMx8K5puZvW5gF5YxGxKxKxKxKxKxKxKxKxKxKx', 'Property Manager', '+880-1744-444444', '500 Management Office', 'Dhaka', 'Dhaka Division', '1000', 'manager');

-- Insert Sample Payments
INSERT INTO payments (user_id, payment_type, amount, payment_date, due_date, status, payment_method, transaction_id, description) VALUES
(2, 'rent', 25000.00, '2025-01-05', '2025-01-01', 'completed', 'bank_transfer', 'TXN001234567', 'January 2025 Rent'),
(2, 'maintenance', 3000.00, '2025-01-05', '2025-01-01', 'completed', 'bank_transfer', 'TXN001234568', 'January 2025 Maintenance Fee'),
(3, 'rent', 28000.00, '2025-01-03', '2025-01-01', 'completed', 'card', 'TXN001234569', 'January 2025 Rent'),
(3, 'maintenance', 3000.00, CURRENT_DATE, CURRENT_DATE, 'pending', NULL, NULL, 'January 2025 Maintenance Fee');

-- Insert Sample Complaints
INSERT INTO complaints (user_id, title, description, category, priority, status, assigned_to) VALUES
(2, 'Water Leakage in Bathroom', 'There is a water leakage in the bathroom ceiling. It has been dripping for 2 days now.', 'maintenance', 'high', 'in_progress', 4),
(3, 'Elevator Not Working', 'The main elevator is out of order since yesterday morning.', 'maintenance', 'urgent', 'open', NULL),
(2, 'Noisy Neighbors', 'Neighbors are making loud noise during late night hours.', 'noise', 'medium', 'open', 4);

-- Insert Sample Messages
INSERT INTO messages (sender_id, receiver_id, subject, message_body, is_read) VALUES
(1, 2, 'Welcome to Ottalika', 'Welcome to our community! Please feel free to reach out if you need any assistance.', true),
(2, 4, 'Regarding Water Leakage', 'I have submitted a complaint about water leakage. When can I expect someone to fix it?', true),
(4, 2, 'RE: Regarding Water Leakage', 'Our maintenance team has been assigned. They will visit tomorrow between 2-4 PM.', false),
(3, 1, 'Query about Gym Timings', 'Can you please confirm the gym operating hours?', false);

-- Insert Sample Notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(2, 'Payment Successful', 'Your rent payment of ৳25,000 has been processed successfully.', 'payment_due', true),
(2, 'Complaint Update', 'Your complaint about water leakage has been assigned to maintenance team.', 'complaint_update', false),
(3, 'Payment Due', 'Your maintenance fee of ৳3,000 is due today.', 'payment_due', false),
(3, 'New Message', 'You have received a new message from Admin User.', 'message_received', false);

-- Verification Query
SELECT 
    'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments
UNION ALL
SELECT 'Complaints', COUNT(*) FROM complaints
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications;