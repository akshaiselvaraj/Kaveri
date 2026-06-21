import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, FileText, User, Target, Calendar, MapPin, Activity } from 'lucide-react';
import { api } from '../services/api';

interface DetailModalProps {
  type: 'fir' | 'accused' | 'victim';
  id: string;
  onClose: () => void;
  onNavigate: (type: 'fir' | 'accused' | 'victim', id: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ type, id, onClose, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (type === 'fir') {
          const res = await api.getFIR(id);
          setData(res);
        } else if (type === 'accused') {
          const res = await api.getAccused(id);
          setData(res);
        } else {
          const res = await api.getVictim(id);
          setData(res);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || `Failed to fetch details for ${type} #${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type, id]);

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-[#D32F2F] bg-red-50 border-[#D32F2F]/20';
    if (score >= 40) return 'text-[#ED6C02] bg-orange-50 border-[#ED6C02]/20';
    return 'text-[#2E7D32] bg-green-50 border-[#2E7D32]/20';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-[#1E4E8C] bg-blue-50 border-[#1E4E8C]/20';
      case 'Under Investigation': return 'text-[#ED6C02] bg-orange-50 border-[#ED6C02]/20';
      case 'Completed': return 'text-[#2E7D32] bg-green-50 border-[#2E7D32]/20';
      case 'Closed': return 'text-slate-600 bg-slate-100 border-slate-300';
      default: return 'text-slate-500 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-white border border-[#D9E1E8] rounded overflow-hidden shadow-xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="p-4 bg-[#0B1F3A] border-b border-[#C79A2B] flex justify-between items-center text-white">
          <div className="flex items-center gap-2.5">
            {type === 'fir' && <FileText className="w-5 h-5 text-[#C79A2B]" />}
            {type === 'accused' && <ShieldAlert className="w-5 h-5 text-[#C79A2B]" />}
            {type === 'victim' && <User className="w-5 h-5 text-[#C79A2B]" />}
            
            <h2 className="text-xs font-bold uppercase tracking-wider">
              {type === 'fir' && `Official Case Dossier: ${id}`}
              {type === 'accused' && `Suspect Identification profile`}
              {type === 'victim' && `Victim Registry records`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#1E4E8C] text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F4F6F8]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-[#1E4E8C]/20 border-t-[#1E4E8C] animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Retrieving official logs...</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 border border-[#D32F2F]/20 bg-red-50 text-[#D32F2F] rounded text-xs text-center font-medium">
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* FIR DETAILS VIEW */}
              {type === 'fir' && (
                <div className="space-y-5">
                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-[#D9E1E8] p-3.5 rounded space-y-1">
                      <span className="text-[9px] uppercase text-slate-500 font-bold flex items-center gap-1"><Activity className="w-3 h-3 text-[#1E4E8C]"/> Crime Type</span>
                      <p className="text-[#0B1F3A] font-bold text-xs">{data.crime_type}</p>
                    </div>

                    <div className="bg-white border border-[#D9E1E8] p-3.5 rounded space-y-1">
                      <span className="text-[9px] uppercase text-slate-500 font-bold flex items-center gap-1"><Calendar className="w-3 h-3 text-[#1E4E8C]"/> Date Filed</span>
                      <p className="text-[#0B1F3A] font-bold text-xs">{data.date}</p>
                    </div>

                    <div className="bg-white border border-[#D9E1E8] p-3.5 rounded space-y-1">
                      <span className="text-[9px] uppercase text-slate-500 font-bold flex items-center gap-1"><MapPin className="w-3 h-3 text-[#1E4E8C]"/> Police Jurisdiction</span>
                      <p className="text-[#0B1F3A] font-bold text-xs">{data.district}</p>
                    </div>

                    <div className="bg-white border border-[#D9E1E8] p-3.5 rounded space-y-1">
                      <span className="text-[9px] uppercase text-slate-500 font-bold flex items-center gap-1"><Target className="w-3 h-3 text-[#1E4E8C]"/> Case Status</span>
                      <div>
                        <span className={`inline-block border text-[10px] px-2.5 py-0.5 rounded font-bold ${getStatusColor(data.status)}`}>
                          {data.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Incident Narrative */}
                  <div className="bg-white border border-[#D9E1E8] p-4 rounded">
                    <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2 border-b border-[#D9E1E8] pb-1">Incident Details</h3>
                    <p className="text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 p-3 border border-slate-100 rounded">
                      {data.description || 'No case logs seeded.'}
                    </p>
                  </div>

                  {/* Accused & Victims Lists */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Accused Column */}
                    <div className="bg-white border border-[#D9E1E8] p-4 rounded">
                      <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2 border-b border-[#D9E1E8] pb-1">Identified Suspects</h3>
                      <div className="space-y-2">
                        {data.accused && data.accused.length > 0 ? (
                          data.accused.map((acc: any) => (
                            <button
                              key={acc.accused_id}
                              onClick={() => onNavigate('accused', String(acc.accused_id))}
                              className="w-full text-left p-2.5 rounded border border-[#D9E1E8] bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center group cursor-pointer"
                            >
                              <div>
                                <h4 className="text-xs font-bold text-[#1E4E8C] group-hover:underline">{acc.name}</h4>
                                <p className="text-[10px] text-slate-500">{acc.occupation || 'Unemployed'}</p>
                              </div>
                              <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${getRiskColor(acc.risk_score)}`}>
                                Risk: {acc.risk_score}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">No suspects identified.</p>
                        )}
                      </div>
                    </div>

                    {/* Victims Column */}
                    <div className="bg-white border border-[#D9E1E8] p-4 rounded">
                      <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-2 border-b border-[#D9E1E8] pb-1">Victims / Complainants</h3>
                      <div className="space-y-2">
                        {data.victims && data.victims.length > 0 ? (
                          data.victims.map((vic: any) => (
                            <button
                              key={vic.victim_id}
                              onClick={() => onNavigate('victim', String(vic.victim_id))}
                              className="w-full text-left p-2.5 rounded border border-[#D9E1E8] bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center group cursor-pointer"
                            >
                              <div>
                                <h4 className="text-xs font-bold text-[#1E4E8C] group-hover:underline">{vic.name}</h4>
                                <p className="text-[10px] text-slate-500">{vic.age} yrs • {vic.gender}</p>
                              </div>
                              <span className="text-[10px] text-slate-600 font-semibold">{vic.occupation || 'N/A'}</span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">No victim logs mapped.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Geo-Coordinates */}
                  <div className="p-3 bg-white border border-[#D9E1E8] rounded flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#1E4E8C]" /> GPS Tag Location</span>
                    <span className="text-slate-700 font-mono font-semibold">Latitude: {data.latitude}° // Longitude: {data.longitude}°</span>
                  </div>
                </div>
              )}

              {/* ACCUSED PROFILE VIEW */}
              {type === 'accused' && (
                <div className="space-y-5">
                  {/* Main Bio Grid */}
                  <div className="bg-white border border-[#D9E1E8] p-4 rounded flex gap-4 items-start">
                    <div className="w-12 h-12 rounded bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-[#0B1F3A]">{data.name}</h3>
                      <p className="text-xs text-slate-600">{data.age} years old • {data.gender} • {data.occupation || 'Unemployed'}</p>
                      
                      {/* Risk score slider */}
                      <div className="pt-1.5 max-w-md">
                        <div className="flex justify-between text-[9px] font-bold mb-1">
                          <span className="text-slate-500 uppercase tracking-widest">Accused Threat Risk index</span>
                          <span className={data.risk_score >= 70 ? 'text-[#D32F2F]' : 'text-amber-600'}>{data.risk_score}/100</span>
                        </div>
                        <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              data.risk_score >= 70 ? 'bg-[#D32F2F]' : data.risk_score >= 40 ? 'bg-[#ED6C02]' : 'bg-[#2E7D32]'
                            }`}
                            style={{ width: `${data.risk_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Criminal History Case Linking */}
                  <div className="bg-white border border-[#D9E1E8] p-4 rounded">
                    <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-3 border-b border-[#D9E1E8] pb-1">Suspect Incident Dossier</h3>
                    {data.history && data.history.length > 0 ? (
                      <div className="space-y-2">
                        {data.history.map((h: any) => (
                          <button
                            key={h.fir_id}
                            onClick={() => onNavigate('fir', h.fir_id)}
                            className="w-full text-left p-3 rounded border border-[#D9E1E8] bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center group cursor-pointer"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#1E4E8C] group-hover:underline">{h.fir_id}</span>
                                <span className="text-xs text-[#0B1F3A] font-bold">• {h.crime_type}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">Filed Date: {h.date}</p>
                            </div>
                            <span className={`text-[10px] border px-2 py-0.5 rounded font-bold ${getStatusColor(h.status)}`}>
                              {h.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No formal cases filed on this individual.</p>
                    )}
                  </div>
                </div>
              )}

              {/* VICTIM PROFILE VIEW */}
              {type === 'victim' && (
                <div className="space-y-5">
                  {/* Main Bio */}
                  <div className="bg-white border border-[#D9E1E8] p-4 rounded flex gap-4 items-start">
                    <div className="w-12 h-12 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="text-sm font-bold text-[#0B1F3A]">{data.name}</h3>
                      <p className="text-xs text-slate-600">{data.age} years old • {data.gender} • {data.occupation || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Case Linking */}
                  <div className="bg-white border border-[#D9E1E8] p-4 rounded">
                    <h3 className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider mb-3 border-b border-[#D9E1E8] pb-1">Incident Complainant History</h3>
                    {data.cases && data.cases.length > 0 ? (
                      <div className="space-y-2">
                        {data.cases.map((c: any) => (
                          <button
                            key={c.fir_id}
                            onClick={() => onNavigate('fir', c.fir_id)}
                            className="w-full text-left p-3 rounded border border-[#D9E1E8] bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center group cursor-pointer"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#1E4E8C] group-hover:underline">{c.fir_id}</span>
                                <span className="text-xs text-[#0B1F3A] font-bold">• {c.crime_type}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">Filed Date: {c.date}</p>
                            </div>
                            <span className={`text-[10px] border px-2 py-0.5 rounded font-bold ${getStatusColor(c.status)}`}>
                              {c.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No formal cases filed on behalf of this person.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
