const { Chat_room, Message, Admin, Opd } = require('../models');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { ValidationError, where, Op } = require('sequelize');
const sequelize = require('../config/database')
const { NotFoundError } = require('../utils/error');

const createChatRoom = async (req, res) => {
    let transaction;
    try {
        const id_opd = req.body.id_opd || req.user?.id_user;
        
        const findAdmin = await db.Admin.findOne({
            attributes: ['id_admin', 'nama']
        });
        
        if (!findAdmin) {
            throw new ValidationError('Data admin tidak ditemukan');
        }
        
        const id_admin = req.body.id_admin || findAdmin.id_admin;
        
        console.log(`Checking for existing chat room between OPD: ${id_opd} and Admin: ${id_admin}`);
        
        const existingRoom = await db.Chat_room.findOne({
            include: [
                {
                    model: db.Message,
                    as: 'messages',
                    where: {
                        id_opd,
                        id_admin
                    },
                    required: true
                }
            ]
        });
        
        if (existingRoom) {
            console.log(`Found existing chat room: ${existingRoom.id_room}`);
            
            const messages = await db.Message.findAll({
                where: { id_room: existingRoom.id_room },
                order: [['createdAt', 'ASC']]
            });
            
            return res.status(200).json({
                success: true,
                status: 200,
                message: 'Room chat sudah ada',
                data: {
                    id_room: existingRoom.id_room,
                    is_active: existingRoom.is_active,
                    createdAt: existingRoom.createdAt,
                    updatedAt: existingRoom.updatedAt,
                    messages
                }
            });
        }
        
        console.log('Creating new chat room');
        transaction = await sequelize.transaction();
        
        const createRoom = await db.Chat_room.create({
            is_active: true
        }, { transaction });
        
        const initialMessage = await db.Message.create({
            id_room: createRoom.id_room,
            content: 'Halo, Selamat Pagi! Jika ada yang diragukan, tanyakan pada room chat ini',
            is_read: true,
            user_type: 'admin',
            id_admin,
            id_opd
        }, { transaction });
        
        await transaction.commit();
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Room chat berhasil ditambahkan',
            data: {
                id_room: createRoom.id_room,
                is_active: createRoom.is_active,
                createdAt: createRoom.createdAt,
                updatedAt: createRoom.updatedAt,
                messages: [initialMessage]
            }
        });
        
    } catch (error) {
        console.error('Error in getOrCreateChatRoom:', error);
        if (transaction) await transaction.rollback();
        
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.message
            });
        } else if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: error.message
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server'
            });
        }   
    }
};

// const getOrCreateChatRoom = async (req, res) => {
//     let transaction;
//     try {
//         const { id_opd, id_admin} = req.body;
        
//         if (!id_opd || !id_admin) {
//             return res.status(400).json({
//                 success: false, 
//                 status: 400, 
//                 message: 'Parameter id_opd dan id_admin diperlukan'
//             });
//         }

//         // Mencari room chat yang sudah ada antara OPD dan admin ini
//         const findRoom = await db.Chat_room.findOne({
//             include: [
//                 {
//                     model: db.Message,
//                     as: 'messages',
//                     where: {
//                         id_opd,
//                         id_admin
//                     },
//                     required: true,
//                     limit: 1
//                 }
//             ]
//         });

//         transaction = await db.sequelize.transaction();

//         let chatRoom;
        
//         if (!findRoom) {
//             // Buat room baru jika tidak ditemukan
//             chatRoom = await db.Chat_room.create({
//                 is_active: true
//             }, { transaction });

//             // Buat pesan awal
//             await db.Message.create({
//                 id_room: chatRoom.id_room,
//                 content: 'Halo, Selamat Pagi!!, Jika ada yang diragukan, tanyakan pada room chat ini',
//                 is_read: true,
//                 user_type: 'admin',
//                 id_admin,
//                 id_opd
//             }, { transaction });
            
//             await transaction.commit();
            
//             // Ambil data room lengkap
//             chatRoom = await db.Chat_room.findOne({
//                 where: { id_room: chatRoom.id_room },
//                 include: [
//                     {
//                         model: db.Message,
//                         as: 'messages',
//                         include: [
//                             {
//                                 model: db.Admin,
//                                 as: 'admin',
//                                 attributes: ['id_admin', 'nama'],
//                                 required: false
//                             },
//                             {
//                                 model: db.Opd,
//                                 as: 'opd',
//                                 attributes: ['id_opd', 'nama_opd'],
//                                 required: false
//                             }
//                         ]
//                     }
//                 ]
//             });
//         } else {
//             chatRoom = findRoom;
            
//             // Ambil data room lengkap
//             chatRoom = await db.Chat_room.findOne({
//                 where: { id_room: findRoom.id_room },
//                 include: [
//                     {
//                         model: db.Message,
//                         as: 'messages',
//                         include: [
//                             {
//                                 model: db.Admin,
//                                 as: 'admin',
//                                 attributes: ['id_admin', 'nama'],
//                                 required: false
//                             },
//                             {
//                                 model: db.Opd,
//                                 as: 'opd',
//                                 attributes: ['id_opd', 'nama_opd'],
//                                 required: false
//                             }
//                         ]
//                     }
//                 ]
//             });
//         }

//         res.status(200).json({
//             success: true, 
//             status: 200, 
//             message: 'Chat room berhasil diambil/dibuat',
//             data: chatRoom
//         });
//     } catch (error) {
//         console.error('Error in getOrCreateChatRoom:', error);
//         if (transaction) await transaction.rollback();
        
//         if (error instanceof ValidationError) {
//             return res.status(400).json({
//                 success: false,
//                 status: 400,
//                 message: error.message
//             });
//         } else if (error instanceof NotFoundError) {
//             return res.status(404).json({
//                 success: false,
//                 status: 404,
//                 message: error.message
//             });
//         } else {
//             return res.status(500).json({
//                 success: false,
//                 status: 500,
//                 message: 'Kesalahan Server'
//             });
//         }
//     }
// };

const getChatHistory = async (req, res) => {
    try {
        const { id_room } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user?.id_user
        const userRole = req.user?.role

        if (userRole === 'opd') {
            const hasAccess = await db.Message.findOne({
                where: { 
                    id_room,
                    id_opd: userId
                }
            });
            
            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    status: 403,
                    message: 'Tidak memiliki akses ke room chat ini'
                });
            }
        }

        const offset = (page - 1) * limit;

        const messages = await db.Message.findAndCountAll({
            where: {
                id_room
            },
            include: [
                {
                    model: db.Admin,
                    as: 'admin',
                    attributes: ['id_admin', 'nama']
                },
                {
                    model: db.Opd,
                    as: 'opd',
                    attributes: ['id_opd', 'nama_opd']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            success: true,
            status: 200,
            data: {
              messages: messages.rows,
              totalMessages: messages.count,
              totalPages: Math.ceil(messages.count / limit),
              currentPage: parseInt(page)
            }
        });
    } catch (error) {
        console.error(error);        
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.message
            });
        } else if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: error.message
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server'
            });
        }
    }
};

const getAllChatRooms = async (req, res) => {
    try {
        const userId = req.user?.id_user; 
        const userRole = req.user?.role;
        let chatRooms = [];
        
        if (userRole === 'admin') {
            chatRooms = await db.Chat_room.findAll({
                where: {
                    is_active: true
                },
                attributes: ['id_room', 'createdAt'],
                order: [['createdAt', 'DESC']]
            });
            
            console.log(`Found ${chatRooms.length} active chat rooms for admin`);
        } else if (userRole === 'opd') {
            chatRooms = await db.Chat_room.findAll({
                where: {
                    is_active: true
                },
                include: [{
                    model: db.Message,
                    as: 'messages',
                    where: { 
                        id_opd: userId 
                    },
                    required: true
                }],
                attributes: ['id_room', 'createdAt'],
                order: [['createdAt', 'DESC']]
            });
            
            console.log(`Found ${chatRooms.length} chat rooms for OPD with ID ${userId}`);
        }

        const formattedRooms = [];
    
        for (const room of chatRooms) {
            try {
                // Ambil pesan terakhir untuk room ini
                const lastMessage = await db.Message.findOne({
                    where: { id_room: room.id_room },
                    order: [['createdAt', 'DESC']],
                    include: [
                        { model: db.Opd, as: 'opd', attributes: ['id_opd', 'nama_opd'] },
                        { model: db.Admin, as: 'admin', attributes: ['id_admin', 'nama'] }
                    ]
                });
                
                if (!lastMessage) {
                    console.log(`No messages found for room ${room.id_room}`);
                    continue;
                }
                
                console.log(`Last message found for room ${room.id_room}:`, {
                    content: lastMessage.content,
                    userType: lastMessage.user_type,
                    opd: lastMessage.opd ? lastMessage.opd.nama_opd : null,
                    admin: lastMessage.admin ? lastMessage.admin.nama : null
                });
                
                // Hitung jumlah pesan yang belum dibaca
                let unreadCount;
                
                if (userRole === 'admin') {
                    unreadCount = await db.Message.count({
                        where: { 
                            id_room: room.id_room,
                            is_read: false,
                            user_type: 'opd' // Pesan dari OPD yang belum dibaca oleh admin
                        }
                    });
                } else {
                    unreadCount = await db.Message.count({
                        where: { 
                            id_room: room.id_room,
                            is_read: false,
                            user_type: 'admin', // Pesan dari admin yang belum dibaca oleh OPD
                            id_opd: userId
                        }
                    });
                }
                
                // Format data room untuk respons
                if (userRole === 'admin') {
                    if (lastMessage.opd) {
                        formattedRooms.push({
                            id_room: room.id_room,
                            opd: {
                                id_opd: lastMessage.opd.id_opd,
                                nama_opd: lastMessage.opd.nama_opd
                            },
                            last_message: {
                                content: lastMessage.content,
                                created_at: lastMessage.createdAt,
                                user_type: lastMessage.user_type
                            },
                            unread_count: unreadCount
                        });
                    } else {
                        // Jika tidak ada data OPD, cari data OPD dari pesan lain dalam room ini
                        const anyMsgWithOpd = await db.Message.findOne({
                            where: { 
                                id_room: room.id_room 
                            },
                            include: [
                                { model: db.Opd, as: 'opd', attributes: ['id_opd', 'nama_opd'] }
                            ],
                            order: [['createdAt', 'DESC']]
                        });
                        
                        if (anyMsgWithOpd && anyMsgWithOpd.opd) {
                            formattedRooms.push({
                                id_room: room.id_room,
                                opd: {
                                    id_opd: anyMsgWithOpd.opd.id_opd,
                                    nama_opd: anyMsgWithOpd.opd.nama_opd
                                },
                                last_message: {
                                    content: lastMessage.content,
                                    created_at: lastMessage.createdAt,
                                    user_type: lastMessage.user_type
                                },
                                unread_count: unreadCount
                            });
                        } else {
                            console.log(`No OPD data found for room ${room.id_room}`);
                        }
                    }
                } else if (userRole === 'opd') {
                    if (lastMessage.admin) {
                        formattedRooms.push({
                            id_room: room.id_room,
                            admin: {
                                id_admin: lastMessage.admin.id_admin,
                                nama: lastMessage.admin.nama
                            },
                            last_message: {
                                content: lastMessage.content,
                                created_at: lastMessage.createdAt,
                                user_type: lastMessage.user_type
                            },
                            unread_count: unreadCount
                        });
                    } else {
                        // Jika tidak ada data Admin, cari data Admin dari pesan lain dalam room ini
                        const anyMsgWithAdmin = await db.Message.findOne({
                            where: { 
                                id_room: room.id_room 
                            },
                            include: [
                                { model: db.Admin, as: 'admin', attributes: ['id_admin', 'nama'] }
                            ],
                            order: [['createdAt', 'DESC']]
                        });
                        
                        if (anyMsgWithAdmin && anyMsgWithAdmin.admin) {
                            formattedRooms.push({
                                id_room: room.id_room,
                                admin: {
                                    id_admin: anyMsgWithAdmin.admin.id_admin,
                                    nama: anyMsgWithAdmin.admin.nama
                                },
                                last_message: {
                                    content: lastMessage.content,
                                    created_at: lastMessage.createdAt,
                                    user_type: lastMessage.user_type
                                },
                                unread_count: unreadCount
                            });
                        } else {
                            console.log(`No Admin data found for room ${room.id_room}`);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing room ${room.id_room}:`, error);
            }
        }
        
        console.log(`Returning ${formattedRooms.length} formatted rooms`);
        
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Chat Room Berhasil ditemukan',
            data: formattedRooms
        });
    } catch (error) {
        console.error('Error in getAllChatRooms:', error);        
        if (error instanceof ValidationError) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: error.message
            });
        } else if (error instanceof NotFoundError) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: error.message
            });
        } else {
            return res.status(500).json({
                success: false,
                status: 500,
                message: 'Kesalahan Server'
            });
        }
    }
};

module.exports = { createChatRoom, getChatHistory, getAllChatRooms };