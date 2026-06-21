export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  sql?: string;
  sqlResults?: any[];
  activeFilters?: Record<string, string>;
  activeEntities?: Record<string, any>;
  detectedLang?: string;
  queryMetadata?: {
    intent: string;
    explanation: string;
    executionTimeMs: number;
  };
  audioUrl?: string; // Optional voice playback helper
}

export interface Session {
  sessionId: string;
  snippet: string;
  updatedAt: string;
}

export interface FIRDetails {
  fir_id: string;
  crime_type: string;
  date: string;
  location_id: number;
  status: 'Pending' | 'Under Investigation' | 'Completed' | 'Closed';
  description: string;
  district: string;
  latitude: number;
  longitude: number;
  accused: Array<{
    accused_id: number;
    name: string;
    age: number;
    gender: string;
    occupation: string;
    risk_score: number;
  }>;
  victims: Array<{
    victim_id: number;
    name: string;
    age: number;
    gender: string;
    occupation: string;
  }>;
}

export interface AccusedDetails {
  accused_id: number;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  risk_score: number;
  history: Array<{
    fir_id: string;
    crime_type: string;
    date: string;
    status: string;
  }>;
}

export interface VictimDetails {
  victim_id: number;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  cases: Array<{
    fir_id: string;
    crime_type: string;
    date: string;
    status: string;
  }>;
}
