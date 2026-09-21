import React from 'react';
import { Book, BookStatus } from '../types';
import { getBookReviewReasons } from '../lib/bookAudit';
import { Eye, Edit3, Trash2, CheckCircle2, Clock, BookOpen, Sparkles, AlertTriangle } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onView: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: BookStatus) => void;
  onOpenReview?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenReview,
}) => {
  const isAvailable = book.status === 'available';
  const isReserved = book.status === 'reserved';
  const isSold = book.status === 'sold';
  const reviewReasons = getBookReviewReasons(book);
  const needsReview = reviewReasons.length > 0;

  // Value vs price difference
  const difference = book.value - book.price;
  const isBargain = difference > 0;

  return (
    <div
      id={`book-card-${book.id}`}
      className={`group relative bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col shadow-xs hover:shadow-md ${
        isSold
          ? 'border-stone-200 bg-stone-50/70 opacity-80'
          : isReserved
          ? 'border-amber-300 bg-amber-50/20'
          : 'border-amber-900/10 hover:border-amber-500/40'
      }`}
    >
      {/* Top Cover Image Area */}
      <div
        className="relative aspect-[3/4] w-full bg-stone-100 overflow-hidden cursor-pointer flex items-center justify-center"
        onClick={() => onView(book)}
      >
        {book.photoUrl ? (
          <img
            src={book.photoUrl}
            alt={book.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-stone-400">
            <BookOpen className="w-12 h-12 mb-2 stroke-1" />
            <span className="text-xs text-center">Fotot pole lisatud</span>
          </div>
        )}

        {/* Gradient shadow overlay for aesthetic depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {isAvailable && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-600 text-white shadow-xs">
              Müügis
            </span>
          )}
          {isReserved && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-600 text-white shadow-xs flex items-center gap-1">
              <Clock className="w-3 h-3" /> Broneeritud
            </span>
          )}
          {isSold && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-stone-700 text-white shadow-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Müüdud
            </span>
          )}
        </div>

        {/* Year Tag & Review Warning Badge */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-stone-900/80 backdrop-blur text-amber-100 border border-amber-300/30">
            {book.year}
          </span>
          {needsReview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenReview) onOpenReview(book);
                else onView(book);
              }}
              className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1 shadow-md transition-transform hover:scale-105"
              title={`Vajab täpsustamist: ${reviewReasons.join(', ')}`}
            >
              <AlertTriangle className="w-2.5 h-2.5 text-stone-950" />
              <span>Täpsusta</span>
            </button>
          )}
        </div>

        {/* Category & Condition tags overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90 z-10">
          <span className="bg-black/50 backdrop-blur px-2 py-0.5 rounded text-[11px] truncate max-w-[55%]">
            {book.category || 'Muu'}
          </span>
          <span className="bg-black/50 backdrop-blur px-2 py-0.5 rounded text-[11px]">
            {book.condition}
          </span>
        </div>
      </div>

      {/* Book details section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              onClick={() => onView(book)}
              className="font-serif-title text-lg font-bold text-stone-900 leading-snug line-clamp-1 cursor-pointer hover:text-amber-800 transition-colors"
              title={book.title}
            >
              {book.title}
            </h3>
          </div>

          <p className="text-sm font-medium text-stone-600 mb-2 flex items-center justify-between gap-1.5 flex-wrap">
            <span className="truncate max-w-[65%]">{book.author}</span>
            <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5 shrink-0">
              <span>{book.year}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 text-[10px] font-semibold border border-amber-200">
                {book.language || 'Eesti'}
              </span>
            </span>
          </p>

          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
            {book.description || 'Lühitutvustus puudub. Klõpsa muutmiseks ja kirjelduse lisamiseks.'}
          </p>
        </div>

        {/* Pricing block */}
        <div className="pt-3 border-t border-stone-100 mt-auto">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-400 block">Müügihind</span>
              <div className="text-xl font-bold text-stone-900">
                {book.price} <span className="text-sm font-medium">€</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 block">Väärtus</span>
              <div className="text-sm font-semibold text-stone-500">
                ~{book.value} €
              </div>
            </div>
          </div>

          {/* Bargain indicator */}
          {isBargain && isAvailable && (
            <div className="mb-3 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Väärtusest soodsam:
              </span>
              <span className="font-bold">-{difference} €</span>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <button
              id={`view-book-btn-${book.id}`}
              onClick={() => onView(book)}
              className="flex-1 py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              title="Vaata kõiki andmeid"
            >
              <Eye className="w-3.5 h-3.5" /> Vaata
            </button>

            <button
              id={`edit-book-btn-${book.id}`}
              onClick={() => onEdit(book)}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs transition-colors"
              title="Muuda andmeid"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Quick status cycle button */}
            <button
              id={`status-toggle-btn-${book.id}`}
              onClick={() => {
                const nextStatus: BookStatus = isAvailable
                  ? 'reserved'
                  : isReserved
                  ? 'sold'
                  : 'available';
                onStatusChange(book.id, nextStatus);
              }}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : isReserved
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
              }`}
              title={`Praegu: ${isAvailable ? 'Müügis' : isReserved ? 'Broneeritud' : 'Müüdud'}. Klõpsa staatuse vahetamiseks.`}
            >
              {isAvailable ? (
                <Tag className="w-3.5 h-3.5" />
              ) : isReserved ? (
                <Clock className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              id={`delete-book-btn-${book.id}`}
              onClick={() => {
                if (window.confirm(`Kas oled kindel, et soovid raamatu "${book.title}" kustutada?`)) {
                  onDelete(book.id);
                }
              }}
              className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-400 hover:text-rose-700 text-xs transition-colors"
              title="Kustuta"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function Tag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}
