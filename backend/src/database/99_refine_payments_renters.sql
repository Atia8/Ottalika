-- ============================================
-- FILE: 99_refine_payments_renters_FIXED.sql
-- PURPOSE: Refine payments and renters logic
-- FIXED: Enum casting issues
-- ============================================


BEGIN;

-- ============================================
-- STEP 1: ADD NEW COLUMNS TO EXISTING TABLES
-- ============================================

-- Add lease columns to renters table (if not exist)
ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS apartment_id INTEGER REFERENCES apartments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lease_start DATE,
ADD COLUMN IF NOT EXISTS lease_end DATE,
ADD COLUMN IF NOT EXISTS agreed_rent DECIMAL(10,2);

-- Add base rent to apartments (for tracking increases)
ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS base_rent DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_increase_date DATE;

-- Create rent_history table for tracking changes
CREATE TABLE IF NOT EXISTS rent_history (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
    renter_id INTEGER REFERENCES renters(id) ON DELETE SET NULL,
    old_rent DECIMAL(10,2),
    new_rent DECIMAL(10,2),
    change_reason VARCHAR(50), -- 'annual_increase', 'manager_adjustment', 'new_lease'
    changed_by INTEGER REFERENCES users(id),
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rent_history_apartment ON rent_history(apartment_id);
CREATE INDEX IF NOT EXISTS idx_rent_history_renter ON rent_history(renter_id);
CREATE INDEX IF NOT EXISTS idx_renters_apartment ON renters(apartment_id);
CREATE INDEX IF NOT EXISTS idx_renters_lease ON renters(lease_start, lease_end);

-- ============================================
-- STEP 2: UPDATE APARTMENT RENT TRACKING
-- ============================================

-- Set base_rent = current rent_amount for all apartments
UPDATE apartments SET base_rent = rent_amount WHERE base_rent = 0 OR base_rent IS NULL;

-- ============================================
-- STEP 3: MIGRATE EXISTING RENTER DATA TO NEW STRUCTURE
-- ============================================

-- For renters that have apartments assigned (via apartments.current_renter_id)
UPDATE renters r
SET 
    apartment_id = a.id,
    lease_start = a.lease_start,
    lease_end = a.lease_end,
    agreed_rent = a.rent_amount
FROM apartments a
WHERE a.current_renter_id = r.id
AND r.apartment_id IS NULL;

-- ============================================
-- STEP 4: CREATE RENT HISTORY FOR EXISTING RENTERS
-- ============================================

INSERT INTO rent_history (apartment_id, renter_id, old_rent, new_rent, change_reason, effective_date)
SELECT 
    r.apartment_id,
    r.id,
    r.agreed_rent,
    r.agreed_rent,
    'initial_lease',
    r.lease_start
FROM renters r
WHERE r.apartment_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM rent_history WHERE renter_id = r.id
);

-- ============================================
-- STEP 5: CLEAN UP OLD PAYMENTS (KEEP ONLY 2025-2026)
-- ============================================

-- Update status for old payments to keep them as history
UPDATE payments SET status = 'paid'::payment_status
WHERE status = 'pending' AND month < '2025-01-01';

-- ============================================
-- STEP 6: FUNCTION TO GENERATE PAYMENTS FOR A RENTER (FIXED)
-- ============================================

-- Drop and recreate with proper logic

CREATE OR REPLACE FUNCTION generate_renter_payments(p_renter_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_apartment_id INTEGER;
    v_lease_start DATE;
    v_lease_end DATE;
    v_agreed_rent DECIMAL;
    v_current_month DATE;
    v_due_date DATE;
    v_today DATE := CURRENT_DATE;
    v_status payment_status;
    v_paid_at TIMESTAMP;
BEGIN
    -- Get renter details
    SELECT apartment_id, lease_start, lease_end, agreed_rent 
    INTO v_apartment_id, v_lease_start, v_lease_end, v_agreed_rent
    FROM renters WHERE id = p_renter_id;
    
    IF v_apartment_id IS NULL THEN
        RAISE NOTICE 'Renter % has no apartment assigned', p_renter_id;
        RETURN;
    END IF;
    
    -- Start from lease start month (first day of month)
    v_current_month := DATE_TRUNC('month', v_lease_start)::DATE;
    
    -- Generate payments for each month of lease
    WHILE v_current_month <= DATE_TRUNC('month', v_lease_end)::DATE LOOP
        -- Due date is 5th of the month
        v_due_date := v_current_month + INTERVAL '5 days';
        
        -- Determine status based on current date
        IF v_current_month < DATE_TRUNC('month', v_today) THEN
            -- Past months: mark as PAID (historical)
            v_status := 'paid'::payment_status;
            -- Set paid_at to a reasonable date (3rd of that month)
            v_paid_at := v_current_month + INTERVAL '3 days';
        ELSIF v_current_month = DATE_TRUNC('month', v_today) THEN
            -- Current month: pending (due now)
            v_status := 'pending'::payment_status;
            v_paid_at := NULL;
        ELSE
            -- Future months: pending (upcoming)
            v_status := 'pending'::payment_status;
            v_paid_at := NULL;
        END IF;
        
        -- Insert payment
        INSERT INTO payments (
            apartment_id, 
            renter_id, 
            amount, 
            month, 
            due_date, 
            status,
            paid_at,
            created_at,
            updated_at
        ) VALUES (
            v_apartment_id, 
            p_renter_id, 
            v_agreed_rent, 
            v_current_month, 
            v_due_date,
            v_status,
            v_paid_at,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (renter_id, month) DO UPDATE SET
            amount = EXCLUDED.amount,
            apartment_id = EXCLUDED.apartment_id,
            due_date = EXCLUDED.due_date,
            status = EXCLUDED.status,
            paid_at = EXCLUDED.paid_at,
            updated_at = CURRENT_TIMESTAMP;
        
        -- Move to next month
        v_current_month := (v_current_month + INTERVAL '1 month')::DATE;
    END LOOP;
    
    RAISE NOTICE 'Generated payments for renter % from % to % (% past months paid)', 
        p_renter_id, v_lease_start, v_lease_end;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- STEP 7: TRIGGER TO AUTO-CREATE PAYMENTS ON NEW RENTER
-- ============================================

CREATE OR REPLACE FUNCTION trigger_generate_renter_payments()
RETURNS TRIGGER AS $$
BEGIN
    -- When a renter gets assigned an apartment
    IF NEW.apartment_id IS NOT NULL AND 
       (OLD.apartment_id IS NULL OR OLD.apartment_id != NEW.apartment_id) THEN
        PERFORM generate_renter_payments(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_renter_payments ON renters;
CREATE TRIGGER trg_generate_renter_payments
AFTER INSERT OR UPDATE OF apartment_id ON renters
FOR EACH ROW
EXECUTE FUNCTION trigger_generate_renter_payments();

-- ============================================
-- STEP 8: FUNCTION FOR ANNUAL RENT INCREASE
-- ============================================

CREATE OR REPLACE FUNCTION apply_annual_rent_increase(
    p_increase_amount DECIMAL DEFAULT 1000,
    p_building_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    apartment_id INTEGER,
    apartment_number VARCHAR,
    building_name VARCHAR,
    old_rent DECIMAL,
    new_rent DECIMAL,
    current_renter VARCHAR
) AS $$
DECLARE
    v_effective_date DATE := DATE_TRUNC('year', CURRENT_DATE)::DATE;
BEGIN
    RETURN QUERY
    WITH updated_apartments AS (
        UPDATE apartments a
        SET 
            rent_amount = rent_amount + p_increase_amount,
            last_increase_date = CURRENT_DATE,
            updated_at = CURRENT_TIMESTAMP
        WHERE 
            (p_building_id IS NULL OR a.building_id = p_building_id)
            AND a.status = 'occupied'
        RETURNING a.id, a.apartment_number, a.building_id, 
                  a.rent_amount - p_increase_amount as old_rent, 
                  a.rent_amount as new_rent
    ),
    building_names AS (
        SELECT b.id, b.name FROM buildings b
    )
    SELECT 
        ua.id,
        ua.apartment_number,
        bn.name,
        ua.old_rent,
        ua.new_rent,
        r.name
    FROM updated_apartments ua
    LEFT JOIN building_names bn ON ua.building_id = bn.id
    LEFT JOIN renters r ON ua.id = r.apartment_id AND r.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 9: FUNCTION TO GET RENTER PAYMENT STATUS
-- ============================================
-- First, drop the existing function
-- Drop the problematic function
DROP FUNCTION IF EXISTS get_renter_payment_status(integer);

-- Create the fixed version
CREATE OR REPLACE FUNCTION get_renter_payment_status(p_renter_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    month DATE,
    amount DECIMAL,
    status TEXT,
    can_pay BOOLEAN,
    due_date DATE,
    display_status TEXT
) AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_current_month DATE := DATE_TRUNC('month', v_today)::DATE;
    v_lease_start DATE;
    v_lease_end DATE;
BEGIN
    -- Get renter's lease dates - use the parameter explicitly
    SELECT renters.lease_start, renters.lease_end 
    INTO v_lease_start, v_lease_end
    FROM renters 
    WHERE renters.id = p_renter_id;
    
    RETURN QUERY
    SELECT 
        payments.id,
        payments.month,
        payments.amount,
        payments.status::TEXT,
        (payments.month <= v_current_month AND payments.status = 'pending'::payment_status) as can_pay,
        payments.due_date,
        CASE
            WHEN payments.status = 'paid'::payment_status THEN 'paid'
            WHEN payments.month < v_current_month AND payments.status = 'pending'::payment_status THEN 'overdue'
            WHEN payments.month = v_current_month AND payments.status = 'pending'::payment_status THEN 'due_now'
            WHEN payments.month > v_current_month AND payments.status = 'pending'::payment_status THEN 'upcoming'
            ELSE payments.status::TEXT
        END as display_status
    FROM payments
    WHERE payments.renter_id = p_renter_id
    ORDER BY payments.month DESC;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_renter_payment_status(6);

-- ============================================
-- STEP 10: FUNCTION TO CHECK IF RENTER CAN PAY
-- (Must pay oldest first, no future payments)
-- ============================================

CREATE OR REPLACE FUNCTION validate_renter_payment(
    p_renter_id INTEGER,
    p_payment_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_target_month DATE;
    v_has_older_unpaid BOOLEAN;
    v_current_month DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
BEGIN
    -- Get the month of the payment they want to pay
    SELECT month INTO v_target_month
    FROM payments WHERE id = p_payment_id AND renter_id = p_renter_id;
    
    -- Check if trying to pay future month
    IF v_target_month > v_current_month THEN
        RAISE EXCEPTION 'Cannot pay for future months';
    END IF;
    
    -- Check if there are older unpaid months
    SELECT EXISTS (
        SELECT 1 FROM payments
        WHERE renter_id = p_renter_id
            AND status = 'pending'::payment_status
            AND month < v_target_month
    ) INTO v_has_older_unpaid;
    
    IF v_has_older_unpaid THEN
        RAISE EXCEPTION 'Must pay older months first';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 11: CREATE 2026 DEMO DATA
-- ============================================

-- First, update all existing renters to have 2026 leases
UPDATE renters SET
    lease_start = '2026-01-01',
    lease_end = '2026-12-31',
    agreed_rent = CASE 
        WHEN id = 1 THEN 12000  -- John
        WHEN id = 2 THEN 8000   -- Sarah
        WHEN id = 3 THEN 8500   -- Mike
        WHEN id = 4 THEN 13000  -- Emily
        WHEN id = 5 THEN 25000  -- David
        WHEN id = 6 THEN 8500   -- Demo
        WHEN id = 7 THEN 11000  -- Robert
        ELSE agreed_rent
    END
WHERE status = 'active';

-- Clear old payments and generate new ones for 2026
DELETE FROM payments WHERE EXTRACT(YEAR FROM month) < 2026;

-- Generate payments for all active renters
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM renters WHERE status = 'active' LOOP
        PERFORM generate_renter_payments(r.id);
    END LOOP;
END $$;

-- ============================================
-- STEP 12: ADD MORE APARTMENTS (Optional)
-- ============================================

-- Add more apartments to reach desired counts
-- Green Valley (ID 1) - currently 7, need 14
INSERT INTO apartments (building_id, apartment_number, floor, bedrooms, bathrooms, rent_amount, base_rent, status) VALUES
(1, '104', '1', 1, 1, 8500, 8500, 'vacant'),
(1, '105', '1', 2, 1, 12000, 12000, 'vacant'),
(1, '203', '2', 2, 1, 12500, 12500, 'vacant'),
(1, '204', '2', 1, 1, 9000, 9000, 'vacant'),
(1, '303', '3', 2, 2, 15000, 15000, 'vacant'),
(1, '304', '3', 1, 1, 9500, 9500, 'vacant'),
(1, '401', '4', 3, 2, 18000, 18000, 'vacant')
ON CONFLICT DO NOTHING;

-- Sky Tower (ID 2) - currently 2, need 6
INSERT INTO apartments (building_id, apartment_number, floor, bedrooms, bathrooms, rent_amount, base_rent, status) VALUES
(2, '101', '1', 2, 2, 18000, 18000, 'vacant'),
(2, '201', '2', 2, 2, 19000, 19000, 'vacant'),
(2, '301', '3', 3, 2, 25000, 25000, 'vacant'),
(2, '401', '4', 3, 2, 26000, 26000, 'vacant')
ON CONFLICT DO NOTHING;

-- Lakeview (ID 3) - currently 3, need 10
INSERT INTO apartments (building_id, apartment_number, floor, bedrooms, bathrooms, rent_amount, base_rent, status) VALUES
(3, '103', '1', 1, 1, 7800, 7800, 'vacant'),
(3, '104', '1', 2, 1, 11500, 11500, 'vacant'),
(3, '202', '2', 2, 1, 12500, 12500, 'vacant'),
(3, '203', '2', 1, 1, 8000, 8000, 'vacant'),
(3, '301', '3', 2, 2, 14000, 14000, 'vacant'),
(3, '302', '3', 1, 1, 8200, 8200, 'vacant'),
(3, '303', '3', 3, 2, 16000, 16000, 'vacant')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 13: VERIFICATION QUERIES
-- ============================================

-- Check renters with their apartments
SELECT 
    r.id,
    r.name,
    r.lease_start,
    r.lease_end,
    r.agreed_rent,
    a.apartment_number,
    b.name as building
FROM renters r
LEFT JOIN apartments a ON r.apartment_id = a.id
LEFT JOIN buildings b ON a.building_id = b.id
WHERE r.status = 'active'
ORDER BY r.id;

-- Check payment status for each renter
SELECT 
    r.name,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN p.status = 'paid'::payment_status THEN 1 END) as paid,
    COUNT(CASE WHEN p.month < DATE_TRUNC('month', CURRENT_DATE) AND p.status = 'pending'::payment_status THEN 1 END) as overdue,
    COUNT(CASE WHEN p.month = DATE_TRUNC('month', CURRENT_DATE) AND p.status = 'pending'::payment_status THEN 1 END) as due_now,
    COUNT(CASE WHEN p.month > DATE_TRUNC('month', CURRENT_DATE) AND p.status = 'pending'::payment_status THEN 1 END) as upcoming
FROM renters r
JOIN payments p ON r.id = p.renter_id
GROUP BY r.id, r.name
ORDER BY r.id;

-- Show all vacant apartments
SELECT 
    b.name as building,
    a.apartment_number,
    a.floor,
    a.bedrooms || ' bed' as specs,
    a.rent_amount
FROM apartments a
JOIN buildings b ON a.building_id = b.id
WHERE a.status = 'vacant'
ORDER BY b.name, a.apartment_number;

-- Show apartment counts per building
SELECT 
    b.name,
    COUNT(*) as total,
    COUNT(CASE WHEN a.status = 'occupied' THEN 1 END) as occupied,
    COUNT(CASE WHEN a.status = 'vacant' THEN 1 END) as vacant
FROM buildings b
LEFT JOIN apartments a ON b.id = a.building_id
GROUP BY b.id, b.name
ORDER BY b.id;

COMMIT;

-- Final message
SELECT '✅ Payments and Renters refinement complete!' as message;