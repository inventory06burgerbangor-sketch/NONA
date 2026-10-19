import React from 'react';
import { useApp } from '../context/AppContext';
import { BellRing, Check, Clock, Volume2 } from 'lucide-react';

export const AlarmRingingModal: React.FC = () => {
  const { 
    ringingAlarm, 
    dismissAlarm, 
    snoozeAlarm, 
    toggleScheduleComplete 
  } = useApp();

  if (!ringingAlarm) return null;

  const handleMarkComplete = () => {
    toggleScheduleComplete(ringingAlarm.id);
    dismissAlarm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2B1E]/50 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white border-2 border-[#5A7358] rounded-3xl max-w-sm w-full text-[#283826] shadow-2xl p-6 text-center relative overflow-hidden">
        {/* Subtle sage background accent */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#E2EBE1] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-[#CCDACC] rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-[#EBF1EA] border border-[#CCDACC] flex items-center justify-center text-[#4B6349] shadow-md animate-bounce">
            <BellRing className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF1EA] border border-[#CAD8C9] text-[#3B4D39] text-xs font-semibold mb-2">
            <Volume2 className="w-3.5 h-3.5 animate-pulse text-[#5A7358]" />
            Alarm The Time Berbunyi
          </div>

          <h2 className="text-lg font-serif-display font-bold text-[#1F2B1E] mb-1">
            {ringingAlarm.title}
          </h2>

          <div className="text-[#4B6349] font-mono text-base font-bold my-1.5">
            Pukul {ringingAlarm.time} WIB
          </div>

          {ringingAlarm.description && (
            <p className="text-xs text-[#556753] bg-[#F8FAF7] p-3 rounded-2xl border border-[#E2EBE1] text-left my-3">
              {ringingAlarm.description}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-5">
            <button
              onClick={() => snoozeAlarm(5)}
              className="flex items-center justify-center gap-1 px-2.5 py-2.5 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#D5E1D4] text-[#3B4D39] text-xs font-semibold transition-colors"
            >
              <Clock className="w-3 h-3 text-[#5A7358]" />
              Snooze
            </button>

            <button
              onClick={handleMarkComplete}
              className="flex items-center justify-center gap-1 px-2.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Selesai
            </button>

            <button
              onClick={dismissAlarm}
              className="flex items-center justify-center px-2.5 py-2.5 rounded-xl bg-[#5A7358] hover:bg-[#485D46] text-white text-xs font-bold transition-colors shadow-xs"
            >
              Matikan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
