// Check-in submissions post a message using this internal protocol prefix so
// the thread can render a rich reference card instead of plain text. Any
// surface that shows message content (previews, snippets, list rows) must
// parse it first — otherwise the raw "[CHECKIN:id:date]" string leaks
// through to the user.
const CHECKIN_REGEX = /^\[CHECKIN:([a-zA-Z0-9_-]+):([^\]]+)\]([\s\S]*)$/;

export type ParsedCheckInMessage = { checkInId: string; date: string; notes: string };

export function parseCheckInMessage(body: string): ParsedCheckInMessage | null {
  const match = body.match(CHECKIN_REGEX);
  if (!match) return null;
  return { checkInId: match[1], date: match[2], notes: match[3].trim() };
}

/**
 * Human-readable preview text for a message list/snippet — strips the
 * check-in protocol prefix and falls back to a friendly label when the
 * check-in was submitted without notes.
 */
export function formatMessagePreview(body: string, maxLength = 60): string {
  const checkIn = parseCheckInMessage(body);
  const raw = checkIn ? checkIn.notes || "Sent a check-in" : body;
  return raw.length > maxLength ? raw.slice(0, maxLength) + "…" : raw;
}
