-- ============================================
-- FILE: 99_fix_renter_accounts.sql
-- PURPOSE: Create user accounts for existing renters
-- NO SPECIAL CHARACTERS - SAFE FOR WINDOWS
-- ============================================

BEGIN;

-- Step 1: See what we're working with
SELECT 'BEFORE FIX' as stage;
SELECT 
    r.id as renter_id,
    r.name,
    r.email,
    r.phone,
    r.status,
    r.user_id,
    CASE 
        WHEN r.user_id IS NULL THEN 'No login'
        ELSE 'Has login'
    END as login_status,
    (SELECT COUNT(*) FROM payments p WHERE p.renter_id = r.id) as payment_count,
    (SELECT COUNT(*) FROM maintenance_requests mr WHERE mr.renter_id = r.id) as complaint_count
FROM renters r
ORDER BY r.id;

-- Step 2: Create user accounts for renters without user_id
-- These will use the same demo123 password as your other demo accounts
INSERT INTO users (username, email, phone, role, password_hash, "isActive")
SELECT 
    COALESCE(
        SPLIT_PART(r.email, '@', 1), 
        LOWER(REPLACE(r.name, ' ', '_'))
    ) as username,
    r.email,
    r.phone,
    'renter' as role,
    '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi' as password_hash,
    true as "isActive"
FROM renters r
WHERE r.user_id IS NULL 
  AND r.email IS NOT NULL
  AND r.email != ''
ON CONFLICT (email) DO NOTHING;

-- Step 3: Update renters with the new user_ids
UPDATE renters r
SET user_id = u.id,
    updated_at = CURRENT_TIMESTAMP
FROM users u
WHERE r.user_id IS NULL 
  AND r.email = u.email
  AND u.role = 'renter';

-- Step 4: For renters without email, create placeholder users
INSERT INTO users (username, email, phone, role, password_hash, "isActive")
SELECT 
    'renter_' || r.id as username,
    'renter_' || r.id || '@ottalika.com' as email,
    r.phone,
    'renter' as role,
    '$2a$10$JTKgZtabSdN8WLhKOhvwveTntvCbsTVXz1xu7/E/ntpR.ZbZE1/Hi' as password_hash,
    true as "isActive"
FROM renters r
WHERE r.user_id IS NULL 
  AND (r.email IS NULL OR r.email = '')
ON CONFLICT (email) DO NOTHING;

-- Step 5: Update those renters too
UPDATE renters r
SET user_id = u.id,
    email = u.email,
    updated_at = CURRENT_TIMESTAMP
FROM users u
WHERE r.user_id IS NULL 
  AND u.email = 'renter_' || r.id || '@ottalika.com';

-- Step 6: Verify the fix
SELECT 'AFTER FIX' as stage;
SELECT 
    r.id as renter_id,
    r.name,
    r.email,
    r.phone,
    r.status,
    r.user_id,
    u.email as user_email,
    CASE 
        WHEN r.user_id IS NOT NULL AND u.id IS NOT NULL THEN 'Can login now'
        ELSE 'Still broken'
    END as login_status,
    (SELECT COUNT(*) FROM payments p WHERE p.renter_id = r.id) as payment_count,
    (SELECT COUNT(*) FROM maintenance_requests mr WHERE mr.renter_id = r.id) as complaint_count
FROM renters r
LEFT JOIN users u ON r.user_id = u.id
ORDER BY r.id;

-- Step 7: Show login credentials for all renters
SELECT 'LOGIN CREDENTIALS' as info;
SELECT 
    r.id,
    r.name,
    COALESCE(r.email, u.email) as login_email,
    'demo123' as password,
    CASE 
        WHEN r.user_id IS NOT NULL THEN 'Ready'
        ELSE 'Issue'
    END as status
FROM renters r
LEFT JOIN users u ON r.user_id = u.id
ORDER BY r.id;

COMMIT;

-- Optional: Check orphaned records
SELECT 'ORPHANED RECORDS CHECK' as check_type;
SELECT 
    'Users without renters:' as description,
    COUNT(*) as count
FROM users u
LEFT JOIN renters r ON u.id = r.user_id
WHERE u.role = 'renter' AND r.id IS NULL

UNION ALL

SELECT 
    'Renters without users:' as description,
    COUNT(*) as count
FROM renters r
LEFT JOIN users u ON r.user_id = u.id
WHERE u.id IS NULL;