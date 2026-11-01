const messageId = (message) => message.id ?? `${message.createdAt}:${message.authorId}:${message.text}`;

const mergeMessages = (existing, incoming) => {
  const messages = new Map(existing.map((message) => [messageId(message), message]));
  for (const message of incoming) messages.set(messageId(message), message);
  return [...messages.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export function createChatSession({ createSocket, room = 'global', cooldownMs = 5_000, now = () => Date.now() }) {
  let socket;
  let lastSentAt = -Infinity;
  let state = { connected: false, activeCount: 0, messages: [], cooldownMs: 0 };
  const subscribers = new Set();

  const publish = () => subscribers.forEach((listener) => listener({ ...state, messages: [...state.messages] }));
  const setState = (patch) => { state = { ...state, ...patch }; publish(); };

  const handlers = {
    connect: () => {
      setState({ connected: true });
      socket.emit('join', room, (result = {}) => {
        if (result.ok) setState({ activeCount: result.count ?? 0 });
      });
    },
    disconnect: () => setState({ connected: false }),
    presence: ({ room: eventRoom, count }) => {
      if (eventRoom === room) setState({ activeCount: count });
    },
    message: (message) => setState({ messages: mergeMessages(state.messages, [message]) })
  };

  return {
    connect() {
      if (socket) return;
      socket = createSocket();
      socket.on('connect', handlers.connect);
      socket.on('disconnect', handlers.disconnect);
      socket.on('presence:update', handlers.presence);
      socket.on('message:new', handlers.message);
    },
    disconnect() {
      if (!socket) return;
      socket.off('connect', handlers.connect);
      socket.off('disconnect', handlers.disconnect);
      socket.off('presence:update', handlers.presence);
      socket.off('message:new', handlers.message);
      socket.disconnect();
      socket = undefined;
    },
    replaceHistory(messages) {
      setState({ messages: mergeMessages([], messages) });
    },
    prependHistory(messages) {
      setState({ messages: mergeMessages(state.messages, messages) });
    },
    send(text) {
      const elapsed = now() - lastSentAt;
      if (elapsed < cooldownMs) {
        const remaining = cooldownMs - elapsed;
        setState({ cooldownMs: remaining });
        return Promise.resolve({ ok: false, error: 'cooldown', retryInMs: remaining });
      }
      if (!socket) return Promise.resolve({ ok: false, error: 'not-connected' });

      lastSentAt = now();
      setState({ cooldownMs: 0 });
      return new Promise((resolve) => socket.emit('message:send', { room, text }, (result = {}) => resolve(result)));
    },
    subscribe(listener) {
      subscribers.add(listener);
      listener({ ...state, messages: [...state.messages] });
      return () => subscribers.delete(listener);
    },
    snapshot: () => ({ ...state, messages: [...state.messages] })
  };
}

