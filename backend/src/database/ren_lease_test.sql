-- This should FAIL with error message
DO $$
DECLARE
    v_status VARCHAR;
    v_message TEXT;
    v_new_start DATE;
    v_new_end DATE;
    v_old_rent DECIMAL;
    v_new_rent DECIMAL;
BEGIN
    CALL renew_lease(
        4, '2027-12-31', 5.0, 'annual_renewal',
        v_status, v_message, v_new_start, v_new_end, v_old_rent, v_new_rent
    );
    
    RAISE NOTICE 'Status: %', v_status;
    RAISE NOTICE 'Message: %', v_message;
END $$;