CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp
BEFORE UPDATE ON owner_requests
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE OR REPLACE FUNCTION get_pending_requests()
RETURNS VOID AS $$
DECLARE
    req_record RECORD;
    req_cursor CURSOR FOR
        SELECT * FROM owner_requests WHERE status = 'pending';
BEGIN
    OPEN req_cursor;

    LOOP
        FETCH req_cursor INTO req_record;
        EXIT WHEN NOT FOUND;

        RAISE NOTICE 'Request ID: %, Renter: %',
            req_record.id, req_record.renter_name;
    END LOOP;

    CLOSE req_cursor;
END;
$$ LANGUAGE plpgsql;
