CREATE OR REPLACE FUNCTION calculate_bill_status(
    p_due_date DATE,
    p_paid_date DATE
)
RETURNS VARCHAR AS $$
BEGIN
    IF p_paid_date IS NOT NULL THEN
        IF p_paid_date > p_due_date THEN
            RETURN 'late';
        ELSE
            RETURN 'paid';
        END IF;
    ELSE
        IF CURRENT_DATE > p_due_date THEN
            RETURN 'pending';
        ELSE
            RETURN 'upcoming';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trg_set_bill_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status := calculate_bill_status(NEW.due_date, NEW.paid_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_bill_insert_update
BEFORE INSERT OR UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION trg_set_bill_status();


CREATE OR REPLACE PROCEDURE mark_bill_paid(
    p_bill_id INT,
    p_paid_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE bills
    SET paid_date = p_paid_date
    WHERE id = p_bill_id;
END;
$$;

SELECT
    COALESCE(
        TO_CHAR(DATE_TRUNC('month', due_date), 'Mon YYYY'),
        'TOTAL'
    ) AS period,
    SUM(amount) AS total_expense
FROM bills
WHERE status IN ('paid', 'late')
GROUP BY ROLLUP (DATE_TRUNC('month', due_date))
ORDER BY period;

