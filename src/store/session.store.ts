import type { SessionRecord } from "../types/session.js";

class SessionStore {
  private readonly sessions = new Map<string, SessionRecord>();

  create(session: SessionRecord): SessionRecord {
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): SessionRecord | undefined {
    return this.sessions.get(id);
  }

  list(): SessionRecord[] {
    return [...this.sessions.values()];
  }

  update(id: string, patch: Partial<SessionRecord>): SessionRecord | undefined {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;

    const updated: SessionRecord = { ...existing, ...patch };
    this.sessions.set(id, updated);
    return updated;
  }
}

export const sessionStore = new SessionStore();
