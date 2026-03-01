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
        14,
        '2027-12-31'::DATE,
        5.0::DECIMAL,
        'annual_renewal'::VARCHAR,
        v_status, v_message, v_new_start, v_new_end, v_old_rent, v_new_rent
    );
    
    RAISE NOTICE 'Status: %', v_status;
    RAISE NOTICE 'Message: %', v_message;
    RAISE NOTICE 'New Lease: % to %', v_new_start, v_new_end;
    RAISE NOTICE 'Rent: ৳% → ৳%', v_old_rent, v_new_rent;
END $$;

-- Verify the update
SELECT 
    id,
    name,
    email,
    agreed_rent,
    lease_start,
    lease_end
FROM renters 
WHERE email = 'ar@gmail.com';

-- Check rent history
SELECT * FROM rent_history 
WHERE renter_id = 14
ORDER BY effective_date DESC;

-- Check new payments
SELECT month, amount, status 
FROM payments 
WHERE renter_id = 14 
  AND month > '2026-09-01'
ORDER BY month;