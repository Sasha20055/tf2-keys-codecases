// Sanitized production excerpt.
// In the host application, `io` comes from socket.io-client and `socketUrl`
// is supplied by runtime configuration instead of being hard-coded.
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SEND_COOLDOWN = 5000;

export default function useChat({ room = 'global', socketUrl, path = '/ws' } = {}) {
    const socketRef = useRef(null);
    const lastSendRef = useRef(0);
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const [activeCount, setActiveCount] = useState(0);
    const [cooldown, setCooldown] = useState(0);

    const setHistory = useCallback((items = []) => {
        setMessages(prev => {
            const map = new Map();
            [...items, ...prev].forEach(m => {
                const id = m.id || `${m.createdAt}-${m.fromUserId}-${m.text}`;
                map.set(id, m);
            });
            return Array.from(map.values())
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
    }, []);

    const prependPage = useCallback((older = []) => {
        setMessages(prev => {
            const map = new Map();
            [...older, ...prev].forEach(m => {
                const id = m.id || `${m.createdAt}-${m.fromUserId}-${m.text}`;
                map.set(id, m);
            });
            return Array.from(map.values()).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
        });
    }, []);

    useEffect(() => {
        const s = io(socketUrl || window.location.origin, {
            path,
            transports: ['websocket'],
            withCredentials: true
        });
        socketRef.current = s;

        setMessages([]);
        setActiveCount(0);

        s.on('connect', () => {
            setConnected(true);
            s.emit('join', room, (res) => {
                if (res?.ok) setActiveCount(res.count ?? 0);
            });
        });

        s.on('presence:update', ({ room: r, count }) => {
            if (r === room) setActiveCount(count);
        });

        s.on('disconnect', () => setConnected(false));
        s.on('message:new', (m) => setMessages(prev => [...prev, m]));
        s.on('connect_error', (e) => console.warn('WS connect_error:', e?.message));

        return () => { s.off(); s.disconnect(); };
    }, [room, socketUrl, path]);

    const send = useCallback((text) => new Promise(resolve => {
        const now = Date.now();
        const elapsed = now - lastSendRef.current;

        if (elapsed < SEND_COOLDOWN) {
            const remaining = SEND_COOLDOWN - elapsed;
            setCooldown(Math.ceil(remaining / 1000));
            return resolve({ ok: false, error: `Wait ${Math.ceil(remaining / 1000)} seconds before sending again` });
        }

        lastSendRef.current = now;
        setCooldown(0);

        socketRef.current?.emit('message:send', { room, text }, (res) => resolve(res || {}));
    }), [room]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    return { messages, send, connected, setHistory, prependPage, activeCount, cooldown };
}

