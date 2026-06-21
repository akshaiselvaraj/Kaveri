import type { FIRDetails, AccusedDetails, VictimDetails, Session } from '../types';

const API_BASE = '/api';

export const api = {
  async sendMessage(message: string, sessionId: string, lang?: 'en' | 'kn'): Promise<any> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, lang })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  async getHistory(): Promise<Session[]> {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) throw new Error('Failed to retrieve history');
    return res.json();
  },

  async getFIR(id: string): Promise<FIRDetails> {
    const res = await fetch(`${API_BASE}/fir/${id}`);
    if (!res.ok) throw new Error(`Failed to retrieve FIR ${id}`);
    return res.json();
  },

  async getAccused(id: number | string): Promise<AccusedDetails> {
    const res = await fetch(`${API_BASE}/accused/${id}`);
    if (!res.ok) throw new Error(`Failed to retrieve Accused ${id}`);
    return res.json();
  },

  async getVictim(id: number | string): Promise<VictimDetails> {
    const res = await fetch(`${API_BASE}/victim/${id}`);
    if (!res.ok) throw new Error(`Failed to retrieve Victim ${id}`);
    return res.json();
  },

  async exportPDF(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    if (!res.ok) throw new Error('Failed to generate PDF');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kaveri_Intelligence_Report_${sessionId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};
