import { useState, useEffect, useMemo } from 'react';
import { Book, BookStatus, SortOption, GroupByOption, TimePeriodKey } from './types';
import { loadBooks, saveBook, deleteBook, saveAllBooks } from './lib/storage';
import { sortBooks, TIME_PERIODS, getBookTimePeriod } from './lib/bookSorting';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { CategoryBar } from './components/CategoryBar';
import { CategorySection } from './components/CategorySection';
import { BookCard } from './components/BookCard';
import { BookListItem } from './components/BookListItem';
import { BookDetailModal } from './components/BookDetailModal';
import { BookFormModal } from './components/BookFormModal';
import { BatchUploadModal } from './components/BatchUploadModal';
import { ExportImportModal } from './components/ExportImportModal';
import { BookReviewModal } from './components/BookReviewModal';
import { isBookNeedingReview } from './lib/bookAudit';
import { BookOpen, Plus, UploadCloud, RotateCcw, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter and view states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<TimePeriodKey>('all');
  const [customYearRange, setCustomYearRange] = useState<{ min: number; max: number }>({
    min: 1900,
    max: new Date().getFullYear(),
  });
  const [sortOption, setSortOption] = useState<SortOption>('category-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [groupBy, setGroupBy] = useState<GroupByOption>('category');
  const [isAllCollapsed, setIsAllCollapsed] = useState(false);

  // Modal dialog states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [bookToView, setBookToView] = useState<Book | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isExportImportModalOpen, setIsExportImportModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDismissedReviewBanner, setIsDismissedReviewBanner] = useState(false);

  // Load books on mount
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const loaded = await loadBooks();
        setBooks(loaded);
      } catch (err) {
        console.error('Raamatute laadimise tõrge:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Unique categories from books
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      const cat = b.category?.trim();
      if (cat) {
        set.add(cat);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'et'));
  }, [books]);

  // Book counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      const cat = b.category?.trim() || 'Muu';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [books]);

  // Unique languages from books
  const languages = useMemo(() => {
    const set = new Set<string>();
    ['Eesti', 'Inglise', 'Vene', 'Saksa', 'Soome'].forEach((l) => set.add(l));
    books.forEach((b) => {
      const lang = b.language?.trim();
      if (lang) {
        set.add(lang);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'et'));
  }, [books]);

  // Book counts per language
  const languageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      const lang = b.language?.trim() || 'Eesti';
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return counts;
  }, [books]);

  // Book counts per time period
  const periodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      const pKey = getBookTimePeriod(b.year).key;
      counts[pKey] = (counts[pKey] || 0) + 1;
    });
    return counts;
  }, [books]);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    const filtered = books.filter((book) => {
      // Status filter
      if (statusFilter !== 'all' && book.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const bookCat = book.category?.trim() || 'Muu';
        if (bookCat !== categoryFilter) {
          return false;
        }
      }

      // Language filter
      if (languageFilter !== 'all') {
        const bookLang = book.language?.trim() || 'Eesti';
        if (bookLang !== languageFilter) {
          return false;
        }
      }

      // Time period filter
      if (periodFilter !== 'all') {
        if (periodFilter === 'custom') {
          if (book.year < customYearRange.min || book.year > customYearRange.max) {
            return false;
          }
        } else {
          const bookPeriodKey = getBookTimePeriod(book.year).key;
          if (bookPeriodKey !== periodFilter) {
            return false;
          }
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = book.title?.toLowerCase().includes(q);
        const matchAuthor = book.author?.toLowerCase().includes(q);
        const matchYear = String(book.year).includes(q);
        const matchDesc = book.description?.toLowerCase().includes(q);
        const matchPub = book.publisher?.toLowerCase().includes(q);
        const matchCat = book.category?.toLowerCase().includes(q);
        const matchLang = (book.language || 'Eesti').toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchYear && !matchDesc && !matchPub && !matchCat && !matchLang) {
          return false;
        }
      }

      return true;
    });

    return sortBooks(filtered, sortOption);
  }, [
    books,
    statusFilter,
    categoryFilter,
    languageFilter,
    periodFilter,
    customYearRange,
    searchQuery,
    sortOption,
  ]);

  // Grouped sections based on groupBy option (category, period, language)
  const groupedSections = useMemo(() => {
    if (groupBy === 'none') {
      return [];
    }

    if (groupBy === 'period') {
      // Group by time period / era
      const map = new Map<TimePeriodKey, Book[]>();
      filteredBooks.forEach((book) => {
        const pKey = getBookTimePeriod(book.year).key;
        if (!map.has(pKey)) map.set(pKey, []);
        map.get(pKey)!.push(book);
      });

      const sections = TIME_PERIODS.filter((p) => map.has(p.key)).map((p) => ({
        key: p.key,
        title: `${p.label} (${p.shortLabel})`,
        subtitle: p.description,
        books: map.get(p.key)!,
        groupType: 'period' as const,
      }));

      if (sortOption === 'year-desc' || sortOption === 'period-desc') {
        sections.reverse();
      }

      return sections;
    }

    if (groupBy === 'language') {
      // Group by language
      const map = new Map<string, Book[]>();
      filteredBooks.forEach((book) => {
        const lang = book.language?.trim() || 'Eesti';
        if (!map.has(lang)) map.set(lang, []);
        map.get(lang)!.push(book);
      });

      const sortedLangs = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, 'et'));
      if (sortOption === 'language-desc') {
        sortedLangs.reverse();
      }

      return sortedLangs.map((lang) => ({
        key: lang,
        title: `${lang} keel`,
        subtitle: `Kokku ${map.get(lang)!.length} raamatut`,
        books: map.get(lang)!,
        groupType: 'language' as const,
      }));
    }

    // Default: Group by category
    const map = new Map<string, Book[]>();
    filteredBooks.forEach((book) => {
      const cat = book.category?.trim() || 'Muu';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(book);
    });

    const sortedCategories = Array.from(map.keys()).sort((a, b) => a.localeCompare(b, 'et'));
    if (sortOption === 'category-desc') {
      sortedCategories.reverse();
    }

    return sortedCategories.map((cat) => ({
      key: cat,
      title: cat,
      subtitle: undefined,
      books: map.get(cat)!,
      groupType: 'category' as const,
    }));
  }, [filteredBooks, groupBy, sortOption]);

  // Handle save (create or edit)
  const handleSaveBook = async (
    bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = Date.now();
    let updatedBook: Book;

    if (id) {
      const existing = books.find((b) => b.id === id);
      updatedBook = {
        ...bookData,
        id,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      await saveBook(updatedBook);
      setBooks((prev) => prev.map((b) => (b.id === id ? updatedBook : b)));
    } else {
      updatedBook = {
        ...bookData,
        id: `book-${now}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };
      await saveBook(updatedBook);
      setBooks((prev) => [updatedBook, ...prev]);
    }

    // Also update viewed book if open
    if (bookToView && bookToView.id === id) {
      setBookToView(updatedBook);
    }
  };

  // Handle delete
  const handleDeleteBook = async (id: string) => {
    await deleteBook(id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (bookToView && bookToView.id === id) {
      setBookToView(null);
    }
  };

  // Handle status quick change
  const handleStatusChange = async (id: string, newStatus: BookStatus) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;

    const updated: Book = {
      ...book,
      status: newStatus,
      updatedAt: Date.now(),
    };
    await saveBook(updated);
    setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    if (bookToView && bookToView.id === id) {
      setBookToView(updated);
    }
  };

  // Handle batch add
  const handleBatchAdd = async (newBooks: Book[]) => {
    const combined = [...newBooks, ...books];
    await saveAllBooks(combined);
    setBooks(combined);
  };

  // Handle single book update (e.g. from review modal or detail modal)
  const handleUpdateBook = async (updatedBook: Book) => {
    await saveBook(updatedBook);
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    if (bookToView && bookToView.id === updatedBook.id) {
      setBookToView(updatedBook);
    }
  };

  // Handle batch book update (from review modal)
  const handleBatchUpdateBooks = async (updatedList: Book[]) => {
    const idMap = new Map(updatedList.map((b) => [b.id, b]));
    const newAll = books.map((b) => idMap.get(b.id) || b);
    await saveAllBooks(newAll);
    setBooks(newAll);
    if (bookToView && idMap.has(bookToView.id)) {
      setBookToView(idMap.get(bookToView.id)!);
    }
  };

  // Handle viewing a book (increments view count for popularity sorting)
  const handleViewBook = (b: Book) => {
    const updated = { ...b, viewsCount: (b.viewsCount || 0) + 1 };
    saveBook(updated).catch(console.error);
    setBooks((prev) => prev.map((item) => (item.id === b.id ? updated : item)));
    setBookToView(updated);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setLanguageFilter('all');
    setPeriodFilter('all');
  };

  // Books requiring review
  const needsReviewCount = useMemo(() => books.filter(isBookNeedingReview).length, [books]);

  return (
    <div className="min-h-screen bg-stone-50/60 text-stone-800 pb-16">
      {/* Decorative top bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-800 via-amber-600 to-amber-900" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header & Filter Controls */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          languageFilter={languageFilter}
          onLanguageFilterChange={setLanguageFilter}
          languages={languages}
          periodFilter={periodFilter}
          onPeriodFilterChange={setPeriodFilter}
          customYearRange={customYearRange}
          onCustomYearRangeChange={setCustomYearRange}
          sortOption={sortOption}
          onSortOptionChange={setSortOption}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenAddModal={() => {
            setBookToEdit(null);
            setIsFormModalOpen(true);
          }}
          onOpenBatchModal={() => setIsBatchModalOpen(true)}
          onOpenExportImportModal={() => setIsExportImportModalOpen(true)}
          onOpenReviewModal={() => setIsReviewModalOpen(true)}
          needsReviewCount={needsReviewCount}
          onResetFilters={handleResetFilters}
        />

        {/* Real-time Statistics Bar */}
        <StatsBar books={books} />

        {/* Needs Review Alert Banner */}
        {needsReviewCount > 0 && !isDismissedReviewBanner && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-900 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  {needsReviewCount} raamatu andmed vajavad ülevaatamist või täpsustamist
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-900/80 mt-0.5">
                  Tuvastasime raamatuid, millel puudub täpne ilmumisaasta (või on märgitud süsteemi vaikimisi aasta) või autor. Täiustatud AI bibliograafia ülevaataja parandab need fotode järgi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="py-1.5 px-3.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Ava ülevaataja</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDismissedReviewBanner(true)}
                className="text-stone-400 hover:text-stone-600 text-xs px-2 py-1"
                title="Peida teade"
              >
                Peida
              </button>
            </div>
          </div>
        )}

        {/* Category & Time Period Bar */}
        {books.length > 0 && (
          <CategoryBar
            categories={categories}
            categoryCounts={categoryCounts}
            selectedCategory={categoryFilter}
            onSelectCategory={(cat) => setCategoryFilter(cat)}
            languages={languages}
            languageCounts={languageCounts}
            selectedLanguage={languageFilter}
            onSelectLanguage={(lang) => setLanguageFilter(lang)}
            periodCounts={periodCounts}
            selectedPeriod={periodFilter}
            onSelectPeriod={(period) => setPeriodFilter(period)}
            totalBooks={books.length}
            groupBy={groupBy}
            onGroupByChange={(mode) => setGroupBy(mode)}
            isAllCollapsed={isAllCollapsed}
            onToggleCollapseAll={() => setIsAllCollapsed((prev) => !prev)}
          />
        )}

        {/* Content Section */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-stone-400">
            <BookOpen className="w-10 h-10 animate-pulse text-amber-700 mb-3" />
            <p className="text-sm font-medium">Laadin raamatukogu...</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          groupBy !== 'none' ? (
            /* Grouped View (by Category, Time period or Language) */
            <div className="space-y-6">
              {groupedSections.map((group) => (
                <CategorySection
                  key={group.key}
                  category={group.title}
                  subtitle={group.subtitle}
                  groupType={group.groupType}
                  books={group.books}
                  viewMode={viewMode}
                  isInitiallyCollapsed={isAllCollapsed}
                  onViewBook={handleViewBook}
                  onEditBook={(b) => {
                    setBookToEdit(b);
                    setIsFormModalOpen(true);
                  }}
                  onDeleteBook={handleDeleteBook}
                  onStatusChange={handleStatusChange}
                  onFilterOnlyThisCategory={() => {
                    if (group.groupType === 'category') setCategoryFilter(group.key);
                    else if (group.groupType === 'period') setPeriodFilter(group.key as TimePeriodKey);
                    else if (group.groupType === 'language') setLanguageFilter(group.key);
                  }}
                  onOpenReview={() => setIsReviewModalOpen(true)}
                />
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            /* Flat Gallery Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onView={handleViewBook}
                  onEdit={(b) => {
                    setBookToEdit(b);
                    setIsFormModalOpen(true);
                  }}
                  onDelete={handleDeleteBook}
                  onStatusChange={handleStatusChange}
                  onOpenReview={() => setIsReviewModalOpen(true)}
                />
              ))}
            </div>
          ) : (
            /* Flat Table / Compact List View */
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-16">Foto</th>
                      <th className="py-3 px-4">Raamat & Autor</th>
                      <th className="py-3 px-4 hidden md:table-cell">Žanr & Seisukord</th>
                      <th className="py-3 px-4 text-right">Hind & Väärtus</th>
                      <th className="py-3 px-4 text-center">Staatus</th>
                      <th className="py-3 px-4 text-right">Tegevused</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBooks.map((book) => (
                      <BookListItem
                        key={book.id}
                        book={book}
                        onView={handleViewBook}
                        onEdit={(b) => {
                          setBookToEdit(b);
                          setIsFormModalOpen(true);
                        }}
                        onDelete={handleDeleteBook}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Empty Search or Empty Library State */
          <div className="py-16 px-4 text-center bg-white rounded-3xl border border-stone-200 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 stroke-1" />
            </div>
            <h3 className="font-serif-title text-lg font-bold text-stone-900 mb-1">
              Ühtegi raamatut ei leitud
            </h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              {searchQuery ||
              statusFilter !== 'all' ||
              categoryFilter !== 'all' ||
              languageFilter !== 'all' ||
              periodFilter !== 'all'
                ? 'Muuda otsingusõna või eemalda aktiivsed filtrid, et näha kõiki oma raamatuid.'
                : 'Sinu raamatukogu on praegu tühi. Alusta oma raamatute ülespanekut!'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {searchQuery ||
              statusFilter !== 'all' ||
              categoryFilter !== 'all' ||
              languageFilter !== 'all' ||
              periodFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Tühjenda filtrid</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setBookToEdit(null);
                      setIsFormModalOpen(true);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Lisa esimene raamat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(true)}
                    className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-800" />
                    <span>Google Fotod (ZIP) / Hulgilaadi</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Book Detail Modal */}
      <BookDetailModal
        book={bookToView}
        onClose={() => setBookToView(null)}
        onEdit={(book) => {
          setBookToEdit(book);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteBook}
        onStatusChange={handleStatusChange}
        onUpdateBook={handleUpdateBook}
      />

      {/* Add / Edit Book Modal */}
      <BookFormModal
        isOpen={isFormModalOpen}
        bookToEdit={bookToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setBookToEdit(null);
        }}
        onSave={handleSaveBook}
      />

      {/* Book Review & AI Auditor Modal */}
      <BookReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        books={books}
        onUpdateBook={handleUpdateBook}
        onBatchUpdateBooks={handleBatchUpdateBooks}
        onOpenEditModal={(book) => {
          setBookToEdit(book);
          setIsFormModalOpen(true);
        }}
      />

      {/* Batch Upload Modal */}
      <BatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onAddBooks={handleBatchAdd}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportImportModalOpen}
        books={books}
        onClose={() => setIsExportImportModalOpen(false)}
        onBooksUpdated={(newBooks) => setBooks(newBooks)}
      />
    </div>
  );
}
