import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PhotoItem } from '../types';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Layers, 
  Grid, 
  Sparkles, 
  X, 
  Lock, 
  ZoomIn, 
  Users,
  VideoOff,
  Tag
} from 'lucide-react';
import { playCameraShutterSound } from '../utils/audio';

export const ArtGalleryTab: React.FC = () => {
  const { 
    currentUser, 
    users, 
    addPhoto, 
    deletePhoto, 
    canModifyPhoto,
    lastAddedPhotoId
  } = useApp();

  // Stacked vs Neat Grid display mode
  const [isStackedMode, setIsStackedMode] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'collab'>('all');
  
  // Upload modal / Camera modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState<string>('');
  const [selectedCollaboratorIds, setSelectedCollaboratorIds] = useState<string[]>([]);
  
  // Lightbox modal
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  // Video / camera ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // All photos across users
  const allPhotos: PhotoItem[] = users.flatMap(u => u.photos || []);

  const displayedPhotos = allPhotos.filter(p => {
    if (!currentUser) return true;
    if (filterMode === 'mine') return p.ownerId === currentUser.id;
    if (filterMode === 'collab') {
      return (p.collaborators || []).includes(currentUser.id) || (p.ownerId === currentUser.id && (p.collaborators || []).length > 0);
    }
    return true;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    setPreviewImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' } 
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera aktif pada browser.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    playCameraShutterSound();

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPreviewImage(dataUrl);
    }
    stopCamera();
  };

  const handleSavePhoto = async () => {
    if (!previewImage) return;

    await addPhoto(previewImage, captionInput.trim(), selectedCollaboratorIds);
    setIsUploadModalOpen(false);
    setPreviewImage(null);
    setCaptionInput('');
    setSelectedCollaboratorIds([]);
    stopCamera();
  };

  const toggleCollaborator = (userId: string) => {
    setSelectedCollaboratorIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const otherUsers = currentUser ? users.filter(u => u.id !== currentUser.id) : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER GALERI VISUAL (Requirement: "dibagian menu gambar Hilangkan semua tulisan di header, Cukup galeri visual.") */}
      <div className="bg-white border border-[#D5E1D4] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-serif-display font-bold text-[#1F2B1E]">
          Galeri Visual
        </h1>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Toggle Stacked vs Neat Grid */}
          <div className="flex items-center bg-[#F4F8F3] p-1 rounded-xl border border-[#D5E1D4]">
            <button
              onClick={() => setIsStackedMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isStackedMode
                  ? 'bg-[#5A7358] text-white shadow-xs'
                  : 'text-[#556753] hover:text-[#1F2B1E]'
              }`}
              title="Tertumpuk Santai"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tertumpuk</span>
            </button>
            <button
              onClick={() => setIsStackedMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isStackedMode
                  ? 'bg-[#5A7358] text-white shadow-xs'
                  : 'text-[#556753] hover:text-[#1F2B1E]'
              }`}
              title="Tata Rapi"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Tata Rapi</span>
            </button>
          </div>

          {/* Upload / Ambil Foto Button */}
          {currentUser && (
            <button
              onClick={() => {
                setIsUploadModalOpen(true);
                setPreviewImage(null);
                setSelectedCollaboratorIds([]);
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#5A7358] hover:bg-[#485D46] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Upload / Foto</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs (Semua, Foto Saya, Kolaborasi) */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-2 border-b border-[#E2EBE1] pb-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[
            { id: 'all', label: 'Semua Karya' },
            { id: 'mine', label: 'Foto Saya' },
            { id: 'collab', label: 'Kolaborasi & Tag' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as 'all' | 'mine' | 'collab')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                filterMode === tab.id
                  ? 'bg-[#EBF1EA] text-[#283826] border border-[#CCDACC]'
                  : 'text-[#6B7E69] hover:text-[#283826] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-[#71856F] text-[11px] font-mono">
          {displayedPhotos.length} foto polaroid
        </span>
      </div>

      {/* CRITICAL REQUIREMENT: "saat Upload/Foto jangan hide Hasil gambarnya" */}
      {lastAddedPhotoId && (
        <div className="p-3.5 rounded-2xl bg-[#EBF1EA] border border-[#CAD8C9] flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#5A7358] text-white flex items-center justify-center font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#1F2B1E]">
                Foto Baru Ditambahkan!
              </div>
              <div className="text-[11px] text-[#556753]">
                Hasil foto langsung tampil di tumpukan dan dapat dilihat di bawah.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const photo = allPhotos.find(p => p.id === lastAddedPhotoId);
              if (photo) setSelectedPhoto(photo);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#5A7358] text-white font-bold text-xs hover:bg-[#485D46] transition-colors shrink-0 shadow-xs"
          >
            Lihat Foto
          </button>
        </div>
      )}

      {/* GALLERY DISPLAY AREA */}
      {displayedPhotos.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-[#D5E1D4] shadow-xs">
          <Camera className="w-10 h-10 mx-auto text-[#CCDACC] mb-2.5" />
          <h3 className="font-serif-display font-semibold text-[#1F2B1E] text-sm sm:text-base">
            Galeri visual masih kosong
          </h3>
          <p className="text-xs text-[#71856F] mt-1 max-w-xs mx-auto">
            Gunakan tombol "Upload / Foto" untuk menambahkan kenangan polaroid baru serta tag akun kolaborator.
          </p>
        </div>
      ) : isStackedMode ? (
        /* STACKED POLAROID MODE (Responsive & bounded, no mobile overflow) */
        <div 
          onClick={() => setIsStackedMode(false)}
          className="relative min-h-[460px] sm:min-h-[540px] bg-[#F7F9F7] border border-[#D5E1D4] rounded-3xl p-4 sm:p-8 overflow-hidden flex items-center justify-center cursor-pointer group shadow-xs"
          title="Klik di mana saja untuk Menata Rapi!"
        >
          {/* Floating hint */}
          <div className="absolute top-3 right-3 z-30 px-3 py-1 rounded-full bg-white/90 border border-[#D5E1D4] text-[10px] text-[#4B6349] font-medium flex items-center gap-1 shadow-xs group-hover:bg-[#5A7358] group-hover:text-white transition-all">
            <Grid className="w-3 h-3" />
            <span>Klik untuk Menata Rapi</span>
          </div>

          <div className="relative w-full max-w-lg h-[360px] sm:h-[420px] flex items-center justify-center">
            {displayedPhotos.map((photo, index) => {
              const isOwner = canModifyPhoto(photo.ownerId);
              const isRecent = photo.id === lastAddedPhotoId;
              const angle = (index % 5 - 2) * 4;
              const offsetX = (index % 4 - 1.5) * 20;
              const offsetY = (index % 3 - 1) * 15;

              return (
                <div
                  key={photo.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(photo);
                  }}
                  style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) rotate(${angle}deg)`,
                    zIndex: index + 10,
                  }}
                  className={`absolute w-52 sm:w-60 bg-white p-3 pb-5 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:z-40 hover:rotate-0 cursor-pointer border border-[#CCDACC] ${
                    isRecent ? 'ring-2 ring-[#5A7358]' : ''
                  }`}
                >
                  {/* Polaroid Frame */}
                  <div className="aspect-square bg-[#E8EFE8] overflow-hidden rounded-lg relative">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <span className="p-1.5 rounded-full bg-white text-[#283826] shadow">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Caption & Collaborators */}
                  <div className="mt-2.5 px-1 text-center font-handwriting text-[#1F2B1E] text-base leading-tight truncate">
                    {photo.caption}
                  </div>

                  {/* Collaborator Tag Pill */}
                  {photo.collaborators && photo.collaborators.length > 0 && (
                    <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                      {photo.collaborators.map((cId) => {
                        const target = users.find(u => u.id === cId);
                        return (
                          <span
                            key={cId}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#EBF1EA] text-[#3B4D39] text-[9px] font-semibold"
                          >
                            <Tag className="w-2.5 h-2.5 text-[#5A7358]" />
                            @{target?.name.split(' ')[0] || 'User'}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center justify-between text-[9px] text-[#71856F] px-1 font-mono">
                    <span>{photo.ownerName.split(' ')[0]}</span>
                    <span>{photo.date}</span>
                  </div>

                  {/* Delete button (Owner only) */}
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Hapus foto polaroid ini dari galeri?')) {
                          deletePhoto(photo.id);
                        }
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow hover:bg-red-700 transition-colors"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* NEAT GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-300">
          {displayedPhotos.map((photo) => {
            const isOwner = canModifyPhoto(photo.ownerId);
            const isRecent = photo.id === lastAddedPhotoId;

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className={`bg-white p-3.5 pb-5 rounded-2xl shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer border border-[#D5E1D4] flex flex-col justify-between ${
                  isRecent ? 'ring-2 ring-[#5A7358]' : ''
                }`}
              >
                <div>
                  <div className="aspect-square bg-[#E8EFE8] overflow-hidden rounded-xl relative">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    />
                    {isRecent && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[#5A7358] text-white font-bold text-[9px] shadow-xs">
                        Baru
                      </span>
                    )}
                  </div>

                  <div className="mt-3 px-1 text-center font-handwriting text-[#1F2B1E] text-lg leading-snug">
                    {photo.caption}
                  </div>

                  {/* Collaborator Tags */}
                  {photo.collaborators && photo.collaborators.length > 0 && (
                    <div className="mt-1.5 flex items-center justify-center gap-1 flex-wrap">
                      {photo.collaborators.map((cId) => {
                        const target = users.find(u => u.id === cId);
                        return (
                          <span
                            key={cId}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-[#EBF1EA] text-[#3B4D39] text-[10px] font-semibold"
                          >
                            <Users className="w-2.5 h-2.5 text-[#5A7358]" />
                            @{target?.name || 'Rekan'}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-[#E8EFE8] flex items-center justify-between text-xs text-[#71856F] font-mono">
                  <span className="truncate max-w-[120px]">
                    Oleh: {photo.ownerName}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">{photo.date}</span>
                    {isOwner ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Hapus foto polaroid ini dari galeri?')) {
                            deletePhoto(photo.id);
                          }
                        }}
                        className="text-[#71856F] hover:text-red-700 transition-colors p-1"
                        title="Hapus foto saya"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span title="Hanya pemilik asli yang dapat menghapus foto">
                        <Lock className="w-3 h-3 text-[#CCDACC]" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD & CAMERA MODAL WITH TAG / COLLABORATION */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2B1E]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-[#D5E1D4] rounded-3xl max-w-md w-full max-h-[92vh] overflow-y-auto text-[#283826] shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8EFE8]">
              <h3 className="font-serif-display font-bold text-base text-[#1F2B1E]">
                Tambah Foto Polaroid & Kolaborasi
              </h3>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  stopCamera();
                }}
                className="p-1 rounded-lg text-[#71856F] hover:bg-[#F3F7F2]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Camera Feed or Image Preview */}
              <div className="relative aspect-square bg-[#F8FAF7] rounded-2xl overflow-hidden border border-[#D5E1D4] flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-5 text-[#8FA38D]">
                    <Camera className="w-10 h-10 mx-auto mb-2 text-[#CAD8C9]" />
                    <p className="text-xs">
                      Pilih foto atau aktifkan kamera perangkat langsung.
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-2">
                {isCameraActive ? (
                  <div className="flex gap-2">
                    <button
                      onClick={captureSnapshot}
                      className="px-4 py-2 rounded-xl bg-[#5A7358] hover:bg-[#485D46] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Camera className="w-4 h-4" />
                      Jepret Foto
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-xl bg-[#F4F8F3] text-[#3B4D39] text-xs font-semibold hover:bg-[#EBF1EA]"
                    >
                      <VideoOff className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={startCamera}
                      className="px-3.5 py-2 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#CCDACC] text-[#3B4D39] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-[#5A7358]" />
                      Buka Kamera
                    </button>

                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#CCDACC] text-[#3B4D39] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs">
                      <Upload className="w-4 h-4 text-[#5A7358]" />
                      <span>Upload Gambar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-xs font-semibold text-[#3B4D39] mb-1">
                  Keterangan Foto (Caption)
                </label>
                <input
                  type="text"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="Contoh: Sudut studio fajar bersama rekan..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8FAF7] border border-[#D5E1D4] text-xs sm:text-sm text-[#1F2B1E] placeholder:text-[#9FB19E] focus:outline-none focus:border-[#5A7358]"
                />
              </div>

              {/* KOLABORASI / TAG USER LAIN (Requirement: "tambahkan kolom kolaborasi/Tag user Account lain.") */}
              <div>
                <label className="block text-xs font-semibold text-[#3B4D39] mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#5A7358]" />
                  Kolaborasi / Tag Akun Pengguna Lain
                </label>
                {otherUsers.length === 0 ? (
                  <p className="text-[11px] text-[#71856F] italic bg-[#F8FAF7] p-2.5 rounded-xl border border-[#E2EBE1]">
                    Belum ada akun pengguna lain yang terdaftar untuk di-tag. Foto ini akan tersimpan di galeri Anda.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border border-[#D5E1D4] rounded-2xl p-2 bg-[#F8FAF7]">
                    {otherUsers.map((u) => {
                      const isTagged = selectedCollaboratorIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleCollaborator(u.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                            isTagged
                              ? 'bg-[#EBF1EA] text-[#283826] font-bold border border-[#CCDACC]'
                              : 'hover:bg-white text-[#556753]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={u.avatar} alt="" className="w-5 h-5 rounded-full" />
                            <span>{u.name}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${isTagged ? 'bg-[#5A7358] text-white' : 'text-[#71856F]'}`}>
                            {isTagged ? 'Ditandai' : '+ Tag'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="pt-3 border-t border-[#E8EFE8] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    stopCamera();
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#71856F] hover:bg-[#F3F7F2]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={!previewImage}
                  className="px-4 py-2 rounded-xl bg-[#5A7358] hover:bg-[#485D46] disabled:opacity-40 text-white font-bold text-xs transition-all shadow-xs"
                >
                  Simpan ke Galeri
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div 
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2B1E]/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-4 sm:p-6 pb-6 rounded-3xl max-w-md w-full text-[#1F2B1E] shadow-2xl relative border border-[#CCDACC]"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#283826] text-white flex items-center justify-center shadow-lg hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="aspect-square bg-[#E8EFE8] rounded-2xl overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-3.5 text-center">
              <div className="font-handwriting text-2xl text-[#1F2B1E]">
                {selectedPhoto.caption}
              </div>

              {selectedPhoto.collaborators && selectedPhoto.collaborators.length > 0 && (
                <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#71856F]">Kolaborator:</span>
                  {selectedPhoto.collaborators.map(cId => {
                    const u = users.find(usr => usr.id === cId);
                    return (
                      <span key={cId} className="px-2 py-0.5 rounded-full bg-[#EBF1EA] text-[#3B4D39] text-[10px] font-semibold">
                        @{u?.name || 'Rekan'}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 text-xs font-mono text-[#71856F] flex items-center justify-center gap-2">
                <span>Karya: {selectedPhoto.ownerName}</span>
                <span>•</span>
                <span>{selectedPhoto.date}</span>
              </div>
            </div>

            {canModifyPhoto(selectedPhoto.ownerId) && (
              <div className="mt-4 pt-3 border-t border-[#E8EFE8] flex justify-end">
                <button
                  onClick={async () => {
                    if (confirm('Hapus foto ini secara permanen?')) {
                      await deletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Foto Ini
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
