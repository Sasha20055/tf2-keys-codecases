import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatSession } from '../src/realtime/chat-session.js';

class FakeSocket {
  listeners = new Map();
  emitted = [];
  on(event, handler) { this.listeners.set(event, handler); }
  off(event) { this.listeners.delete(event); }
  disconnect() { this.disconnected = true; }
  emit(event, ...args) {
    this.emitted.push([event, ...args]);
    const callback = args.at(-1);
    if (event === 'join') callback({ ok: true, count: 3 });
    if (event === 'message:send') callback({ ok: true });
  }
  receive(event, payload) { this.listeners.get(event)?.(payload); }
}

test('chat joins a room, tracks presence and deduplicates messages', () => {
  const socket = new FakeSocket();
  const chat = createChatSession({ createSocket: () => socket, room: 'support' });
  chat.connect();
  socket.receive('connect');
  socket.receive('presence:update', { room: 'support', count: 8 });
  socket.receive('message:new', { id: 'm1', text: 'hello', authorId: 'u1', createdAt: '2026-01-01T10:00:00Z' });
  chat.prependHistory([{ id: 'm1', text: 'hello', authorId: 'u1', createdAt: '2026-01-01T10:00:00Z' }]);
  assert.equal(chat.snapshot().activeCount, 8);
  assert.equal(chat.snapshot().messages.length, 1);
});

test('chat prevents a second send during cooldown', async () => {
  const socket = new FakeSocket();
  let time = 1_000;
  const chat = createChatSession({ createSocket: () => socket, cooldownMs: 5_000, now: () => time });
  chat.connect();
  assert.deepEqual(await chat.send('one'), { ok: true });
  time += 1_000;
  assert.deepEqual(await chat.send('two'), { ok: false, error: 'cooldown', retryInMs: 4_000 });
  chat.disconnect();
  assert.equal(socket.disconnected, true);
});

