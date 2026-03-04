-- ============================================
-- CREATE REALISTIC DEMO DATA WITH 2025-2026 LEASE DATES
-- ============================================

-- Safety check - uncomment to test without executing
-- ROLLBACK;
-- RETURN;

BEGIN; -- Start transaction so we can rollback if something goes wrong

-- First, clear existing payments for clean slate
DELETE FROM payments;
DELETE FROM rent_history;

-- Update renters with different lease start dates (some in 2025, some in 2026)
UPDATE renters SET
    lease_start = CASE id
        WHEN 1 THEN '2025-06-01'  -- John Doe - started June 2025 (long term)
        WHEN 2 THEN '2025-09-15'  -- Sarah Smith - started Sep 2025
        WHEN 3 THEN '2026-02-01'  -- Mike Johnson - started Feb 2026
        WHEN 4 THEN '2026-02-15'  -- Emily Wilson - started Feb 2026
        WHEN 6 THEN '2025-01-01'  -- Demo Renter - started Jan 2025 (oldest)
        WHEN 7 THEN '2026-03-01'  -- Robert Davis - started March 2026 (current month)
        ELSE lease_start
    END,
    lease_end = '2026-12-31'  -- All end Dec 2026
WHERE status = 'active';

-- Verify the updates
SELECT id, name, lease_start, lease_end FROM renters WHERE status = 'active' ORDER BY id;

-- Generate fresh payments for all active renters
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM renters WHERE status = 'active' ORDER BY id LOOP
        RAISE NOTICE 'Generating payments for renter %', r.id;
        PERFORM generate_renter_payments(r.id);
    END LOOP;
END $$;

-- ============================================
-- SET REALISTIC PAYMENT STATUSES FOR 2025
-- ============================================

-- Mark ALL 2025 payments as PAID for everyone (historical)
UPDATE payments 
SET status = 'paid'::payment_status,
    paid_at = month + INTERVAL '3 days' -- Simulate payment on 3rd of month
WHERE EXTRACT(YEAR FROM month) = 2025;

-- ============================================
-- SET 2026 PAYMENT STATUSES (Current year)
-- ============================================

-- Jan 2026 - Everyone paid on time
UPDATE payments 
SET status = 'paid'::payment_status,
    paid_at = '2026-01-05'
WHERE month = '2026-01-01'::DATE 
  AND status = 'pending'::payment_status;

-- Feb 2026 - Mixed payment behavior
UPDATE payments 
SET status = CASE 
    WHEN renter_id IN (1, 2, 6) THEN 'paid'::payment_status   -- John, Sarah, Demo paid on time
    WHEN renter_id IN (3, 4) THEN 'pending'::payment_status   -- Mike, Emily late (overdue)
    ELSE status
END,
paid_at = CASE 
    WHEN renter_id IN (1, 2, 6) THEN '2026-02-05'::DATE
    ELSE NULL
END
WHERE month = '2026-02-01'::DATE;

-- March 2026 - Current month (all pending) - no changes needed

-- ============================================
-- ADD RENT INCREASE FROM 2025 TO 2026
-- ============================================

-- For renters who started in 2025, increase their rent by 1000 for 2026
UPDATE payments 
SET amount = amount + 1000
WHERE EXTRACT(YEAR FROM month) = 2026 
  AND renter_id IN (1, 2, 6)  -- John, Sarah, Demo (2025 starters)
  AND status != 'paid'; -- Only update unpaid ones to avoid confusion

-- Also update paid ones for consistency
UPDATE payments 
SET amount = amount + 1000
WHERE EXTRACT(YEAR FROM month) = 2026 
  AND renter_id IN (1, 2, 6)
  AND status = 'paid';

-- Update the agreed_rent in renters table to reflect the increase
UPDATE renters 
SET agreed_rent = CASE id
    WHEN 1 THEN 13000  -- John: was 12000 + 1000
    WHEN 2 THEN 9000   -- Sarah: was 8000 + 1000
    WHEN 6 THEN 9500   -- Demo: was 8500 + 1000
    ELSE agreed_rent
END
WHERE id IN (1, 2, 6);

-- ============================================
-- CREATE RENT HISTORY RECORDS
-- ============================================

-- For 2025 starters, record the increase
INSERT INTO rent_history (apartment_id, renter_id, old_rent, new_rent, change_reason, effective_date)
SELECT 
    r.apartment_id,
    r.id,
    CASE 
        WHEN r.id = 1 THEN 12000
        WHEN r.id = 2 THEN 8000
        WHEN r.id = 6 THEN 8500
    END,
    r.agreed_rent,
    'annual_increase',
    '2026-01-01'
FROM renters r
WHERE r.id IN (1, 2, 6)  -- 2025 starters
AND NOT EXISTS (
    SELECT 1 FROM rent_history 
    WHERE renter_id = r.id AND change_reason = 'annual_increase'
);

-- For 2026 starters, record initial lease
INSERT INTO rent_history (apartment_id, renter_id, old_rent, new_rent, change_reason, effective_date)
SELECT 
    r.apartment_id,
    r.id,
    r.agreed_rent,
    r.agreed_rent,
    'initial_lease',
    r.lease_start
FROM renters r
WHERE r.id IN (3, 4, 7)  -- 2026 starters
AND NOT EXISTS (
    SELECT 1 FROM rent_history 
    WHERE renter_id = r.id
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check get_renter_payment_status function for each renter
SELECT '----- RENTER 1 (John - 2025 starter) -----';
SELECT * FROM get_renter_payment_status(1) LIMIT 5;

SELECT '----- RENTER 2 (Sarah - 2025 starter) -----';
SELECT * FROM get_renter_payment_status(2) LIMIT 5;

SELECT '----- RENTER 3 (Mike - 2026 starter) -----';
SELECT * FROM get_renter_payment_status(3) LIMIT 5;

SELECT '----- RENTER 4 (Emily - 2026 starter) -----';
SELECT * FROM get_renter_payment_status(4) LIMIT 5;

SELECT '----- RENTER 6 (Demo - 2025 starter) -----';
SELECT * FROM get_renter_payment_status(6) LIMIT 5;

SELECT '----- RENTER 7 (Robert - 2026 starter, current month) -----';
SELECT * FROM get_renter_payment_status(7) LIMIT 5;

-- Summary by renter
SELECT 
    r.id,
    r.name as renter_name,
    to_char(r.lease_start, 'Mon DD, YYYY') as lease_start,
    COUNT(CASE WHEN EXTRACT(YEAR FROM p.month) = 2025 THEN 1 END) as payments_2025,
    COUNT(CASE WHEN EXTRACT(YEAR FROM p.month) = 2026 AND p.status = 'paid' THEN 1 END) as paid_2026,
    COUNT(CASE WHEN EXTRACT(YEAR FROM p.month) = 2026 AND p.status = 'pending' AND p.month < '2026-03-01' THEN 1 END) as overdue_2026,
    COUNT(CASE WHEN p.month = '2026-03-01' AND p.status = 'pending' THEN 1 END) as due_now,
    COUNT(CASE WHEN p.month > '2026-03-01' AND p.status = 'pending' THEN 1 END) as upcoming,
    COUNT(*) as total_payments
FROM renters r
JOIN payments p ON r.id = p.renter_id
WHERE r.status = 'active'
GROUP BY r.id, r.name, r.lease_start
ORDER BY r.lease_start;

-- Show rent amounts by year (to verify increase)
SELECT 
    r.name,
    to_char(p.month, 'YYYY') as year,
    MIN(p.amount) as min_rent,
    MAX(p.amount) as max_rent,
    COUNT(*) as payments_count
FROM renters r
JOIN payments p ON r.id = p.renter_id
WHERE r.id IN (1, 2, 6)  -- 2025 starters
GROUP BY r.name, to_char(p.month, 'YYYY')
ORDER BY r.name, year;

-- Check current month status for each renter
SELECT 
    r.id,
    r.name,
    p.month,
    p.status,
    p.amount,
    CASE 
        WHEN p.month = '2026-03-01' AND p.status = 'pending' THEN '✓ CAN PAY NOW'
        ELSE 'Cannot pay'
    END as can_pay_status
FROM renters r
JOIN payments p ON r.id = p.renter_id
WHERE p.month = '2026-03-01'
ORDER BY r.id;

COMMIT; -- Uncomment to save changes
--ROLLBACK; -- Uncomment to test without saving