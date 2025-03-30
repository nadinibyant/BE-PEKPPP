// services/socketService.js
const db = require('../models');
const { v4: uuidv4 } = require('uuid');

const setupSocket = async (io) => {
  const onlineUsers = {};
  const defaultAdmin = await db.Admin.findOne();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    socket.on('login', async (userData) => {
      try {
        onlineUsers[socket.id] = userData;
        
        if (userData.userType === 'admin') {
          const chatRooms = await db.Chat_room.findAll({
            where: { is_active: true }
          });
          
          chatRooms.forEach(room => {
            socket.join(room.id_room);
          });
        } else if (userData.userType === 'opd') {
          const chatRooms = await db.Chat_room.findAll({
            where: { is_active: true },
            include: [{
              model: db.Message,
              as: 'messages',
              where: { id_opd: userData.id },
              required: true 
            }]
          });
          
          if (chatRooms && chatRooms.length > 0) {
            chatRooms.forEach(room => {
              socket.join(room.id_room);
            });
          }
        }
        
        io.emit('userStatus', { 
          userId: userData.id || (userData.id_admin || userData.id_opd),
          userType: userData.userType, 
          status: 'online'
        });
      } catch (error) {
        console.error('Error handling login:', error);
        socket.emit('errorMessage', { 
          message: 'Gagal melakukan login', 
          details: error.message 
        });
      }
    });
  
    socket.on('sendMessage', async (messageData) => {
      try {
        const { id_room, content, user_type, id_admin, id_opd, tempId } = messageData;
        
        console.log('Processing message data:', { id_room, content, user_type, id_admin, id_opd });
        
        if (!id_room || !content || !user_type) {
          return socket.emit('errorMessage', { message: 'Data tidak lengkap' });
        }
        
        const room = await db.Chat_room.findOne({ where: { id_room } });
        if (!room) {
          console.error('Room not found:', id_room);
          return socket.emit('errorMessage', { message: 'Chat room not found' });
        }
        
        const messageObj = {
          id_message: uuidv4(),
          id_room,
          content,
          is_read: false,
          user_type
        };
        
        if (user_type === 'admin' && id_admin) {
          messageObj.id_admin = id_admin;
          messageObj.id_opd = id_opd;
        } else if (user_type === 'opd' && id_opd) {
          messageObj.id_opd = id_opd;
          messageObj.id_admin = defaultAdmin.id_admin;
        } else {
          return socket.emit('errorMessage', { message: 'Invalid user type or missing ID' });
        }
        
        console.log('Creating new message...');
        const newMessage = await db.Message.create(messageObj);
        console.log('Message created successfully with ID:', newMessage.id_message);
        
        console.log('Retrieving saved message...');
        const savedMessage = await db.Message.findOne({
          where: { id_message: newMessage.id_message },
          include: [
            { model: db.Admin, as: 'admin', attributes: ['id_admin', 'nama'] },
            { model: db.Opd, as: 'opd', attributes: ['id_opd', 'nama_opd'] }
          ]
        });
        
        if (!savedMessage) {
          console.error('Could not retrieve saved message');
          return socket.emit('errorMessage', { message: 'Failed to retrieve saved message' });
        }
        
        if (tempId) {
          savedMessage.dataValues.tempId = tempId;
        }
        
        console.log('Emitting message to room:', id_room);
        io.to(id_room).emit('receiveMessage', savedMessage);
        
        socket.emit('messageSent', {
          id_message: newMessage.id_message,
          tempId: tempId
        });
      } catch (error) {
        console.error('Detailed error sending message:', error.message);
        console.error('Error stack:', error.stack);
        socket.emit('errorMessage', { 
          message: 'Gagal mengirim pesan', 
          details: error.message 
        });
      }
    });
  
    socket.on('typing', (data) => {
      socket.to(data.id_room).emit('userTyping', {
        userId: data.userId,
        userType: data.userType,
        id_room: data.id_room
      });
    });

    socket.on('markAsRead', async (data) => {
      try {
        await db.Message.update(
          { is_read: true },
          { 
            where: { 
              id_room: data.id_room,
              user_type: data.userType === 'admin' ? 'opd' : 'admin'
            } 
          }
        );

        io.to(data.id_room).emit('messagesRead', {
          id_room: data.id_room,
          userType: data.userType
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('join', (data) => {
        if (data && data.roomId) {
          console.log(`User ${socket.id} explicitly joining room ${data.roomId}`);
          socket.join(data.roomId);
        } else {
          console.error('Invalid join request, missing roomId');
        }
      });

    socket.on('reconnect', () => {
      console.log('Socket reconnected:', socket.id);
      if (onlineUsers[socket.id]) {
        const userData = onlineUsers[socket.id];
        io.emit('userStatus', { 
          userId: userData.id || (userData.id_admin || userData.id_opd), 
          userType: userData.userType,
          status: 'online'
        });
      }
    });

    socket.on('disconnect', () => {
      if (onlineUsers[socket.id]) {
        const userData = onlineUsers[socket.id];
        io.emit('userStatus', { 
          userId: userData.id || (userData.id_admin || userData.id_opd), 
          userType: userData.userType,
          status: 'offline' 
        });
        
        delete onlineUsers[socket.id];
      }
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;