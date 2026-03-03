-- ==================== CLEAN UP PREVIOUS OBJECTS ====================

-- 1. Drop Views (Use CASCADE because views can depend on each other)
DROP VIEW IF EXISTS user_auth_view CASCADE;
DROP VIEW IF EXISTS owner_dashboard_view CASCADE;
DROP VIEW IF EXISTS rent_payments_view CASCADE;
DROP VIEW IF EXISTS owner_utility_bills_view CASCADE;
DROP VIEW IF EXISTS maintenance_resolution_view CASCADE;
DROP VIEW IF EXISTS owner_all_bills_view CASCADE;
DROP MATERIALIZED VIEW IF EXISTS monthly_financial_summary CASCADE;

-- 2. Drop Triggers (Must specify the table they belong to)
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
DROP TRIGGER IF EXISTS trigger_renters_updated_at ON renters;
DROP TRIGGER IF EXISTS trigger_apartments_updated_at ON apartments;
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS trigger_maintenance_requests_updated_at ON maintenance_requests;
DROP TRIGGER IF EXISTS trigger_manager_tasks_updated_at ON manager_tasks;
DROP TRIGGER IF EXISTS trigger_owners_updated_at ON owners;
DROP TRIGGER IF EXISTS trigger_managers_updated_at ON managers;
DROP TRIGGER IF EXISTS trigger_utility_bills_updated_at ON utility_bills;
DROP TRIGGER IF EXISTS trigger_owner_expenses_updated_at ON owner_expenses;
DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS trigger_bills_status_update ON bills;
DROP TRIGGER IF EXISTS trigger_utility_bills_status_update ON utility_bills;
DROP TRIGGER IF EXISTS trigger_payment_audit ON payments;
DROP TRIGGER IF EXISTS trigger_renter_audit ON renters;
DROP TRIGGER IF EXISTS trigger_maintenance_audit ON maintenance_requests;

-- 3. Drop Functions and Procedures (Specify argument types for identification)
DROP FUNCTION IF EXISTS find_payment_pattern_renters(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_owner_financial_summary(INTEGER) CASCADE;
DROP PROCEDURE IF EXISTS resolve_maintenance_request(INTEGER, TEXT, DECIMAL, INTEGER);

-- ==================== NOW START YOUR CREATIONS ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_bill_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.paid_date IS NOT NULL THEN
        NEW.status = 'paid';
    ELSIF NEW.due_date < CURRENT_DATE THEN
        NEW.status = 'overdue';
    ELSIF NEW.due_date > CURRENT_DATE THEN
        NEW.status = 'upcoming';
    ELSE
        NEW.status = 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO payment_audit_log (payment_id, old_status, new_status, change_reason)
        VALUES (NEW.id, OLD.status, NEW.status, 'Status changed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_renter_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO renters_audit_log (renter_id, old_status, new_status, change_reason)
        VALUES (NEW.id, OLD.status, NEW.status, 'Status changed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_maintenance_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO maintenance_audit_log (request_id, old_status, new_status, change_reason)
        VALUES (NEW.id, OLD.status, NEW.status, 'Status changed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_payment_pattern_renters(pattern_type VARCHAR DEFAULT 'late')
RETURNS TABLE (
  renter_id INTEGER,
  renter_name VARCHAR,
  apartment_number VARCHAR,
  total_payments INTEGER,
  late_payments INTEGER,
  on_time_payments INTEGER,
  late_payment_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH payment_stats AS (
    SELECT 
      r.id as renter_id,
      r.name as renter_name,
      a.apartment_number,
      COUNT(p.id) as total_payments,
      COUNT(CASE WHEN p.status = 'overdue' OR (p.status = 'paid' AND p.paid_at > p.due_date) THEN 1 END) as late_payments,
      COUNT(CASE WHEN p.status = 'paid' AND p.paid_at <= p.due_date THEN 1 END) as on_time_payments
    FROM renters r
    LEFT JOIN apartments a ON r.id = a.current_renter_id
    LEFT JOIN payments p ON r.id = p.renter_id AND p.status IN ('paid', 'overdue')
    WHERE r.status = 'active'
    GROUP BY r.id, r.name, a.apartment_number
  )
  SELECT 
    ps.renter_id,
    ps.renter_name,
    ps.apartment_number,
    ps.total_payments,
    ps.late_payments,
    ps.on_time_payments,
    CASE 
      WHEN ps.total_payments > 0 THEN 
        ROUND((ps.late_payments::DECIMAL / ps.total_payments) * 100, 2)
      ELSE 0 
    END as late_payment_percentage
  FROM payment_stats ps
  WHERE 
    (pattern_type = 'late' AND ps.late_payments > 0) OR
    (pattern_type = 'ontime' AND ps.on_time_payments > 0) OR
    pattern_type = 'all'
  ORDER BY late_payment_percentage DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_owner_financial_summary(owner_id_param INTEGER)
RETURNS TABLE (
  total_income DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  net_profit DECIMAL(12,2),
  pending_payments BIGINT,
  overdue_payments BIGINT,
  vacant_apartments BIGINT,
  occupied_apartments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH owner_buildings AS (
    SELECT id FROM buildings WHERE owner_id = owner_id_param
  ),
  income AS (
    SELECT COALESCE(SUM(p.amount), 0) as total_income
    FROM payments p
    JOIN apartments a ON p.apartment_id = a.id
    JOIN owner_buildings ob ON a.building_id = ob.id
    WHERE p.status = 'paid'
  ),
  expenses AS (
    SELECT COALESCE(SUM(oe.amount), 0) as total_expenses
    FROM owner_expenses oe
    WHERE oe.owner_id = owner_id_param
  )
  SELECT 
    i.total_income,
    e.total_expenses,
    i.total_income - e.total_expenses as net_profit,
    (SELECT COUNT(*) FROM payments p
     JOIN apartments a ON p.apartment_id = a.id
     JOIN owner_buildings ob ON a.building_id = ob.id
     WHERE p.status = 'pending')::BIGINT as pending_payments,
    (SELECT COUNT(*) FROM payments p
     JOIN apartments a ON p.apartment_id = a.id
     JOIN owner_buildings ob ON a.building_id = ob.id
     WHERE p.status = 'overdue')::BIGINT as overdue_payments,
    (SELECT COUNT(*) FROM apartments a
     JOIN owner_buildings ob ON a.building_id = ob.id
     WHERE a.status = 'vacant')::BIGINT as vacant_apartments,
    (SELECT COUNT(*) FROM apartments a
     JOIN owner_buildings ob ON a.building_id = ob.id
     WHERE a.status = 'occupied')::BIGINT as occupied_apartments
  FROM income i, expenses e;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE PROCEDURE resolve_maintenance_request(
    request_id INTEGER,
    resolution_text TEXT,
    actual_cost DECIMAL(10,2),
    manager_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE maintenance_requests
    SET 
        status = 'completed',
        resolution = resolution_text,
        actual_cost = actual_cost,
        completed_at = CURRENT_TIMESTAMP,
        manager_marked_resolved = TRUE
    WHERE id = request_id;
    
    INSERT INTO maintenance_audit_log (request_id, old_status, new_status, change_reason, changed_by)
    VALUES (
        request_id,
        (SELECT status FROM maintenance_requests WHERE id = request_id),
        'completed',
        'Manager resolved maintenance',
        manager_id
    );
    
    RAISE NOTICE 'Maintenance request % resolved by manager %', request_id, manager_id;
END;
$$;

-- ==================== CREATE TRIGGERS ====================

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_renters_updated_at BEFORE UPDATE ON renters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_apartments_updated_at BEFORE UPDATE ON apartments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_manager_tasks_updated_at BEFORE UPDATE ON manager_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_owners_updated_at BEFORE UPDATE ON owners
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_managers_updated_at BEFORE UPDATE ON managers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_utility_bills_updated_at BEFORE UPDATE ON utility_bills
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_owner_expenses_updated_at BEFORE UPDATE ON owner_expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_messages_updated_at BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_bills_status_update 
BEFORE INSERT OR UPDATE ON bills
FOR EACH ROW EXECUTE FUNCTION update_bill_status();

CREATE TRIGGER trigger_utility_bills_status_update 
BEFORE INSERT OR UPDATE ON utility_bills
FOR EACH ROW EXECUTE FUNCTION update_bill_status();

CREATE TRIGGER trigger_payment_audit AFTER UPDATE OF status ON payments
FOR EACH ROW EXECUTE FUNCTION log_payment_status_change();

CREATE TRIGGER trigger_renter_audit AFTER UPDATE OF status ON renters
FOR EACH ROW EXECUTE FUNCTION log_renter_status_change();

CREATE TRIGGER trigger_maintenance_audit AFTER UPDATE OF status ON maintenance_requests
FOR EACH ROW EXECUTE FUNCTION log_maintenance_status_change();

-- ==================== CREATE VIEWS ====================

CREATE VIEW user_auth_view AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    u.phone,
    u."isActive",
    u.created_at,
    u.updated_at,
    CASE 
        WHEN u.role = 'owner' THEN o.name
        WHEN u.role = 'manager' THEN m.name
        WHEN u.role = 'renter' THEN r.name
        ELSE u.username
    END as full_name,
    CASE 
        WHEN u.role = 'owner' THEN o.id
        WHEN u.role = 'manager' THEN m.id
        WHEN u.role = 'renter' THEN r.id
        ELSE NULL
    END as profile_id
FROM users u
LEFT JOIN owners o ON u.id = o.user_id AND u.role = 'owner'
LEFT JOIN managers m ON u.id = m.user_id AND u.role = 'manager'
LEFT JOIN renters r ON u.id = r.user_id AND u.role = 'renter';

CREATE VIEW owner_dashboard_view AS
SELECT 
    o.id as owner_id,
    o.name as owner_name,
    COUNT(DISTINCT b.id) as total_buildings,
    COUNT(DISTINCT a.id) as total_apartments,
    COUNT(DISTINCT CASE WHEN a.status = 'occupied' THEN a.id END) as occupied_apartments,
    COUNT(DISTINCT CASE WHEN a.status = 'vacant' THEN a.id END) as vacant_apartments,
    COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as pending_income,
    COALESCE(SUM(CASE WHEN p.status = 'overdue' THEN p.amount ELSE 0 END), 0) as overdue_income,
    COALESCE(SUM(oe.amount), 0) as total_expenses,
    (COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) - COALESCE(SUM(oe.amount), 0)) as net_profit
FROM owners o
LEFT JOIN buildings b ON o.id = b.owner_id
LEFT JOIN apartments a ON b.id = a.building_id
LEFT JOIN payments p ON a.id = p.apartment_id
LEFT JOIN owner_expenses oe ON o.id = oe.owner_id
GROUP BY o.id, o.name;

CREATE VIEW rent_payments_view AS
SELECT 
    p.*,
    a.apartment_number,
    a.floor,
    r.name as renter_name,
    r.email as renter_email,
    r.phone as renter_phone,
    b.name as building_name,
    o.name as owner_name,
    pc.status as verification_status,
    pc.verified_at,
    pc.notes as verification_notes
FROM payments p
JOIN apartments a ON p.apartment_id = a.id
JOIN renters r ON p.renter_id = r.id
JOIN buildings b ON a.building_id = b.id
LEFT JOIN owners o ON b.owner_id = o.id
LEFT JOIN payment_confirmations pc ON p.id = pc.payment_id;

CREATE VIEW owner_utility_bills_view AS
SELECT 
    ub.id,
    ub.type,
    ub.building_id,
    ub.amount,
    ub.due_date,
    ub.status,
    ub.provider,
    ub.account_number,
    ub.month,
    ub.consumption,
    ub.description,
    ub.paid_date,
    ub.paid_amount,
    ub.created_at,
    ub.updated_at,
    b.name as building_name,
    o.id as owner_id,
    o.name as owner_name
FROM utility_bills ub
JOIN buildings b ON ub.building_id = b.id
JOIN owners o ON b.owner_id = o.id;

CREATE VIEW maintenance_resolution_view AS
SELECT 
    mr.*,
    r.name as renter_name,
    a.apartment_number,
    b.name as building_name,
    CASE 
        WHEN mr.manager_marked_resolved = TRUE AND mr.renter_marked_resolved = TRUE THEN 'fully_resolved'
        WHEN mr.manager_marked_resolved = TRUE THEN 'awaiting_renter_confirmation'
        WHEN mr.renter_marked_resolved = TRUE THEN 'awaiting_manager_confirmation'
        ELSE 'unresolved'
    END as resolution_status
FROM maintenance_requests mr
JOIN renters r ON mr.renter_id = r.id
JOIN apartments a ON mr.apartment_id = a.id
JOIN buildings b ON a.building_id = b.id;

CREATE MATERIALIZED VIEW monthly_financial_summary AS
SELECT 
    DATE_TRUNC('month', p.month) as report_month,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_collected,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN p.status = 'overdue' THEN p.amount ELSE 0 END) as total_overdue,
    COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN p.status = 'overdue' THEN 1 END) as overdue_count
FROM payments p
GROUP BY DATE_TRUNC('month', p.month)
ORDER BY report_month DESC;

-- Fix the owner_all_bills_view with proper type casting
DROP VIEW IF EXISTS owner_all_bills_view CASCADE;

CREATE VIEW owner_all_bills_view AS
SELECT 
    id,
    'utility'::TEXT as bill_source,
    type as bill_type,
    type as title,
    building_id,
    (SELECT name FROM buildings WHERE id = building_id) as building_name,
    owner_id,
    amount,
    due_date,
    status::TEXT as status,  -- Cast to TEXT to avoid enum mismatch
    paid_date,
    paid_amount,
    provider,
    account_number,
    month,
    consumption,
    description,
    created_at,
    updated_at
FROM utility_bills
WHERE owner_id IS NOT NULL

UNION ALL

SELECT 
    id,
    'manager'::TEXT as bill_source,
    'Manager Bill' as bill_type,
    title,
    NULL::INTEGER as building_id,
    'All Buildings' as building_name,
    (SELECT assigned_owner_id FROM managers WHERE id = manager_id) as owner_id,
    amount,
    due_date,
    status::TEXT as status,  -- Cast to TEXT
    paid_date,
    amount as paid_amount,
    NULL::VARCHAR as provider,
    NULL::VARCHAR as account_number,
    NULL::VARCHAR as month,
    NULL::VARCHAR as consumption,
    description,
    created_at,
    updated_at
FROM bills
WHERE manager_id IS NOT NULL

UNION ALL

SELECT 
    id,
    'expense'::TEXT as bill_source,
    category as bill_type,
    category || ' Expense' as title,
    NULL::INTEGER as building_id,
    'Owner Expense' as building_name,
    owner_id,
    amount,
    expense_date as due_date,
    CASE WHEN expense_date <= CURRENT_DATE THEN 'paid' ELSE 'pending' END as status,
    expense_date as paid_date,
    amount as paid_amount,
    NULL::VARCHAR as provider,
    receipt_number as account_number,
    NULL::VARCHAR as month,
    NULL::VARCHAR as consumption,
    description,
    created_at,
    updated_at
FROM owner_expenses;

-- ==================== FINAL VERIFICATION ====================

DO $$
DECLARE
    total_tables INTEGER;
    total_rows BIGINT;
    utility_bill_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    SELECT SUM(row_count) INTO total_rows
    FROM (
        SELECT COUNT(*) as row_count FROM users
        UNION ALL SELECT COUNT(*) FROM owners
        UNION ALL SELECT COUNT(*) FROM managers
        UNION ALL SELECT COUNT(*) FROM renters
        UNION ALL SELECT COUNT(*) FROM buildings
        UNION ALL SELECT COUNT(*) FROM apartments
        UNION ALL SELECT COUNT(*) FROM payments
        UNION ALL SELECT COUNT(*) FROM payment_confirmations
        UNION ALL SELECT COUNT(*) FROM maintenance_requests
        UNION ALL SELECT COUNT(*) FROM manager_tasks
        UNION ALL SELECT COUNT(*) FROM complaints
        UNION ALL SELECT COUNT(*) FROM complaint_resolution
        UNION ALL SELECT COUNT(*) FROM bills
        UNION ALL SELECT COUNT(*) FROM utility_bills
        UNION ALL SELECT COUNT(*) FROM owner_expenses
        UNION ALL SELECT COUNT(*) FROM payment_audit_log
        UNION ALL SELECT COUNT(*) FROM renters_audit_log
        UNION ALL SELECT COUNT(*) FROM maintenance_audit_log
        UNION ALL SELECT COUNT(*) FROM messages
    ) as counts;
    
    SELECT COUNT(*) INTO utility_bill_count FROM utility_bills;
    
    RAISE NOTICE '
    ============================================
    OTTALIKA DATABASE COMPLETE
    ============================================
    Created % tables
    Inserted % total rows
    Utility bills: % (should be 8)
    ============================================
    DEMO USERS:
        Owner 1: owner@ottalika.com / demo123
        Owner 2: owner2@ottalika.com / demo123
        Manager: manager@ottalika.com / demo123
        Renter: renter@ottalika.com / demo123
    ============================================
    ', total_tables, total_rows, utility_bill_count;
END $$;

-- Show utility bills with correct status
SELECT 
    type,
    amount,
    due_date,
    status,
    paid_date,
    CASE 
        WHEN due_date < CURRENT_DATE AND status != 'paid' THEN 'Should be PAID or OVERDUE'
        WHEN due_date > CURRENT_DATE AND status = 'paid' THEN 'Should be UPCOMING'
        ELSE 'Correct'
    END as status_check
FROM utility_bills
ORDER BY due_date;

-- Show owner all bills view (only if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'owner_all_bills_view') THEN
        RAISE NOTICE 'Owner All Bills View created successfully';
    END IF;
END $$;