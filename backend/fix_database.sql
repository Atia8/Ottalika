-- ==================== FIX DATABASE - ADD MISSING COLUMNS ====================
-- Run this SQL script to add the missing dual-resolution columns

-- Check if columns exist, if not add them
DO $$ 
BEGIN
    -- Add manager_marked_resolved column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'maintenance_requests' 
        AND column_name = 'manager_marked_resolved'
    ) THEN
        ALTER TABLE maintenance_requests 
        ADD COLUMN manager_marked_resolved BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added manager_marked_resolved column';
    END IF;

    -- Add renter_marked_resolved column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'maintenance_requests' 
        AND column_name = 'renter_marked_resolved'
    ) THEN
        ALTER TABLE maintenance_requests 
        ADD COLUMN renter_marked_resolved BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added renter_marked_resolved column';
    END IF;

    -- Add resolution column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'maintenance_requests' 
        AND column_name = 'resolution'
    ) THEN
        ALTER TABLE maintenance_requests 
        ADD COLUMN resolution TEXT;
        RAISE NOTICE 'Added resolution column';
    END IF;

    -- Add resolution_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'maintenance_requests' 
        AND column_name = 'resolution_notes'
    ) THEN
        ALTER TABLE maintenance_requests 
        ADD COLUMN resolution_notes TEXT;
        RAISE NOTICE 'Added resolution_notes column';
    END IF;

    -- Add assigned_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'maintenance_requests' 
        AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE maintenance_requests 
        ADD COLUMN assigned_at TIMESTAMP;
        RAISE NOTICE 'Added assigned_at column';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_manager_resolved 
ON maintenance_requests(manager_marked_resolved);

CREATE INDEX IF NOT EXISTS idx_maintenance_renter_resolved 
ON maintenance_requests(renter_marked_resolved);

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'maintenance_requests' 
AND column_name IN (
    'manager_marked_resolved', 
    'renter_marked_resolved', 
    'resolution', 
    'resolution_notes',
    'assigned_at'
)
ORDER BY column_name;

RAISE NOTICE '✅ Database fix completed successfully!';