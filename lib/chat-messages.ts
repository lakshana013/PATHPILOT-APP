/**
 * In-memory store for session chat messages.
 * Cleared when session ends; not persisted to DB.
 */

export type StoredMessage = {
  id: string;
  senderId: string;
  text: string;
  at: number;
};

const sessionMessages = new Map<string, StoredMessage[]>();

export function getMessages(sessionId: string): StoredMessage[] {
  return sessionMessages.get(sessionId) ?? [];
}

export function addMessage(sessionId: string, message: StoredMessage): void {
  const list = sessionMessages.get(sessionId) ?? [];
  list.push(message);
  sessionMessages.set(sessionId, list);
}

export function clearSessionMessages(sessionId: string): void {
  sessionMessages.delete(sessionId);
}
