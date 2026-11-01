import test from 'node:test';
import assert from 'node:assert/strict';
import { createSecurityPolicy } from '../src/security/policy.js';

test('security policy allows known clients and rejects unknown ones', () => {
  const policy = createSecurityPolicy({
    allowedOrigins: ['https://demo.example.test'],
    apiOrigin: 'https://api.example.test',
    isProduction: true
  });
  policy.cors.origin('https://demo.example.test', (error, allowed) => {
    assert.equal(error, null);
    assert.equal(allowed, true);
  });
  policy.cors.origin('https://unknown.example.test', (error, allowed) => {
    assert.match(error.message, /not allowed/);
    assert.equal(allowed, false);
  });
  assert.equal(policy.sessionCookie.secure, true);
  assert.deepEqual(policy.contentSecurityPolicy.connectSrc, ["'self'", 'https://api.example.test']);
});

