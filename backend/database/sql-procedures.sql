-- ==================== PROCEDURE ====================
-- 1. Generate Monthly Rent Bills for a Manager
CREATE OR REPLACE PROCEDURE generate_monthly_rents_for_manager(manager_id UUID)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO "Bills" (
        id,
        "unitId",
        "renterId",
        amount,
        "dueDate",
        type,
        status,
        "createdAt",
        "updatedAt"
    )
    SELECT 
        gen_random_uuid(),
        u.id,
        u."renterId",
        u."rentAmount",
        (CURRENT_DATE + INTERVAL '1 month')::date,
        'rent',
        'pending',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM "Units" u
    JOIN "Buildings" b ON u."buildingId" = b.id
    WHERE b."managerId" = manager_id
      AND u.status = 'occupied'
      AND u."renterId" IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM "Bills" bl
          WHERE bl."unitId" = u.id
            AND bl.type = 'rent'
            AND DATE_TRUNC('month', bl."dueDate") = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
      );
    
    RAISE NOTICE 'Monthly rents generated for manager: %', manager_id;
END;
$$;

-- ==================== FUNCTION ====================
-- 2. Get Manager Dashboard Statistics
CREATE OR REPLACE FUNCTION get_manager_stats(manager_id UUID)
RETURNS TABLE (
    total_buildings INT,
    total_units INT,
    occupied_units INT,
    pending_renters INT,
    pending_payments DECIMAL(10,2),
    overdue_amount DECIMAL(10,2),
    pending_maintenance INT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT b.id)::INT as total_buildings,
        COUNT(DISTINCT u.id)::INT as total_units,
        COUNT(CASE WHEN u.status = 'occupied' THEN 1 END)::INT as occupied_units,
        COUNT(CASE WHEN ur."isVerified" = false AND ur.role = 'renter' THEN 1 END)::INT as pending_renters,
        COALESCE(SUM(CASE WHEN bl.status = 'pending' THEN bl.amount ELSE 0 END), 0) as pending_payments,
        COALESCE(SUM(CASE WHEN bl.status = 'overdue' THEN bl.amount + bl."lateFee" ELSE 0 END), 0) as overdue_amount,
        COUNT(CASE WHEN mr.status = 'pending' THEN 1 END)::INT as pending_maintenance
    FROM "Users" m
    LEFT JOIN "Buildings" b ON m.id = b."managerId"
    LEFT JOIN "Units" u ON b.id = u."buildingId"
    LEFT JOIN "Users" ur ON u."renterId" = ur.id
    LEFT JOIN "Bills" bl ON u.id = bl."unitId"
    LEFT JOIN "MaintenanceRequests" mr ON u.id = mr."unitId"
    WHERE m.id = manager_id;
END;
$$;

-- ==================== TRIGGER ====================
-- 3. Auto-create Manager Task on New Maintenance Request
CREATE OR REPLACE FUNCTION create_task_on_maintenance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get building manager from the unit
    INSERT INTO "ManagerTasks" (
        id,
        "managerId",
        "taskType",
        title,
        description,
        status,
        priority,
        "dueDate",
        "createdAt",
        "updatedAt"
    )
    SELECT 
        gen_random_uuid(),
        b."managerId",
        'complaint_resolution',
        'New Maintenance: ' || NEW.title,
        NEW.description,
        'pending',
        CASE NEW.priority
            WHEN 'urgent' THEN 'high'
            WHEN 'high' THEN 'high'
            WHEN 'medium' THEN 'medium'
            ELSE 'low'
        END,
        CURRENT_DATE + INTERVAL '3 days',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM "Units" u
    JOIN "Buildings" b ON u."buildingId" = b.id
    WHERE u.id = NEW."unitId";
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER maintenance_to_task_trigger
AFTER INSERT ON "MaintenanceRequests"
FOR EACH ROW
EXECUTE FUNCTION create_task_on_maintenance();