import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import { 
  BookOpen, 
  Image as ImageIcon, 
  Clock, 
  X, 
  ChevronRight, 
  UserCheck, 
  UserPlus, 
  Sparkles,
  Wifi
} from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onOpenRegister 
}) => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    activeTab, 
    setActiveTab, 
    isOnline 
  } = useApp();

  const menuItems: {
    id: ActiveTab;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'the-word',
      title: 'The Word',
      description: 'Rak Buku, catatan bebas sudut kertas & sobekan lembaran',
      icon: <BookOpen className="w-5 h-5 text-[#5A7358]" />,
    },
    {
      id: 'the-art',
      title: 'The ART',
      description: 'Galeri foto polaroid, unggah & tag kolaborasi',
      icon: <ImageIcon className="w-5 h-5 text-[#5A7358]" />,
    },
    {
      id: 'the-time',
      title: 'The Time',
      description: 'Kalender agenda kegiatan & lonceng alarm aktual',
      icon: <Clock className="w-5 h-5 text-[#5A7358]" />,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-[#1F2B1E]/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Side Drawer Content (Disamping, modern minimalist aesthetic) */}
      <div 
        className="relative w-4/5 max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-r border-[#D5E1D4] text-[#283826] animate-in slide-in-from-left duration-250 ease-out"
      >
        <div>
          {/* Drawer Top Header */}
          <div className="p-4 sm:p-5 border-b border-[#E8EFE8] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EBF1EA] border border-[#CCDACC] flex items-center justify-center text-[#4B6349] font-serif-display font-bold text-lg shadow-xs">
                Z
              </div>
              <div>
                <h2 className="font-serif-display text-base font-bold text-[#1F2B1E] tracking-tight">
                  ZAINORA
                </h2>
                <div className="flex items-center gap-1 text-[10px] text-[#71856F]">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{isOnline ? 'Online Sync' : 'Offline'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#71856F] hover:text-[#1F2B1E] hover:bg-[#F3F7F2] transition-colors"
              title="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Snippet in Drawer */}
          {currentUser && (
            <div className="px-4 py-3 bg-[#F8FAF7] border-b border-[#E8EFE8] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full bg-white object-cover border border-[#CCDACC] shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#1F2B1E] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-[#71856F] truncate">
                    Buku: {currentUser.book.title}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3 BESAR MENU ITEMS (The Word, The ART, The Time) */}
          <div className="p-3 sm:p-4 space-y-2">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#71856F]">
              Menu
            </div>

            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all ${
                    isActive
                      ? 'bg-[#EBF1EA] border border-[#CAD8C9] shadow-xs'
                      : 'hover:bg-[#F8FAF7] border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    isActive ? 'bg-white shadow-xs' : 'bg-[#F2F6F1]'
                  }`}>
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${
                        isActive ? 'text-[#1F2B1E]' : 'text-[#3B4D39]'
                      }`}>
                        {item.title}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[#5A7358]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#556753] mt-0.5 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Bottom Actions: User Switcher & Create Account */}
        <div className="p-3 sm:p-4 border-t border-[#E8EFE8] bg-[#FAFCFA] space-y-2">
          {users.length > 1 && (
            <div>
              <div className="px-1 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#71856F]">
                Ganti Akun Pengguna
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                      u.id === currentUser?.id
                        ? 'bg-[#EBF1EA] text-[#1F2B1E] font-bold border border-[#CCDACC]'
                        : 'hover:bg-white text-[#556753]'
                    }`}
                  >
                    <span className="truncate">{u.name}</span>
                    {u.id === currentUser?.id && <UserCheck className="w-3.5 h-3.5 text-[#5A7358]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              onOpenRegister();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white hover:bg-[#F3F7F2] border border-[#CCDACC] text-[#3B4D39] text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#5A7358]" />
            <span>+ Buat Akun / Buku Baru</span>
          </button>
        </div>
      </div>
    </div>
  );
};
