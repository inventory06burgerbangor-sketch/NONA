import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_COVERS } from '../data/initialData';
import { BookTheme, PaperTexture } from '../types';
import { Book, Image, FileText, Check, Upload, X } from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const { createUserAccount } = useApp();

  const [name, setName] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0].url);
  const [selectedTheme, setSelectedTheme] = useState<BookTheme>('botanical');
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);
  const [paperTexture, setPaperTexture] = useState<PaperTexture>('ruled');
  const [totalPages, setTotalPages] = useState<number>(20);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const result = event.target.result as string;
          setCustomCoverUrl(result);
          setSelectedCover(result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Silakan masukkan nama akun pengguna.');
      return;
    }
    if (!bookTitle.trim()) {
      setError('Silakan berikan judul untuk buku catatan Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserAccount({
        name: name.trim(),
        bookTitle: bookTitle.trim(),
        theme: selectedTheme,
        coverImage: customCoverUrl || selectedCover,
        paperTexture,
        totalPages: Math.max(5, totalPages),
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError('Terjadi kesalahan saat membuat akun.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2B1E]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#D5E1D4] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto text-[#283826] shadow-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8EFE8]">
          <div>
            <h2 className="text-lg sm:text-xl font-serif-display font-bold text-[#1F2B1E]">
              Pilih Buku & Daftarkan Akun
            </h2>
            <p className="text-xs text-[#6B7E69] mt-0.5">
              Atur sampul, lembaran kertas, dan jumlah halaman untuk buku Anda.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#71856F] hover:text-[#283826] hover:bg-[#F3F7F2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* User Name & Book Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#3B4D39] mb-1.5">
                Nama Pengguna
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Nadhira S."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#D5E1D4] text-xs sm:text-sm text-[#1F2B1E] placeholder:text-[#9FB19E] focus:outline-none focus:border-[#5A7358] focus:bg-white transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3B4D39] mb-1.5">
                Judul Buku
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="Contoh: Logika & Sketsa Harian"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#D5E1D4] text-xs sm:text-sm text-[#1F2B1E] placeholder:text-[#9FB19E] focus:outline-none focus:border-[#5A7358] focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          {/* Pilih Sampul (Preset / Upload Sendiri) */}
          <div>
            <label className="text-xs font-semibold text-[#3B4D39] block mb-2 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-[#5A7358]" />
              Pilihan Sampul Buku (Preset atau Upload Sendiri)
            </label>

            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {PRESET_COVERS.map((cov) => {
                const isSelected = selectedCover === cov.url && !customCoverUrl;
                return (
                  <button
                    key={cov.id}
                    type="button"
                    onClick={() => {
                      setSelectedCover(cov.url);
                      setSelectedTheme(cov.theme);
                      setCustomCoverUrl(null);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all group text-left ${
                      isSelected
                        ? 'border-[#5A7358] ring-2 ring-[#5A7358]/20 shadow-md'
                        : 'border-[#E2EBE1] hover:border-[#CAD8C9] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-[#F2F6F1] relative overflow-hidden">
                      <img
                        src={cov.url}
                        alt={cov.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#5A7358] text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="p-1.5 bg-white border-t border-[#E8EFE8]">
                      <div className="text-[10px] font-semibold text-[#283826] truncate">
                        {cov.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Cover Upload Field */}
            <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-dashed border-[#CCDACC] hover:border-[#5A7358] transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                {customCoverUrl ? (
                  <img
                    src={customCoverUrl}
                    alt="Custom Cover"
                    className="w-10 h-14 rounded-lg object-cover border border-[#5A7358] shrink-0"
                  />
                ) : (
                  <div className="w-10 h-14 rounded-lg bg-white border border-[#D5E1D4] flex items-center justify-center shrink-0 text-[#8FA38D]">
                    <Book className="w-5 h-5" />
                  </div>
                )}
                <div className="text-xs truncate">
                  <div className="font-semibold text-[#283826] truncate">
                    {customCoverUrl ? 'Sampul Kustom Dipilih' : 'Upload Sampul Pilihan Sendiri'}
                  </div>
                  <div className="text-[#71856F] text-[11px]">Boleh foto/gambar dari galeri</div>
                </div>
              </div>

              <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white hover:bg-[#F3F7F2] border border-[#CCDACC] text-[#3B4D39] text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs">
                <Upload className="w-3.5 h-3.5 text-[#5A7358]" />
                <span>{customCoverUrl ? 'Ganti File' : 'Pilih File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Tekstur Kertas */}
          <div>
            <label className="text-xs font-semibold text-[#3B4D39] block mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#5A7358]" />
              Tekstur Kertas Halaman
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'ruled', name: 'Garis (Ruled)' },
                { id: 'grid', name: 'Kotak (Grid)' },
                { id: 'parchment', name: 'Parchment' },
                { id: 'blank', name: 'Polos (Blank)' },
              ].map((tex) => (
                <button
                  key={tex.id}
                  type="button"
                  onClick={() => setPaperTexture(tex.id as PaperTexture)}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                    paperTexture === tex.id
                      ? 'border-[#5A7358] bg-[#EBF1EA] text-[#283826] font-bold shadow-xs'
                      : 'border-[#E2EBE1] bg-[#F8FAF7] text-[#6B7E69] hover:bg-white'
                  }`}
                >
                  {tex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Jumlah Halaman */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#3B4D39]">
                Jumlah Halaman
              </label>
              <span className="text-xs font-bold text-[#4B6349] font-mono">
                {totalPages} Halaman
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={totalPages}
              onChange={(e) => setTotalPages(Number(e.target.value))}
              className="w-full accent-[#5A7358] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#71856F] mt-1 font-mono">
              <span>10 Hal</span>
              <span>30 Hal</span>
              <span>50 Hal</span>
              <span>100 Hal</span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-[#E8EFE8] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7E69] hover:bg-[#F3F7F2]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#5A7358] hover:bg-[#485D46] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
            >
              {isSubmitting ? 'Menyimpan...' : 'Buka & Mulai Buku Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
