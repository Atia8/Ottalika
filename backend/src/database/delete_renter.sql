-- Check if the trigger exists and is enabled
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name,
    tgtype,
    tgenabled
FROM pg_trigger
WHERE tgname = 'trigger_auto_create_next_payment';

-- Check the function definition
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE proname = 'auto_create_next_payment';

-- Check all payments for renter 6 (Demo Renter)
SELECT 
    p.id,
    p.renter_id,
    p.amount,
    p.month,
    p.status,
    p.due_date,
    p.paid_at,
    p.payment_method,
    a.apartment_number,
    r.name AS renter_name
FROM payments p
LEFT JOIN apartments a ON p.apartment_id = a.id
LEFT JOIN renters r ON p.renter_id = r.id
WHERE p.renter_id = 6
ORDER BY p.month DESC;

-- Check if there are any payments for future months
SELECT 
    id,
    renter_id,
    month,
    status,
    due_date
FROM payments
WHERE month > CURRENT_DATE
ORDER BY month;

-- Check the most recent payment activity
SELECT 
    p.id,
    p.renter_id,
    r.name AS renter_name,
    p.month,
    p.status,
    p.paid_at,
    p.updated_at
FROM payments p
JOIN renters r ON p.renter_id = r.id
ORDER BY p.updated_at DESC
LIMIT 10;

-- Check if the validate_payment_order trigger exists
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname = 'trigger_validate_payment_order';

-- Check if the validate_payment_month trigger exists
SELECT 
    tgname AS trigger_name,
    tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname = 'trigger_validate_payment_month';