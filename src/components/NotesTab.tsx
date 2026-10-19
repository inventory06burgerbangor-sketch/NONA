import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Book } from '../types';
import { 
  Plus, 
  Scissors, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Send, 
  Check, 
  Edit3, 
  FileText, 
  Archive,
  X
} from 'lucide-react';
import { playPenStrokeSound } from '../utils/audio';

export const NotesTab: React.FC = () => {
  const { 
    currentUser, 
    users, 
    viewingBook, 
    setViewingBook, 
    canViewBook, 
    canModifyBook, 
    requestBookAccess, 
    deleteBook,
    activePageNumber,
    setActivePageNumber,
    addSnippetToPage,
    updateSnippet,
    deleteSnippet,
    addNewPage,
    tearActivePage
  } = useApp();

  // Writing toolbar state
  const [isWritingMode, setIsWritingMode] = useState<boolean>(true);
  const [selectedFont, setSelectedFont] = useState<'handwriting' | 'serif' | 'sans' | 'mono'>('handwriting');
  const [selectedColor, setSelectedColor] = useState<string>('#2E3D2C');
  const [selectedFontSize, setSelectedFontSize] = useState<number>(20);
  
  // Interactive editing snippet state
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [activeNewSnippet, setActiveNewSnippet] = useState<{ x: number; y: number } | null>(null);
  const [newSnippetText, setNewSnippetText] = useState<string>('');
  
  // View scraps archive toggle
  const [showScrapsArchive, setShowScrapsArchive] = useState<boolean>(false);
  const [isTearingAnimation, setIsTearingAnimation] = useState<boolean>(false);

  const paperRef = useRef<HTMLDivElement>(null);

  // If no user exists yet
  if (!currentUser) {
    return (
      <div className="bg-white border border-[#D5E1D4] rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#EBF1EA] border border-[#CCDACC] text-[#4B6349] flex items-center justify-center mx-auto mb-4 font-serif-display text-2xl font-bold">
          Z
        </div>
        <h2 className="text-xl font-serif-display font-bold text-[#1F2B1E] mb-2">
          Selamat Datang di ZAINORA Archive
        </h2>
        <p className="text-xs text-[#556753] mb-6 leading-relaxed">
          Belum ada profil pengguna yang terdaftar. Buat akun pertama Anda untuk memulai The Word (Rak Buku & Catatan).
        </p>
      </div>
    );
  }

  const currentBook: Book = viewingBook || currentUser.book;
  const isOwner = canModifyBook(currentBook.ownerId);
  const hasAccess = canViewBook(currentBook.ownerId);

  // Check if current user has already requested access
  const hasPendingRequest = currentUser.sentRequests?.some(
    r => r.targetOwnerId === currentBook.ownerId && r.status === 'pending'
  );

  const totalPagesCount = currentBook.pages?.length || 1;
  const currentPage = currentBook.pages?.find(p => p.pageNumber === activePageNumber) || currentBook.pages?.[0];

  // Handle clicking on the paper to place text anywhere on the page
  const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isWritingMode || !isOwner) return;
    if (editingSnippetId !== null) return;

    const rect = paperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.max(4, Math.min(75, Math.round((clickX / rect.width) * 100)));
    const yPercent = Math.max(4, Math.min(85, Math.round((clickY / rect.height) * 100)));

    setActiveNewSnippet({ x: xPercent, y: yPercent });
    setNewSnippetText('');
    playPenStrokeSound();
  };

  const handleSaveNewSnippet = async () => {
    if (!activeNewSnippet || !newSnippetText.trim() || !currentPage) return;

    await addSnippetToPage(currentPage.id, {
      x: activeNewSnippet.x,
      y: activeNewSnippet.y,
      text: newSnippetText.trim(),
      fontStyle: selectedFont,
      fontSize: selectedFontSize,
      color: selectedColor,
      rotation: Math.floor(Math.random() * 4) - 2,
    });

    playPenStrokeSound();
    setActiveNewSnippet(null);
    setNewSnippetText('');
  };

  const handleSaveEditSnippet = async (snippetId: string) => {
    if (!currentPage || !editingText.trim()) return;
    await updateSnippet(currentPage.id, snippetId, editingText.trim());
    setEditingSnippetId(null);
    setEditingText('');
  };

  const handleTearPage = async () => {
    if (!isOwner || !currentPage) return;
    if (confirm('Apakah Anda ingin menyobek halaman ini? Halaman akan dipindahkan ke arsip sobekan.')) {
      setIsTearingAnimation(true);
      setTimeout(async () => {
        await tearActivePage(currentBook.id, currentPage.id);
        setIsTearingAnimation(false);
      }, 300);
    }
  };

  const handleDeleteBook = async () => {
    if (!isOwner) {
      alert('Peringatan: Anda hanya bisa menghapus buku milik Anda sendiri!');
      return;
    }
    if (confirm('Apakah Anda yakin ingin mengosongkan/mereset isi buku ini?')) {
      await deleteBook(currentBook.id);
    }
  };

  const otherUsers = users.filter(u => u.id !== currentUser.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* RAK BUKU HEADER (Requirement: "Di bagian Rak Buku, Hilangkan semua tulisan di header, Cukup Rak buku saja.") */}
      <div className="bg-white border border-[#D5E1D4] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-serif-display font-bold text-[#1F2B1E]">
          Rak Buku
        </h1>

        {/* Book Selector Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            onClick={() => setViewingBook(currentUser.book)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentBook.ownerId === currentUser.id
                ? 'bg-[#5A7358] text-white shadow-xs'
                : 'bg-[#F4F8F3] text-[#4B6349] hover:bg-[#EBF1EA] border border-[#CCDACC]'
            }`}
          >
            Buku Saya ({currentUser.name})
          </button>

          {otherUsers.map((u) => {
            const isSelected = currentBook.ownerId === u.id;
            const hasFriendAccess = canViewBook(u.id);

            return (
              <button
                key={u.id}
                onClick={() => setViewingBook(u.book)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#5A7358] text-white shadow-xs'
                    : 'bg-[#F4F8F3] text-[#4B6349] hover:bg-[#EBF1EA] border border-[#CCDACC]'
                }`}
              >
                {!hasFriendAccess && <Lock className="w-3 h-3 text-[#71856F]" />}
                <span>Buku {u.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACCESS LOCKED VIEW */}
      {!hasAccess ? (
        <div className="bg-white border border-[#D5E1D4] rounded-3xl p-6 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="relative w-36 sm:w-44 mx-auto mb-5 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-2 border-[#CCDACC]">
            <img
              src={currentBook.coverImage}
              alt={currentBook.title}
              className="w-full h-full object-cover filter blur-[2px] opacity-75"
            />
            <div className="absolute inset-0 bg-[#1F2B1E]/60 flex flex-col items-center justify-center p-4">
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white mb-1.5">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">Buku Terkunci</span>
            </div>
          </div>

          <h2 className="text-xl font-serif-display font-bold text-[#1F2B1E] mb-1">
            "{currentBook.title}"
          </h2>
          <p className="text-xs sm:text-sm text-[#556753] max-w-sm mx-auto mb-5 leading-relaxed">
            Buku ini adalah milik <strong className="text-[#1F2B1E]">{currentBook.ownerName}</strong>. 
            Anda memerlukan izin dari pemilik buku untuk membuka lembaran tulisan ini.
          </p>

          {hasPendingRequest ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EBF1EA] border border-[#CAD8C9] text-[#3B4D39] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#5A7358] animate-pulse" />
              Permintaan Izin Terkirim — Menunggu Konfirmasi {currentBook.ownerName}
            </div>
          ) : (
            <button
              onClick={() => requestBookAccess(currentBook.ownerId)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5A7358] hover:bg-[#485D46] text-white text-xs font-bold transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Izin Buka ke {currentBook.ownerName}
            </button>
          )}
        </div>
      ) : (
        /* BOOK OPEN VIEW */
        <div className="space-y-3 sm:space-y-4">
          {/* Action Toolbar */}
          <div className="bg-white border border-[#D5E1D4] rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
            {/* Page Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={activePageNumber <= 1}
                onClick={() => setActivePageNumber(Math.max(1, activePageNumber - 1))}
                className="p-2 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#D5E1D4] disabled:opacity-40 disabled:pointer-events-none text-[#3B4D39]"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1.5 rounded-xl bg-[#F8FAF7] border border-[#D5E1D4] text-xs font-mono font-bold text-[#3B4D39]">
                Hal {activePageNumber} / {totalPagesCount}
              </div>

              <button
                disabled={activePageNumber >= totalPagesCount}
                onClick={() => setActivePageNumber(Math.min(totalPagesCount, activePageNumber + 1))}
                className="p-2 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#D5E1D4] disabled:opacity-40 disabled:pointer-events-none text-[#3B4D39]"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Editing Controls */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {isOwner && (
                <button
                  onClick={() => setIsWritingMode(!isWritingMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isWritingMode
                      ? 'bg-[#5A7358] text-white shadow-xs'
                      : 'bg-[#F4F8F3] text-[#3B4D39] hover:bg-[#EBF1EA] border border-[#D5E1D4]'
                  }`}
                  title="Klik di mana saja di atas kertas untuk menulis"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isWritingMode ? 'Mode Tulis Aktif' : 'Lanjutkan Tulisan'}</span>
                </button>
              )}

              {isOwner && (
                <button
                  onClick={() => addNewPage(currentBook.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4F8F3] hover:bg-[#EBF1EA] border border-[#D5E1D4] text-[#3B4D39] text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#5A7358]" />
                  <span>Halaman Baru</span>
                </button>
              )}

              {isOwner && (
                <button
                  onClick={handleTearPage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-700 text-xs font-semibold transition-colors"
                  title="Sobek lembaran halaman ini"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Sobek</span>
                </button>
              )}

              <button
                onClick={() => setShowScrapsArchive(!showScrapsArchive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  showScrapsArchive
                    ? 'bg-[#EBF1EA] text-[#283826] border border-[#CAD8C9]'
                    : 'bg-[#F4F8F3] text-[#556753] hover:bg-[#EBF1EA] border border-[#D5E1D4]'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Sobekan ({currentBook.tornScraps?.length || 0})</span>
              </button>

              <button
                onClick={handleDeleteBook}
                disabled={!isOwner}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isOwner
                    ? 'text-[#71856F] hover:text-red-700 hover:bg-red-50'
                    : 'opacity-40 cursor-not-allowed text-stone-400'
                }`}
                title={isOwner ? 'Reset Buku Saya' : 'Anda tidak dapat menghapus buku orang lain'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {!isOwner && <Lock className="w-2.5 h-2.5 ml-0.5" />}
              </button>
            </div>
          </div>

          {/* Writing Tools Bar */}
          {isWritingMode && isOwner && (
            <div className="bg-[#F8FAF7] border border-[#D5E1D4] rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <span className="text-[#556753] text-[11px] font-medium hidden sm:inline">
                Sentuh/klik di sudut mana pun di atas lembar kertas untuk menempatkan tulisan.
              </span>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Font Selector */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#D5E1D4]">
                  <button
                    onClick={() => setSelectedFont('handwriting')}
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      selectedFont === 'handwriting' ? 'bg-[#5A7358] text-white font-bold' : 'text-[#556753]'
                    }`}
                  >
                    Tangan
                  </button>
                  <button
                    onClick={() => setSelectedFont('serif')}
                    className={`px-2 py-1 rounded-lg text-xs font-serif transition-colors ${
                      selectedFont === 'serif' ? 'bg-[#5A7358] text-white font-bold' : 'text-[#556753]'
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => setSelectedFont('sans')}
                    className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                      selectedFont === 'sans' ? 'bg-[#5A7358] text-white font-bold' : 'text-[#556753]'
                    }`}
                  >
                    Modern
                  </button>
                  <button
                    onClick={() => setSelectedFont('mono')}
                    className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors ${
                      selectedFont === 'mono' ? 'bg-[#5A7358] text-white font-bold' : 'text-[#556753]'
                    }`}
                  >
                    Ketik
                  </button>
                </div>

                {/* Ink Color Picker */}
                <div className="flex items-center gap-1.5">
                  {[
                    { color: '#2E3D2C', title: 'Sage Gelap' },
                    { color: '#1E3A8A', title: 'Biru Tua' },
                    { color: '#4A5568', title: 'Arang' },
                    { color: '#78350F', title: 'Sepia' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setSelectedColor(c.color)}
                      title={c.title}
                      style={{ backgroundColor: c.color }}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        selectedColor === c.color ? 'scale-125 ring-2 ring-[#5A7358] ring-offset-2 ring-offset-white' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>

                {/* Font Size */}
                <select
                  value={selectedFontSize}
                  onChange={(e) => setSelectedFontSize(Number(e.target.value))}
                  className="bg-white border border-[#D5E1D4] rounded-xl px-2 py-1 text-[#283826] text-xs focus:outline-none"
                >
                  <option value={16}>16px</option>
                  <option value={20}>20px</option>
                  <option value={24}>24px</option>
                  <option value={28}>28px</option>
                </select>
              </div>
            </div>
          )}

          {/* ARSIP SOBEKAN VIEW */}
          {showScrapsArchive && (
            <div className="p-4 sm:p-5 bg-white border border-[#D5E1D4] rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-[#5A7358]" />
                  <h3 className="font-serif-display font-bold text-[#1F2B1E] text-sm">
                    Arsip Sobekan Kertas
                  </h3>
                </div>
                <button
                  onClick={() => setShowScrapsArchive(false)}
                  className="text-[#71856F] hover:text-[#1F2B1E] text-xs font-semibold"
                >
                  Tutup Arsip
                </button>
              </div>

              {(!currentBook.tornScraps || currentBook.tornScraps.length === 0) ? (
                <div className="text-xs text-[#71856F] italic text-center py-5">
                  Belum ada halaman yang disobek. Gunakan tombol "Sobek" untuk merobek lembaran aktif.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {currentBook.tornScraps.map((scrap, idx) => (
                    <div
                      key={scrap.id || idx}
                      className="p-4 bg-[#F8FAF7] rounded-xl shadow-xs torn-top border border-[#CCDACC] text-[#283826]"
                    >
                      <div className="flex justify-between items-start text-[10px] text-[#71856F] mb-2 border-b border-[#E2EBE1] pb-1 font-mono">
                        <span>Lembaran Sobek #{idx + 1}</span>
                        <span>{scrap.tornAt ? new Date(scrap.tornAt).toLocaleDateString('id-ID') : 'Terarsip'}</span>
                      </div>
                      <div className="space-y-1.5 min-h-[70px]">
                        {scrap.snippets.map((snip) => (
                          <div
                            key={snip.id}
                            style={{ color: snip.color, fontSize: `${Math.min(16, snip.fontSize)}px` }}
                            className={snip.fontStyle === 'handwriting' ? 'font-handwriting' : snip.fontStyle === 'serif' ? 'font-serif' : 'font-sans-clean'}
                          >
                            {snip.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* THE REALISTIC SAGE & WHITE PAPER CANVAS */}
          <div className="relative mx-auto max-w-4xl shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D5E1D4] bg-[#F4F8F3] p-2 sm:p-4">
            {/* Paper Sheet */}
            <div
              ref={paperRef}
              onClick={handlePaperClick}
              className={`relative min-h-[580px] sm:min-h-[660px] w-full rounded-xl sm:rounded-2xl p-4 sm:p-10 transition-all cursor-crosshair select-none ${
                currentBook.paperTexture === 'ruled'
                  ? 'paper-ruled'
                  : currentBook.paperTexture === 'grid'
                  ? 'paper-grid'
                  : currentBook.paperTexture === 'parchment'
                  ? 'paper-parchment'
                  : 'paper-blank'
              } ${isTearingAnimation ? 'opacity-0 translate-y-6 rotate-2 duration-300' : 'opacity-100 duration-200'}`}
              style={{
                boxShadow: '0 4px 20px rgba(40,54,38,0.06)',
              }}
            >
              {/* Paper Header / Watermark */}
              <div className="flex justify-between items-center text-xs text-[#8FA38D] mb-4 sm:mb-6 font-serif select-none pointer-events-none border-b border-[#E2EBE1] pb-1.5">
                <span className="italic truncate max-w-[200px] sm:max-w-md">
                  {currentBook.title} — {currentPage?.title || `Halaman ${activePageNumber}`}
                </span>
                <span className="font-mono text-[#8FA38D] text-[11px] shrink-0">
                  Hal. {activePageNumber}
                </span>
              </div>

              {/* Sage margin line */}
              <div className="absolute top-0 bottom-0 left-8 sm:left-14 w-[1px] bg-[#CCDACC]/60 pointer-events-none" />

              {/* RENDER PLACED TEXT SNIPPETS ANYWHERE ON PAPER */}
              {currentPage?.snippets.map((snip) => {
                const isEditing = editingSnippetId === snip.id;
                const fontClass =
                  snip.fontStyle === 'handwriting'
                    ? 'font-handwriting'
                    : snip.fontStyle === 'serif'
                    ? 'font-serif-display'
                    : snip.fontStyle === 'mono'
                    ? 'font-mono'
                    : 'font-sans-clean';

                return (
                  <div
                    key={snip.id}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      left: `${snip.x}%`,
                      top: `${snip.y}%`,
                      transform: `rotate(${snip.rotation}deg)`,
                      color: snip.color,
                      fontSize: `${snip.fontSize}px`,
                      lineHeight: '1.4',
                    }}
                    className={`absolute group max-w-[85%] sm:max-w-md p-1.5 rounded-lg transition-shadow ${
                      isOwner ? 'hover:bg-[#EBF1EA]/70 hover:ring-1 hover:ring-[#CAD8C9] cursor-pointer' : ''
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl shadow-lg border border-[#CAD8C9]">
                        <textarea
                          rows={3}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full text-[#1F2B1E] bg-transparent text-sm focus:outline-none resize-none font-sans"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-[#E8EFE8]">
                          <button
                            onClick={() => setEditingSnippetId(null)}
                            className="p-1 rounded-lg text-[#71856F] hover:bg-[#F3F7F2]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleSaveEditSnippet(snip.id)}
                            className="p-1 rounded-lg bg-[#5A7358] text-white hover:bg-[#485D46]"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (isOwner) {
                            setEditingSnippetId(snip.id);
                            setEditingText(snip.text);
                          }
                        }}
                        className={`whitespace-pre-wrap ${fontClass}`}
                      >
                        {snip.text}
                      </div>
                    )}

                    {/* Owner controls */}
                    {isOwner && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 right-0 flex items-center gap-1 bg-[#283826] text-white px-1.5 py-0.5 rounded shadow text-[10px]">
                        <button
                          onClick={() => {
                            setEditingSnippetId(snip.id);
                            setEditingText(snip.text);
                          }}
                          className="hover:text-amber-200 p-0.5"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteSnippet(currentPage.id, snip.id)}
                          className="hover:text-red-300 p-0.5"
                          title="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* NEW SNIPPET MODAL ON CLICK */}
              {activeNewSnippet && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    left: `${Math.min(65, activeNewSnippet.x)}%`,
                    top: `${Math.min(75, activeNewSnippet.y)}%`,
                  }}
                  className="absolute z-30 max-w-[90vw] w-72 bg-white rounded-2xl shadow-xl border border-[#CAD8C9] p-3 text-[#283826] animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E8EFE8] text-[11px] text-[#556753]">
                    <span className="font-semibold text-[#3B4D39]">Tulis di Sudut Kertas</span>
                    <button
                      onClick={() => setActiveNewSnippet(null)}
                      className="text-[#71856F] hover:text-[#1F2B1E]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={newSnippetText}
                    onChange={(e) => setNewSnippetText(e.target.value)}
                    placeholder="Mulai ketik di sudut kertas..."
                    className="w-full text-[#1F2B1E] bg-transparent text-xs sm:text-sm focus:outline-none resize-none placeholder:text-[#9FB19E]"
                    autoFocus
                  />

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#E8EFE8] text-xs">
                    <button
                      onClick={() => setActiveNewSnippet(null)}
                      className="px-2.5 py-1 rounded-lg text-[#71856F] hover:bg-[#F3F7F2] text-xs"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveNewSnippet}
                      disabled={!newSnippetText.trim()}
                      className="px-3.5 py-1 rounded-xl bg-[#5A7358] hover:bg-[#485D46] disabled:opacity-40 text-white font-bold text-xs shadow-xs"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state hint */}
              {(!currentPage?.snippets || currentPage.snippets.length === 0) && !activeNewSnippet && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none select-none text-[#8FA38D]">
                  <FileText className="w-8 h-8 mb-2 stroke-1 text-[#CAD8C9]" />
                  <p className="font-serif italic text-sm sm:text-base text-[#556753]">Lembaran ini masih kosong.</p>
                  <p className="text-[11px] text-[#71856F] mt-1 max-w-xs">
                    {isOwner
                      ? 'Klik di mana saja di atas kertas untuk menorehkan tulisan bebas.'
                      : 'Pemilik belum menambahkan tulisan pada halaman ini.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
