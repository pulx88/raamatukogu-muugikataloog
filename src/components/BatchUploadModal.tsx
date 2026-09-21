import React, { useState } from 'react';
import { Book } from '../types';
import { compressImage } from '../lib/storage';
import { extractImagesFromZip, extractImagesFromPdf } from '../lib/archiveExtractor';
import {
  X,
  Upload,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileArchive,
  FolderOpen,
  Image as ImageIcon,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBooks: (books: Book[]) => Promise<void>;
}

interface PendingItem {
  id: string;
  previewUrl: string;
  title: string;
  author: string;
  year: number;
  price: number;
  value: number;
  description: string;
  category: string;
  publisher?: string;
  yearReasoning?: string;
  yearConfidence?: 'high' | 'medium' | 'approximate';
  status: 'pending' | 'scanning' | 'ready' | 'error';
  errorMessage?: string;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onAddBooks,
}) => {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUnpacking, setIsUnpacking] = useState(false);
  const [unpackingStatus, setUnpackingStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Process any incoming file: ZIP archive, PDF document, folder of images, or multiple images
  const processIncomingFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploadError(null);
    const newPendingItems: PendingItem[] = [];

    for (const file of files) {
      const lowerName = file.name.toLowerCase();

      // Check if it's a ZIP archive
      const isZip =
        lowerName.endsWith('.zip') ||
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed' ||
        file.type === 'application/x-zip' ||
        file.type === 'multipart/x-zip';

      if (isZip) {
        setIsUnpacking(true);
        setUnpackingStatus(`Pakin lahti Google Fotode ZIP arhiivi "${file.name}"...`);

        try {
          const extracted = await extractImagesFromZip(file, (curr, total, name) => {
            setUnpackingStatus(`Loen arhiivist pilti ${curr}/${total}: ${name}`);
          });

          for (const ext of extracted) {
            newPendingItems.push({
              id: ext.id,
              previewUrl: ext.dataUrl,
              title: ext.titleHint || ext.name.replace(/\.[^/.]+$/, ''),
              author: 'Määramata autor',
              year: new Date().getFullYear(),
              price: 10,
              value: 15,
              description: ext.descriptionHint || '',
              category: 'Muu',
              status: 'pending',
            });
          }
        } catch (err: any) {
          console.error('ZIP arhiivi lahtipakkimise viga:', err);
          setUploadError(
            'ZIP faili lahtipakkimise tõrge: ' +
              (err?.message || 'Tundmatu formaat.') +
              ' Kui fotod on arvutis juba lahti pakitud, kasuta allolevat nuppu "Vali fotode kaust".'
          );
        } finally {
          setIsUnpacking(false);
          setUnpackingStatus('');
        }
      }
      // Check if it's a PDF document
      else if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
        setIsUnpacking(true);
        setUnpackingStatus(`Töötlen PDF faili lehekülgi "${file.name}"...`);

        try {
          const extracted = await extractImagesFromPdf(file, (curr, total) => {
            setUnpackingStatus(`Renderdan PDF lehekülge ${curr}/${total}...`);
          });

          for (const ext of extracted) {
            newPendingItems.push({
              id: ext.id,
              previewUrl: ext.dataUrl,
              title: ext.titleHint || `Raamat lk`,
              author: 'Määramata autor',
              year: new Date().getFullYear(),
              price: 10,
              value: 15,
              description: '',
              category: 'Muu',
              status: 'pending',
            });
          }
        } catch (err: any) {
          console.error('PDF töötlemise viga:', err);
          setUploadError('PDF faili töötlemisel tekkis tõrge: ' + (err?.message || 'Tundmatu formaat'));
        } finally {
          setIsUnpacking(false);
          setUnpackingStatus('');
        }
      }
      // Check if it's an image
      else if (
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|tiff?)$/i.test(lowerName)
      ) {
        try {
          const previewUrl = await compressImage(file, 1200, 0.85);
          const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          newPendingItems.push({
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            previewUrl,
            title: cleanTitle,
            author: 'Määramata autor',
            year: new Date().getFullYear(),
            price: 10,
            value: 15,
            description: '',
            category: 'Muu',
            status: 'pending',
          });
        } catch (err) {
          console.error('Pildi tihendamise viga:', err);
        }
      } else {
        // Unknown file
        console.warn('Tundmatu failitüüp:', file.name, file.type);
      }
    }

    if (newPendingItems.length > 0) {
      setItems((prev) => [...prev, ...newPendingItems]);
    } else if (!uploadError && files.length > 0 && !files.some((f) => f.name.toLowerCase().endsWith('.zip'))) {
      setUploadError('Valitud failide hulgast ei leitud pilte ega ZIP-arhiivi. Vali palun pildifailid (.jpg, .png) või ZIP-fail.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processIncomingFiles(e.target.files);
    e.target.value = '';
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Run AI identification sequentially across all pending items
  const handleAutoScanAll = async () => {
    setIsProcessing(true);
    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (item.status === 'ready') continue;

      item.status = 'scanning';
      setProgressText(`Tuvastan raamatut ${i + 1} / ${updated.length}: "${item.title}"...`);
      setItems([...updated]);

      try {
        const res = await fetch('/api/scan-book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: item.previewUrl,
            existingTitle: item.title,
            existingAuthor: item.author !== 'Määramata autor' ? item.author : undefined,
            currentYear: item.year !== new Date().getFullYear() ? item.year : undefined,
          }),
        });

        const json = await res.json();
        if (json.success && json.data) {
          item.title = json.data.title || item.title;
          item.author = json.data.author || item.author;
          item.year = json.data.year || item.year;
          item.description = json.data.description || item.description;
          item.value = json.data.estimatedValue || item.value;
          item.price = json.data.suggestedPrice || item.price;
          item.category = json.data.category || item.category;
          item.publisher = json.data.publisher || item.publisher;
          item.yearReasoning = json.data.yearReasoning;
          item.yearConfidence = json.data.yearConfidence;
          item.status = 'ready';
        } else {
          item.status = 'ready';
        }
      } catch (err: any) {
        item.status = 'error';
        item.errorMessage = err?.message || 'Tuvastamine ebaõnnestus';
      }

      setItems([...updated]);

      // Gentle pause to avoid rate limit spikes
      if (i < updated.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1300));
      }
    }

    setIsProcessing(false);
    setProgressText('');
  };

  // Save all processed items to book database
  const handleSaveAll = async () => {
    if (items.length === 0) return;
    setIsImporting(true);

    try {
      const booksToCreate: Book[] = items.map((item) => ({
        id: `book-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: item.title.trim() || 'Nimetu raamat',
        author: item.author.trim() || 'Määramata autor',
        year: Number(item.year) || 1980,
        description: item.description || '',
        value: Number(item.value) || 15,
        price: Number(item.price) || 10,
        photoUrl: item.previewUrl,
        category: item.category || 'Muu',
        condition: 'Hea',
        status: 'available',
        publisher: item.publisher,
        yearReasoning: item.yearReasoning,
        yearConfidence: item.yearConfidence,
        aiReviewed: Boolean(item.yearReasoning),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      await onAddBooks(booksToCreate);
      setItems([]);
      onClose();
    } catch (err) {
      console.error('Hulgi salvestamise viga:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      id="batch-upload-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="batch-upload-modal-card"
        className="relative bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-amber-900/10 my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-900">
              <FileArchive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif-title text-xl md:text-2xl font-bold text-stone-900">
                Laadi fotod üles (sh Google Fotod ZIP failina)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Toetab Google Fotode ZIP-arhiive, PDF-e ja mitut pilti korraga
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Unpacking progress notice */}
          {isUnpacking && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-amber-700 shrink-0" />
              <div>
                <p className="text-xs font-bold">{unpackingStatus || 'Töötlen faili...'}</p>
                <p className="text-[11px] text-amber-700">Pildid pakitakse automaatselt lahti ja optimeeritakse.</p>
              </div>
            </div>
          )}

          {/* Error Alert Banner */}
          {uploadError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-rose-900 mb-0.5">Tähelepanu faili lisamisel</p>
                <p className="text-rose-700 leading-relaxed">{uploadError}</p>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-rose-400 hover:text-rose-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`p-8 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center text-center ${
              dragOver
                ? 'border-amber-600 bg-amber-100/50 scale-[0.99]'
                : 'border-amber-300 bg-amber-50/30 hover:bg-amber-50/60'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 shadow-2xs">
              <Upload className="w-7 h-7 stroke-[1.5]" />
            </div>

            <h4 className="font-serif-title font-bold text-stone-900 text-base mb-1">
              Lohista siia oma Google Fotode ZIP fail või vali fotod
            </h4>
            <p className="text-xs text-stone-500 max-w-lg mb-5 leading-relaxed">
              Võid lohistada siia otse <strong>Photos.zip</strong> faili, valida arvutist <strong>lahtipakitud fotode kausta</strong> või valida korraga <strong>mitukümmend pilti</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {/* Option 1: ZIP file */}
              <label className="py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-amber-200" />
                <span>1. Vali ZIP fail</span>
                <input
                  type="file"
                  accept=".zip,.ZIP,application/zip,application/x-zip-compressed,application/octet-stream,*"
                  className="hidden"
                  onChange={handleFilesSelected}
                />
              </label>

              {/* Option 2: Folder of unzipped photos */}
              <label className="py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-semibold cursor-pointer transition-colors shadow-2xs flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-800" />
                <span>2. Vali lahtipakitud kaust</span>
                <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory="true"
                  // @ts-ignore
                  directory="true"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
              </label>

              {/* Option 3: Individual photos */}
              <label className="py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-xs font-semibold cursor-pointer transition-colors shadow-2xs flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-stone-600" />
                <span>3. Vali fotod seadmest</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  onChange={handleFilesSelected}
                />
              </label>

              {/* Google Photos Guide toggle */}
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Info className="w-4 h-4 text-amber-700" />
                <span>Juhend</span>
                {showInstructions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Accordion instructions for Google Photos */}
          {showInstructions && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-xs space-y-2">
              <h5 className="font-bold text-stone-900 flex items-center gap-1.5">
                <span>📷 Kuidas Google Fotodest kõik raamatupildid ühte faili panna:</span>
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-stone-600 pl-1">
                <li>
                  Ava arvutis või telefonis <strong>photos.google.com</strong>.
                </li>
                <li>
                  Märgi linnukesega kõik oma raamatute fotod (või ava album, kuhu oled need pannud).
                </li>
                <li>
                  Klõpsa paremal üleval <strong>kolme punktiga menüül</strong> ja vali <strong>„Laadi kõik alla”</strong> (või vajuta klahvikombinatsiooni <code>Shift + D</code>).
                </li>
                <li>
                  Google pakib fotod automaatselt kokku üheks <strong>.zip failiks</strong> (nt <code>Photos.zip</code>).
                </li>
                <li>
                  Lohista või vali see <code>.zip</code> fail otse siiasamasse aknasse — rakendus loeb kõik fotod hetkega ise välja!
                </li>
              </ol>
            </div>
          )}

          {/* Action Bar when items exist */}
          {items.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-100 border border-stone-200">
              <div className="text-xs font-semibold text-stone-800 flex items-center gap-2">
                <span>Valmis laaditud fotod:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-800 text-white font-bold text-xs">
                  {items.length} tk
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoScanAll}
                  disabled={isProcessing}
                  className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{progressText || 'Tuvastan raamatuid...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>✨ Tuvasta kõik AI abil</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="py-2 px-3 rounded-xl text-stone-500 hover:text-rose-700 hover:bg-rose-50 text-xs font-medium transition-colors"
                >
                  Tühjenda nimekiri
                </button>
              </div>
            </div>
          )}

          {/* Items Grid */}
          {items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative p-3 rounded-2xl border border-stone-200 bg-white shadow-2xs flex gap-3 items-start group"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.title}
                    className="w-16 h-22 object-cover rounded-xl bg-stone-100 shrink-0 border border-stone-200"
                  />

                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        item.title = e.target.value;
                        setItems([...items]);
                      }}
                      placeholder="Pealkiri"
                      className="w-full text-xs font-bold text-stone-900 border-b border-transparent focus:border-amber-500 outline-none pb-0.5 truncate"
                    />

                    <input
                      type="text"
                      value={item.author}
                      onChange={(e) => {
                        item.author = e.target.value;
                        setItems([...items]);
                      }}
                      placeholder="Autor"
                      className="w-full text-[11px] text-stone-600 border-b border-transparent focus:border-amber-500 outline-none pb-0.5 truncate mt-0.5"
                    />

                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 text-[11px] text-stone-600">
                        <span>Aasta:</span>
                        <input
                          type="number"
                          value={item.year}
                          onChange={(e) => {
                            item.year = Number(e.target.value);
                            setItems([...items]);
                          }}
                          className="w-12 px-1 py-0.5 border rounded text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-stone-900">
                        <span>Hind:</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            item.price = Number(e.target.value);
                            setItems([...items]);
                          }}
                          className="w-12 px-1 py-0.5 border rounded text-[11px]"
                        />
                        <span>€</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {item.status === 'scanning' && (
                        <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Tuvastan...
                        </span>
                      )}
                      {item.status === 'ready' && (
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Tuvastatud
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-[10px] text-rose-500 font-medium flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Viga
                        </span>
                      )}
                      {item.status === 'pending' && (
                        <span className="text-[10px] text-stone-400">Ootel</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Eemalda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 flex items-center justify-between bg-stone-50">
          <span className="text-xs text-stone-500">
            {items.length > 0 ? `${items.length} raamatut valmis lisamiseks` : 'Vali Google Fotode fail alustamiseks'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold"
            >
              Sulge
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={items.length === 0 || isImporting}
              className="py-2.5 px-5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvestan kataloogi...</span>
                </>
              ) : (
                <span>Lisa kõik ({items.length}) kataloogi</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
