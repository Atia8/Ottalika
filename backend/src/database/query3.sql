-- Check what years actually exist in your payments table
SELECT 
    EXTRACT(YEAR FROM month) as year,
    COUNT(*) as payment_count,
    MIN(month) as earliest,
    MAX(month) as latest
FROM payments
GROUP BY EXTRACT(YEAR FROM month)
ORDER BY year DESC;