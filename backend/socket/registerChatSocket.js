// socket/registerChatSocket.js
// Handler Socket.IO chat real-time + join room notifikasi siswa.
// Logika disalin dari server.js asli — event names, payload, dan alur tidak diubah.
const chatService = require('../services/chatService');
const { verifyToken } = require('../middleware/auth');

/**
 * Daftarkan semua handler chat pada instance Socket.IO.
 * @param {import('socket.io').Server} io
 * @returns {{ activeSessions: Map }} map sesi aktif (dipakai /health)
 */
function registerChatSocket(io) {
    const activeSessions = new Map();

    // Init tabel + migrasi JSON (sama seperti initChatStorage() di server.js lama)
    chatService.initChatStorage();

    // Wajibkan JWT di handshake (auth.token atau query.token)
    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.query?.token ||
                (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
            if (!token) {
                return next(new Error('Autentikasi Socket.IO diperlukan'));
            }
            socket.user = verifyToken(token);
            next();
        } catch (err) {
            next(new Error('Token Socket.IO tidak valid'));
        }
    });

    io.on('connection', (socket) => {
        console.log('✅ User connected:', socket.id);

        let currentSessionId = null;
        let currentUserId = null;
        let currentUserType = null;

        // Join room notifikasi pribadi siswa (dipakai untuk badge & panel riwayat notifikasi jadwal)
        socket.on('join-siswa-notif', (data) => {
            try {
                const nis = typeof data === 'string' ? data : data?.nis;
                if (!nis) return;
                socket.join(`siswa-notif-${nis}`);
                console.log(`📌 Siswa NIS ${nis} join room notifikasi (socket: ${socket.id})`);
            } catch (error) {
                console.error('Error in join-siswa-notif:', error);
            }
        });

        // Join chat room
        socket.on('join-chat', async (data) => {
            try {
                const { userId, userType, sessionId, userName } = data;

                if (!sessionId) {
                    console.error('No sessionId provided');
                    return;
                }

                if (!socket.user) {
                    socket.emit('error', { message: 'Autentikasi diperlukan' });
                    return;
                }
                if (socket.user.role === 'siswa') {
                    const uid = String(userId);
                    if (uid !== String(socket.user.nis) && uid !== String(socket.user.id)) {
                        socket.emit('error', { message: 'Identitas chat tidak sesuai sesi login' });
                        return;
                    }
                }

                currentSessionId = sessionId;
                currentUserId = userId;
                currentUserType = userType;

                // Join room
                socket.join(sessionId);
                console.log(`📌 ${userName} (${userType}) joined room: ${sessionId}`);

                // Store session info
                if (!activeSessions.has(sessionId)) {
                    activeSessions.set(sessionId, {
                        siswaId: userType === 'siswa' ? userId : null,
                        guruId: userType === 'guru' ? userId : null,
                        siswaName: userType === 'siswa' ? userName : null,
                        guruName: userType === 'guru' ? userName : null,
                        siswaSocket: userType === 'siswa' ? socket.id : null,
                        guruSocket: userType === 'guru' ? socket.id : null
                    });
                } else {
                    const session = activeSessions.get(sessionId);
                    if (userType === 'siswa') {
                        session.siswaId = userId;
                        session.siswaName = userName;
                        session.siswaSocket = socket.id;
                    } else {
                        session.guruId = userId;
                        session.guruName = userName;
                        session.guruSocket = socket.id;
                    }
                    activeSessions.set(sessionId, session);
                }

                // Send history to the user who just joined (dari database)
                const history = await chatService.getChatHistoryFromDb(sessionId);
                if (history.length > 0) {
                    console.log(`📚 Sending ${history.length} messages to ${userName}`);
                    socket.emit('chat-history', history);
                }

                // Notify others in the room
                socket.to(sessionId).emit('user-joined', {
                    userId: userId,
                    userName: userName,
                    userType: userType,
                    message: `${userName} telah bergabung dalam konseling.`
                });

            } catch (error) {
                console.error('Error in join-chat:', error);
            }
        });

        // Handle incoming chat message
        socket.on('chat-message', async (data) => {
            try {
                const { sessionId, message, senderId, senderName, senderType } = data;

                if (!sessionId || !message) {
                    console.error('Invalid message data:', data);
                    return;
                }

                const messageData = await chatService.saveChatMessage({
                    sessionId,
                    message,
                    senderId,
                    senderName,
                    senderType,
                });

                // Broadcast to all users in the room (including sender)
                io.to(sessionId).emit('new-message', messageData);

            } catch (error) {
                console.error('Error in chat-message:', error);
                socket.emit('error', { message: 'Gagal mengirim pesan' });
            }
        });

        // Handle typing indicator
        socket.on('typing', (data) => {
            try {
                const { sessionId, isTyping, userName } = data;
                if (sessionId) {
                    socket.to(sessionId).emit('user-typing', {
                        userId: currentUserId,
                        userName: userName,
                        isTyping: isTyping
                    });
                }
            } catch (error) {
                console.error('Error in typing:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);

            if (currentSessionId && activeSessions.has(currentSessionId)) {
                const session = activeSessions.get(currentSessionId);

                if (session.siswaSocket === socket.id) {
                    session.siswaSocket = null;
                    session.siswaOnline = false;
                } else if (session.guruSocket === socket.id) {
                    session.guruSocket = null;
                    session.guruOnline = false;
                }

                const otherUser = session.siswaSocket || session.guruSocket;
                if (otherUser) {
                    io.to(currentSessionId).emit('user-left', {
                        message: `${currentUserType === 'siswa' ? 'Siswa' : 'Guru'} telah meninggalkan chat`
                    });
                }

                if (!session.siswaSocket && !session.guruSocket) {
                    setTimeout(() => {
                        if (activeSessions.has(currentSessionId) &&
                            !activeSessions.get(currentSessionId).siswaSocket &&
                            !activeSessions.get(currentSessionId).guruSocket) {
                            activeSessions.delete(currentSessionId);
                            console.log(`🗑️ Session ${currentSessionId} removed`);
                        }
                    }, 30000);
                }
            }
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return { activeSessions };
}

module.exports = { registerChatSocket };
