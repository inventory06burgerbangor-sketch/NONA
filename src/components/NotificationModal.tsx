import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Check, X, Shield, BookOpen } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    respondPermissionRequest, 
    users 
  } = useApp();

  if (!isOpen || !currentUser) return null;

  const pendingRequests = currentUser.permissionRequests?.filter(r => r.status === 'pending') || [];
  const sentRequests = currentUser.sentRequests || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2B1E]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#D5E1D4] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto text-[#283826] shadow-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8EFE8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF1EA] border border-[#CCDACC] flex items-center justify-center text-[#4B6349]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif-display font-bold text-[#1F2B1E]">
                Izin Membuka Buku
              </h2>
              <p className="text-xs text-[#6B7E69]">
                Kelola hak akses pengguna lain ke lembaran buku Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71856F] hover:text-[#283826] hover:bg-[#F3F7F2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Permintaan Masuk (Pending) */}
          <div>
            <div className="text-xs font-bold text-[#3B4D39] uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Permintaan Masuk</span>
              <span className="text-[#5A7358] font-semibold normal-case">
                {pendingRequests.length} menunggu
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#E2EBE1] text-center text-xs text-[#71856F]">
                Tidak ada permintaan izin baru yang menunggu.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#CCDACC] flex flex-col gap-2.5 shadow-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#E2EBE1] border border-[#CCDACC] flex items-center justify-center text-[#3B4D39] font-bold text-xs shrink-0">
                        {req.requesterName.charAt(0)}
                      </div>
                      <div className="text-xs flex-1">
                        <div className="font-semibold text-[#1F2B1E]">
                          {req.requesterName}
                        </div>
                        <p className="text-[#556753] mt-0.5">
                          Meminta izin untuk membuka dan membaca isi buku Anda:{' '}
                          <span className="text-[#3B4D39] font-semibold">"{req.bookTitle}"</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8EFE8]">
                      <button
                        onClick={() => respondPermissionRequest(req.id, false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#71856F] hover:text-red-700 hover:bg-red-50 border border-transparent transition-colors"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => respondPermissionRequest(req.id, true)}
                        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#5A7358] hover:bg-[#485D46] text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Setujui Izin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pengguna yang Diberi Izin */}
          <div>
            <div className="text-xs font-bold text-[#3B4D39] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#5A7358]" />
              Pengguna yang Memiliki Akses ke Bukumu
            </div>
            {(currentUser.allowedViewerIds || []).length === 0 ? (
              <p className="text-xs text-[#71856F] italic">
                Buku ini bersifat privat (hanya Anda yang dapat membaca).
              </p>
            ) : (
              <div className="space-y-1.5">
                {currentUser.allowedViewerIds.map((uid) => {
                  const targetUser = users.find(u => u.id === uid);
                  return (
                    <div
                      key={uid}
                      className="px-3 py-2 rounded-xl bg-[#F8FAF7] border border-[#E2EBE1] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={targetUser?.avatar || ''}
                          alt=""
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-[#283826] font-semibold">
                          {targetUser?.name || uid}
                        </span>
                      </div>
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Izin Aktif
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sent Requests Status */}
          {sentRequests.length > 0 && (
            <div>
              <div className="text-xs font-bold text-[#3B4D39] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#5A7358]" />
                Permintaan Akses Anda
              </div>
              <div className="space-y-2">
                {sentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2EBE1] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="text-[#283826] font-semibold truncate max-w-[200px]">
                        Buku "{req.bookTitle}"
                      </div>
                    </div>
                    <div>
                      {req.status === 'pending' && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-amber-200">
                          Menunggu Izin
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-emerald-200">
                          Disetujui
                        </span>
                      )}
                      {req.status === 'denied' && (
                        <span className="text-red-800 bg-red-50 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-red-200">
                          Ditolak
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
