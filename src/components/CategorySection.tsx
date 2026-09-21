import React, { useState } from 'react';
import { Book, BookStatus } from '../types';
import { BookCard } from './BookCard';
import { BookListItem } from './BookListItem';
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  Sparkles,
  History,
  BookOpen,
  Compass,
  GraduationCap,
  Baby,
  Feather,
  Utensils,
  Cpu,
  Gem,
  FileQuestion,
  Filter,
  Calendar,
  Globe,
  Clock,
} from 'lucide-react';

interface CategorySectionProps {
  category: string;
  books: Book[];
  viewMode: 'grid' | 'table';
  isInitiallyCollapsed?: boolean;
  onViewBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onStatusChange: (id: string, status: BookStatus) => void;
  onFilterOnlyThisCategory?: (category: string) => void;
  onOpenReview?: (book: Book) => void;
  subtitle?: string;
  groupType?: 'category' | 'period' | 'language';
}

// Helper to choose a thematic icon for category, period, or language
const getGroupIcon = (title: string, groupType: 'category' | 'period' | 'language' = 'category') => {
  if (groupType === 'period') {
    return <Calendar className="w-4 h-4" />;
  }
  if (groupType === 'language') {
    return <Globe className="w-4 h-4" />;
  }

  const lower = title.toLowerCase();
  if (lower.includes('ajalugu') || lower.includes('biograafia')) return <History className="w-4 h-4" />;
  if (lower.includes('laste')) return <Baby className="w-4 h-4" />;
  if (lower.includes('luule') || lower.includes('draama')) return <Feather className="w-4 h-4" />;
  if (lower.includes('filosoofia') || lower.includes('religioon')) return <GraduationCap className="w-4 h-4" />;
  if (lower.includes('kokandus') || lower.includes('kodu')) return <Utensils className="w-4 h-4" />;
  if (lower.includes('teadus') || lower.includes('tehnika')) return <Cpu className="w-4 h-4" />;
  if (lower.includes('antiikne') || lower.includes('haruldane')) return <Gem className="w-4 h-4" />;
  if (lower.includes('krimi') || lower.includes('põnevik')) return <Compass className="w-4 h-4" />;
  if (lower.includes('fantaasia') || lower.includes('ulme')) return <Sparkles className="w-4 h-4" />;
  if (lower.includes('klassika') || lower.includes('kirjandus')) return <BookOpen className="w-4 h-4" />;
  if (lower.includes('muu')) return <FileQuestion className="w-4 h-4" />;
  return <Bookmark className="w-4 h-4" />;
};

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  books,
  viewMode,
  isInitiallyCollapsed = false,
  onViewBook,
  onEditBook,
  onDeleteBook,
  onStatusChange,
  onFilterOnlyThisCategory,
  onOpenReview,
  subtitle,
  groupType = 'category',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(isInitiallyCollapsed);

  // Totals for this group
  const totalValue = books.reduce((sum, b) => sum + (b.value || 0), 0);
  const totalPrice = books.reduce((sum, b) => sum + (b.price || 0), 0);
  const availableCount = books.filter((b) => b.status === 'available').length;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Group Header */}
      <div
        className="p-4 bg-stone-50/80 hover:bg-stone-100/70 cursor-pointer border-b border-stone-200/70 flex flex-wrap items-center justify-between gap-3 select-none transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-800 text-amber-50 flex items-center justify-center shrink-0 shadow-2xs">
            {getGroupIcon(category, groupType)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif-title font-bold text-stone-900 text-base md:text-lg">
                {category}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                {books.length} {books.length === 1 ? 'raamat' : 'raamatut'}
              </span>
            </div>

            {subtitle && (
              <p className="text-xs text-stone-500 line-clamp-1 mt-0.5 font-normal">
                {subtitle}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
              <span>
                Müügis: <strong className="text-emerald-700 font-semibold">{availableCount}</strong>
              </span>
              <span>•</span>
              <span>
                Koguhind: <strong className="text-stone-800 font-semibold">{totalPrice.toFixed(0)} €</strong>
              </span>
              <span>•</span>
              <span>
                Hinnanguline väärtus: <strong className="text-stone-800 font-semibold">{totalValue.toFixed(0)} €</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right action buttons: filter only this & collapse/expand toggle */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {onFilterOnlyThisCategory && (
            <button
              type="button"
              onClick={() => onFilterOnlyThisCategory(category)}
              className="py-1 px-2.5 rounded-lg bg-white hover:bg-amber-50 border border-stone-200 text-[11px] font-semibold text-stone-700 hover:text-amber-900 flex items-center gap-1 transition-colors"
              title={`Filtreeri ainult "${category}"`}
            >
              <Filter className="w-3 h-3 text-amber-800" />
              <span className="hidden sm:inline">Ainult see</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-white hover:bg-stone-200 text-stone-600 border border-stone-200"
            title={isCollapsed ? 'Ava plokk' : 'Ahenda plokk'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Category Content: Grid or Table */}
      {!isCollapsed && (
        <div className="p-4 bg-stone-50/20">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onView={onViewBook}
                  onEdit={onEditBook}
                  onDelete={onDeleteBook}
                  onStatusChange={onStatusChange}
                  onOpenReview={onOpenReview}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-14">Foto</th>
                    <th className="py-2.5 px-3">Raamat & Autor</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Aasta & Seisukord</th>
                    <th className="py-2.5 px-3 text-right">Hind & Väärtus</th>
                    <th className="py-2.5 px-3 text-center">Staatus</th>
                    <th className="py-2.5 px-3 text-right">Tegevused</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <BookListItem
                      key={book.id}
                      book={book}
                      onView={onViewBook}
                      onEdit={onEditBook}
                      onDelete={onDeleteBook}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
