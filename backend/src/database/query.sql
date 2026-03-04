-- STEP 1: First, let's see all the duplicates
SELECT 
  CASE 
    WHEN sender_id = 'renter_6' THEN '👤 Demo Renter'
    ELSE '👨‍💼 Manager'
  END as sender,
  message,
  created_at,
  to_char(created_at, 'YYYY-MM-DD HH:MI AM') as full_date
FROM messages 
WHERE (sender_id = 'renter_6' OR receiver_id = 'renter_6')
  AND (sender_id = 'manager_1' OR receiver_id = 'manager_1')
ORDER BY created_at;

-- STEP 2: Delete ALL messages between renter_6 and manager_1 (clean slate)
DELETE FROM messages 
WHERE (sender_id = 'renter_6' OR receiver_id = 'renter_6')
  AND (sender_id = 'manager_1' OR receiver_id = 'manager_1');

-- STEP 3: Insert fresh copies (one of each message)
-- February 26 conversation
INSERT INTO messages (sender_id, receiver_id, message, created_at, is_read) VALUES 
('renter_6', 'manager_1', 'Hello manager, I have a question about my February rent payment', '2026-02-16 15:00:00', true);

INSERT INTO messages (sender_id, receiver_id, message, created_at, is_read) VALUES 
('manager_1', 'renter_6', 'Your February payment was received. Thank you!', '2026-02-16 16:30:00', true);

-- Yesterday's conversation (adjust time as needed)
INSERT INTO messages (sender_id, receiver_id, message, created_at, is_read) VALUES 
('renter_6', 'manager_1', 'Hi, just checking if my March payment was received?', 
 (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '15 hours')::timestamp, false);

INSERT INTO messages (sender_id, receiver_id, message, created_at, is_read) VALUES 
('manager_1', 'renter_6', 'Yes, your March payment is verified. Thanks!', 
 (CURRENT_DATE - INTERVAL '1 day' + INTERVAL '16 hours')::timestamp, true);

-- Today's conversation (keep your existing ones or add new)
INSERT INTO messages (sender_id, receiver_id, message, created_at, is_read) VALUES 
('renter_6', 'manager_1', 'hi', '2026-03-01 14:13:44', true);

INSERT INTO messages (sender_id, receiver_id, message, created_at, is_read) VALUES 
('manager_1', 'renter_6', 'how are you', '2026-03-01 14:14:00', true);

INSERT INTO messages (sender_id, receiver_id, message, created_at, is_read) VALUES 
('manager_1', 'renter_6', 'hi', '2026-03-01 16:40:00', true);

-- STEP 4: Verify clean data
SELECT 
  CASE 
    WHEN sender_id = 'renter_6' THEN '👤 Demo Renter'
    ELSE '👨‍💼 Manager'
  END as sender,
  message,
  to_char(created_at, 'Dy Mon DD, YYYY HH:MI AM') as formatted_date,
  CASE 
    WHEN created_at::date = CURRENT_DATE THEN 'Today'
    WHEN created_at::date = CURRENT_DATE - 1 THEN 'Yesterday'
    ELSE to_char(created_at, 'Mon DD, YYYY')
  END as display_date
FROM messages 
WHERE (sender_id = 'renter_6' OR receiver_id = 'renter_6')
  AND (sender_id = 'manager_1' OR receiver_id = 'manager_1')
ORDER BY created_at;