-- update-password.sql
UPDATE users SET password_hash = '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi'
WHERE email IN ('manager@ottalika.com', 'owner@ottalika.com', 'renter@ottalika.com');

-- Verify
SELECT email, role, LEFT(password_hash, 30) as hash_prefix FROM users WHERE email LIKE '%ottalika.com%';