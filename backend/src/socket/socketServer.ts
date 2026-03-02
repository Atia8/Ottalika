// backend/src/socket/socketServer.ts
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { pool } from '../database/db';

interface ConnectedUser {
  userId: string;
  role: string;
  roomId: string;
  socketId: string;
}

const connectedUsers = new Map<string, ConnectedUser>();

export const initializeSocket = (server: HttpServer) => {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      
      const userResult = await pool.query(
        'SELECT id, role FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      const usersId = decoded.userId.toString();
      const userRole = userResult.rows[0].role;
      
      // Get the actual role-specific ID
      let actualRoomId = '';
      
      if (userRole === 'renter') {
        const renterResult = await pool.query(
          'SELECT id FROM renters WHERE user_id = $1',
          [decoded.userId]
        );
        actualRoomId = `renter_${renterResult.rows[0].id}`;
      } else if (userRole === 'manager') {
        const managerResult = await pool.query(
          'SELECT id FROM managers WHERE user_id = $1',
          [decoded.userId]
        );
        actualRoomId = `manager_${managerResult.rows[0].id}`;
      } else if (userRole === 'owner') {
        const ownerResult = await pool.query(
          'SELECT id FROM owners WHERE user_id = $1',
          [decoded.userId]
        );
        actualRoomId = `owner_${ownerResult.rows[0].id}`;
      }

      socket.data.user = {
        id: usersId,
        role: userRole,
        roomId: actualRoomId
      };

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    
    const usersId = socket.data.user.id;
    const userRole = socket.data.user.role;
    const actualRoomId = socket.data.user.roomId;

    // Store user connection
    connectedUsers.set(socket.id, {
      userId: usersId,
      role: userRole,
      roomId: actualRoomId,
      socketId: socket.id
    });

    // Join the actual room
    socket.join(actualRoomId);
    console.log(`👥 User ${usersId} (${userRole}) joined room ${actualRoomId}`);

    // Broadcast online status
    socket.broadcast.emit('user_status_change', {
      userId: actualRoomId,
      online: true
    });

    // Handle sending message - NO DATABASE SAVE, only real-time
    socket.on('send_message', (data: {
      receiverId: string;
      receiverRole: string;
      message: any;
    }) => {
      const { receiverId, receiverRole, message } = data;
      
      const senderRoom = actualRoomId;
      const receiverRoom = `${receiverRole}_${receiverId}`;

      console.log(`📨 Real-time message from ${senderRoom} to ${receiverRoom}`);

      // Create temp message for real-time delivery
      const tempMessage = {
        id: Date.now(), // Temporary ID - will be replaced by HTTP response
        message: message,
        timestamp: new Date().toISOString(),
        sender_id: senderRoom,
        receiver_id: receiverRoom,
        is_read: false
      };

      // Emit to receiver for real-time update
      socket.to(receiverRoom).emit('new_message', tempMessage);
    });

    // Handle messages read
    socket.on('messages_read', async (data: {
      userId: string;
      role: string;
      conversationWith: { id: string; role: string };
    }) => {
      try {
        const { conversationWith } = data;
        const currentUserRoom = actualRoomId;
        const otherUserRoom = `${conversationWith.role}_${conversationWith.id}`;

        console.log(`👁️ Marking messages as read: ${otherUserRoom} → ${currentUserRoom}`);

        // Update database
        const result = await pool.query(
          `UPDATE messages 
           SET is_read = true
           WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
           RETURNING id`,
          [currentUserRoom, otherUserRoom]
        );

        if (result.rows.length > 0) {
          // Send read receipt
          socket.to(otherUserRoom).emit('messages_read_receipt', {
            conversationId: currentUserRoom,
            messageIds: result.rows.map(r => r.id),
            readAt: new Date().toISOString()
          });

          // Clear unread count
          socket.emit('unread_cleared', {
            conversationId: otherUserRoom
          });
        }

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
      
      connectedUsers.delete(socket.id);
      
      socket.broadcast.emit('user_status_change', {
        userId: actualRoomId,
        online: false
      });
    });
  });

  return io;
};

async function getUnreadCount(userRoom: string): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM messages 
       WHERE receiver_id = $1 AND is_read = false`,
      [userRoom]
    );
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

export const isUserOnline = (userRoom: string): boolean => {
  return Array.from(connectedUsers.values()).some(u => 
    u.roomId === userRoom
  );
};