import React from 'react';
import { Book, BookStatus } from '../types';
import { Eye, Edit3, Trash2, Clock, CheckCircle2, BookOpen } from 'lucide-react';

interface BookListItemProps {
  book: Book;
  onView: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: BookStatus) => void;
}

export const BookListItem: React.FC<BookListItemProps> = ({
  book,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const isAvailable = book.status === 'available';
  const isReserved = book.status === 'reserved';
  const isSold = book.status === 'sold';

  return (
    <tr
      id={`book-row-${book.id}`}
      className={`border-b border-stone-200/70 hover:bg-amber-50/40 transition-colors ${
        isSold ? 'bg-stone-50/50 text-stone-500' : ''
      }`}
    >
      {/* Thumbnail */}
      <td className="py-3 px-4 w-16">
        <div
          onClick={() => onView(book)}
          className="w-12 h-16 rounded-md overflow-hidden bg-stone-100 cursor-pointer shadow-xs border border-stone-200 flex items-center justify-center shrink-0"
        >
          {book.photoUrl ? (
            <img
              src={book.photoUrl}
              alt={book.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <BookOpen className="w-5 h-5 text-stone-300" />
          )}
        </div>
      </td>

      {/* Title, Author & Description */}
      <td className="py-3 px-4">
        <div className="flex flex-col">
          <span
            onClick={() => onView(book)}
            className="font-serif-title font-bold text-stone-900 hover:text-amber-800 cursor-pointer text-base"
          >
            {book.title}
          </span>
          <span className="text-xs text-stone-600 font-medium flex items-center gap-1.5 flex-wrap">
            <span>{book.author}</span>
            <span className="text-stone-300">•</span>
            <span className="font-semibold text-stone-800">{book.year}</span>
            <span className="text-stone-300">•</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 text-[10px] font-medium border border-amber-200">
              {book.language || 'Eesti'}
            </span>
          </span>
          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5 max-w-md">
            {book.description || 'Kirjeldus puudub'}
          </p>
        </div>
      </td>

      {/* Category & Condition */}
      <td className="py-3 px-4 hidden md:table-cell text-xs">
        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium block w-fit mb-1">
          {book.category}
        </span>
        <span className="text-stone-500 text-[11px]">{book.condition}</span>
      </td>

      {/* Price & Value */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="font-bold text-base text-stone-900">
          {book.price} €
        </div>
        <div className="text-xs text-stone-500">
          Väärtus: ~{book.value} €
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4 text-center whitespace-nowrap">
        <select
          id={`status-select-${book.id}`}
          value={book.status}
          onChange={(e) => onStatusChange(book.id, e.target.value as BookStatus)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
            isAvailable
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : isReserved
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-stone-100 text-stone-700 border-stone-300'
          }`}
        >
          <option value="available">Müügis</option>
          <option value="reserved">Broneeritud</option>
          <option value="sold">Müüdud</option>
        </select>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView(book)}
            className="p-1.5 rounded-lg text-stone-600 hover:text-amber-800 hover:bg-amber-100 transition-colors"
            title="Vaata"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(book)}
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
            title="Muuda"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Kas oled kindel, et soovid raamatu "${book.title}" kustutada?`)) {
                onDelete(book.id);
              }
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-700 hover:bg-rose-100 transition-colors"
            title="Kustuta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
