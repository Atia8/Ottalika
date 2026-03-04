-- Drop the existing procedure
DROP PROCEDURE IF EXISTS renew_lease(INTEGER, DATE, DECIMAL, VARCHAR, VARCHAR, TEXT, DATE, DATE, DECIMAL, DECIMAL);

-- Create the fixed version with proper overdue check
CREATE OR REPLACE PROCEDURE renew_lease(
    p_renter_id INTEGER,
    p_new_end_date DATE,
    p_rent_increase_percent DECIMAL DEFAULT 5.0,
    p_increase_reason VARCHAR DEFAULT 'annual_renewal',
    INOUT p_status VARCHAR DEFAULT NULL,
    INOUT p_message TEXT DEFAULT NULL,
    INOUT p_new_lease_start DATE DEFAULT NULL,
    INOUT p_new_lease_end DATE DEFAULT NULL,
    INOUT p_old_rent DECIMAL DEFAULT NULL,
    INOUT p_new_rent DECIMAL DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_lease_start DATE;
    v_current_lease_end DATE;
    v_current_rent DECIMAL;
    v_apartment_id INTEGER;
    v_renter_name VARCHAR;
    v_new_rent DECIMAL;
    v_unpaid_months INTEGER;  -- Changed name to be more accurate
    v_month_counter DATE;
    v_payment_count INTEGER := 0;
BEGIN
    -- Get current renter details
    SELECT 
        r.lease_start, 
        r.lease_end, 
        r.agreed_rent,
        r.apartment_id,
        r.name
    INTO 
        v_current_lease_start, 
        v_current_lease_end, 
        v_current_rent,
        v_apartment_id,
        v_renter_name
    FROM renters r
    WHERE r.id = p_renter_id;
    
    -- Check if renter exists
    IF v_current_lease_start IS NULL THEN
        p_status := 'ERROR';
        p_message := 'Renter not found';
        RETURN;
    END IF;
    
    -- Validate new end date
    IF p_new_end_date <= v_current_lease_end THEN
        p_status := 'ERROR';
        p_message := 'New lease end date must be after current lease end date';
        RETURN;
    END IF;
    
    -- FIXED: Check for ANY unpaid months (both 'pending' AND 'overdue')
    SELECT COUNT(*) INTO v_unpaid_months
    FROM payments p
    WHERE p.renter_id = p_renter_id
      AND p.status IN ('pending'::payment_status, 'overdue'::payment_status)
      AND p.month < DATE_TRUNC('month', CURRENT_DATE);
    
    IF v_unpaid_months > 0 THEN
        p_status := 'ERROR';
        p_message := 'Cannot renew lease: Renter has ' || v_unpaid_months || ' unpaid month(s). Please clear all dues first.';
        RETURN;
    END IF;
    
    -- Calculate new rent
    v_new_rent := v_current_rent * (1 + p_rent_increase_percent / 100);
    v_new_rent := ROUND(v_new_rent / 100) * 100;
    
    -- Update renter record
    UPDATE renters 
    SET 
        lease_start = v_current_lease_end + INTERVAL '1 day',
        lease_end = p_new_end_date,
        agreed_rent = v_new_rent,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_renter_id;
    
    -- Update apartment record
    UPDATE apartments 
    SET 
        rent_amount = v_new_rent,
        lease_start = v_current_lease_end + INTERVAL '1 day',
        lease_end = p_new_end_date,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_apartment_id;
    
    -- Record rent history
    INSERT INTO rent_history (
        apartment_id, renter_id, old_rent, new_rent, 
        change_reason, effective_date, created_at
    ) VALUES (
        v_apartment_id, p_renter_id, v_current_rent, v_new_rent,
        p_increase_reason, v_current_lease_end + INTERVAL '1 day',
        CURRENT_TIMESTAMP
    );
    
    -- Delete future payments
    DELETE FROM payments 
    WHERE renter_id = p_renter_id 
      AND month > DATE_TRUNC('month', v_current_lease_end);
    
    -- Generate new payments
    v_month_counter := DATE_TRUNC('month', v_current_lease_end + INTERVAL '1 day');
    
    WHILE v_month_counter <= DATE_TRUNC('month', p_new_end_date) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM payments 
            WHERE renter_id = p_renter_id 
              AND month = v_month_counter
        ) THEN
            INSERT INTO payments (
                apartment_id, renter_id, amount, month, due_date, status,
                created_at, updated_at
            ) VALUES (
                v_apartment_id, p_renter_id, v_new_rent, v_month_counter,
                v_month_counter + INTERVAL '5 days',
                CASE 
                    WHEN v_month_counter < DATE_TRUNC('month', CURRENT_DATE) 
                        THEN 'paid'::payment_status
                    WHEN v_month_counter = DATE_TRUNC('month', CURRENT_DATE) 
                        THEN 'pending'::payment_status
                    ELSE 'pending'::payment_status
                END,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
            
            v_payment_count := v_payment_count + 1;
        END IF;
        
        v_month_counter := v_month_counter + INTERVAL '1 month';
    END LOOP;
    
    -- Set output parameters
    p_status := 'SUCCESS';
    p_message := 'Lease renewed successfully. Generated ' || v_payment_count || ' new payments.';
    p_new_lease_start := v_current_lease_end + INTERVAL '1 day';
    p_new_lease_end := p_new_end_date;
    p_old_rent := v_current_rent;
    p_new_rent := v_new_rent;
    
    RAISE NOTICE 'Lease renewed for %: ৳% → ৳% (% new payments)', 
        v_renter_name, v_current_rent, v_new_rent, v_payment_count;
    
EXCEPTION
    WHEN OTHERS THEN
        p_status := 'ERROR';
        p_message := 'Lease renewal failed: ' || SQLERRM;
        RAISE NOTICE 'Error: %', SQLERRM;
END;
$$;