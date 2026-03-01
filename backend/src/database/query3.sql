-- Check Emily Wilson's details first
SELECT id, name, agreed_rent, lease_start, lease_end 
FROM renters 
WHERE name LIKE '%Emily%' OR email LIKE '%emily%';

-- Then check all her payments
SELECT 
    p.id,
    p.month,
    p.amount,
    p.status,
    p.due_date,
    p.paid_at,
    CASE 
        WHEN p.status = 'paid' THEN 'paid'
        WHEN p.status = 'pending' AND p.month < CURRENT_DATE THEN 'overdue'
        WHEN p.status = 'pending' AND p.month >= CURRENT_DATE THEN 'pending'
        ELSE p.status::text
    END as display_status,
    CURRENT_DATE as today
FROM payments p
WHERE p.renter_id = 4  -- Assuming Emily is ID 4
ORDER BY p.month DESC;