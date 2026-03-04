import { Router } from "express";
import { pool } from "../../database/db";

const router = Router();

// Fixed owner ID
const OWNER_ID = 1;
const OWNER_STRING = `owner_${OWNER_ID}`;

// ===========================
// Get Owner Conversations
// ===========================
router.get("/conversations", async (req, res) => {
   try {
      // Get all managers and format them as conversations
      const managers = await pool.query(`
         SELECT 
            m.id,
            m.name,
            'manager' as role,
            COALESCE(
               (SELECT message 
                FROM messages 
                WHERE (sender_id = $1 AND receiver_id = 'manager_' || m.id::text) 
                   OR (sender_id = 'manager_' || m.id::text AND receiver_id = $1)
                ORDER BY created_at DESC 
                LIMIT 1), 
               ''
            ) as last_message,
            COALESCE(
               (SELECT created_at 
                FROM messages 
                WHERE (sender_id = $1 AND receiver_id = 'manager_' || m.id::text) 
                   OR (sender_id = 'manager_' || m.id::text AND receiver_id = $1)
                ORDER BY created_at DESC 
                LIMIT 1), 
               NOW()
            ) as last_message_time,
            COALESCE(
               (SELECT COUNT(*) 
                FROM messages 
                WHERE sender_id = 'manager_' || m.id::text 
                  AND receiver_id = $1 
                  AND is_read = false), 
               0
            ) as unread_count
         FROM managers m
         ORDER BY 
            CASE WHEN EXISTS (
               SELECT 1 FROM messages 
               WHERE (sender_id = $1 AND receiver_id = 'manager_' || m.id::text) 
                  OR (sender_id = 'manager_' || m.id::text AND receiver_id = $1)
            ) THEN 0 ELSE 1 END,
            (SELECT created_at FROM messages 
             WHERE (sender_id = $1 AND receiver_id = 'manager_' || m.id::text) 
                OR (sender_id = 'manager_' || m.id::text AND receiver_id = $1)
             ORDER BY created_at DESC LIMIT 1) DESC NULLS LAST
      `, [OWNER_STRING]);

      // Format as expected by frontend
      const conversations = managers.rows.map(manager => ({
         id: manager.id,
         with_user: {
            id: manager.id,
            name: manager.name,
            role: manager.role
         },
         last_message: manager.last_message || '',
         last_message_time: manager.last_message_time,
         unread_count: parseInt(manager.unread_count) || 0
      }));

      res.json({
         success: true,
         data: {
            ownerId: OWNER_ID,
            conversations: conversations
         }
      });

   } catch(err: any) {
      console.error('Get conversations error:', err);
      res.status(500).json({ error: err.message });
   }
});

// ===========================
// Send Message Owner → Manager
// ===========================
router.post("/", async (req, res) => {
   try {
      const { receiverId, message } = req.body;

      if (!receiverId || !message?.trim()) {
         return res.status(400).json({ error: "Missing receiverId or message" });
      }

      const receiverString = `manager_${receiverId}`;

      const result = await pool.query(`
         INSERT INTO messages
         (sender_id, receiver_id, message, created_at, is_read)
         VALUES($1, $2, $3, NOW(), false)
         RETURNING id, sender_id, receiver_id, message, created_at as timestamp, is_read
      `, [OWNER_STRING, receiverString, message]);

      const savedMessage = result.rows[0];

      // Format message for frontend
      const formattedMessage = {
         id: savedMessage.id,
         message: savedMessage.message,
         timestamp: savedMessage.timestamp,
         is_own: true,
         sender_name: 'You',
         status: 'delivered'
      };

      // ⭐ SOCKET REALTIME SEND
      const io = req.app.get("io");
      if (io) {
         io.to(receiverString).emit("new_message", {
            id: savedMessage.id,
            sender_id: savedMessage.sender_id,
            receiver_id: savedMessage.receiver_id,
            message: savedMessage.message,
            timestamp: savedMessage.timestamp,
            is_read: savedMessage.is_read
         });
      }

      res.json({
         success: true,
         data: {
            message: formattedMessage
         }
      });

   } catch(err: any) {
      console.error('Send message error:', err);
      res.status(500).json({ error: err.message });
   }
});

// ===========================
// Get Chat Messages
// ===========================
router.get("/conversations/:managerId", async (req, res) => {
   try {
      const { managerId } = req.params;
      const managerString = `manager_${managerId}`;

      // Get manager info for sender names
      const managerInfo = await pool.query(`
         SELECT name FROM managers WHERE id = $1
      `, [managerId]);

      // Get owner info
      const ownerInfo = await pool.query(`
         SELECT name FROM owners WHERE id = $1
      `, [OWNER_ID]);

      const managerName = managerInfo.rows[0]?.name || 'Manager';
      const ownerName = ownerInfo.rows[0]?.name || 'Owner';

      const messages = await pool.query(`
         SELECT 
            id,
            sender_id,
            receiver_id,
            message,
            created_at as timestamp,
            is_read
         FROM messages
         WHERE
            (sender_id = $1 AND receiver_id = $2)
            OR
            (sender_id = $2 AND receiver_id = $1)
         ORDER BY created_at ASC
      `, [OWNER_STRING, managerString]);

      // Format messages for frontend
      const formattedMessages = messages.rows.map(msg => ({
         id: msg.id,
         message: msg.message,
         timestamp: msg.timestamp,
         is_own: msg.sender_id === OWNER_STRING,
         sender_name: msg.sender_id === OWNER_STRING ? ownerName : managerName,
         status: msg.is_read ? 'read' : 'delivered'
      }));

      // Mark received messages as read
      await pool.query(`
         UPDATE messages 
         SET is_read = true 
         WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
      `, [managerString, OWNER_STRING]);

      res.json({
         success: true,
         data: {
            messages: formattedMessages
         }
      });

   } catch(err: any) {
      console.error('Get messages error:', err);
      res.status(500).json({ error: err.message });
   }
});

export default router;
