-- First, check existing users to avoid conflicts
SELECT id, username, email FROM users;

-- Create user accounts for Mike, Emily, and Robert
-- Use the same password hash as other users (demo123)
INSERT INTO users (username, password_hash, role, email, phone, "isActive") VALUES
('mike_johnson', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'renter', 'mike.johnson@example.com', '01712345680', true),
('emily_wilson', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'renter', 'emily.wilson@example.com', '01712345681', true),
('robert_davis', '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi', 'renter', 'robert.davis@example.com', '01712345683', true);

-- Now link the users to their renter profiles
UPDATE renters SET user_id = (
    SELECT id FROM users WHERE email = renters.email
)
WHERE email IN ('mike.johnson@example.com', 'emily.wilson@example.com', 'robert.davis@example.com')
AND user_id IS NULL;

-- Verify the updates
SELECT 
    r.id, 
    r.name, 
    r.email, 
    r.user_id,
    u.username,
    u.password_hash
FROM renters r
LEFT JOIN users u ON r.user_id = u.id
ORDER BY r.id;