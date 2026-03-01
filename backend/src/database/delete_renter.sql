-- Add unique constraint to payments table
ALTER TABLE payments ADD CONSTRAINT unique_renter_month UNIQUE (renter_id, month);