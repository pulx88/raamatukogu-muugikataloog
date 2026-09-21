import React, { useState, useEffect } from 'react';
import { Book, BookCondition, BookStatus } from '../types';
import { compressImage } from '../lib/storage';
import { CameraModal } from './CameraModal';
import { X, Upload, Camera, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';

interface BookFormModalProps {
  isOpen: boolean;
  bookToEdit?: Book | null;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
}

const CATEGORIES = [
  'Eesti klassika',
  'Eesti nüüdiskirjandus',
  'Maailmakirjandus',
  'Ajalugu & Biograafiad',
  'Krimi & Põnevik',
  'Fantaasia & Ulme',
  'Lastekirjandus',
  'Luule & Draama',
  'Filosoofia & Religioon',
  'Teadus & Tehnika',
  'Kokandus & Kodu',
  'Antiikne & Haruldane',
  'Muu',
];

const CONDITIONS: BookCondition[] = ['Uueväärne', 'Väga hea', 'Hea', 'Rahuldav', 'Antiikne'];

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  bookToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState<number | string>(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<number | string>(15);
  const [price, setPrice] = useState<number | string>(10);
  const [category, setCategory] = useState('Eesti klassika');
  const [language, setLanguage] = useState('Eesti');
  const [condition, setCondition] = useState<BookCondition>('Hea');
  const [status, setStatus] = useState<BookStatus>('available');
  const [publisher, setPublisher] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title || '');
      setAuthor(bookToEdit.author || '');
      setYear(bookToEdit.year || new Date().getFullYear());
      setDescription(bookToEdit.description || '');
      setValue(bookToEdit.value ?? 15);
      setPrice(bookToEdit.price ?? 10);
      setCategory(bookToEdit.category || 'Eesti klassika');
      setLanguage(bookToEdit.language || 'Eesti');
      setCondition(bookToEdit.condition || 'Hea');
      setStatus(bookToEdit.status || 'available');
      setPublisher(bookToEdit.publisher || '');
      setNotes(bookToEdit.notes || '');
      setPhotoUrl(bookToEdit.photoUrl || '');
    } else {
      // Reset for new book
      setTitle('');
      setAuthor('');
      setYear(new Date().getFullYear());
      setDescription('');
      setValue(15);
      setPrice(10);
      setCategory('Eesti klassika');
      setLanguage('Eesti');
      setCondition('Hea');
      setStatus('available');
      setPublisher('');
      setNotes('');
      setPhotoUrl('');
    }
    setScanMessage(null);
    setScanError(null);
  }, [bookToEdit, isOpen]);

  const handleFileUpload = async (file: File) => {
    try {
      const compressed = await compressImage(file, 1200, 0.85);
      setPhotoUrl(compressed);
      setScanMessage('Foto on edukalt üles laaditud! Saad nüüd kasutada ka tehisintellekti tuvastust.');
      setScanError(null);
    } catch (err) {
      console.error('Pildi tihendamise viga:', err);
      setScanError('Pildi töötlemine ebaõnnestus.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // AI Book Scan using server-side Gemini 3.8 Flash
  const handleScanWithAi = async () => {
    if (!photoUrl && !title) {
      setScanError('Palun laadi esmalt üles foto või sisesta vähemalt esialgne pealkiri.');
      return;
    }

    setIsScanning(true);
    setScanMessage(null);
    setScanError(null);

    try {
      const res = await fetch('/api/scan-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoUrl,
          existingTitle: title,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Raamatu analüüsimine ebaõnnestus.');
      }

      const data = json.data;
      if (data.title) setTitle(data.title);
      if (data.author) setAuthor(data.author);
      if (data.year) setYear(data.year);
      if (data.description) setDescription(data.description);
      if (data.estimatedValue) setValue(data.estimatedValue);
      if (data.suggestedPrice) setPrice(data.suggestedPrice);
      if (data.category) setCategory(data.category);
      if (data.language) setLanguage(data.language);
      if (data.condition) setCondition(data.condition);

      setScanMessage('✨ Raamat tuvastatud! Kontrolli ja kohanda vajadusel andmeid.');
    } catch (err: any) {
      console.error('AI tuvastuse viga:', err);
      setScanError(err?.message || 'Tuvastamisel tekkis tõrge. Saad andmed sisestada käsitsi.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setScanError('Pealkiri ja autor on kohustuslikud väljad.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        {
          title: title.trim(),
          author: author.trim(),
          year: Number(year) || new Date().getFullYear(),
          description: description.trim(),
          value: Number(value) || 0,
          price: Number(price) || 0,
          category,
          language: language.trim() || 'Eesti',
          condition,
          status,
          publisher: publisher.trim(),
          notes: notes.trim(),
          photoUrl: photoUrl || '',
        },
        bookToEdit ? bookToEdit.id : undefined
      );
      onClose();
    } catch (err: any) {
      setScanError('Salvestamisel tekkis tõrge: ' + err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        id="book-form-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
        onClick={onClose}
      >
        <div
          id="book-form-modal-card"
          className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-amber-900/10 my-8 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-amber-50/40">
            <div>
              <h2 className="font-serif-title text-xl md:text-2xl font-bold text-stone-900">
                {bookToEdit ? 'Muuda raamatu andmeid' : 'Lisa uus raamat'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Täida väljad, laadi üles foto või kasuta tehisintellekti automaatset tuvastust
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Status Messages */}
            {scanMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{scanMessage}</span>
              </div>
            )}
            {scanError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2 border border-rose-200">
                <span>{scanError}</span>
              </div>
            )}

            {/* Photo Upload & AI Scan Section */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-900/10 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                Raamatu foto
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Image Preview Box */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="w-32 h-44 rounded-xl border-2 border-dashed border-amber-300 bg-white flex flex-col items-center justify-center relative overflow-hidden shrink-0 group"
                >
                  {photoUrl ? (
                    <>
                      <img
                        src={photoUrl}
                        alt="Raamatu eelvaade"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eemalda foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-stone-400">
                      <ImageIcon className="w-8 h-8 mb-1 text-amber-600/50 stroke-1" />
                      <span className="text-[10px] leading-tight">Lohista pilt siia</span>
                    </div>
                  )}
                </div>

                {/* Upload Buttons */}
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <div className="flex flex-wrap gap-2">
                    <label className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-4 h-4 text-amber-700" />
                      <span>Vali fail seadmest</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="py-2 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Camera className="w-4 h-4 text-amber-700" />
                      <span>Pildista</span>
                    </button>
                  </div>

                  {/* AI Scan Trigger Button */}
                  <button
                    id="ai-scan-book-btn"
                    type="button"
                    onClick={handleScanWithAi}
                    disabled={isScanning || (!photoUrl && !title)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analüüsin raamatu fotot...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>✨ Tuvasta info pildilt automaatselt (AI)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-stone-500">
                    AI loeb kaanelt pealkirja, autori, aasta, pakub kokkuvõtte ja soovitab hinda.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Fields: Title and Author */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Raamatu pealkiri *
                </label>
                <input
                  id="book-title-input"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="nt Kevade"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Autor *
                </label>
                <input
                  id="book-author-input"
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="nt Oskar Luts"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Year, Price, Value */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Väljalaske aasta *
                </label>
                <input
                  id="book-year-input"
                  type="number"
                  required
                  min="1500"
                  max="2035"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Müügihind (€) *
                </label>
                <input
                  id="book-price-input"
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Hinnanguline väärtus (€)
                </label>
                <input
                  id="book-value-input"
                  type="number"
                  step="0.5"
                  min="0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Category, Language, Condition, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Kategooria / Žanr
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Keel
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                >
                  {['Eesti', 'Inglise', 'Vene', 'Saksa', 'Soome', 'Prantsuse', 'Rootsi', 'Muu'].map((l) => (
                    <option key={l} value={l}>
                      {l} keel
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Seisukord
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as BookCondition)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Müügistaatus
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
                >
                  <option value="available">Müügis</option>
                  <option value="reserved">Broneeritud</option>
                  <option value="sold">Müüdud</option>
                </select>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-stone-700">
                  Lühitutvustus
                </label>
                <span className="text-[11px] text-stone-400">2-3 lauset sisu kohta</span>
              </div>
              <textarea
                id="book-description-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kirjelda lühidalt raamatu tegevustikku või sisu..."
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm leading-relaxed"
              />
            </div>

            {/* Publisher and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Kirjastus (valikuline)
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="nt Eesti Raamat, Noor-Eesti, Varrak"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Märkused (nt köite omapära, ostja nimi jne)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="nt Kaaned terved, autogrammiga"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
              >
                Loobu
              </button>
              <button
                id="save-book-submit-btn"
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-6 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvestan...</span>
                  </>
                ) : (
                  <span>{bookToEdit ? 'Salvesta muudatused' : 'Lisa raamat kataloogi'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setPhotoUrl(dataUrl);
          setScanMessage('Foto tehtud! Saad soovi korral käivitada ka AI automaattuvastuse.');
        }}
      />
    </>
  );
};
