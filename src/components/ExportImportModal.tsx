import React, { useRef, useState } from 'react';
import { Book } from '../types';
import { exportBooksToJson, exportBooksToCsv, importBooksFromJson, resetToSampleBooks } from '../lib/storage';
import { X, Download, Upload, FileSpreadsheet, FileJson, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  books: Book[];
  onClose: () => void;
  onBooksUpdated: (newBooks: Book[]) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  books,
  onClose,
  onBooksUpdated,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    try {
      const imported = await importBooksFromJson(e.target.files[0]);
      onBooksUpdated(imported);
      setStatusMessage({
        type: 'success',
        text: `Edukalt imporditud ${imported.length} raamatut!`,
      });
    } catch (err: any) {
      console.error('Import error:', err);
      setStatusMessage({
        type: 'error',
        text: 'Faili importimine ebaõnnestus: ' + (err?.message || 'Vigane JSON fail'),
      });
    }
  };

  const handleReset = async () => {
    if (window.confirm('Kas soovid tõesti taastada algsed näidisraamatud? Praegused muudatused asendatakse näidisandmetega.')) {
      const sample = await resetToSampleBooks();
      onBooksUpdated(sample);
      setStatusMessage({
        type: 'success',
        text: 'Näidisraamatute nimekiri taastatud!',
      });
    }
  };

  return (
    <div
      id="export-import-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="export-import-modal-card"
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-amber-900/10 my-8 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-amber-50/40">
          <div>
            <h2 className="font-serif-title text-xl font-bold text-stone-900">
              Kataloogi eksport & import
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Salvesta andmed arvutisse, ava Excelis või taasta varukoopia
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Export Options */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              Eksportimine (Laadi alla)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* CSV for Excel */}
              <button
                type="button"
                onClick={() => exportBooksToCsv(books)}
                className="p-4 rounded-2xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-left flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-2 mb-2 text-emerald-700">
                  <FileSpreadsheet className="w-6 h-6" />
                  <span className="font-bold text-sm text-stone-900 group-hover:text-emerald-900">
                    Excel (CSV)
                  </span>
                </div>
                <p className="text-xs text-stone-500 mb-3">
                  Tabel koos pealkirjade, autorite, aastate, hindade ja väärtustega.
                </p>
                <div className="flex items-center text-xs font-semibold text-emerald-800">
                  <Download className="w-3.5 h-3.5 mr-1" /> Laadi alla .csv
                </div>
              </button>

              {/* Full JSON Backup */}
              <button
                type="button"
                onClick={() => exportBooksToJson(books)}
                className="p-4 rounded-2xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all text-left flex flex-col justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-2 mb-2 text-amber-700">
                  <FileJson className="w-6 h-6" />
                  <span className="font-bold text-sm text-stone-900 group-hover:text-amber-900">
                    Täielik varukoopia
                  </span>
                </div>
                <p className="text-xs text-stone-500 mb-3">
                  Kõik raamatud koos kaanepiltide ja täielike kirjeldustega.
                </p>
                <div className="flex items-center text-xs font-semibold text-amber-800">
                  <Download className="w-3.5 h-3.5 mr-1" /> Laadi alla .json
                </div>
              </button>
            </div>
          </div>

          {/* Import Option */}
          <div className="pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              Importimine (Laadi üles varukoopia)
            </h3>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex items-center justify-center gap-3 text-stone-700 font-semibold text-xs"
            >
              <Upload className="w-5 h-5 text-amber-700" />
              <span>Vali arvutist varem salvestatud .json fail</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleJsonImport}
              />
            </button>
          </div>

          {/* Reset to Samples */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-700 block">Näidisandmed</span>
              <span className="text-[11px] text-stone-500">Taasta algsed eesti ja maailmakirjanduse teosed</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="py-1.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Taasta näidised
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-100 flex justify-end bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
          >
            Valmis
          </button>
        </div>
      </div>
    </div>
  );
};
