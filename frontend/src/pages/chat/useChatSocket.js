import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../../api/tokenStore';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Hook chat real-time via Socket.IO. Mengelola koneksi, riwayat pesan,
 * status online/offline, dan typing indicator — versi React dari logic
 * yang dulu ada inline di chat-siswa.html / chat-guru.html.
 *
 * `currentUser` = { id, name, type } — type: 'siswa' | 'guru'
 */
export default function useChatSocket({ sessionId, currentUser }) {
  const [events, setEvents] = useState([]); // { type: 'message'|'system', data?, text?, key }
  const [connStatus, setConnStatus] = useState('connecting'); // connecting | connected | disconnected
  const [connMessage, setConnMessage] = useState('Menghubungkan...');
  const [typingText, setTypingText] = useState(null);

  const socketRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const historyLoadedRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  useEffect(() => {
    if (!sessionId || !currentUser?.id) return undefined;

    historyLoadedRef.current = false;
    messageIdsRef.current = new Set();
    setEvents([]);

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        role: currentUserRef.current?.type || currentUser?.type || undefined,
        token: getToken() || undefined,
      },
    });
    socketRef.current = socket;

    function joinChat() {
      socket.emit('join-chat', {
        userId: currentUserRef.current.id,
        userType: currentUserRef.current.type,
        sessionId,
        userName: currentUserRef.current.name,
      });
    }

    socket.once('connect', () => {
      setConnStatus('connected');
      setConnMessage('Terhubung ke server');
      joinChat();
    });

    socket.on('reconnect', () => {
      setConnStatus('connected');
      setConnMessage('Terhubung kembali');
      joinChat();
    });

    socket.on('disconnect', () => {
      setConnStatus('disconnected');
      setConnMessage('Terputus, mencoba menyambung...');
    });

    socket.on('connect_error', (error) => {
      setConnStatus('disconnected');
      setConnMessage(`Error: ${error.message}`);
    });

    socket.on('new-message', (data) => {
      const msgId = data.id != null ? `id_${data.id}` : `${data.senderId}_${data.timestamp}_${data.message.substring(0, 20)}`;
      if (messageIdsRef.current.has(msgId)) return;
      messageIdsRef.current.add(msgId);
      setTypingText(null);
      setEvents((prev) => [...prev, { type: 'message', data, key: msgId }]);
    });

    socket.on('chat-history', (history) => {
      if (historyLoadedRef.current) return;
      historyLoadedRef.current = true;

      if (history && history.length > 0) {
        const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const newEvents = [];
        sorted.forEach((msg) => {
          const msgId = msg.id != null ? `id_${msg.id}` : `${msg.senderId}_${msg.timestamp}_${msg.message.substring(0, 20)}`;
          if (!messageIdsRef.current.has(msgId)) {
            messageIdsRef.current.add(msgId);
            newEvents.push({ type: 'message', data: msg, key: msgId });
          }
        });
        if (newEvents.length > 0) setEvents((prev) => [...prev, ...newEvents]);
      }
    });

    socket.on('user-joined', (data) => {
      setEvents((prev) => [
        ...prev,
        { type: 'system', text: `${data.userName} bergabung dalam konseling`, key: `join_${Date.now()}` },
      ]);
    });

    socket.on('user-left', (data) => {
      setEvents((prev) => [
        ...prev,
        { type: 'system', text: data.message || 'Pengguna telah meninggalkan chat', key: `left_${Date.now()}` },
      ]);
      setConnStatus('disconnected');
      setConnMessage('Pengguna Offline');
    });

    socket.on('user-typing', (data) => {
      setTypingText(data.isTyping ? `${data.userName} sedang mengetik...` : null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [sessionId, currentUser?.id]);

  const sendMessage = useCallback(
    (text) => {
      const socket = socketRef.current;
      if (!socket || connStatus !== 'connected') return false;

      socket.emit('chat-message', {
        sessionId,
        message: text,
        senderId: currentUserRef.current.id,
        senderName: currentUserRef.current.name,
        senderType: currentUserRef.current.type,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('typing', { sessionId, isTyping: false, userName: currentUserRef.current.name });
      return true;
    },
    [sessionId, connStatus]
  );

  const notifyTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || connStatus !== 'connected') return;

    socket.emit('typing', { sessionId, isTyping: true, userName: currentUserRef.current.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { sessionId, isTyping: false, userName: currentUserRef.current.name });
    }, 1000);
  }, [sessionId, connStatus]);

  return { events, connStatus, connMessage, typingText, sendMessage, notifyTyping };
}
