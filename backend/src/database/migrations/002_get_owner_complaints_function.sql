-- DROP FUNCTION IF EXISTS get_owner_complaints();

CREATE OR REPLACE FUNCTION get_owner_complaints()
RETURNS TABLE (
    complaint_id INT,
    title TEXT,
    description TEXT,
    category TEXT,
    priority TEXT,
    apartment_id INT,
    apartment_number TEXT,
    renter_name TEXT,
    created_at TIMESTAMP,
    manager_confirmed BOOLEAN,
    renter_confirmed BOOLEAN,
    resolved_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
      c.id AS complaint_id,
  c.title::text,
  c.description::text,
  c.category::text,
  c.priority::text,
  c.apartment_id,
  a.apartment_number::text,
  r.name::text AS renter_name,
  c.created_at,
  cr.manager_confirmed,
  cr.renter_confirmed,
  cr.resolved_at
    FROM complaints c
    JOIN apartments a ON c.apartment_id = a.id
    JOIN renters r ON c.renter_id = r.id
    LEFT JOIN complaint_resolution cr ON c.id = cr.complaint_id
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;
