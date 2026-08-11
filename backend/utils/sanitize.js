// utils/sanitize.js
// Filter privasi teks chat / AI (tidak diubah dari server.js asli).

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

module.exports = { sanitizeText, sanitizeMessages };
