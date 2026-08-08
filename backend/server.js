const express = require('express');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');
// web-push bersifat opsional: kalau paketnya belum di-install (npm install belum
// dijalankan ulang setelah update), server tetap harus jalan normal — hanya fitur
// push notification yang nonaktif, bukan seluruh backend (termasuk Socket.IO chat).
let webpush = null;
try {
    webpush = require('web-push');
} catch (err) {
    console.warn('⚠️  Package "web-push" belum ter-install. Jalankan `npm install` di folder backend agar fitur push notification aktif.');
}
require('dotenv').config();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Upload khusus foto profil siswa: disimpan ke disk (bukan memory) karena
// filenya perlu tetap ada & bisa diakses lewat URL statis setelahnya.
const FOTO_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const uploadFoto = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, FOTO_SISWA_DIR),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
            const nis = req.params.nis.replace(/[^a-zA-Z0-9_-]/g, '');
            cb(null, `${nis}-${Date.now()}${ext}`);
        },
    }),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB, cukup untuk foto profil
    fileFilter: (req, file, cb) => {
        if (!FOTO_ALLOWED_MIME.includes(file.mimetype)) {
            return cb(new Error('Format file harus JPG, PNG, atau WEBP'));
        }
        cb(null, true);
    },
});

// Modul auth yang sudah direfactor ke pola services/controllers/routes.
// Route lain di file ini masih dalam proses migrasi bertahap ke pola yang sama.
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: [
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://localhost:3000',
            'http://localhost:8080',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://157.10.161.170:5000',
            'http://157.10.161.170:8080'
        ],
        credentials: true,
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 8080;

// ===============================
// DATABASE CONNECTION
// ===============================
const pool = require('./database');

// ===============================
// WEB PUSH (VAPID) - notifikasi jadwal konseling
// ===============================
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@stopbullying.example';

if (webpush && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log('✅ Web Push (VAPID) siap digunakan');
} else if (!webpush) {
    // Peringatan sudah dicetak saat require gagal di atas
} else {
    console.warn('⚠️  VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY belum diatur — push notification dinonaktifkan. Jalankan: node scripts/generate-vapid-keys.js');
}

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://157.10.161.170:5000',
        'http://157.10.161.170:8080'
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Folder penyimpanan file upload (foto profil siswa) — disajikan statis
// supaya bisa diakses langsung lewat URL, mis. /uploads/siswa/xxxx.jpg
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const FOTO_SISWA_DIR = path.join(UPLOADS_DIR, 'siswa');
if (!fs.existsSync(FOTO_SISWA_DIR)) {
    fs.mkdirSync(FOTO_SISWA_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Endpoint /api/register dan /api/login ditangani modul auth yang sudah direfactor.
app.use('/api', authRoutes);

// ===============================
// FILTER PRIVASI
// ===============================
function sanitizeText(text) {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/\b(nama saya|saya bernama|aku bernama)\s+[a-zA-Z\s]+/gi, '[IDENTITAS DIHAPUS]')
        .replace(/\b\d{8,}\b/g, '[NOMOR DIHAPUS]')
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL DIHAPUS]')
        .replace(/\b(alamat saya|tinggal di)\s+.+/gi, '[ALAMAT DIHAPUS]');
}

function sanitizeMessages(messages) {
    if (!Array.isArray(messages)) return messages;
    return messages.map(msg => ({
        ...msg,
        content: sanitizeText(msg.content)
    }));
}

// ===============================
// CHAT HISTORY STORAGE (MySQL — chat_messages)
// ===============================
const CHAT_HISTORY_FILE = path.join(__dirname, 'chat_history.json');

async function ensureChatMessagesTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(150) NOT NULL,
                sender_id VARCHAR(50) NOT NULL,
                sender_name VARCHAR(100),
                sender_type ENUM('siswa','guru') NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (session_id)
            )
        `);
        console.log('✅ Tabel chat_messages siap');
    } catch (err) {
        console.error('❌ Error membuat tabel chat_messages:', err.message);
    }
}

// Migrasi sekali jalan: kalau chat_history.json (versi lama) masih ada dan
// tabel chat_messages masih kosong, pindahkan isinya ke database supaya
// riwayat chat lama tidak hilang. File lama di-rename jadi .migrated setelahnya.
async function migrateChatHistoryJsonIfNeeded() {
    try {
        if (!fs.existsSync(CHAT_HISTORY_FILE)) return;

        const [[{ cnt }]] = await pool.query('SELECT COUNT(*) AS cnt FROM chat_messages');
        if (cnt > 0) return; // sudah ada data di DB, jangan timpa

        const raw = fs.readFileSync(CHAT_HISTORY_FILE, 'utf8');
        const historyBySession = JSON.parse(raw);

        let total = 0;
        for (const sessionId of Object.keys(historyBySession)) {
            const messages = historyBySession[sessionId] || [];
            for (const msg of messages) {
                await pool.query(
                    `INSERT INTO chat_messages (session_id, sender_id, sender_name, sender_type, message, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        sessionId,
                        String(msg.senderId ?? 'unknown'),
                        msg.senderName ?? null,
                        (msg.senderType === 'guru' ? 'guru' : 'siswa'),
                        msg.message ?? '',
                        msg.timestamp ? new Date(msg.timestamp) : new Date()
                    ]
                );
                total++;
            }
        }

        fs.renameSync(CHAT_HISTORY_FILE, CHAT_HISTORY_FILE + '.migrated');
        console.log(`✅ Migrasi chat_history.json selesai — ${total} pesan dipindahkan ke database`);
    } catch (err) {
        console.error('❌ Error migrasi chat_history.json ke database:', err.message);
    }
}

async function initChatStorage() {
    await ensureChatMessagesTable();
    await migrateChatHistoryJsonIfNeeded();
}
initChatStorage();

async function getChatHistoryFromDb(sessionId) {
    const [rows] = await pool.query(
        `SELECT cm.id, cm.sender_id, cm.sender_name, cm.sender_type, cm.message, cm.created_at,
                s.foto_profile
         FROM chat_messages cm
         LEFT JOIN siswa s ON cm.sender_type = 'siswa' AND s.nis = cm.sender_id
         WHERE cm.session_id = ?
         ORDER BY cm.id ASC`,
        [sessionId]
    );
    return rows.map(r => ({
        id: r.id,
        senderId: r.sender_id,
        senderName: r.sender_name,
        senderType: r.sender_type,
        senderFoto: r.foto_profile || null,
        message: r.message,
        timestamp: r.created_at
    }));
}

// ===============================
// SOCKET.IO - REAL-TIME CHAT
// ===============================
const activeSessions = new Map();

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
            const history = await getChatHistoryFromDb(sessionId);
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

    // Handle incoming messages
    socket.on('chat-message', async (data) => {
        try {
            const { sessionId, message, senderId, senderName, senderType } = data;
            
            if (!sessionId || !message) {
                console.error('Invalid message data:', data);
                return;
            }
            
            // Sanitize message
            const sanitizedMessage = sanitizeText(message);
            const dbSenderType = senderType === 'guru' ? 'guru' : 'siswa';

            console.log(`📨 Message in ${sessionId} from ${senderName}: ${sanitizedMessage.substring(0, 50)}`);

            const [result] = await pool.query(
                `INSERT INTO chat_messages (session_id, sender_id, sender_name, sender_type, message)
                 VALUES (?, ?, ?, ?, ?)`,
                [sessionId, String(senderId), senderName || null, dbSenderType, sanitizedMessage]
            );

            // Ambil foto profil pengirim (kalau siswa) supaya bisa ditampilkan di bubble chat
            let senderFoto = null;
            if (dbSenderType === 'siswa') {
                const [siswaRows] = await pool.query('SELECT foto_profile FROM siswa WHERE nis = ?', [String(senderId)]);
                if (siswaRows.length > 0) senderFoto = siswaRows[0].foto_profile;
            }

            const messageData = {
                id: result.insertId,
                senderId,
                senderName,
                senderType: dbSenderType,
                senderFoto,
                message: sanitizedMessage,
                timestamp: new Date().toISOString()
            };
            
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

// ===============================
// CHAT ENDPOINT (GROQ API) - HANYA KONSELING SEKOLAH
// ===============================
// Migrasi ringan: tabel informasi_bk — knowledge base FAQ yang dikelola Guru BK
// (beasiswa, pendaftaran PT, karir, info sekolah, dll) dan dipakai chatbot AI
async function ensureInformasiBkTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS informasi_bk (
                id INT AUTO_INCREMENT PRIMARY KEY,
                judul VARCHAR(150) NOT NULL,
                kategori VARCHAR(50) NOT NULL,
                isi TEXT NOT NULL,
                guru_bk VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabel informasi_bk siap');
    } catch (err) {
        console.error('❌ Error membuat tabel informasi_bk:', err.message);
    }
}
ensureInformasiBkTable();

const KATEGORI_INFORMASI_LIST = ['Beasiswa', 'Pendaftaran Perguruan Tinggi', 'Bimbingan Karir', 'Informasi Sekolah', 'Informasi BK', 'Umum'];

// GET semua informasi (opsional filter ?kategori=)
app.get('/api/informasi', async (req, res) => {
    try {
        const { kategori } = req.query;
        let sql = 'SELECT * FROM informasi_bk';
        const params = [];
        if (kategori) {
            sql += ' WHERE kategori = ?';
            params.push(kategori);
        }
        sql += ' ORDER BY updated_at DESC';
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Error GET /api/informasi:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// POST tambah informasi baru
app.post('/api/informasi', async (req, res) => {
    try {
        const { judul, kategori, isi, guru_bk } = req.body;
        if (!judul || !kategori || !isi || !guru_bk) {
            return res.status(400).json({ error: 'Judul, kategori, isi, dan guru_bk wajib diisi' });
        }
        if (!KATEGORI_INFORMASI_LIST.includes(kategori)) {
            return res.status(400).json({ error: 'Kategori tidak valid' });
        }
        const [result] = await pool.query(
            'INSERT INTO informasi_bk (judul, kategori, isi, guru_bk) VALUES (?, ?, ?, ?)',
            [judul.trim(), kategori, isi.trim(), guru_bk]
        );
        res.json({ success: true, message: 'Informasi berhasil ditambahkan', id: result.insertId });
    } catch (error) {
        console.error('Error POST /api/informasi:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// PUT update informasi
app.put('/api/informasi/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { judul, kategori, isi } = req.body;
        if (!judul || !kategori || !isi) {
            return res.status(400).json({ error: 'Judul, kategori, dan isi wajib diisi' });
        }
        if (!KATEGORI_INFORMASI_LIST.includes(kategori)) {
            return res.status(400).json({ error: 'Kategori tidak valid' });
        }
        const [result] = await pool.query(
            'UPDATE informasi_bk SET judul = ?, kategori = ?, isi = ? WHERE id = ?',
            [judul.trim(), kategori, isi.trim(), id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Informasi tidak ditemukan' });
        }
        res.json({ success: true, message: 'Informasi berhasil diperbarui' });
    } catch (error) {
        console.error('Error PUT /api/informasi/:id:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// DELETE hapus informasi
app.delete('/api/informasi/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM informasi_bk WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Informasi tidak ditemukan' });
        }
        res.json({ success: true, message: 'Informasi berhasil dihapus' });
    } catch (error) {
        console.error('Error DELETE /api/informasi/:id:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: { message: 'Format pesan tidak valid' } });
        }
        
        console.log('📨 Chat request received');
        
        // Ambil pesan terakhir user
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        if (lastUserMessage) {
            console.log(`📝 Pesan user: ${lastUserMessage.content.substring(0, 100)}`);
        }
        
        // Ambil knowledge base FAQ yang dikelola Guru BK (beasiswa, PT, karir, dll)
        let referensiText = '(Belum ada informasi tambahan dari Guru BK)';
        try {
            const [infoRows] = await pool.query('SELECT judul, kategori, isi FROM informasi_bk ORDER BY updated_at DESC');
            if (infoRows.length > 0) {
                referensiText = infoRows
                    .map(r => `### ${r.judul} (${r.kategori})\n${r.isi}`)
                    .join('\n\n');
            }
        } catch (e) {
            console.warn('Gagal ambil informasi_bk untuk konteks chatbot:', e.message);
        }

        // =============================================================
        // SYSTEM PROMPT - INI SATU-SATUNYA YANG MENGONTROL AI
        // Llama/GROQ akan memahami instruksi ini secara alami
        // TANPA PERLU DATA DUMMY ATAU KEYWORD BUATAN
        // =============================================================
        const counselingSystemPrompt = {
            role: 'system',
            content: `Anda adalah konselor BK profesional untuk siswa SMP/SMA.

**BATASAN KETAT - HANYA 6 KATEGORI KONSELING SEKOLAH INI:**
1. AKADEMIK - Kesulitan belajar, ujian, nilai, tugas, PR, motivasi belajar, konsentrasi, cara belajar efektif
2. SOSIAL - Pertemanan, pergaulan, konflik dengan teman, rasa dikucilkan, cara berbaur
3. PRIBADI - Stres, cemas, kepercayaan diri rendah, emosi, perasaan, overthinking, kegelisahan
4. KARIR - Cita-cita, pilihan jurusan SMA/SMK, rencana kuliah/kerja, bakat dan minat
5. BULLYING - Perundungan, dihina, dijauhi, intimidasi, cyberbullying, cara melaporkan
6. KELUARGA - Masalah dengan orang tua/saudara, kondisi rumah, broken home, komunikasi keluarga

**ATURAN YANG HARUS DIPATUHI:**
- Jika pertanyaan di LUAR 6 kategori di atas DAN di luar topik FAQ referensi di bawah, jawab dengan tegas:
  "Maaf, saya adalah asisten konseling BK. Saya hanya bisa membantu terkait Akademik, Sosial, Pribadi, Karir, Bullying, Keluarga, atau info seputar sekolah/beasiswa/pendaftaran PT. Ada masalah yang ingin kamu ceritakan?"
- JANGAN pernah menjawab pertanyaan tentang: Matematika, Fisika, Kimia, Biologi, Sejarah, Geografi, Coding, Programming, Game, Film, Musik, Olahraga, atau pengetahuan umum lainnya
- Gunakan bahasa yang hangat, lembut, empatik, dan mendukung seperti konselor profesional
- Panggil siswa dengan "kamu" atau "adik" (jika terkesan lebih muda)
- Jangan memberikan diagnosis medis (depresi, gangguan kecemasan, dll) - cukup beri dukungan psikologis sederhana
- Jika siswa menunjukkan tanda-tanda bahaya (ingin menyakiti diri), segera sarankan untuk menemui guru BK atau orang dewasa terpercaya
- Panjang jawaban: 2-4 kalimat yang padat dan membantu
- Beri solusi praktis yang bisa dilakukan siswa

**FAQ / INFORMASI SEKOLAH-KARIR (dikelola Guru BK):**
Selain 6 kategori konseling di atas, Anda BOLEH menjawab pertanyaan seputar beasiswa, pendaftaran perguruan tinggi, jalur masuk (SNBP/SNBT/mandiri), bimbingan karir, dan info sekolah — TAPI HANYA berdasarkan referensi di bawah ini. JANGAN mengarang detail (tanggal, syarat, kuota, link) yang tidak ada di referensi. Jika pertanyaan relevan tapi infonya tidak ada di referensi, jawab jujur: "Maaf, saya belum punya info spesifik soal itu. Coba tanya langsung ke Guru BK ya."

--- REFERENSI ---
${referensiText}
--- AKHIR REFERENSI ---

Ingat: Anda BUKAN guru mata pelajaran. Anda adalah KONSELOR BK. Fokus pada membantu siswa mengatasi masalah pribadi dan sosial mereka, plus info sekolah/karir dari referensi di atas.`
        };
        
        // Filter privasi pada pesan
        const safeMessages = sanitizeMessages(messages);
        
        // Gabungkan system prompt dengan history chat
        const finalMessages = [counselingSystemPrompt, ...safeMessages];
        
        // Panggil GROQ API
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
                messages: finalMessages,
                max_tokens: 1024,
                temperature: 0.7
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                timeout: 30000
            }
        );
        
        const reply = response.data.choices[0]?.message?.content || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
        
        console.log(`🤖 Respon AI: ${reply.substring(0, 100)}...`);
        
        res.json({ 
            reply,
            success: true 
        });
        
    } catch (error) {
        console.error('GROQ API Error:', error.response?.data || error.message);
        
        // Kirim error yang ramah untuk user
        let errorMessage = 'Maaf, terjadi kesalahan pada server. Silakan coba lagi nanti.';
        
        if (error.response?.status === 401) {
            errorMessage = 'Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.';
        } else if (error.response?.status === 429) {
            errorMessage = 'Maaf, terlalu banyak permintaan. Silakan tunggu sebentar.';
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Maaf, koneksi timeout. Silakan coba lagi.';
        }
        
        res.status(error.response?.status || 500).json({
            error: {
                message: errorMessage,
                status: error.response?.status || 500
            }
        });
    }
});

// ===============================
// TEST ENDPOINT
// ===============================
app.get('/api/test', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server berjalan dengan baik',
        timestamp: new Date().toISOString(),
        socketConnected: true,
        aiModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
    });
});

// ===============================
// HEALTH CHECK
// ===============================
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        activeSessions: activeSessions.size
    });
});

// ===============================
// ENDPOINT SISWA
// ===============================

// Registrasi siswa
// Registrasi & login siswa sekarang ditangani oleh authRoutes -> authController
// -> authService (lihat routes/authRoutes.js). Dipasang di app.use('/api', authRoutes) di bawah.


// ===============================
// ENDPOINT PROFILE SISWA
// ===============================

// Get profile lengkap siswa
app.get('/api/profile/:nis', async (req, res) => {
    try {
        const { nis } = req.params;
        
        const [rows] = await pool.query(
            `SELECT id, nis, nama, kelas, jenis_kelamin, 
                    DATE_FORMAT(tanggal_lahir, '%Y-%m-%d') as tanggal_lahir,
                    alamat, no_telepon, foto_profile, created_at
             FROM siswa 
             WHERE nis = ?`,
            [nis]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }
        
        res.json(rows[0]);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// Update profile siswa
app.put('/api/profile/:nis', async (req, res) => {
    try {
        const { nis } = req.params;
        const { jenis_kelamin, tanggal_lahir, alamat, no_telepon, kelas } = req.body;
        
        const updates = [];
        const values = [];
        
        if (jenis_kelamin !== undefined) {
            updates.push('jenis_kelamin = ?');
            values.push(jenis_kelamin);
        }
        if (tanggal_lahir !== undefined) {
            updates.push('tanggal_lahir = ?');
            values.push(tanggal_lahir);
        }
        if (alamat !== undefined) {
            updates.push('alamat = ?');
            values.push(alamat);
        }
        if (no_telepon !== undefined) {
            updates.push('no_telepon = ?');
            values.push(no_telepon);
        }
        if (kelas !== undefined) {
            const validKelas = [
                'X - 1','X - 2','X - 3','X - 4','X - 5','X - 6','X - 7','X - 8','X - 9','X - 10',
                'XI - 1','XI - 2','XI - 3','XI - 4','XI - 5','XI - 6','XI - 7','XI - 8','XI - 9','XI - 10',
                'XII - 1','XII - 2','XII - 3','XII - 4','XII - 5','XII - 6','XII - 7','XII - 8','XII - 9','XII - 10'
            ];
            if (!validKelas.includes(kelas)) {
                return res.status(400).json({ error: 'Kelas tidak valid' });
            }
            updates.push('kelas = ?');
            values.push(kelas);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Tidak ada data yang diupdate' });
        }
        
        values.push(nis);
        
        const [result] = await pool.query(
            `UPDATE siswa SET ${updates.join(', ')} WHERE nis = ?`,
            values
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }
        
        res.json({ 
            success: true, 
            message: 'Profile berhasil diupdate' 
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// Update foto profile (upload file asli, bukan cuma path)
app.put('/api/profile/:nis/foto', (req, res) => {
    // Dipanggil manual (bukan didaftarkan sebagai middleware route) supaya error
    // dari multer (tipe file salah, ukuran kelebihan, boundary rusak, dll) bisa
    // ditangani langsung di sini dengan pasti — tidak bergantung pada urutan
    // error-middleware Express yang gampang salah pasang.
    uploadFoto.single('foto')(req, res, async (uploadErr) => {
        if (uploadErr) {
            console.error('Error upload foto:', uploadErr.message);
            return res.status(400).json({ error: uploadErr.message || 'Gagal mengunggah foto' });
        }

        try {
            const { nis } = req.params;
            if (!req.file) {
                return res.status(400).json({ error: 'File foto wajib diunggah' });
            }

            const [existingRows] = await pool.query('SELECT foto_profile FROM siswa WHERE nis = ?', [nis]);
            if (existingRows.length === 0) {
                // Siswa tidak ditemukan — hapus file yang terlanjur ke-upload supaya tidak jadi sampah
                fs.unlink(req.file.path, () => {});
                return res.status(404).json({ error: 'Siswa tidak ditemukan' });
            }

            const fotoPath = `/uploads/siswa/${req.file.filename}`;
            await pool.query('UPDATE siswa SET foto_profile = ? WHERE nis = ?', [fotoPath, nis]);

            // Hapus file foto lama (kalau ada) supaya folder uploads tidak menumpuk sampah
            const oldFoto = existingRows[0].foto_profile;
            if (oldFoto && oldFoto.startsWith('/uploads/siswa/')) {
                const oldFilePath = path.join(UPLOADS_DIR, oldFoto.replace('/uploads/', ''));
                fs.unlink(oldFilePath, () => {}); // abaikan error kalau file lama sudah tidak ada
            }

            res.json({
                success: true,
                message: 'Foto profile berhasil diupdate',
                foto_profile: fotoPath,
            });
        } catch (error) {
            console.error('Error PUT /api/profile/:nis/foto:', error);
            res.status(500).json({ error: 'Terjadi kesalahan server' });
        }
    });
});

// Hapus foto profile (kembali ke avatar inisial default)
app.delete('/api/profile/:nis/foto', async (req, res) => {
    try {
        const { nis } = req.params;
        const [existingRows] = await pool.query('SELECT foto_profile FROM siswa WHERE nis = ?', [nis]);
        if (existingRows.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }

        await pool.query('UPDATE siswa SET foto_profile = NULL WHERE nis = ?', [nis]);

        const oldFoto = existingRows[0].foto_profile;
        if (oldFoto && oldFoto.startsWith('/uploads/siswa/')) {
            const oldFilePath = path.join(UPLOADS_DIR, oldFoto.replace('/uploads/', ''));
            fs.unlink(oldFilePath, () => {});
        }

        res.json({ success: true, message: 'Foto profile berhasil dihapus' });
    } catch (error) {
        console.error('Error DELETE /api/profile/:nis/foto:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});


// ===============================
// ENDPOINT RIWAYAT KELAS SISWA
// (hanya Guru BK yang boleh akses)
// ===============================

// Inisialisasi tabel riwayat_kelas jika belum ada
async function initRiwayatKelasTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS riwayat_kelas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nis VARCHAR(20) NOT NULL,
                tahun_ajaran VARCHAR(9) NOT NULL COMMENT 'Format: 2024/2025',
                kelas VARCHAR(20) NOT NULL,
                status ENUM('aktif','arsip') DEFAULT 'aktif',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_nis_tahun (nis, tahun_ajaran)
            )
        `);
        console.log('✅ Tabel riwayat_kelas siap');
    } catch (err) {
        console.error('❌ Error membuat tabel riwayat_kelas:', err.message);
    }
}
initRiwayatKelasTable();

// GET semua riwayat kelas satu siswa
app.get('/api/riwayat-kelas/:nis', async (req, res) => {
    try {
        const { nis } = req.params;
        const [rows] = await pool.query(
            'SELECT * FROM riwayat_kelas WHERE nis = ? ORDER BY tahun_ajaran DESC',
            [nis]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// GET kelas aktif satu siswa (untuk dipakai saat buat konseling)
app.get('/api/riwayat-kelas/:nis/aktif', async (req, res) => {
    try {
        const { nis } = req.params;
        const [rows] = await pool.query(
            'SELECT kelas, tahun_ajaran FROM riwayat_kelas WHERE nis = ? AND status = "aktif" LIMIT 1',
            [nis]
        );
        if (rows.length === 0) {
            // Fallback ke kolom kelas di tabel siswa
            const [siswa] = await pool.query('SELECT kelas FROM siswa WHERE nis = ?', [nis]);
            return res.json({ kelas: siswa[0]?.kelas || '-', tahun_ajaran: null, source: 'siswa' });
        }
        res.json({ ...rows[0], source: 'riwayat' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// POST tambah/update riwayat kelas (upsert berdasarkan nis + tahun_ajaran)
app.post('/api/riwayat-kelas', async (req, res) => {
    try {
        const { nis, tahun_ajaran, kelas, status } = req.body;

        if (!nis || !tahun_ajaran || !kelas) {
            return res.status(400).json({ error: 'nis, tahun_ajaran, dan kelas wajib diisi' });
        }

        // Validasi format tahun ajaran
        if (!/^\d{4}\/\d{4}$/.test(tahun_ajaran)) {
            return res.status(400).json({ error: 'Format tahun ajaran harus: 2024/2025' });
        }

        const validKelas = [
            'X - 1','X - 2','X - 3','X - 4','X - 5','X - 6','X - 7','X - 8','X - 9','X - 10',
            'XI - 1','XI - 2','XI - 3','XI - 4','XI - 5','XI - 6','XI - 7','XI - 8','XI - 9','XI - 10',
            'XII - 1','XII - 2','XII - 3','XII - 4','XII - 5','XII - 6','XII - 7','XII - 8','XII - 9','XII - 10'
        ];
        if (!validKelas.includes(kelas)) {
            return res.status(400).json({ error: 'Kelas tidak valid' });
        }

        const statusVal = status === 'arsip' ? 'arsip' : 'aktif';

        // Jika status aktif, nonaktifkan kelas aktif lain milik siswa ini
        if (statusVal === 'aktif') {
            await pool.query(
                'UPDATE riwayat_kelas SET status = "arsip" WHERE nis = ? AND status = "aktif"',
                [nis]
            );
            // Sync ke tabel siswa juga
            await pool.query('UPDATE siswa SET kelas = ? WHERE nis = ?', [kelas, nis]);
        }

        // Upsert
        await pool.query(
            `INSERT INTO riwayat_kelas (nis, tahun_ajaran, kelas, status)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE kelas = VALUES(kelas), status = VALUES(status)`,
            [nis, tahun_ajaran, kelas, statusVal]
        );

        res.json({ success: true, message: 'Riwayat kelas berhasil disimpan' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// DELETE hapus satu entri riwayat kelas
app.delete('/api/riwayat-kelas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM riwayat_kelas WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data tidak ditemukan' });
        }
        res.json({ success: true, message: 'Riwayat kelas berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});


// ===============================
// ENDPOINT HISTORY KONSELING SISWA
// ===============================

// Migrasi ringan: tambahkan kolom deskripsi jika belum ada
async function ensureKonselingDeskripsiColumn() {
    try {
        await pool.query(`ALTER TABLE konseling ADD COLUMN deskripsi TEXT NULL AFTER kategori`);
        console.log('✅ Kolom deskripsi ditambahkan ke tabel konseling');
    } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
            console.error('❌ Error menambahkan kolom deskripsi:', err.message);
        }
    }
}
ensureKonselingDeskripsiColumn();

// POST tambah pengajuan konseling baru
// Migrasi ringan: tambahkan kolom kelas_siswa jika belum ada
// (freeze snapshot kelas siswa saat konseling dibuat — lihat konfirmasi() lama di status.html)
async function ensureKonselingKelasSiswaColumn() {
    try {
        await pool.query(`ALTER TABLE konseling ADD COLUMN kelas_siswa VARCHAR(20) NULL AFTER deskripsi`);
        console.log('✅ Kolom kelas_siswa ditambahkan ke tabel konseling');
    } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
            console.error('❌ Error menambahkan kolom kelas_siswa:', err.message);
        }
    }
}
ensureKonselingKelasSiswaColumn();

// Migrasi ringan: tambahkan kolom-kolom laporan terstruktur jika belum ada
// (kesimpulan, rekomendasi, status penanganan, dll — dipakai UI laporan di detail-history.html)
async function ensureKonselingLaporanColumns() {
    const columns = [
        `ADD COLUMN laporan_tanggal DATE NULL AFTER laporan`,
        `ADD COLUMN laporan_waktu TIME NULL AFTER laporan_tanggal`,
        `ADD COLUMN laporan_dibuat_oleh VARCHAR(100) NULL AFTER laporan_waktu`,
        `ADD COLUMN laporan_kesimpulan TEXT NULL AFTER laporan_dibuat_oleh`,
        `ADD COLUMN laporan_rekomendasi TEXT NULL AFTER laporan_kesimpulan`,
        `ADD COLUMN laporan_status_penanganan VARCHAR(50) NULL AFTER laporan_rekomendasi`,
        `ADD COLUMN laporan_catatan_tambahan TEXT NULL AFTER laporan_status_penanganan`,
        `ADD COLUMN laporan_created_at TIMESTAMP NULL AFTER laporan_catatan_tambahan`
    ];
    for (const clause of columns) {
        try {
            await pool.query(`ALTER TABLE konseling ${clause}`);
        } catch (err) {
            if (err.code !== 'ER_DUP_FIELDNAME') {
                console.error('❌ Error migrasi kolom laporan:', clause, err.message);
            }
        }
    }
    console.log('✅ Kolom laporan terstruktur siap di tabel konseling');
}
ensureKonselingLaporanColumns();

// Batas waktu Guru BK boleh mengedit laporan setelah pertama kali disimpan.
// Setelah lewat ini, laporan terkunci — mencegah riwayat lama diubah diam-diam.
const LAPORAN_EDIT_WINDOW_HOURS = 72; // 3 x 24 jam

// Migrasi ringan: tambahkan kolom validasi jadwal jika belum ada
async function ensureKonselingValidasiColumns() {
    const columns = [
        `ADD COLUMN status_validasi VARCHAR(20) DEFAULT 'Belum Divalidasi' AFTER status`,
        `ADD COLUMN tanggal_validasi DATE NULL AFTER status_validasi`,
        `ADD COLUMN jam_validasi TIME NULL AFTER tanggal_validasi`
    ];
    for (const clause of columns) {
        try {
            await pool.query(`ALTER TABLE konseling ${clause}`);
        } catch (err) {
            if (err.code !== 'ER_DUP_FIELDNAME') {
                console.error('❌ Error migrasi kolom validasi:', clause, err.message);
            }
        }
    }
    console.log('✅ Kolom validasi jadwal siap di tabel konseling');
}
ensureKonselingValidasiColumns();

// Migrasi ringan: tabel notifikasi jadwal untuk siswa
// (dipakai saat Guru BK menetapkan/mengubah jadwal konseling)
async function ensureNotifikasiTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notifikasi (
                id INT AUTO_INCREMENT PRIMARY KEY,
                siswa_id INT NOT NULL,
                konseling_id INT NULL,
                tipe VARCHAR(30) NOT NULL DEFAULT 'jadwal',
                judul VARCHAR(150) NOT NULL,
                pesan TEXT NOT NULL,
                tanggal_lama DATE NULL,
                jam_lama TIME NULL,
                tanggal_baru DATE NULL,
                jam_baru TIME NULL,
                is_read TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_notifikasi_siswa (siswa_id, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ Tabel notifikasi siap');
    } catch (err) {
        console.error('❌ Error membuat tabel notifikasi:', err.message);
    }
}
ensureNotifikasiTable();

// Migrasi ringan: tabel langganan push notification (Web Push API)
async function ensurePushSubscriptionsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                siswa_id INT NOT NULL,
                endpoint VARCHAR(500) NOT NULL,
                p256dh VARCHAR(255) NOT NULL,
                auth VARCHAR(255) NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_push_endpoint (endpoint(255)),
                INDEX idx_push_siswa (siswa_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        console.log('✅ Tabel push_subscriptions siap');
    } catch (err) {
        console.error('❌ Error membuat tabel push_subscriptions:', err.message);
    }
}
ensurePushSubscriptionsTable();

// Kirim notifikasi perubahan/penetapan jadwal konseling ke siswa:
// - simpan riwayat ke tabel notifikasi
// - broadcast real-time via Socket.IO (untuk badge & panel riwayat saat app terbuka)
// - kirim Web Push (untuk notifikasi sistem walau tab/app tertutup)
async function kirimNotifikasiJadwal({ siswaId, konselingId, judul, pesan, tanggalLama, jamLama, tanggalBaru, jamBaru }) {
    try {
        const [result] = await pool.query(
            `INSERT INTO notifikasi
                (siswa_id, konseling_id, tipe, judul, pesan, tanggal_lama, jam_lama, tanggal_baru, jam_baru)
             VALUES (?, ?, 'jadwal', ?, ?, ?, ?, ?, ?)`,
            [siswaId, konselingId || null, judul, pesan, tanggalLama || null, jamLama || null, tanggalBaru || null, jamBaru || null]
        );

        const payload = {
            id: result.insertId,
            konselingId: konselingId || null,
            tipe: 'jadwal',
            judul,
            pesan,
            tanggalLama: tanggalLama || null,
            jamLama: jamLama || null,
            tanggalBaru: tanggalBaru || null,
            jamBaru: jamBaru || null,
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        // Broadcast real-time ke room siswa yang sedang online (lihat io.on('connection'))
        const [siswaRows] = await pool.query('SELECT nis FROM siswa WHERE id = ?', [siswaId]);
        if (siswaRows.length > 0) {
            const room = `siswa-notif-${siswaRows[0].nis}`;
            const socketsDiRoom = await io.in(room).fetchSockets();
            console.log(`ℹ️  [realtime] Emit ke room "${room}" — ${socketsDiRoom.length} koneksi aktif sedang join room ini.`);
            io.to(room).emit('notifikasi-baru', payload);
        } else {
            console.log(`⚠️  [realtime] siswa_id=${siswaId} tidak ditemukan di tabel siswa — notifikasi tidak bisa dikirim real-time.`);
        }

        // Kirim Web Push ke semua device yang berlangganan milik siswa ini
        await kirimPushKeSiswa(siswaId, { title: judul, body: pesan, data: payload });
    } catch (err) {
        console.error('❌ Error kirimNotifikasiJadwal:', err.message);
    }
}

// Kirim web push ke seluruh subscription siswa; hapus subscription yang sudah kadaluarsa/invalid
async function kirimPushKeSiswa(siswaId, { title, body, data }) {
    if (!webpush || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.log(`ℹ️  [push] Dilewati untuk siswa_id=${siswaId} — web-push belum tersedia/dikonfigurasi.`);
        return;
    }

    try {
        const [subs] = await pool.query(
            'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE siswa_id = ?',
            [siswaId]
        );

        console.log(`ℹ️  [push] siswa_id=${siswaId} punya ${subs.length} subscription terdaftar.`);
        if (subs.length === 0) {
            console.log(`⚠️  [push] Tidak ada subscription untuk siswa_id=${siswaId} — siswa ini belum pernah klik "Aktifkan notifikasi push" di browser/device-nya sendiri, jadi push TIDAK akan sampai ke dia (walau notifikasi tetap tersimpan & tampil real-time di dalam app).`);
        }

        const payloadString = JSON.stringify({ title, body, data });

        await Promise.all(subs.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            };
            try {
                await webpush.sendNotification(pushSubscription, payloadString);
                console.log(`✅ [push] Terkirim ke subscription id=${sub.id} (siswa_id=${siswaId}).`);
            } catch (err) {
                // 404/410 = subscription sudah tidak valid (mis. user uninstall/clear data)
                if (err.statusCode === 404 || err.statusCode === 410) {
                    console.log(`⚠️  [push] Subscription id=${sub.id} sudah kadaluarsa, dihapus dari database.`);
                    await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
                } else {
                    console.error(`❌ [push] Gagal mengirim ke subscription id=${sub.id}:`, err.message);
                }
            }
        }));
    } catch (err) {
        console.error('❌ Error kirimPushKeSiswa:', err.message);
    }
}

// GET kunci publik VAPID (dipakai frontend untuk pushManager.subscribe)
app.get('/api/push/vapid-public-key', (req, res) => {
    if (!VAPID_PUBLIC_KEY) {
        return res.status(503).json({ error: 'Push notification belum dikonfigurasi di server' });
    }
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST simpan subscription push notification milik siswa
app.post('/api/push/subscribe', async (req, res) => {
    try {
        if (!webpush) {
            return res.status(503).json({ error: 'Push notification belum tersedia di server (jalankan npm install)' });
        }
        const { nis, subscription } = req.body;
        if (!nis || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({ error: 'Data subscription tidak lengkap' });
        }

        const [siswaRows] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [nis]);
        if (siswaRows.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }
        const siswaId = siswaRows[0].id;

        await pool.query(
            `INSERT INTO push_subscriptions (siswa_id, endpoint, p256dh, auth)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE siswa_id = VALUES(siswa_id), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
            [siswaId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
        );

        res.json({ success: true, message: 'Berlangganan push notification berhasil' });
    } catch (error) {
        console.error('Error POST /api/push/subscribe:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// POST hapus subscription (mis. saat siswa menonaktifkan notifikasi)
app.post('/api/push/unsubscribe', async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint wajib diisi' });
        }
        await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
        res.json({ success: true, message: 'Berhenti berlangganan push notification' });
    } catch (error) {
        console.error('Error POST /api/push/unsubscribe:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// GET riwayat notifikasi milik siswa (berdasarkan NIS, konsisten dengan endpoint lain)
app.get('/api/notifikasi/:nis', async (req, res) => {
    try {
        const { nis } = req.params;
        const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);

        const [siswaRows] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [nis]);
        if (siswaRows.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }
        const siswaId = siswaRows[0].id;

        const [rows] = await pool.query(
            `SELECT
                id, konseling_id AS konselingId, tipe, judul, pesan,
                DATE_FORMAT(tanggal_lama, '%Y-%m-%d') AS tanggalLama,
                TIME_FORMAT(jam_lama, '%H:%i') AS jamLama,
                DATE_FORMAT(tanggal_baru, '%Y-%m-%d') AS tanggalBaru,
                TIME_FORMAT(jam_baru, '%H:%i') AS jamBaru,
                is_read AS isRead,
                created_at AS createdAt
             FROM notifikasi
             WHERE siswa_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [siswaId, limit]
        );

        const [[{ unreadCount }]] = await pool.query(
            'SELECT COUNT(*) AS unreadCount FROM notifikasi WHERE siswa_id = ? AND is_read = 0',
            [siswaId]
        );

        res.json({
            notifikasi: rows.map((r) => ({ ...r, isRead: !!r.isRead })),
            unreadCount,
        });
    } catch (error) {
        console.error('Error GET /api/notifikasi/:nis:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// PUT tandai satu notifikasi sudah dibaca
app.put('/api/notifikasi/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('UPDATE notifikasi SET is_read = 1 WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notifikasi tidak ditemukan' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error PUT /api/notifikasi/:id/read:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// PUT tandai semua notifikasi milik siswa sebagai sudah dibaca
app.put('/api/notifikasi/:nis/read-all', async (req, res) => {
    try {
        const { nis } = req.params;
        const [siswaRows] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [nis]);
        if (siswaRows.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }
        await pool.query('UPDATE notifikasi SET is_read = 1 WHERE siswa_id = ? AND is_read = 0', [siswaRows[0].id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error PUT /api/notifikasi/:nis/read-all:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

app.post('/api/konseling', async (req, res) => {
    try {
        const { nis, guru_bk, tanggal, jam, jenis, kategori, deskripsi } = req.body;

        if (!nis || !guru_bk || !tanggal || !jam || !jenis || !kategori || !deskripsi) {
            return res.status(400).json({ error: 'Semua field harus diisi' });
        }
        if (deskripsi.trim().length < 20) {
            return res.status(400).json({ error: 'Deskripsi minimal 20 karakter' });
        }
        if (!['Luring', 'Daring'].includes(jenis)) {
            return res.status(400).json({ error: 'Jenis konseling tidak valid' });
        }

        const [siswaRows] = await pool.query('SELECT id, kelas FROM siswa WHERE nis = ?', [nis]);
        if (siswaRows.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }
        const siswaId = siswaRows[0].id;

        // Freeze snapshot kelas aktif siswa di sisi server, supaya kalau nanti
        // siswa naik kelas, laporan konseling lama tetap menampilkan kelas saat itu dibuat.
        let kelasSnapshot = siswaRows[0].kelas || '-';
        try {
            const [kelasAktifRows] = await pool.query(
                'SELECT kelas FROM riwayat_kelas WHERE nis = ? AND status = "aktif" LIMIT 1',
                [nis]
            );
            if (kelasAktifRows.length > 0) {
                kelasSnapshot = kelasAktifRows[0].kelas;
            }
        } catch (e) {
            console.warn('Gagal ambil kelas aktif dari riwayat_kelas, pakai siswa.kelas:', e.message);
        }

        const [result] = await pool.query(
            `INSERT INTO konseling (siswa_id, guru_bk, tanggal, jam, jenis, kategori, deskripsi, kelas_siswa, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Proses')`,
            [siswaId, guru_bk, tanggal, jam, jenis, kategori, deskripsi.trim(), kelasSnapshot]
        );

        res.json({
            success: true,
            message: 'Pengajuan konseling berhasil disimpan',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error POST /api/konseling:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// GET semua konseling untuk satu Guru BK (dashboard guru-bk.html)
// GET semua konseling dari semua Guru BK (dashboard-kepsek.html)
app.get('/api/konseling-all', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                k.id,
                k.guru_bk AS guru,
                DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal,
                TIME_FORMAT(k.jam, '%H:%i') AS jam,
                k.jenis,
                k.kategori,
                k.deskripsi,
                k.kelas_siswa,
                k.status,
                k.status_validasi,
                DATE_FORMAT(k.tanggal_validasi, '%Y-%m-%d') AS tanggal_validasi,
                TIME_FORMAT(k.jam_validasi, '%H:%i') AS jam_validasi,
                k.laporan_kesimpulan,
                k.laporan_rekomendasi,
                k.laporan_status_penanganan,
                k.laporan_catatan_tambahan,
                k.laporan_dibuat_oleh,
                DATE_FORMAT(k.laporan_tanggal, '%Y-%m-%d') AS laporan_tanggal,
                TIME_FORMAT(k.laporan_waktu, '%H:%i') AS laporan_waktu,
                k.laporan_created_at,
                k.created_at,
                s.nis,
                s.nama AS nama_siswa,
                s.jenis_kelamin,
                DATE_FORMAT(s.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir,
                s.alamat
             FROM konseling k
             JOIN siswa s ON s.id = k.siswa_id
             ORDER BY k.tanggal DESC, k.jam DESC, k.id DESC`
        );
        res.json(rows);
    } catch (error) {
        console.error('Error GET /api/konseling-all:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

app.get('/api/konseling-bk', async (req, res) => {
    try {
        const { guru } = req.query;
        if (!guru) {
            return res.status(400).json({ error: 'Parameter guru wajib diisi' });
        }
        const [rows] = await pool.query(
            `SELECT
                k.id,
                k.guru_bk AS guru,
                DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal,
                TIME_FORMAT(k.jam, '%H:%i') AS jam,
                k.jenis,
                k.kategori,
                k.deskripsi,
                k.kelas_siswa,
                k.status,
                k.status_validasi,
                DATE_FORMAT(k.tanggal_validasi, '%Y-%m-%d') AS tanggal_validasi,
                TIME_FORMAT(k.jam_validasi, '%H:%i') AS jam_validasi,
                k.laporan_kesimpulan,
                k.laporan_rekomendasi,
                k.laporan_status_penanganan,
                k.laporan_catatan_tambahan,
                k.laporan_dibuat_oleh,
                DATE_FORMAT(k.laporan_tanggal, '%Y-%m-%d') AS laporan_tanggal,
                TIME_FORMAT(k.laporan_waktu, '%H:%i') AS laporan_waktu,
                k.laporan_created_at,
                k.created_at,
                s.nis,
                s.nama AS nama_siswa,
                s.foto_profile AS foto_siswa
             FROM konseling k
             JOIN siswa s ON s.id = k.siswa_id
             WHERE k.guru_bk = ?
             ORDER BY k.tanggal DESC, k.jam DESC, k.id DESC`,
            [guru]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error GET /api/konseling-bk:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// PUT validasi jadwal konseling oleh Guru BK
// Endpoint ini juga dipakai untuk mengubah/menjadwal-ulang jadwal yang sudah tervalidasi,
// sehingga di sinilah notifikasi perubahan jadwal ke siswa dipicu.
app.put('/api/konseling/:id/validasi', async (req, res) => {
    try {
        const { id } = req.params;
        const { tanggal, jam } = req.body;
        if (!tanggal || !jam) {
            return res.status(400).json({ error: 'Tanggal dan jam validasi wajib diisi' });
        }

        const [existingRows] = await pool.query(
            `SELECT k.siswa_id, k.status_validasi,
                    DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggalLama,
                    TIME_FORMAT(k.jam, '%H:%i') AS jamLama
             FROM konseling k WHERE k.id = ?`,
            [id]
        );
        if (existingRows.length === 0) {
            return res.status(404).json({ error: 'Data konseling tidak ditemukan' });
        }
        const existing = existingRows[0];

        const [result] = await pool.query(
            `UPDATE konseling
             SET tanggal = ?, jam = ?, tanggal_validasi = ?, jam_validasi = ?, status_validasi = 'Tervalidasi'
             WHERE id = ?`,
            [tanggal, jam, tanggal, jam, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data konseling tidak ditemukan' });
        }

        // Sudah pernah tervalidasi sebelumnya + tanggal/jam berubah => ini reschedule, bukan validasi pertama
        const sudahTervalidasi = existing.status_validasi === 'Tervalidasi';
        const jadwalBerubah = existing.tanggalLama !== tanggal || existing.jamLama !== jam;

        if (sudahTervalidasi && jadwalBerubah) {
            await kirimNotifikasiJadwal({
                siswaId: existing.siswa_id,
                konselingId: id,
                judul: 'Jadwal Konseling Diubah',
                pesan: `Guru BK mengubah jadwal konseling Anda dari ${existing.tanggalLama} pukul ${existing.jamLama} menjadi ${tanggal} pukul ${jam}.`,
                tanggalLama: existing.tanggalLama,
                jamLama: existing.jamLama,
                tanggalBaru: tanggal,
                jamBaru: jam,
            });
        } else if (!sudahTervalidasi) {
            await kirimNotifikasiJadwal({
                siswaId: existing.siswa_id,
                konselingId: id,
                judul: 'Jadwal Konseling Ditetapkan',
                pesan: `Guru BK telah menetapkan jadwal konseling Anda pada ${tanggal} pukul ${jam}.`,
                tanggalBaru: tanggal,
                jamBaru: jam,
            });
        }

        res.json({ success: true, message: 'Jadwal berhasil divalidasi' });
    } catch (error) {
        console.error('Error PUT /api/konseling/:id/validasi:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// PUT ubah status konseling (mis. Dibatalkan)
app.put('/api/konseling/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['Proses', 'Selesai', 'Dibatalkan'].includes(status)) {
            return res.status(400).json({ error: 'Status tidak valid' });
        }

        const [existingRows] = await pool.query(
            `SELECT siswa_id, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal, TIME_FORMAT(jam, '%H:%i') AS jam
             FROM konseling WHERE id = ?`,
            [id]
        );
        if (existingRows.length === 0) {
            return res.status(404).json({ error: 'Data konseling tidak ditemukan' });
        }

        const [result] = await pool.query('UPDATE konseling SET status = ? WHERE id = ?', [status, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Data konseling tidak ditemukan' });
        }

        if (status === 'Dibatalkan') {
            const existing = existingRows[0];
            await kirimNotifikasiJadwal({
                siswaId: existing.siswa_id,
                konselingId: id,
                judul: 'Jadwal Konseling Dibatalkan',
                pesan: `Guru BK membatalkan jadwal konseling Anda pada ${existing.tanggal} pukul ${existing.jam}.`,
                tanggalLama: existing.tanggal,
                jamLama: existing.jam,
            });
        }

        res.json({ success: true, message: 'Status berhasil diubah' });
    } catch (error) {
        console.error('Error PUT /api/konseling/:id/status:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// PUT simpan laporan hasil konseling (menandai status Selesai)
app.put('/api/konseling/:id/laporan', async (req, res) => {
    try {
        const { id } = req.params;
        const { kesimpulan, rekomendasi, statusPenanganan, catatanTambahan, dibuatOleh } = req.body;
        if (!kesimpulan || !rekomendasi) {
            return res.status(400).json({ error: 'Kesimpulan dan rekomendasi wajib diisi' });
        }

        const [rows] = await pool.query(
            'SELECT laporan_created_at FROM konseling WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Data konseling tidak ditemukan' });
        }

        const sudahPernahDisimpan = !!rows[0].laporan_created_at;

        if (sudahPernahDisimpan) {
            // Ini EDIT laporan yang sudah ada — cek batas waktu edit
            const createdAt = new Date(rows[0].laporan_created_at);
            const jamBerlalu = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
            if (jamBerlalu > LAPORAN_EDIT_WINDOW_HOURS) {
                return res.status(403).json({
                    error: `Laporan ini sudah terkunci. Batas edit adalah ${LAPORAN_EDIT_WINDOW_HOURS} jam setelah pertama kali disimpan, dan itu sudah lewat.`
                });
            }

            // Update isi laporan TANPA mengubah laporan_created_at/tanggal/waktu
            // (jejak waktu penyimpanan asli harus tetap utuh)
            await pool.query(
                `UPDATE konseling
                 SET laporan_kesimpulan = ?,
                     laporan_rekomendasi = ?,
                     laporan_status_penanganan = ?,
                     laporan_catatan_tambahan = ?
                 WHERE id = ?`,
                [kesimpulan.trim(), rekomendasi.trim(), statusPenanganan || 'Selesai - Masalah Teratasi', (catatanTambahan || '').trim() || '-', id]
            );
            return res.json({ success: true, message: 'Laporan berhasil diperbarui', edited: true });
        }

        // Ini PERTAMA KALI laporan disimpan
        await pool.query(
            `UPDATE konseling
             SET laporan_kesimpulan = ?,
                 laporan_rekomendasi = ?,
                 laporan_status_penanganan = ?,
                 laporan_catatan_tambahan = ?,
                 laporan_dibuat_oleh = ?,
                 laporan_tanggal = CURDATE(),
                 laporan_waktu = CURTIME(),
                 laporan_created_at = NOW(),
                 status = 'Selesai'
             WHERE id = ?`,
            [kesimpulan.trim(), rekomendasi.trim(), statusPenanganan || 'Selesai - Masalah Teratasi', (catatanTambahan || '').trim() || '-', dibuatOleh || 'Guru BK', id]
        );
        res.json({ success: true, message: 'Laporan berhasil disimpan', edited: false });
    } catch (error) {
        console.error('Error PUT /api/konseling/:id/laporan:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// POST input konseling manual (walk-in) oleh Guru BK — siswa harus sudah terdaftar
app.post('/api/konseling/walkin', async (req, res) => {
    try {
        const { nis, guru_bk, tanggal, jam, jenis, kategori, deskripsi, catatan } = req.body;
        if (!nis || !guru_bk || !tanggal || !jam || !jenis || !kategori || !deskripsi) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        const [siswaRows] = await pool.query('SELECT id, kelas FROM siswa WHERE nis = ?', [nis]);
        if (siswaRows.length === 0) {
            return res.status(404).json({ error: 'Siswa dengan NIS tersebut belum terdaftar. Daftarkan akun siswa terlebih dahulu.' });
        }
        const siswaId = siswaRows[0].id;

        let kelasSnapshot = siswaRows[0].kelas || '-';
        try {
            const [kelasAktifRows] = await pool.query(
                'SELECT kelas FROM riwayat_kelas WHERE nis = ? AND status = "aktif" LIMIT 1',
                [nis]
            );
            if (kelasAktifRows.length > 0) kelasSnapshot = kelasAktifRows[0].kelas;
        } catch (e) {
            console.warn('Gagal ambil kelas aktif untuk walk-in, pakai siswa.kelas:', e.message);
        }

        const deskripsiFinal = catatan && catatan.trim()
            ? deskripsi.trim() + '\n\nCatatan tambahan: ' + catatan.trim()
            : deskripsi.trim();

        const [result] = await pool.query(
            `INSERT INTO konseling
                (siswa_id, guru_bk, tanggal, jam, jenis, kategori, deskripsi, kelas_siswa, status, status_validasi, tanggal_validasi, jam_validasi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Proses', 'Tervalidasi', ?, ?)`,
            [siswaId, guru_bk, tanggal, jam, jenis, kategori, deskripsiFinal, kelasSnapshot, tanggal, jam]
        );

        res.json({ success: true, message: 'Data konseling walk-in berhasil disimpan', id: result.insertId });
    } catch (error) {
        console.error('Error POST /api/konseling/walkin:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// DELETE batalkan pengajuan konseling (hanya jika masih berstatus Proses)
app.delete('/api/konseling/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT status FROM konseling WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Data konseling tidak ditemukan' });
        }
        if (rows[0].status !== 'Proses') {
            return res.status(400).json({ error: 'Hanya pengajuan berstatus Proses yang bisa dibatalkan' });
        }
        await pool.query('DELETE FROM konseling WHERE id = ?', [id]);
        res.json({ success: true, message: 'Pengajuan konseling berhasil dibatalkan' });
    } catch (error) {
        console.error('Error DELETE /api/konseling/:id:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// GET riwayat konseling milik satu siswa (berdasarkan NIS)
app.get('/api/konseling/:nis', async (req, res) => {
    try {
        const { nis } = req.params;

        const [siswaRows] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [nis]);
        if (siswaRows.length === 0) {
            return res.status(404).json({ error: 'Siswa tidak ditemukan' });
        }
        const siswaId = siswaRows[0].id;

        const [rows] = await pool.query(
            `SELECT
                id,
                guru_bk AS guru,
                DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
                TIME_FORMAT(jam, '%H:%i') AS jam,
                jenis,
                kategori,
                deskripsi,
                kelas_siswa,
                status,
                status_validasi,
                DATE_FORMAT(tanggal_validasi, '%Y-%m-%d') AS tanggal_validasi,
                TIME_FORMAT(jam_validasi, '%H:%i') AS jam_validasi,
                laporan,
                DATE_FORMAT(laporan_tanggal, '%Y-%m-%d') AS laporan_tanggal,
                TIME_FORMAT(laporan_waktu, '%H:%i') AS laporan_waktu,
                laporan_dibuat_oleh,
                laporan_kesimpulan,
                laporan_rekomendasi,
                laporan_status_penanganan,
                laporan_catatan_tambahan,
                laporan_created_at,
                created_at
             FROM konseling
             WHERE siswa_id = ?
             ORDER BY tanggal DESC, jam DESC, id DESC`,
            [siswaId]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error GET /api/konseling/:nis:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// GET detail satu sesi konseling berdasarkan id
app.get('/api/konseling/detail/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT
                k.id,
                k.guru_bk AS guru,
                DATE_FORMAT(k.tanggal, '%Y-%m-%d') AS tanggal,
                TIME_FORMAT(k.jam, '%H:%i') AS jam,
                k.jenis,
                k.kategori,
                k.deskripsi,
                k.kelas_siswa,
                k.status,
                k.status_validasi,
                DATE_FORMAT(k.tanggal_validasi, '%Y-%m-%d') AS tanggal_validasi,
                TIME_FORMAT(k.jam_validasi, '%H:%i') AS jam_validasi,
                k.laporan,
                DATE_FORMAT(k.laporan_tanggal, '%Y-%m-%d') AS laporan_tanggal,
                TIME_FORMAT(k.laporan_waktu, '%H:%i') AS laporan_waktu,
                k.laporan_dibuat_oleh,
                k.laporan_kesimpulan,
                k.laporan_rekomendasi,
                k.laporan_status_penanganan,
                k.laporan_catatan_tambahan,
                k.laporan_created_at,
                k.created_at,
                s.nis,
                s.nama AS nama_siswa
             FROM konseling k
             JOIN siswa s ON s.id = k.siswa_id
             WHERE k.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Data konseling tidak ditemukan' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error GET /api/konseling/detail/:id:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// ===============================
// ENDPOINT DAFTAR SEMUA SISWA
// (untuk tab Daftar Siswa di Guru BK)
// ===============================
const VALID_KELAS_LIST = [
    'X - 1','X - 2','X - 3','X - 4','X - 5','X - 6','X - 7','X - 8','X - 9','X - 10',
    'XI - 1','XI - 2','XI - 3','XI - 4','XI - 5','XI - 6','XI - 7','XI - 8','XI - 9','XI - 10',
    'XII - 1','XII - 2','XII - 3','XII - 4','XII - 5','XII - 6','XII - 7','XII - 8','XII - 9','XII - 10'
];

function normalizeJenisKelamin(val) {
    if (!val) return null;
    const v = String(val).trim().toLowerCase();
    if (['l', 'laki-laki', 'laki laki', 'pria', 'male'].includes(v)) return 'Laki-laki';
    if (['p', 'perempuan', 'wanita', 'female'].includes(v)) return 'Perempuan';
    return null;
}

// POST tambah satu siswa secara manual oleh Guru BK
app.post('/api/siswa', async (req, res) => {
    try {
        const { nis, nama, kelas, jenis_kelamin } = req.body;

        if (!nis || !nama || !kelas) {
            return res.status(400).json({ error: 'NIS, nama, dan kelas wajib diisi' });
        }
        if (!/^[0-9]+$/.test(String(nis))) {
            return res.status(400).json({ error: 'NIS hanya boleh berupa angka' });
        }
        if (!VALID_KELAS_LIST.includes(kelas)) {
            return res.status(400).json({ error: 'Kelas tidak valid' });
        }
        const jk = normalizeJenisKelamin(jenis_kelamin) || null;

        const [existing] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [nis]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'NIS sudah terdaftar' });
        }

        // Password default = NIS
        await pool.query(
            'INSERT INTO siswa (nis, nama, kelas, jenis_kelamin, password) VALUES (?, ?, ?, ?, MD5(?))',
            [nis, nama, kelas, jk, String(nis)]
        );

        res.json({ success: true, message: 'Siswa berhasil ditambahkan. Password default: NIS siswa.' });
    } catch (error) {
        console.error('Error POST /api/siswa:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// POST import siswa dari file Excel (.xlsx/.xls)
// Kolom yang dibaca (tidak case-sensitive): NIS, Nama, Kelas, Jenis Kelamin
// NIS yang sudah terdaftar akan di-UPDATE (nama/kelas/jenis kelamin), bukan ditolak.
// Helper: upsert satu baris siswa (dipakai oleh import file & import hasil mapping absen)
async function upsertSatuSiswa(nis, nama, kelas, jenis_kelamin) {
    const jk = normalizeJenisKelamin(jenis_kelamin);
    const [existing] = await pool.query('SELECT id FROM siswa WHERE nis = ?', [nis]);
    if (existing.length > 0) {
        await pool.query(
            'UPDATE siswa SET nama = ?, kelas = ?, jenis_kelamin = COALESCE(?, jenis_kelamin) WHERE nis = ?',
            [nama, kelas, jk, nis]
        );
        return 'updated';
    }
    await pool.query(
        'INSERT INTO siswa (nis, nama, kelas, jenis_kelamin, password) VALUES (?, ?, ?, ?, MD5(?))',
        [nis, nama, kelas, jk, nis]
    );
    return 'inserted';
}

app.post('/api/siswa/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'File Excel wajib diupload (field "file")' });
    }

    let rows;
    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } catch (e) {
        return res.status(400).json({ error: 'Gagal membaca file Excel. Pastikan formatnya .xlsx atau .xls' });
    }

    if (!rows || rows.length === 0) {
        return res.status(400).json({ error: 'File Excel kosong atau tidak punya baris data' });
    }

    let inserted = 0, updated = 0;
    const skipped = [];

    for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2; // +2: baris 1 = header di Excel
        const raw = rows[i];

        // Cocokkan nama kolom tanpa peduli besar/kecil huruf & spasi
        const keyMap = {};
        Object.keys(raw).forEach(k => { keyMap[k.trim().toLowerCase()] = raw[k]; });

        const nis = String(keyMap['nis'] || '').trim();
        const nama = String(keyMap['nama'] || '').trim();
        const kelas = String(keyMap['kelas'] || '').trim();
        const jk = keyMap['jenis kelamin'] || keyMap['jenis_kelamin'] || keyMap['jk'];

        if (!nis || !/^[0-9]+$/.test(nis)) {
            skipped.push({ row: rowNum, reason: 'NIS kosong atau bukan angka' });
            continue;
        }
        if (!nama) {
            skipped.push({ row: rowNum, reason: 'Nama kosong' });
            continue;
        }
        if (!VALID_KELAS_LIST.includes(kelas)) {
            skipped.push({ row: rowNum, reason: `Kelas "${kelas}" tidak valid` });
            continue;
        }

        try {
            const result = await upsertSatuSiswa(nis, nama, kelas, jk);
            if (result === 'updated') updated++; else inserted++;
        } catch (e) {
            skipped.push({ row: rowNum, reason: 'Gagal menyimpan: ' + e.message });
        }
    }

    res.json({
        success: true,
        message: `Import selesai — ${inserted} siswa baru ditambahkan, ${updated} siswa diperbarui, ${skipped.length} baris dilewati.`,
        inserted, updated, skipped
    });
});

// POST preview file "Daftar Hadir" (absen) — sheet bernama persis X/XI/XII,
// berisi banyak blok per kelas ("KELAS X - 1", lalu tabel No/NIS/Nama/L-P).
// Tidak menulis ke database — cuma parse & kembalikan per-kelas biar Guru BK
// bisa memetakan tiap kelas absen ke kelas yang dipakai sistem (format sama: "X - 1").
app.post('/api/siswa/import-absen/preview', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'File Excel wajib diupload (field "file")' });
    }

    let workbook;
    try {
        workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } catch (e) {
        return res.status(400).json({ error: 'Gagal membaca file Excel. Pastikan formatnya .xlsx atau .xls' });
    }

    const targetSheets = ['X', 'XI', 'XII'].filter(name => workbook.SheetNames.includes(name));
    if (targetSheets.length === 0) {
        return res.status(400).json({ error: 'Sheet "X", "XI", atau "XII" tidak ditemukan di file ini' });
    }

    const sections = [];

    targetSheets.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        let current = null;
        grid.forEach(row => {
            const c0 = row[0];
            const c1 = row[1];
            const c2 = row[2];
            const c3 = row[3];

            if (typeof c0 === 'string' && c0.toUpperCase().includes('KELAS')) {
                current = { sheet: sheetName, label: c0.trim(), siswa: [] };
                sections.push(current);
                return;
            }

            // Baris siswa: No (angka), NIS (terisi), Nama (teks), L/P
            const isNoAngka = typeof c0 === 'number';
            const nisOk = c1 !== '' && c1 !== null && c1 !== undefined;
            const namaOk = typeof c2 === 'string' && c2.trim() !== '';
            const jkOk = c3 === 'L' || c3 === 'P';

            if (current && isNoAngka && nisOk && namaOk && jkOk) {
                current.siswa.push({
                    nis: String(c1).trim(),
                    nama: c2.trim(),
                    jk: c3
                });
            }
        });
    });

    const totalSiswa = sections.reduce((sum, s) => sum + s.siswa.length, 0);

    res.json({
        success: true,
        sections,
        totalSiswa,
        message: `Ditemukan ${sections.length} kelas dengan total ${totalSiswa} siswa di sheet ${targetSheets.join(', ')}.`
    });
});

// POST konfirmasi hasil mapping absen -> kelas sistem, lalu simpan ke database.
// body: { rows: [{ nis, nama, kelas, jenis_kelamin }, ...] }
app.post('/api/siswa/import-rows', async (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'Tidak ada baris siswa untuk diimport' });
    }

    let inserted = 0, updated = 0;
    const skipped = [];

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const nis = String(r.nis || '').trim();
        const nama = String(r.nama || '').trim();
        const kelas = String(r.kelas || '').trim();

        if (!nis || !/^[0-9]+$/.test(nis)) {
            skipped.push({ row: i + 1, reason: `NIS "${nis}" tidak valid (${nama || 'tanpa nama'})` });
            continue;
        }
        if (!nama) {
            skipped.push({ row: i + 1, reason: `Nama kosong (NIS ${nis})` });
            continue;
        }
        if (!VALID_KELAS_LIST.includes(kelas)) {
            skipped.push({ row: i + 1, reason: `Kelas "${kelas}" tidak valid (${nama})` });
            continue;
        }

        try {
            const result = await upsertSatuSiswa(nis, nama, kelas, r.jenis_kelamin);
            if (result === 'updated') updated++; else inserted++;
        } catch (e) {
            skipped.push({ row: i + 1, reason: `Gagal menyimpan ${nama}: ` + e.message });
        }
    }

    res.json({
        success: true,
        message: `Import selesai — ${inserted} siswa baru ditambahkan, ${updated} siswa diperbarui, ${skipped.length} baris dilewati.`,
        inserted, updated, skipped
    });
});

app.get('/api/siswa', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                s.nis,
                s.nama,
                s.kelas,
                s.jenis_kelamin,
                s.foto_profile,
                rk.tahun_ajaran,
                rk.status AS status_kelas
            FROM siswa s
            LEFT JOIN riwayat_kelas rk
                ON rk.nis = s.nis AND rk.status = 'aktif'
            ORDER BY s.nama ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error GET /api/siswa:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// Error handler terpusat: harus didaftarkan paling akhir, setelah semua route.
// Route yang masih pakai try/catch manual (belum dimigrasi) tidak terpengaruh;
// ini menangani error dari route baru yang pakai asyncHandler (mis. authRoutes).
app.use(errorHandler);

// ===============================
// START SERVER
// ===============================
server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO server listening on port ${PORT}`);
    console.log(`🤖 GROQ API Key: ${process.env.GROQ_API_KEY ? '✅ Tersedia' : '❌ Tidak tersedia'}`);
    console.log(`📦 Model: ${process.env.GROQ_MODEL || 'llama-3.1-8b-instant'}`);
    console.log(`========================================`);
    console.log(`🎯 AI Chatbot dibatasi pada 6 kategori konseling:`);
    console.log(`   1. Akademik   2. Sosial   3. Pribadi`);
    console.log(`   4. Karir      5. Bullying  6. Keluarga`);
    console.log(`========================================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    // Pesan chat sudah langsung tersimpan ke database tiap kali dikirim,
    // jadi tidak perlu lagi menyimpan apapun secara manual di sini.
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});