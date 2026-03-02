-- Check if renter_6 exists and has messages
SELECT 
  'renter_6' as renter_id,
  EXISTS (SELECT 1 FROM renters WHERE id = 6) as renter_exists,
  (SELECT name FROM renters WHERE id = 6) as renter_name,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN sender_id = 'renter_6' THEN 1 END) as messages_sent,
  COUNT(CASE WHEN receiver_id = 'renter_6' THEN 1 END) as messages_received,
  COUNT(DISTINCT 
    CASE 
      WHEN sender_id LIKE 'manager_%' THEN sender_id
      WHEN receiver_id LIKE 'manager_%' THEN receiver_id
    END
  ) as unique_manager_conversations
FROM messages 
WHERE sender_id = 'renter_6' OR receiver_id = 'renter_6';