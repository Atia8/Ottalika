-- Run only this fix
DROP FUNCTION IF EXISTS generate_renter_payments(integer);

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
    v_past_months_count INTEGER := 0;
    v_current_month_count INTEGER := 0;
    v_future_months_count INTEGER := 0;
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
            v_status := 'paid'::payment_status;
            v_paid_at := v_current_month + INTERVAL '3 days';
            v_past_months_count := v_past_months_count + 1;
        ELSIF v_current_month = DATE_TRUNC('month', v_today) THEN
            v_status := 'pending'::payment_status;
            v_paid_at := NULL;
            v_current_month_count := v_current_month_count + 1;
        ELSE
            v_status := 'pending'::payment_status;
            v_paid_at := NULL;
            v_future_months_count := v_future_months_count + 1;
        END IF;
        
        INSERT INTO payments (
            apartment_id, renter_id, amount, month, due_date, status, paid_at,
            created_at, updated_at
        ) VALUES (
            v_apartment_id, p_renter_id, v_agreed_rent, v_current_month, v_due_date,
            v_status, v_paid_at, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (renter_id, month) DO UPDATE SET
            amount = EXCLUDED.amount,
            apartment_id = EXCLUDED.apartment_id,
            due_date = EXCLUDED.due_date,
            status = EXCLUDED.status,
            paid_at = EXCLUDED.paid_at,
            updated_at = CURRENT_TIMESTAMP;
        
        v_current_month := (v_current_month + INTERVAL '1 month')::DATE;
    END LOOP;
    
    RAISE NOTICE 'Generated payments for renter % from % to % (Past: %, Current: %, Upcoming: %)', 
        p_renter_id, v_lease_start, v_lease_end, v_past_months_count, v_current_month_count, v_future_months_count;
END;
$$ LANGUAGE plpgsql;

-- Test it
SELECT generate_renter_payments(6);