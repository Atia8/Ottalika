-- Add the constraint now while the data is clean
ALTER TABLE payments 
ADD CONSTRAINT unique_renter_month 
UNIQUE (renter_id, month);

-- Verify it was added
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'payments'
AND constraint_type = 'UNIQUE';