// Sanitized production excerpt. The host supplies persistence and sanitization.
const buckets = new Map();
function takeToken(key, refillPerSec = 2, burst = 20) {
    const now = Date.now();
    const s = buckets.get(key) || { tokens: burst, ts: now };
    const elapsed = Math.max(0, now - s.ts) / 1000;
    s.tokens = Math.min(burst, s.tokens + elapsed * refillPerSec);
    s.ts = now;
    if (s.tokens < 1) return false;
    s.tokens -= 1;
    buckets.set(key, s);
    return true;
}

export function attachChatHandlers(io, socket, { createMessage, sanitizeText, createId }) {
    const presence = io.presence ?? (io.presence = new Map());
    const userId = String(socket.data.userId);
    socket.data.rooms = new Set();

    function addPresence(room, userId, socketId) {
        let users = presence.get(room);
        if (!users) { users = new Map(); presence.set(room, users); }
        let sockets = users.get(userId);
        if (!sockets) { sockets = new Set(); users.set(userId, sockets); }
        sockets.add(socketId);
    }

    function removePresence(room, userId, socketId) {
        const users = presence.get(room);
        if (!users) return;
        const sockets = users.get(userId);
        if (!sockets) return;
        sockets.delete(socketId);
        if (sockets.size === 0) users.delete(userId);
        if (users.size === 0) presence.delete(room);
    }

    function broadcastPresence(room) {
        const count = presence.get(room)?.size ?? 0;
        io.to(room).emit('presence:update', { room, count });
    }

    socket.on('join', (room = 'global', ack) => {
        if (typeof room !== 'string' || room.length > 100) return;
        socket.join(room);
        socket.data.rooms.add(room);
        addPresence(room, userId, socket.id);
        broadcastPresence(room);
        ack?.({ ok: true, count: presence.get(room).size });
    });

    socket.on('message:send', async (payload, ack) => {
        try {
            const { room = 'global', text } = payload || {};
            if (typeof text !== 'string' || !text.trim()) return ack?.({ ok: false, error: 'empty' });
            if (!takeToken(`${userId}:${room}`)) return ack?.({ ok: false, error: 'rate_limited' });

            const message = await createMessage({
                id: createId(), room, fromUserId: userId, text: sanitizeText(text).slice(0, 2000)
            });
            io.to(room).emit('message:new', message);
            ack?.({ ok: true, message });
        } catch {
            ack?.({ ok: false, error: 'server_error' });
        }
    });

    socket.on('disconnect', () => {
        for (const room of socket.data.rooms) {
            removePresence(room, userId, socket.id);
            broadcastPresence(room);
        }
    });
}

