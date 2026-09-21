import React, { useState } from 'react';
import { Book, BookScanResult, BookStatus } from '../types';
import { getBookReviewReasons, scanBookWithAI } from '../lib/bookAudit';
import {
  X,
  Edit3,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Tag,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  RotateCw,
  AlertTriangle,
  ArrowRight,
  Globe,
} from 'lucide-react';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: BookStatus) => void;
  onUpdateBook?: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onUpdateBook,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanResult, setRescanResult] = useState<BookScanResult | null>(null);
  const [rescanError, setRescanError] = useState<string | null>(null);
  const [rescanApplied, setRescanApplied] = useState(false);

  if (!book) return null;

  const difference = book.value - book.price;
  const isBargain = difference > 0;
  const reviewReasons = getBookReviewReasons(book);

  const handleRescan = async () => {
    setIsRescanning(true);
    setRescanError(null);
    setRescanResult(null);
    setRescanApplied(false);

    try {
      const result = await scanBookWithAI({
        imageBase64: book.photoUrl,
        existingTitle: book.title,
        existingAuthor: book.author,
        currentYear: book.year,
        notes: book.notes,
        reviewMode: true,
      });

      setRescanResult(result);
    } catch (err: any) {
      setRescanError(err?.message || 'Tuvastamine ebaõnnestus');
    } finally {
      setIsRescanning(false);
    }
  };

  const handleApplyRescan = () => {
    if (!rescanResult || !onUpdateBook) return;

    const updated: Book = {
      ...book,
      title: rescanResult.title || book.title,
      author: rescanResult.author || book.author,
      year: rescanResult.year || book.year,
      description: rescanResult.description || book.description,
      category: rescanResult.category || book.category,
      price: rescanResult.suggestedPrice || book.price,
      value: rescanResult.estimatedValue || book.value,
      condition: rescanResult.condition || book.condition,
      publisher: rescanResult.publisher || book.publisher,
      yearReasoning: rescanResult.yearReasoning || book.yearReasoning,
      yearConfidence: rescanResult.yearConfidence || book.yearConfidence,
      aiReviewed: true,
      updatedAt: Date.now(),
    };

    onUpdateBook(updated);
    setRescanApplied(true);
  };

  // Generate copyable text for sale listing (Facebook, Osta.ee, email)
  const copyListingText = () => {
    const text = `📚 ${book.title} - ${book.author} (${book.year})
💶 Hind: ${book.price} € (Hinnanguline väärtus: ~${book.value} €)
📖 Seisukord: ${book.condition}
🏷️ Žanr: ${book.category}
${book.publisher ? `🏛️ Kirjastus: ${book.publisher}\n` : ''}
📝 Lühitutvustus:
${book.description || 'Heas korras raamat.'}
${book.notes ? `\n📌 Lisamärkus: ${book.notes}` : ''}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      id="book-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="book-detail-modal-card"
        className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-amber-900/10 my-8 flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="close-detail-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-900/40 hover:bg-stone-900/70 text-white backdrop-blur transition-colors"
          title="Sulge aken"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Book Cover Image */}
        <div className="md:w-5/12 bg-stone-100 flex items-center justify-center p-6 relative overflow-hidden min-h-[320px]">
          {book.photoUrl ? (
            <div className="relative group max-w-[280px] w-full shadow-lg rounded-xl overflow-hidden border border-stone-300">
              <img
                src={book.photoUrl}
                alt={book.title}
                className="w-full h-auto object-cover max-h-[460px]"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-stone-400 p-8">
              <BookOpen className="w-16 h-16 mb-2 stroke-1" />
              <p className="text-sm">Fotot pole lisatud</p>
            </div>
          )}

          {/* Status badge in detail view */}
          <div className="absolute top-4 left-4">
            {book.status === 'available' && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-600 text-white shadow-xs">
                Müügis
              </span>
            )}
            {book.status === 'reserved' && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-600 text-white shadow-xs flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Broneeritud
              </span>
            )}
            {book.status === 'sold' && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-stone-700 text-white shadow-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Müüdud
              </span>
            )}
          </div>
        </div>

        {/* Right: Book Information & Actions */}
        <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900">
                {book.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                Seisukord: {book.condition}
              </span>
            </div>

            {/* Review warning banner if book has suspicious or missing data */}
            {reviewReasons.length > 0 && !rescanApplied && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Andmed vajavad ülevaatamist:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 pl-1">
                  {reviewReasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className="font-serif-title text-2xl md:text-3xl font-bold text-stone-900 mb-2 leading-tight">
              {book.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-stone-600 text-sm mb-3">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="w-4 h-4 text-amber-800" />
                <span className={book.author === 'Määramata autor' ? 'text-amber-800 font-bold' : ''}>
                  {book.author}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-800" />
                <span className={book.year >= new Date().getFullYear() - 1 ? 'text-amber-800 font-bold' : ''}>
                  Ilmunud: {book.year}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-800" />
                <span>Keel: <strong>{book.language || 'Eesti'}</strong></span>
              </span>
              {book.publisher && (
                <span className="text-stone-500 text-xs">
                  Kirjastus: {book.publisher}
                </span>
              )}
            </div>

            {/* AI Year reasoning badge */}
            {book.yearReasoning && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-[11px] text-amber-800">
                    AI ilmumisaasta selgitus:
                  </span>
                  {book.yearReasoning}
                </div>
              </div>
            )}

            {/* Deep re-scan section */}
            <div className="mb-5">
              {!rescanResult && (
                <button
                  type="button"
                  onClick={handleRescan}
                  disabled={isRescanning}
                  className="py-1.5 px-3.5 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs"
                >
                  {isRescanning ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analüüsin fotot ja eesti bibliograafiat...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      <span>Tuvasta uuesti süvaanalüüsiga</span>
                    </>
                  )}
                </button>
              )}

              {rescanError && (
                <p className="mt-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {rescanError}
                </p>
              )}

              {/* Rescan proposal preview box */}
              {rescanResult && (
                <div className="mt-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2.5 text-xs text-stone-800">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      AI tuvastatud täpsemad andmed:
                    </span>
                    <button
                      type="button"
                      onClick={() => setRescanResult(null)}
                      className="text-stone-400 hover:text-stone-600 text-xs font-normal"
                    >
                      Peida
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/90 p-3 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Pealkiri:</span>
                      <strong className="text-stone-900 text-xs">{rescanResult.title}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Autor:</span>
                      <strong className="text-stone-900 text-xs">{rescanResult.author}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Aasta:</span>
                      <strong className="text-amber-900 text-xs font-bold">
                        {book.year !== rescanResult.year ? (
                          <span className="flex items-center gap-1">
                            <span className="line-through text-stone-400">{book.year}</span>
                            <ArrowRight className="w-3 h-3 text-amber-700" />
                            <span>{rescanResult.year}</span>
                          </span>
                        ) : (
                          rescanResult.year
                        )}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-stone-500 uppercase block">Kirjastus / Seisukord:</span>
                      <span className="text-stone-700">{rescanResult.publisher || '–'} ({rescanResult.condition || 'Hea'})</span>
                    </div>
                  </div>

                  {rescanResult.yearReasoning && (
                    <div className="p-2 rounded-lg bg-amber-100/60 text-[11px] text-amber-950">
                      <strong>Aasta põhjendus:</strong> {rescanResult.yearReasoning}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleRescan}
                      disabled={isRescanning}
                      className="text-[11px] text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1"
                    >
                      <RotateCw className="w-3 h-3" /> Analüüsi uuesti
                    </button>

                    {rescanApplied ? (
                      <span className="py-1 px-3 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1 text-xs shadow-2xs">
                        <Check className="w-3.5 h-3.5" /> Parandus vastu võetud!
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyRescan}
                        className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 text-xs transition-colors shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Võta parandus vastu</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Card */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 mb-5">
              <div className="flex items-baseline justify-between mb-1">
                <div>
                  <span className="text-xs uppercase font-medium tracking-wider text-stone-500">Müügihind</span>
                  <div className="text-3xl font-extrabold text-stone-900">
                    {book.price} <span className="text-lg font-semibold">€</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase font-medium tracking-wider text-stone-500">Hinnanguline väärtus</span>
                  <div className="text-xl font-bold text-stone-600">
                    ~{book.value} €
                  </div>
                </div>
              </div>

              {isBargain && (
                <div className="mt-2 text-xs text-emerald-800 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Müügihind on <strong>{difference} € soodsam</strong> kui hinnanguline turuväärtus!
                </div>
              )}
            </div>

            {/* Description / Synopsis */}
            <div className="mb-6">
              <h4 className="text-xs uppercase font-bold tracking-wider text-stone-400 mb-2">
                Lühitutvustus
              </h4>
              <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
                {book.description || 'Lühitutvustust pole veel lisatud.'}
              </p>
            </div>

            {book.notes && (
              <div className="mb-6 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                <span className="font-semibold text-stone-800 block mb-0.5">Märkmed:</span>
                {book.notes}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-stone-100 flex flex-col gap-3">
            {/* Status change pill buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Staatus:</span>
              <button
                onClick={() => onStatusChange(book.id, 'available')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  book.status === 'available'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Müügis
              </button>
              <button
                onClick={() => onStatusChange(book.id, 'reserved')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  book.status === 'reserved'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Broneeritud
              </button>
              <button
                onClick={() => onStatusChange(book.id, 'sold')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  book.status === 'sold'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Müüdud
              </button>
            </div>

            {/* Bottom buttons */}
            <div className="flex items-center gap-2">
              <button
                id="copy-listing-btn"
                onClick={copyListingText}
                className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Kopeeritud lõikelauale!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Kopeeri kuulutuse tekst
                  </>
                )}
              </button>

              <button
                id="edit-from-detail-btn"
                onClick={() => {
                  onClose();
                  onEdit(book);
                }}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Muuda"
              >
                <Edit3 className="w-4 h-4" /> Muuda
              </button>

              <button
                id="delete-from-detail-btn"
                onClick={() => {
                  if (window.confirm(`Kas soovid raamatu "${book.title}" kindlasti kustutada?`)) {
                    onDelete(book.id);
                    onClose();
                  }
                }}
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Kustuta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
