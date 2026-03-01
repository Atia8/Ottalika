-- ============================================
-- CREATE REALISTIC DEMO DATA WITH 2025-2026 LEASE DATES
-- ============================================

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

-- Generate fresh payments for all active renters (this will create ALL months from lease_start to lease_end)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM renters WHERE status = 'active' LOOP
        PERFORM generate_renter_payments(r.id);
    END LOOP;
END $$;

-- ============================================
-- SET REALISTIC PAYMENT STATUSES FOR 2025
-- ============================================

-- Mark ALL 2025 payments as PAID for everyone (historical)
UPDATE payments 
SET status = 'paid'::payment_status
WHERE EXTRACT(YEAR FROM month) = 2025;

-- ============================================
-- SET 2026 PAYMENT STATUSES (Current year)
-- ============================================

-- Jan 2026 - Everyone paid on time
UPDATE payments 
SET status = 'paid'::payment_status
WHERE month = '2026-01-01' AND status = 'pending'::payment_status;

-- Feb 2026 - Mixed payment behavior
UPDATE payments 
SET status = CASE 
    WHEN renter_id IN (1, 2, 6) THEN 'paid'::payment_status   -- John, Sarah, Demo paid on time
    WHEN renter_id IN (3, 4) THEN 'pending'::payment_status   -- Mike, Emily late (overdue)
    ELSE status
END
WHERE month = '2026-02-01';

-- March 2026 - Current month (all pending)
-- (already pending from generation)

-- ============================================
-- ADD RENT INCREASE FROM 2025 TO 2026
-- ============================================

-- For renters who started in 2025, increase their rent by 1000 for 2026
UPDATE payments 
SET amount = amount + 1000
WHERE EXTRACT(YEAR FROM month) = 2026 
  AND renter_id IN (1, 2, 6);  -- John, Sarah, Demo (2025 starters)

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
    r.agreed_rent - 1000,  -- Old rent (2025)
    r.agreed_rent,          -- New rent (2026)
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
-- SHOW FINAL STATUS REPORT
-- ============================================

-- Summary by renter
SELECT 
    r.id,
    r.name as renter_name,
    to_char(r.lease_start, 'Mon DD, YYYY') as lease_start,
    COUNT(CASE WHEN EXTRACT(YEAR FROM p.month) = 2025 THEN 1 END) as payments_2025,
    COUNT(CASE WHEN EXTRACT(YEAR FROM p.month) = 2026 AND p.status = 'paid' THEN 1 END) as paid_2026,
    COUNT(CASE WHEN EXTRACT(YEAR FROM p.month) = 2026 AND p.status = 'pending' AND p.month < '2026-03-01' THEN 1 END) as overdue_2026,
    COUNT(CASE WHEN p.month = '2026-03-01' AND p.status = 'pending' THEN 1 END) as due_now,
    COUNT(CASE WHEN p.month > '2026-03-01' AND p.status = 'pending' THEN 1 END) as upcoming
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
    MAX(p.amount) as max_rent
FROM renters r
JOIN payments p ON r.id = p.renter_id
WHERE r.id IN (1, 2, 6)  -- 2025 starters
GROUP BY r.name, to_char(p.month, 'YYYY')
ORDER BY r.name, year;