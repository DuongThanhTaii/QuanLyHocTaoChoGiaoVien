/** Restrict auth continuations to local application routes. */
export function safeReturnTo(value: unknown, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback;
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback;
  return path;
}

export function withReturnTo(path: string, returnTo: string) {
  const safe = safeReturnTo(returnTo, '');
  return safe ? `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(safe)}` : path;
}
