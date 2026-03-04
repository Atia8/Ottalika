-- ============================================
-- FILE: 99_enhancements.sql
-- PURPOSE: Optional enhancements - NO BREAKING CHANGES
-- RUN THIS AFTER your main schema
-- ============================================

-- 1. ADD JSONB COLUMN (optional, flexible attributes)
ALTER TABLE apartments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;
CREATE INDEX IF NOT EXISTS idx_apartments_metadata ON apartments USING gin(metadata);

-- 2. ADD HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION calculate_late_fees()
RETURNS TABLE (
  payment_id INTEGER,
  renter_name VARCHAR,
  days_late INTEGER,
  late_fee DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    r.name,
    EXTRACT(DAY FROM (CURRENT_DATE - p.due_date))::INTEGER,
    p.amount * 0.02 * CEIL(EXTRACT(DAY FROM (CURRENT_DATE - p.due_date)) / 30)
  FROM payments p
  JOIN renters r ON p.renter_id = r.id
  WHERE p.status = 'overdue'
    AND p.due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_monthly_revenue(report_year INTEGER)
RETURNS TABLE (
  month TEXT,
  total_revenue DECIMAL,
  payment_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(DATE_TRUNC('month', month), 'Month'),
    SUM(amount),
    COUNT(*)
  FROM payments
  WHERE EXTRACT(YEAR FROM month) = report_year
    AND status = 'paid'
  GROUP BY DATE_TRUNC('month', month)
  ORDER BY DATE_TRUNC('month', month);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_renter_payment_summary(p_renter_id INTEGER)
RETURNS TABLE (
  total_paid DECIMAL,
  total_pending DECIMAL,
  total_overdue DECIMAL,
  on_time_payments INTEGER,
  late_payments INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0),
    COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount END), 0),
    COUNT(CASE WHEN status = 'paid' AND paid_at <= due_date THEN 1 END),
    COUNT(CASE WHEN status = 'paid' AND paid_at > due_date THEN 1 END)
  FROM payments
  WHERE renter_id = p_renter_id;
END;
$$ LANGUAGE plpgsql;

-- 3. ADD USEFUL TRIGGERS
CREATE OR REPLACE FUNCTION auto_create_next_payment()
RETURNS TRIGGER AS $$
DECLARE
  next_month DATE;
BEGIN
  IF NEW.status = 'paid' THEN
    next_month := (NEW.month + INTERVAL '1 month')::DATE;
    
    IF NOT EXISTS (
      SELECT 1 FROM payments 
      WHERE renter_id = NEW.renter_id 
        AND month = next_month
    ) THEN
      INSERT INTO payments (
        apartment_id, renter_id, amount, month, 
        due_date, status
      ) VALUES (
        NEW.apartment_id, NEW.renter_id, NEW.amount, 
        next_month, next_month + INTERVAL '5 days', 'pending'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_next_payment ON payments;
CREATE TRIGGER trigger_auto_create_next_payment
AFTER UPDATE OF status ON payments
FOR EACH ROW
WHEN (NEW.status = 'paid')
EXECUTE FUNCTION auto_create_next_payment();

CREATE OR REPLACE FUNCTION prevent_renter_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM payments 
    WHERE renter_id = OLD.id 
      AND status IN ('pending', 'overdue')
  ) THEN
    RAISE EXCEPTION 'Cannot delete renter with pending or overdue payments';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_renter_deletion ON renters;
CREATE TRIGGER trigger_prevent_renter_deletion
BEFORE DELETE ON renters
FOR EACH ROW
EXECUTE FUNCTION prevent_renter_deletion();

-- 4. ADD ANOTHER COMPOSITE INDEX FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_payments_apartment_status ON payments(apartment_id, status);

-- 5. VERIFY ENHANCEMENTS
SELECT '✅ ENHANCEMENTS COMPLETE' as status;
SELECT 'JSONB column added' as info WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='apartments' AND column_name='metadata'
);
SELECT COUNT(*) as new_functions_added FROM pg_proc WHERE proname IN ('calculate_late_fees', 'get_monthly_revenue', 'get_renter_payment_summary');
SELECT COUNT(*) as new_triggers_added FROM pg_trigger WHERE tgname IN ('trigger_auto_create_next_payment', 'trigger_prevent_renter_deletion');