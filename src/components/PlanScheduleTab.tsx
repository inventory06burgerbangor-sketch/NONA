import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ScheduleCategory } from '../types';
import { 
  CalendarDays, 
  Plus, 
  Bell, 
  BellOff, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Volume2, 
  ChevronLeft, 
  ChevronRight,
  X
} from 'lucide-react';

export const PlanScheduleTab: React.FC = () => {
  const { 
    currentUser, 
    addSchedule, 
    toggleScheduleAlarm, 
    toggleScheduleComplete, 
    deleteSchedule,
    testAlarm
  } = useApp();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // New schedule form modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [time, setTime] = useState<string>('09:00');
  const [category, setCategory] = useState<ScheduleCategory>('penting');
  const [alarmEnabled, setAlarmEnabled] = useState<boolean>(true);

  if (!currentUser) {
    return (
      <div className="bg-white border border-[#D5E1D4] rounded-3xl p-8 text-center max-w-lg mx-auto shadow-xs">
        <Clock className="w-10 h-10 mx-auto text-[#CCDACC] mb-3" />
        <h3 className="font-serif-display font-semibold text-[#1F2B1E] text-base">
          Belum ada profil aktif
        </h3>
        <p className="text-xs text-[#71856F] mt-1">
          Silakan buat profil akun terlebih dahulu untuk menyusun jadwal dan alarm The Time.
        </p>
      </div>
    );
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const allSchedules = currentUser.schedules || [];
  const selectedDateSchedules = allSchedules.filter(s => s.date === selectedDate);
  const upcomingSchedules = allSchedules.filter(s => s.date >= todayStr && !s.completed);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addSchedule({
      title: title.trim(),
      description: description.trim(),
      date: selectedDate,
      time,
      category,
      alarmEnabled,
      completed: false,
    });

    setTitle('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  const categoryColors: Record<ScheduleCategory, { bg: string; text: string; label: string }> = {
    penting: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Penting' },
    kegiatan: { bg: 'bg-[#EBF1EA] border-[#CAD8C9]', text: 'text-[#283826]', label: 'Kegiatan' },
    deadline: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Deadline' },
    personal: { bg: 'bg-[#F2F6F1] border-[#CCDACC]', text: 'text-[#3B4D39]', label: 'Personal' },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header The Time */}
      <div className="bg-white border border-[#D5E1D4] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif-display font-bold text-[#1F2B1E]">
            The Time
          </h1>
          <p className="text-xs text-[#6B7E69] mt-0.5">
            Kalender jadwal kegiatan & alarm lonceng otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={testAlarm}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#CCDACC] text-[#3B4D39] text-xs font-semibold transition-colors"
            title="Dengarkan melodi alarm"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#5A7358]" />
            <span>Tes Alarm</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#5A7358] hover:bg-[#485D46] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* CALENDAR COLUMN (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#D5E1D4] rounded-3xl p-4 sm:p-6 shadow-xs">
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-serif-display font-bold text-[#1F2B1E]">
              {monthNames[currentMonth]} {currentYear}
            </h2>

            <div className="flex items-center gap-1 bg-[#F4F8F3] p-1 rounded-xl border border-[#D5E1D4]">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-[#556753] hover:bg-[#EBF1EA]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(today.getMonth());
                  setCurrentYear(today.getFullYear());
                  setSelectedDate(todayStr);
                }}
                className="px-2.5 py-1 text-xs text-[#3B4D39] font-semibold"
              >
                Hari Ini
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-[#556753] hover:bg-[#EBF1EA]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#8FA38D] mb-2 font-mono">
            <span>Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;

              const daySchedules = allSchedules.filter(s => s.date === dateStr);
              const hasAlarm = daySchedules.some(s => s.alarmEnabled && !s.completed);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#5A7358] text-white shadow-xs scale-105 z-10'
                      : isToday
                      ? 'bg-[#EBF1EA] text-[#283826] border border-[#CAD8C9]'
                      : 'bg-[#F8FAF7] hover:bg-[#EBF1EA] text-[#3B4D39] border border-[#E2EBE1]'
                  }`}
                >
                  <span>{dayNum}</span>

                  {daySchedules.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-white'
                            : hasAlarm
                            ? 'bg-[#5A7358] animate-pulse'
                            : 'bg-[#8FA38D]'
                        }`}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom indicator */}
          <div className="mt-5 pt-3 border-t border-[#E8EFE8] flex items-center justify-between text-xs text-[#71856F]">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#5A7358]" />
                Alarm Aktif
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#CCDACC]" />
                Agenda Lain
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#3B4D39]">
              {new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* AGENDA COLUMN (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#D5E1D4] rounded-3xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EFE8] mb-3">
              <div>
                <h3 className="font-serif-display font-bold text-[#1F2B1E] text-sm sm:text-base">
                  Agenda Tanggal Ini
                </h3>
                <p className="text-[11px] text-[#71856F]">
                  {new Date(selectedDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-1.5 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] text-[#4B6349]"
                title="Tambah Jadwal"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedDateSchedules.length === 0 ? (
              <div className="py-6 text-center text-[#8FA38D] text-xs">
                <Clock className="w-7 h-7 mx-auto mb-2 text-[#CCDACC]" />
                <p>Belum ada jadwal untuk tanggal ini.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-1.5 text-[#5A7358] font-semibold hover:underline text-xs"
                >
                  + Tambah Jadwal & Alarm
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDateSchedules.map((item) => {
                  const cat = categoryColors[item.category] || categoryColors.penting;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl bg-[#F8FAF7] border transition-all ${
                        item.completed ? 'border-[#E2EBE1] opacity-60' : 'border-[#D5E1D4]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => toggleScheduleComplete(item.id)}
                            className="mt-0.5 text-[#8FA38D] hover:text-emerald-700 transition-colors"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <div>
                            <div className={`text-xs font-semibold ${item.completed ? 'line-through text-[#71856F]' : 'text-[#1F2B1E]'}`}>
                              {item.title}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-[#556753] mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => toggleScheduleAlarm(item.id)}
                          className={`p-1.5 rounded-xl text-xs transition-colors ${
                            item.alarmEnabled
                              ? 'bg-[#EBF1EA] text-[#3B4D39] border border-[#CCDACC]'
                              : 'bg-white text-[#CCDACC]'
                          }`}
                          title={item.alarmEnabled ? 'Alarm Aktif' : 'Alarm Mati'}
                        >
                          {item.alarmEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-[#E8EFE8] flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#3B4D39] font-bold">
                            {item.time} WIB
                          </span>
                          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-semibold ${cat.bg} ${cat.text}`}>
                            {cat.label}
                          </span>
                        </div>

                        <button
                          onClick={async () => {
                            if (confirm('Hapus jadwal ini?')) {
                              await deleteSchedule(item.id);
                            }
                          }}
                          className="text-[#8FA38D] hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ALL UPCOMING ALARMS BOX */}
          <div className="bg-white border border-[#D5E1D4] rounded-3xl p-4 sm:p-5 shadow-xs">
            <h4 className="font-serif-display font-bold text-[#1F2B1E] text-xs sm:text-sm mb-2.5 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[#5A7358]" />
              Alarm Mendatang ({upcomingSchedules.filter(s => s.alarmEnabled).length})
            </h4>

            {upcomingSchedules.filter(s => s.alarmEnabled).length === 0 ? (
              <p className="text-xs text-[#71856F] italic">
                Tidak ada alarm aktif yang terjadwal.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {upcomingSchedules.filter(s => s.alarmEnabled).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedDate(s.date)}
                    className="p-2.5 rounded-xl bg-[#F8FAF7] border border-[#E2EBE1] hover:border-[#CAD8C9] transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="truncate max-w-[160px]">
                      <div className="text-[#1F2B1E] font-semibold truncate">{s.title}</div>
                      <div className="text-[10px] text-[#71856F]">{s.date}</div>
                    </div>
                    <span className="font-mono text-[#3B4D39] font-bold text-[11px] shrink-0">
                      {s.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD SCHEDULE & ALARM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2B1E]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#D5E1D4] rounded-3xl max-w-md w-full text-[#283826] shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8EFE8]">
              <h3 className="font-serif-display font-bold text-base text-[#1F2B1E]">
                Tambah Jadwal The Time
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#71856F] hover:bg-[#F3F7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3B4D39] mb-1">
                  Nama Kegiatan / Agenda
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Diskusi kurasi The ART..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF7] border border-[#D5E1D4] text-xs sm:text-sm text-[#1F2B1E] placeholder:text-[#9FB19E] focus:outline-none focus:border-[#5A7358]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#3B4D39] mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF7] border border-[#D5E1D4] text-xs text-[#1F2B1E] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B4D39] mb-1">
                    Jam Alarm (WIB)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8FAF7] border border-[#D5E1D4] text-xs text-[#1F2B1E] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B4D39] mb-1">
                  Kategori
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['penting', 'kegiatan', 'deadline', 'personal'] as ScheduleCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 px-1 rounded-xl border text-center capitalize transition-colors ${
                        category === cat
                          ? 'border-[#5A7358] bg-[#EBF1EA] text-[#283826] font-bold shadow-xs'
                          : 'border-[#E2EBE1] bg-[#F8FAF7] text-[#6B7E69]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B4D39] mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan tambahan..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF7] border border-[#D5E1D4] text-xs text-[#1F2B1E] placeholder:text-[#9FB19E] focus:outline-none focus:border-[#5A7358] resize-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#D5E1D4] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${alarmEnabled ? 'bg-[#EBF1EA] text-[#3B4D39]' : 'bg-white text-[#CCDACC]'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-[#283826]">
                    Bunyikan Alarm Lonceng
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={alarmEnabled}
                  onChange={(e) => setAlarmEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#5A7358] cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-[#E8EFE8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#71856F] hover:bg-[#F3F7F2]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#5A7358] hover:bg-[#485D46] text-white font-bold text-xs transition-all shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
