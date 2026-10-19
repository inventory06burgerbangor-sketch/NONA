import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { NotesTab } from './components/NotesTab';
import { ArtGalleryTab } from './components/ArtGalleryTab';
import { PlanScheduleTab } from './components/PlanScheduleTab';
import { RegistrationModal } from './components/RegistrationModal';
import { NotificationModal } from './components/NotificationModal';
import { AlarmRingingModal } from './components/AlarmRingingModal';
import { SidebarDrawer } from './components/SidebarDrawer';
import { X, Info, BookOpen, Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, notificationMessage, clearNotification, currentUser, users } = useApp();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F9F7] text-[#283826] flex flex-col font-sans-clean selection:bg-[#CCDACC] selection:text-[#1F2B1E]">
      {/* Top Navigation */}
      <Navbar
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSideMenu={() => setIsSideMenuOpen(true)}
      />

      {/* Global Notification Banner */}
      {notificationMessage && (
        <div className="bg-[#EBF1EA] border-b border-[#CAD8C9] px-4 py-2 text-xs text-[#283826] flex items-center justify-between gap-3 animate-in slide-in-from-top-1 duration-200 shadow-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#5A7358] shrink-0" />
              <span className="font-medium text-xs">{notificationMessage}</span>
            </div>
            <button
              onClick={clearNotification}
              className="text-[#71856F] hover:text-[#1F2B1E] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* WELCOME ONBOARDING STATE IF ZERO USERS EXIST */}
      {users.length === 0 ? (
        <div className="flex-1 max-w-xl w-full mx-auto px-4 py-12 sm:py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-white border border-[#D5E1D4] shadow-md flex items-center justify-center text-[#4B6349] font-serif-display text-3xl font-bold mb-6">
            Z
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-[#1F2B1E] mb-3">
            Selamat Datang di ZAINORA Archive
          </h1>
          <p className="text-xs sm:text-sm text-[#556753] max-w-md mx-auto mb-8 leading-relaxed">
            Arsip personal dan kolaboratif dengan tiga ruang: <strong className="text-[#283826]">The Word</strong>, <strong className="text-[#283826]">The ART</strong>, dan <strong className="text-[#283826]">The Time</strong>.
          </p>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#5A7358] hover:bg-[#485D46] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Mulai & Pilih Buku Pertama Anda</span>
          </button>
        </div>
      ) : (
        /* MAIN APPLICATION CONTENT */
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
          {activeTab === 'the-word' && <NotesTab />}
          {activeTab === 'the-art' && <ArtGalleryTab />}
          {activeTab === 'the-time' && <PlanScheduleTab />}
        </main>
      )}

      {/* MENU 3 BESAR DI SAMPING (SIDEBAR DRAWER) */}
      <SidebarDrawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Modals & Audio Alerts */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AlarmRingingModal />

      {/* Modern Aesthetic Footer */}
      <footer className="border-t border-[#E2EBE1] bg-white py-5 text-center text-xs text-[#71856F]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-[#4B6349]">
            ZAINORA Archive — The Word · The ART · The Time
          </span>
          <span className="text-[11px] text-[#8FA38D]">
            {currentUser ? `Pengguna: ${currentUser.name}` : 'Belum Ada Profil'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
