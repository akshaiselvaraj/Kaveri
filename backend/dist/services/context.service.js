"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextService = void 0;
class ContextService {
    sessions = new Map();
    getOrCreateSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                sessionId,
                messages: [],
                activeFilters: {},
                activeEntities: {},
                updatedAt: new Date(),
            });
        }
        return this.sessions.get(sessionId);
    }
    getHistoryList() {
        const list = [];
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
    addMessage(sessionId, role, content, sql, sqlResults, metadata) {
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
    updateSessionEntities(sessionId, entities) {
        const session = this.getOrCreateSession(sessionId);
        session.activeEntities = { ...session.activeEntities, ...entities };
    }
    updateSessionFilters(sessionId, filters) {
        const session = this.getOrCreateSession(sessionId);
        session.activeFilters = { ...session.activeFilters, ...filters };
    }
    clearSession(sessionId) {
        this.sessions.set(sessionId, {
            sessionId,
            messages: [],
            activeFilters: {},
            activeEntities: {},
            updatedAt: new Date(),
        });
    }
}
exports.contextService = new ContextService();
