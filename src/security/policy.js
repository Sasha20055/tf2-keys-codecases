export function createSecurityPolicy({ allowedOrigins, apiOrigin, isProduction }) {
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
    throw new TypeError('allowedOrigins must be a non-empty array');
  }
  if (!apiOrigin) throw new TypeError('apiOrigin is required');

  return {
    cors: {
      origin(origin, callback) {
        const accepted = !origin || allowedOrigins.includes(origin);
        callback(accepted ? null : new Error('origin is not allowed by CORS'), accepted);
      },
      credentials: true
    },
    rateLimit: { windowMs: 15 * 60 * 1_000, limit: 300 },
    sessionCookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax'
    },
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", apiOrigin],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  };
}

