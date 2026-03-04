// // backend/src/routes/manager/messages.routes.ts - FIXED to show ALL renters

// import { Router } from 'express';
// import { dbQuery } from './utils';

// const router = Router();

// // ==================== MESSAGE ENDPOINTS ====================

// // Get all conversations for manager - SHOW ALL RENTERS
// router.get('/messages', async (req, res) => {
//   try {
//     const userId = (req as any).managerId;
    
//     const managerResult = await dbQuery(
//       'SELECT id FROM managers WHERE user_id = $1',
//       [userId]
//     );
    
//     if (managerResult.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Manager not found'
//       });
//     }
    
//     const managerId = managerResult.rows[0].id;
//     const managerString = `manager_${managerId}`;

//     // Get ALL renters (not just those with messages)
//     const allRenters = await dbQuery(`
//       SELECT 
//         r.id,
//         r.name,
//         a.apartment_number,
//         b.name as building_name,
//         'renter' as role
//       FROM renters r
//       LEFT JOIN apartments a ON r.id = a.current_renter_id
//       LEFT JOIN buildings b ON a.building_id = b.id
//       ORDER BY r.name
//     `);
//  // ✅ Get ALL owners
//     const allOwners = await dbQuery(`
//       SELECT 
//         o.id,
//         o.name,
//         NULL as apartment_number,
//         NULL as building_name,
//         'owner' as role
//       FROM owners o
//       ORDER BY o.name
//     `);
 
//     // ✅ Combine renters + owners into one list
//     const allContacts = [
//       ...allRenters.rows.map(r => ({ ...r, role: 'renter' })),
//       ...allOwners.rows.map(o => ({ ...o, role: 'owner' })),
//     ];
//     // Get last messages for each renter (if any)
//     const lastMessages = await dbQuery(`
//       SELECT DISTINCT ON (renter_id)
//         CASE 
//           WHEN sender_id LIKE 'renter_%' THEN CAST(SUBSTRING(sender_id FROM 8) AS INTEGER)
//           WHEN receiver_id LIKE 'renter_%' THEN CAST(SUBSTRING(receiver_id FROM 8) AS INTEGER)
//         END as renter_id,
//         message,
//         created_at
//       FROM messages
//       WHERE sender_id = $1 OR receiver_id = $1
//       ORDER BY renter_id, created_at DESC
//     `, [managerString]);

//     // Get unread counts
//     const unreadCounts = await dbQuery(`
//       SELECT
//         CASE 
//           WHEN sender_id LIKE 'renter_%' THEN CAST(SUBSTRING(sender_id FROM 8) AS INTEGER)
//         END as renter_id,
//         COUNT(*) as unread_count
//       FROM messages
//       WHERE receiver_id = $1 AND is_read = false
//       GROUP BY renter_id
//     `, [managerString]);

//     // Create maps for quick lookup
//     const lastMessageMap = new Map();
//     lastMessages.rows.forEach(msg => {
//       lastMessageMap.set(msg.renter_id, {
//         message: msg.message,
//         time: msg.created_at
//       });
//     });

//     const unreadMap = new Map();
//     unreadCounts.rows.forEach(uc => {
//       unreadMap.set(uc.renter_id, parseInt(uc.unread_count));
//     });

//     // Build conversations array with ALL renters
//     const conversations = allContacts.map(renter => {
//       const lastMsg = lastMessageMap.get(renter.id);
//       const unread = unreadMap.get(renter.id) || 0;
      
//       return {
//         id: renter.id,
//         with_user: {
//           id: renter.id,
//           name: renter.name || 'Unknown',
//           role: 'renter',
//           apartment: renter.apartment_number,
//           building: renter.building_name
//         },
//         last_message: lastMsg?.message || 'No messages yet',
//         last_message_time: lastMsg?.time || new Date(0).toISOString(),
//         unread_count: unread
//       };
//     });

//     // Sort: first those with messages (by most recent), then those without
// // Sort: first those with messages (by most recent), then those without
// conversations.sort((a, b) => {
//   const aHasMsg = a.last_message !== 'No messages yet';
//   const bHasMsg = b.last_message !== 'No messages yet';
  
//   if (aHasMsg && !bHasMsg) return -1;
//   if (!aHasMsg && bHasMsg) return 1;
//   if (aHasMsg && bHasMsg) {
//     return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
//   }
//   return a.with_user.name.localeCompare(b.with_user.name);
// });

//     console.log(`✅ Found ${conversations.length} renters (${conversations.filter(c => c.last_message !== 'No messages yet').length} with messages)`);

//     res.status(200).json({
//       success: true,
//       data: {
//         conversations
//       }
//     });
    
//   } catch (error: any) {
//     console.error('Error fetching conversations:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch conversations',
//       error: error.message
//     });
//   }
// });

// // Send a message
// // In backend/src/routes/manager/messages.routes.ts - Add socket emit

// router.post('/messages', async (req, res) => {
//   try {
//     const userId = (req as any).managerId;
//     const { receiverId, message, role } = req.body;

//     console.log('📨 Sending message:', { userId, receiverId, message, role });

//     if (!receiverId || !message || !role) {
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields'
//       });
//     }

//     const managerResult = await dbQuery(`
//       SELECT m.id, m.name 
//       FROM managers m 
//       WHERE m.user_id = $1
//     `, [userId]);
    
//     if (managerResult.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Manager not found'
//       });
//     }
    
//     const managerId = managerResult.rows[0].id;
//     const managerName = managerResult.rows[0].name;

//     const receiverString = `${role}_${receiverId}`;
//     const senderString = `manager_${managerId}`;

//     // Save to database
//     const result = await dbQuery(`
//       INSERT INTO messages (
//         sender_id,
//         receiver_id,
//         message,
//         created_at,
//         is_read
//       ) VALUES (
//         $1,
//         $2,
//         $3,
//         NOW(),
//         false
//       ) RETURNING *
//     `, [senderString, receiverString, message]);

//     console.log('✅ Message saved to DB:', result.rows[0]);

//     // 👇 IMPORTANT: Emit socket event to receiver
//     const io = req.app.get('io');
//     if (io) {
//       const messageData = {
//         id: result.rows[0].id,
//         message: result.rows[0].message,
//         timestamp: result.rows[0].created_at,
//         sender_id: senderString,
//         receiver_id: receiverString,
//         is_read: false
//       };

//       // Emit to receiver (renter)
//       io.to(receiverString).emit('new_message', messageData);
//       console.log(`🔌 Socket event emitted to ${receiverString}`);
//     }

//     // Return the saved message
//     res.status(200).json({
//       success: true,
//       data: {
//         message: {
//           id: result.rows[0].id,
//           message: result.rows[0].message,
//           timestamp: result.rows[0].created_at,
//           is_own: true,
//           sender_name: managerName || 'Manager',
//           status: 'sent'
//         }
//       }
//     });
    
//   } catch (error: any) {
//     console.error('❌ Error sending message:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to send message',
//       error: error.message
//     });
//   }
// });
// // Get messages with specific user
// router.get('/messages/:userId', async (req, res) => {
//   try {
//     const userId = (req as any).managerId;
//     const { userId: otherUserId } = req.params;
//     const { role } = req.query;

//     if (role !== 'renter' && role !== 'owner') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid role parameter'
//       });
//     }

//     const managerResult = await dbQuery(
//       'SELECT id FROM managers WHERE user_id = $1',
//       [userId]
//     );
    
//     if (managerResult.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Manager not found'
//       });
//     }
    
//     const managerId = managerResult.rows[0].id;
//     const managerString = `manager_${managerId}`;
//     const otherString = `${role}_${otherUserId}`;

//     // Get sender name
//     let senderName = 'Unknown';
//     if (role === 'renter') {
//       const renterResult = await dbQuery('SELECT name FROM renters WHERE id = $1', [otherUserId]);
//       if (renterResult.rows.length > 0) {
//         senderName = renterResult.rows[0].name;
//       }
//     }

//     const messages = await dbQuery(`
//       SELECT 
//         m.id,
//         m.message,
//         m.created_at as timestamp,
//         m.is_read,
//         CASE 
//           WHEN m.sender_id = $1 THEN true
//           ELSE false
//         END as is_own,
//         CASE 
//           WHEN m.sender_id = $1 THEN 'You'
//           ELSE $3
//         END as sender_name
//       FROM messages m
//       WHERE 
//         (m.sender_id = $1 AND m.receiver_id = $2) OR
//         (m.sender_id = $2 AND m.receiver_id = $1)
//       ORDER BY m.created_at ASC
//     `, [managerString, otherString, senderName]);

//     console.log(`✅ Found ${messages.rows.length} messages`);

//     // Mark messages as read
//     await dbQuery(`
//       UPDATE messages 
//       SET is_read = true
//       WHERE 
//         receiver_id = $1 AND
//         sender_id = $2 AND
//         is_read = false
//     `, [managerString, otherString]);

//     const mappedMessages = messages.rows.map(msg => ({
//       id: msg.id,
//       message: msg.message,
//       timestamp: msg.timestamp,
//       is_own: msg.is_own,
//       sender_name: msg.sender_name,
//       status: msg.is_read ? 'read' : (msg.is_own ? 'delivered' : 'sent')
//     }));

//     res.status(200).json({
//       success: true,
//       data: {
//         messages: mappedMessages
//       }
//     });
    
//   } catch (error: any) {
//     console.error('Error fetching messages:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch messages',
//       error: error.message
//     });
//   }
// });

// export default router;

import { Router } from 'express';
import { dbQuery } from './utils';

const router = Router();

// ==================== MESSAGE ENDPOINTS ====================

// Get all conversations for manager - SHOW ALL RENTERS + OWNERS
router.get('/messages', async (req, res) => {
  try {
    const userId = (req as any).managerId;

    const managerResult = await dbQuery(
      'SELECT id FROM managers WHERE user_id = $1',
      [userId]
    );

    if (managerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    const managerId = managerResult.rows[0].id;
    const managerString = `manager_${managerId}`;

    // ✅ Get ALL renters
    const allRenters = await dbQuery(`
      SELECT 
        r.id,
        r.name,
        a.apartment_number,
        b.name as building_name,
        'renter' as role
      FROM renters r
      LEFT JOIN apartments a ON r.id = a.current_renter_id
      LEFT JOIN buildings b ON a.building_id = b.id
      ORDER BY r.name
    `);

    // ✅ Get ALL owners
    const allOwners = await dbQuery(`
      SELECT 
        o.id,
        o.name,
        NULL as apartment_number,
        NULL as building_name,
        'owner' as role
      FROM owners o
      ORDER BY o.name
    `);

    // ✅ Combine renters + owners into one list
    const allContacts = [
      ...allRenters.rows.map(r => ({ ...r, role: 'renter' })),
      ...allOwners.rows.map(o => ({ ...o, role: 'owner' })),
    ];

    // ✅ Get last messages for BOTH renters and owners
    const lastMessages = await dbQuery(`
      SELECT DISTINCT ON (contact_role, contact_id)
        contact_role,
        contact_id,
        message,
        created_at
      FROM (
        SELECT
          CASE
            WHEN sender_id LIKE 'renter_%' THEN 'renter'
            WHEN sender_id LIKE 'owner_%'  THEN 'owner'
          END as contact_role,
          CASE
            WHEN sender_id LIKE 'renter_%' THEN CAST(SUBSTRING(sender_id FROM 8)  AS INTEGER)
            WHEN sender_id LIKE 'owner_%'  THEN CAST(SUBSTRING(sender_id FROM 7)  AS INTEGER)
          END as contact_id,
          message,
          created_at
        FROM messages
        WHERE receiver_id = $1

        UNION ALL

        SELECT
          CASE
            WHEN receiver_id LIKE 'renter_%' THEN 'renter'
            WHEN receiver_id LIKE 'owner_%'  THEN 'owner'
          END as contact_role,
          CASE
            WHEN receiver_id LIKE 'renter_%' THEN CAST(SUBSTRING(receiver_id FROM 8) AS INTEGER)
            WHEN receiver_id LIKE 'owner_%'  THEN CAST(SUBSTRING(receiver_id FROM 7) AS INTEGER)
          END as contact_id,
          message,
          created_at
        FROM messages
        WHERE sender_id = $1
      ) sub
      WHERE contact_role IS NOT NULL AND contact_id IS NOT NULL
      ORDER BY contact_role, contact_id, created_at DESC
    `, [managerString]);

    // ✅ Get unread counts for BOTH renters and owners
    const unreadCounts = await dbQuery(`
      SELECT
        CASE
          WHEN sender_id LIKE 'renter_%' THEN 'renter'
          WHEN sender_id LIKE 'owner_%'  THEN 'owner'
        END as contact_role,
        CASE
          WHEN sender_id LIKE 'renter_%' THEN CAST(SUBSTRING(sender_id FROM 8) AS INTEGER)
          WHEN sender_id LIKE 'owner_%'  THEN CAST(SUBSTRING(sender_id FROM 7) AS INTEGER)
        END as contact_id,
        COUNT(*) as unread_count
      FROM messages
      WHERE receiver_id = $1 AND is_read = false
      GROUP BY contact_role, contact_id
    `, [managerString]);

    // ✅ Maps keyed by "role_id" composite key
    const lastMessageMap = new Map<string, { message: string; time: string }>();
    lastMessages.rows.forEach(msg => {
      const key = `${msg.contact_role}_${msg.contact_id}`;
      lastMessageMap.set(key, { message: msg.message, time: msg.created_at });
    });

    const unreadMap = new Map<string, number>();
    unreadCounts.rows.forEach(uc => {
      const key = `${uc.contact_role}_${uc.contact_id}`;
      unreadMap.set(key, parseInt(uc.unread_count));
    });

    // ✅ Build conversations for ALL contacts (renters + owners)
    const conversations = allContacts.map(contact => {
      const key = `${contact.role}_${contact.id}`;
      const lastMsg = lastMessageMap.get(key);
      const unread = unreadMap.get(key) || 0;

      return {
        id: contact.id,
        with_user: {
          id: contact.id,
          name: contact.name || 'Unknown',
          role: contact.role,
          apartment: contact.apartment_number || null,
          building: contact.building_name || null,
        },
        last_message: lastMsg?.message || 'No messages yet',
        last_message_time: lastMsg?.time || new Date(0).toISOString(),
        unread_count: unread,
      };
    });

    // Sort: messages first (most recent), then no-messages (alphabetical)
    conversations.sort((a, b) => {
      const aHasMsg = a.last_message !== 'No messages yet';
      const bHasMsg = b.last_message !== 'No messages yet';

      if (aHasMsg && !bHasMsg) return -1;
      if (!aHasMsg && bHasMsg) return 1;
      if (aHasMsg && bHasMsg) {
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      }
      return a.with_user.name.localeCompare(b.with_user.name);
    });

    console.log(`✅ Found ${conversations.length} contacts (${allRenters.rows.length} renters, ${allOwners.rows.length} owners)`);

    res.status(200).json({ success: true, data: { conversations } });

  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations', error: error.message });
  }
});

// Send a message (unchanged — already works for any role)
router.post('/messages', async (req, res) => {
  try {
    const userId = (req as any).managerId;
    const { receiverId, message, role } = req.body;

    if (!receiverId || !message || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // ✅ Validate role
    if (role !== 'renter' && role !== 'owner') {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const managerResult = await dbQuery(
      'SELECT m.id, m.name FROM managers m WHERE m.user_id = $1',
      [userId]
    );

    if (managerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    const managerId = managerResult.rows[0].id;
    const managerName = managerResult.rows[0].name;
    const receiverString = `${role}_${receiverId}`;
    const senderString = `manager_${managerId}`;

    const result = await dbQuery(`
      INSERT INTO messages (sender_id, receiver_id, message, created_at, is_read)
      VALUES ($1, $2, $3, NOW(), false)
      RETURNING *
    `, [senderString, receiverString, message]);

    const io = req.app.get('io');
    if (io) {
      io.to(receiverString).emit('new_message', {
        id: result.rows[0].id,
        message: result.rows[0].message,
        timestamp: result.rows[0].created_at,
        sender_id: senderString,
        receiver_id: receiverString,
        is_read: false,
      });
      console.log(`🔌 Socket event emitted to ${receiverString}`);
    }

    res.status(200).json({
      success: true,
      data: {
        message: {
          id: result.rows[0].id,
          message: result.rows[0].message,
          timestamp: result.rows[0].created_at,
          is_own: true,
          sender_name: managerName || 'Manager',
          status: 'sent',
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }
});

// Get messages with a specific user (renter or owner)
router.get('/messages/:userId', async (req, res) => {
  try {
    const userId = (req as any).managerId;
    const { userId: otherUserId } = req.params;
    const { role } = req.query;

    if (role !== 'renter' && role !== 'owner') {
      return res.status(400).json({ success: false, message: 'Invalid role parameter' });
    }

    const managerResult = await dbQuery(
      'SELECT id FROM managers WHERE user_id = $1',
      [userId]
    );

    if (managerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    const managerId = managerResult.rows[0].id;
    const managerString = `manager_${managerId}`;
    const otherString = `${role}_${otherUserId}`;

    // ✅ Fetch name for BOTH renters and owners
    let senderName = 'Unknown';
    if (role === 'renter') {
      const result = await dbQuery('SELECT name FROM renters WHERE id = $1', [otherUserId]);
      if (result.rows.length > 0) senderName = result.rows[0].name;
    } else if (role === 'owner') {
      const result = await dbQuery('SELECT name FROM owners WHERE id = $1', [otherUserId]);
      if (result.rows.length > 0) senderName = result.rows[0].name;
    }

    const messages = await dbQuery(`
      SELECT 
        m.id,
        m.message,
        m.created_at as timestamp,
        m.is_read,
        CASE WHEN m.sender_id = $1 THEN true ELSE false END as is_own,
        CASE WHEN m.sender_id = $1 THEN 'You' ELSE $3 END as sender_name
      FROM messages m
      WHERE 
        (m.sender_id = $1 AND m.receiver_id = $2) OR
        (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at ASC
    `, [managerString, otherString, senderName]);

    // Mark as read
    await dbQuery(`
      UPDATE messages 
      SET is_read = true
      WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
    `, [managerString, otherString]);

    res.status(200).json({
      success: true,
      data: {
        messages: messages.rows.map(msg => ({
          id: msg.id,
          message: msg.message,
          timestamp: msg.timestamp,
          is_own: msg.is_own,
          sender_name: msg.sender_name,
          status: msg.is_read ? 'read' : (msg.is_own ? 'delivered' : 'sent'),
        })),
      },
    });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
});

export default router;
