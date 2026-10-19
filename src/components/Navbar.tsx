import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import { 
  BookOpen, 
  Image as ImageIcon, 
  Clock, 
  Bell, 
  UserCheck, 
  UserPlus, 
  ChevronDown,
  Volume2,
  Menu
} from 'lucide-react';

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenNotifications: () => void;
  onOpenSideMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenRegister, 
  onOpenNotifications,
  onOpenSideMenu 
}) => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    activeTab, 
    setActiveTab, 
    pendingRequestsCount,
    testAlarm,
    isOnline
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'the-word',
      label: 'The Word',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'the-art',
      label: 'The ART',
      icon: <ImageIcon className="w-4 h-4" />,
    },
    {
      id: 'the-time',
      label: 'The Time',
      icon: <Clock className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2EBE1] text-[#283626] shadow-[0_1px_3px_rgba(40,54,38,0.04)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Touch Menu Trigger (Disamping) & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Menu 3 Besar Button (Touch Trigger for Side Menu) */}
          <button
            onClick={onOpenSideMenu}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#CCDACC] text-[#283826] transition-colors shadow-xs"
            title="Buka Menu"
            aria-label="Buka Menu"
          >
            <Menu className="w-4 h-4 text-[#5A7358]" />
            <span className="text-xs font-bold text-[#3B4D39]">Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EBF1EA] border border-[#CCDACC] flex items-center justify-center text-[#4B6349] font-serif-display font-bold text-base shadow-xs shrink-0">
              Z
            </div>
            <span className="font-serif-display text-sm sm:text-lg font-bold tracking-tight text-[#1F2B1E] whitespace-nowrap truncate max-w-[130px] sm:max-w-none">
              ZAINORA Archive
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation 3 Besar (Tampil di Desktop / Tablet) */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#EBF1EA] text-[#1F2B1E] border border-[#CAD8C9] shadow-xs'
                    : 'text-[#5E725C] hover:text-[#1F2B1E] hover:bg-[#F3F7F2]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & User Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Test Alarm Sound */}
          <button
            onClick={testAlarm}
            title="Uji Melodi Alarm The Time"
            className="p-2 rounded-xl text-[#5E725C] hover:text-[#283826] hover:bg-[#F3F7F2] transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Notification Button */}
          {currentUser && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-[#5E725C] hover:text-[#283826] hover:bg-[#F3F7F2] transition-colors"
              title="Pemberitahuan Izin Membuka Buku"
            >
              <Bell className="w-4 h-4" />
              {pendingRequestsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#5A7358] text-[10px] font-bold text-white shadow-xs">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* User Account Switcher Dropdown */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#D5E1D4] text-[#283826] transition-colors shadow-xs"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full bg-white object-cover border border-[#CCDACC]"
                />
                <span className="text-xs font-semibold max-w-[70px] sm:max-w-[110px] truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5E725C]" />
              </button>

              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white border border-[#D5E1D4] rounded-2xl shadow-xl p-2 z-50 text-[#283826] animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-[#E8EFE8] text-[11px] font-medium text-[#71856F]">
                    Akun Pengguna ZAINORA
                  </div>

                  <div className="py-1 space-y-1 max-h-48 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => switchUser(u.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-[#EBF1EA] text-[#283826] font-bold border border-[#CCDACC]'
                            : 'hover:bg-[#F7F9F7] text-[#556753]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-5 h-5 rounded-full bg-[#E2EBE1] object-cover shrink-0"
                          />
                          <span className="truncate">{u.name}</span>
                        </div>
                        {u.id === currentUser.id && <UserCheck className="w-3.5 h-3.5 text-[#5A7358] shrink-0" />}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#E8EFE8]">
                    <button
                      onClick={onOpenRegister}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#4B6349] hover:bg-[#F0F5EF] transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      + Tambah Akun Baru
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenRegister}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5A7358] hover:bg-[#485D46] text-white text-xs font-semibold transition-all shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
