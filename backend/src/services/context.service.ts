export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sql?: string;
  sqlResults?: any[];
  metadata?: {
    activeFilters?: Record<string, string>;
    activeEntities?: Record<string, any>;
    rawError?: string;
  };
}

export interface SessionContext {
  sessionId: string;
  messages: ChatMessage[];
  lastSql?: string;
  lastSqlResults?: any[];
  activeFilters?: Record<string, string>;
  activeEntities?: Record<string, any>;
  updatedAt: Date;
}

class ContextService {
  private sessions: Map<string, SessionContext> = new Map();

  public getOrCreateSession(sessionId: string): SessionContext {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        messages: [],
        activeFilters: {},
        activeEntities: {},
        updatedAt: new Date(),
      });
    }
    return this.sessions.get(sessionId)!;
  }

  public getHistoryList(): { sessionId: string; snippet: string; updatedAt: Date }[] {
    const list: { sessionId: string; snippet: string; updatedAt: Date }[] = [];
    this.sessions.forEach((session, id) => {
      const lastMsg = session.messages[session.messages.length - 1];
      const snippet = lastMsg ? lastMsg.content.substring(0, 60) + (lastMsg.content.length > 60 ? '...' : '') : 'Empty Conversation';
      list.push({
        sessionId: id,
        snippet,
        updatedAt: session.updatedAt,
      });
    });
    return list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  public addMessage(
    sessionId: string,
    role: 'user' | 'model',
    content: string,
    sql?: string,
    sqlResults?: any[],
    metadata?: ChatMessage['metadata']
  ): void {
    const session = this.getOrCreateSession(sessionId);
    session.messages.push({
      role,
      content,
      sql,
      sqlResults,
      metadata,
    });
    session.updatedAt = new Date();

    if (role === 'model' && sql) {
      session.lastSql = sql;
      session.lastSqlResults = sqlResults;
      
      // Attempt to extract filters or entities for the right-side context panel
      if (metadata?.activeFilters) {
        session.activeFilters = { ...session.activeFilters, ...metadata.activeFilters };
      }
      if (metadata?.activeEntities) {
        session.activeEntities = { ...session.activeEntities, ...metadata.activeEntities };
      }
    }
  }

  public updateSessionEntities(sessionId: string, entities: Record<string, any>): void {
    const session = this.getOrCreateSession(sessionId);
    session.activeEntities = { ...session.activeEntities, ...entities };
  }

  public updateSessionFilters(sessionId: string, filters: Record<string, string>): void {
    const session = this.getOrCreateSession(sessionId);
    session.activeFilters = { ...session.activeFilters, ...filters };
  }

  public clearSession(sessionId: string): void {
    this.sessions.set(sessionId, {
      sessionId,
      messages: [],
      activeFilters: {},
      activeEntities: {},
      updatedAt: new Date(),
    });
  }
}

export const contextService = new ContextService();
