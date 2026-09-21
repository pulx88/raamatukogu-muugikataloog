import React, { useState } from 'react';
import { Book, BookCondition, BookScanResult } from '../types';
import { getBookReviewReasons, scanBookWithAI } from '../lib/bookAudit';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  BookOpen,
  ArrowRight,
  Check,
  RotateCw,
  Eye,
  Edit3,
  Layers,
  Search,
  Filter,
} from 'lucide-react';

interface BookReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onUpdateBook: (updatedBook: Book) => void;
  onBatchUpdateBooks: (updatedBooks: Book[]) => void;
  onOpenEditModal: (book: Book) => void;
}

interface ItemAnalysisState {
  isScanning: boolean;
  error?: string;
  suggested?: BookScanResult;
  applied?: boolean;
  editedFields?: Partial<BookScanResult>;
}

export const BookReviewModal: React.FC<BookReviewModalProps> = ({
  isOpen,
  onClose,
  books,
  onUpdateBook,
  onBatchUpdateBooks,
  onOpenEditModal,
}) => {
  const [activeTab, setActiveTab] = useState<'needs_review' | 'all'>('needs_review');
  const [analysisStates, setAnalysisStates] = useState<Record<string, ItemAnalysisState>>({});
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  // Filter books
  const needsReviewBooks = books.filter((b) => getBookReviewReasons(b).length > 0);
  const targetList = activeTab === 'needs_review' ? needsReviewBooks : books;

  const filteredList = targetList.filter((b) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      String(b.year).includes(q) ||
      (b.category && b.category.toLowerCase().includes(q))
    );
  });

  // Run single book scan
  const handleScanSingleBook = async (book: Book) => {
    setAnalysisStates((prev) => ({
      ...prev,
      [book.id]: { isScanning: true, error: undefined },
    }));

    try {
      const result = await scanBookWithAI({
        imageBase64: book.photoUrl,
        existingTitle: book.title,
        existingAuthor: book.author,
        currentYear: book.year,
        notes: book.notes,
        reviewMode: true,
      });

      setAnalysisStates((prev) => ({
        ...prev,
        [book.id]: {
          isScanning: false,
          suggested: result,
          editedFields: { ...result },
        },
      }));
    } catch (err: any) {
      setAnalysisStates((prev) => ({
        ...prev,
        [book.id]: {
          isScanning: false,
          error: err?.message || 'Tuvastamine ebaõnnestus',
        },
      }));
    }
  };

  // Run batch scan across all flagged books
  const handleBatchScanAll = async () => {
    const toScan = needsReviewBooks.filter((b) => !analysisStates[b.id]?.applied);
    if (toScan.length === 0) return;

    setIsBatchScanning(true);

    for (let i = 0; i < toScan.length; i++) {
      const book = toScan[i];
      setBatchProgress({
        current: i + 1,
        total: toScan.length,
        title: book.title || 'Raamat ' + (i + 1),
      });

      setAnalysisStates((prev) => ({
        ...prev,
        [book.id]: { isScanning: true, error: undefined },
      }));

      try {
        const result = await scanBookWithAI({
          imageBase64: book.photoUrl,
          existingTitle: book.title,
          existingAuthor: book.author,
          currentYear: book.year,
          notes: book.notes,
          reviewMode: true,
        });

        setAnalysisStates((prev) => ({
          ...prev,
          [book.id]: {
            isScanning: false,
            suggested: result,
            editedFields: { ...result },
          },
        }));
      } catch (err: any) {
        setAnalysisStates((prev) => ({
          ...prev,
          [book.id]: {
            isScanning: false,
            error: err?.message || 'Tuvastamine ebaõnnestus',
          },
        }));
      }

      // Small delay between requests to be gentle with quota
      if (i < toScan.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1400));
      }
    }

    setIsBatchScanning(false);
    setBatchProgress(null);
  };

  // Apply suggested improvements to a single book
  const handleApplySingle = (book: Book) => {
    const state = analysisStates[book.id];
    if (!state) return;

    const data = state.editedFields || state.suggested;
    if (!data) return;

    const updatedBook: Book = {
      ...book,
      title: data.title?.trim() || book.title,
      author: data.author?.trim() || book.author,
      year: data.year || book.year,
      description: data.description?.trim() || book.description,
      category: data.category?.trim() || book.category,
      price: data.suggestedPrice || book.price,
      value: data.estimatedValue || book.value,
      condition: data.condition || book.condition,
      publisher: data.publisher || book.publisher,
      yearReasoning: data.yearReasoning || book.yearReasoning,
      yearConfidence: data.yearConfidence || book.yearConfidence,
      aiReviewed: true,
      updatedAt: Date.now(),
    };

    onUpdateBook(updatedBook);

    setAnalysisStates((prev) => ({
      ...prev,
      [book.id]: {
        ...prev[book.id],
        applied: true,
      },
    }));
  };

  // Apply all currently scanned suggestions
  const handleApplyAllPending = () => {
    const updatedBooks: Book[] = [];

    books.forEach((book) => {
      const state = analysisStates[book.id];
      if (state && !state.applied && (state.editedFields || state.suggested)) {
        const data = state.editedFields || state.suggested!;
        updatedBooks.push({
          ...book,
          title: data.title?.trim() || book.title,
          author: data.author?.trim() || book.author,
          year: data.year || book.year,
          description: data.description?.trim() || book.description,
          category: data.category?.trim() || book.category,
          price: data.suggestedPrice || book.price,
          value: data.estimatedValue || book.value,
          condition: data.condition || book.condition,
          publisher: data.publisher || book.publisher,
          yearReasoning: data.yearReasoning || book.yearReasoning,
          yearConfidence: data.yearConfidence || book.yearConfidence,
          aiReviewed: true,
          updatedAt: Date.now(),
        });
      }
    });

    if (updatedBooks.length > 0) {
      onBatchUpdateBooks(updatedBooks);

      setAnalysisStates((prev) => {
        const next = { ...prev };
        updatedBooks.forEach((b) => {
          if (next[b.id]) {
            next[b.id] = { ...next[b.id], applied: true };
          }
        });
        return next;
      });
    }
  };

  // Number of unapplied suggestions ready to save
  const pendingReadyCount = Object.keys(analysisStates).filter(
    (id) => !analysisStates[id].applied && analysisStates[id].suggested
  ).length;

  return (
    <div
      id="book-review-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="book-review-modal-container"
        className="relative bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-stone-900 text-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>AI Raamatute Ülevaataja ja Täpsustaja</span>
              </h2>
              <p className="text-xs text-stone-400">
                Tuvasta ja paranda fotode põhjal puuduvad ilmumisaastad, tegelikud autorid ja kirjeldused.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            title="Sulge aken"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Controls & Filters */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('needs_review')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'needs_review'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Vajavad täpsustamist</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-900/40 text-[10px] font-bold">
                {needsReviewBooks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              <span>Kõik raamatud</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold">
                {books.length}
              </span>
            </button>
          </div>

          {/* Actions & Search */}
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Otsi raamatut..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Batch Run Button */}
            {needsReviewBooks.length > 0 && (
              <button
                type="button"
                onClick={handleBatchScanAll}
                disabled={isBatchScanning}
                className="py-1.5 px-3 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
              >
                {isBatchScanning ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Tuvastan ({batchProgress?.current}/{batchProgress?.total})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Tuvasta kõik täpsustamist vajavad</span>
                  </>
                )}
              </button>
            )}

            {/* Apply All Pending Button */}
            {pendingReadyCount > 0 && (
              <button
                type="button"
                onClick={handleApplyAllPending}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kinnita kõik ({pendingReadyCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Batch Progress Bar if running */}
        {batchProgress && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-amber-800 animate-spin" />
              <span>
                Analüüsin teost <strong>{batchProgress.current}</strong> / {batchProgress.total}: &quot;{batchProgress.title}&quot;...
              </span>
            </div>
            <span className="font-bold text-amber-900">
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
        )}

        {/* Scrollable Content List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-stone-100/50">
          {filteredList.length === 0 ? (
            <div className="py-16 text-center text-stone-500">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-800 text-base">Kõik raamatud on heas korras!</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Ühelgi raamatul pole tuvastamata autorit ega kahtlaseid ilmumisaastaid. Vajadusel saad teisi raamatuid vaadata vahekaardilt &quot;Kõik raamatud&quot;.
              </p>
            </div>
          ) : (
            filteredList.map((book) => {
              const reasons = getBookReviewReasons(book);
              const state = analysisStates[book.id] || {};
              const suggested = state.suggested;
              const isScanning = state.isScanning;
              const isApplied = state.applied;

              return (
                <div
                  key={book.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs ${
                    isApplied
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : reasons.length > 0
                      ? 'border-amber-300/80 ring-1 ring-amber-300/30'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row gap-5 items-start">
                    {/* Book Photo Thumbnail */}
                    <div className="flex flex-col items-center shrink-0 w-full sm:w-36">
                      <div className="relative group w-28 sm:w-36 h-36 sm:h-44 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shadow-2xs flex items-center justify-center">
                        {book.photoUrl ? (
                          <>
                            <img
                              src={book.photoUrl}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setEnlargedPhotoUrl(book.photoUrl)}
                              className="absolute inset-0 bg-stone-900/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Klõpsa foto suurendamiseks"
                            >
                              <Eye className="w-5 h-5 mb-1" />
                              <span className="text-[10px] font-bold">Suurenda fotot</span>
                            </button>
                          </>
                        ) : (
                          <BookOpen className="w-8 h-8 text-stone-300" />
                        )}
                      </div>

                      {/* Photo zoom button below image for mobile */}
                      {book.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setEnlargedPhotoUrl(book.photoUrl)}
                          className="mt-1 text-[11px] text-amber-800 hover:text-amber-900 font-medium flex items-center gap-1 sm:hidden"
                        >
                          <Eye className="w-3 h-3" /> Vaata fotot
                        </button>
                      )}
                    </div>

                    {/* Middle: Current Data & Audit Issues */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {reasons.length > 0 ? (
                            reasons.map((r, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-700" />
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Andmed korras
                            </span>
                          )}

                          {book.aiReviewed && (
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                              AI täpsustatud
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif-title font-bold text-stone-900 text-base sm:text-lg leading-snug">
                          {book.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-stone-400" />
                            <span className={book.author === 'Määramata autor' ? 'text-amber-800 font-bold' : ''}>
                              {book.author}
                            </span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span className={book.year >= new Date().getFullYear() - 1 ? 'text-amber-800 font-bold' : ''}>
                              Ilmunud: {book.year || 'Puudub'}
                            </span>
                          </span>
                          <span>•</span>
                          <span>{book.category}</span>
                          <span>•</span>
                          <span>{book.price} €</span>
                        </div>
                      </div>

                      {/* Current Description snippet */}
                      <p className="text-xs text-stone-500 line-clamp-2 italic">
                        {book.description || 'Lühitutvustus puudub.'}
                      </p>

                      {/* AI Scan Trigger Button */}
                      {!suggested && !isApplied && (
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleScanSingleBook(book)}
                            disabled={isScanning}
                            className="py-1.5 px-3 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                          >
                            {isScanning ? (
                              <>
                                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Tuvastan süvaanalüüsiga...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                                <span>Tuvasta uuesti süvaanalüüsiga</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEditModal(book)}
                            className="py-1.5 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Muuda käsitsi</span>
                          </button>
                        </div>
                      )}

                      {state.error && (
                        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                          Tõrge tuvastamisel: {state.error}
                        </p>
                      )}
                    </div>

                    {/* Right / Bottom: AI Identified Proposal Side-by-Side */}
                    {suggested && (
                      <div className="w-full lg:w-96 bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/90 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                            AI tuvastatud täpsustused
                          </span>
                          {suggested.yearConfidence && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                              Kindlus: {suggested.yearConfidence === 'high' ? 'Kõrge' : 'Ligikaudne'}
                            </span>
                          )}
                        </div>

                        {/* Editable Field: Title */}
                        <div>
                          <label className="text-[10px] font-bold uppercase text-stone-500 block mb-0.5">
                            Pealkiri
                          </label>
                          <input
                            type="text"
                            value={state.editedFields?.title ?? suggested.title}
                            onChange={(e) =>
                              setAnalysisStates((prev) => ({
                                ...prev,
                                [book.id]: {
                                  ...prev[book.id],
                                  editedFields: {
                                    ...prev[book.id].editedFields,
                                    title: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-2 py-1 text-xs font-semibold bg-white border border-amber-300 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        {/* Editable Row: Author & Year */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-stone-500 block mb-0.5">
                              Autor
                            </label>
                            <input
                              type="text"
                              value={state.editedFields?.author ?? suggested.author}
                              onChange={(e) =>
                                setAnalysisStates((prev) => ({
                                  ...prev,
                                  [book.id]: {
                                    ...prev[book.id],
                                    editedFields: {
                                      ...prev[book.id].editedFields,
                                      author: e.target.value,
                                    },
                                  },
                                }))
                              }
                              className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-stone-500 block mb-0.5">
                              Ilmumisaasta
                            </label>
                            <input
                              type="number"
                              value={state.editedFields?.year ?? suggested.year}
                              onChange={(e) =>
                                setAnalysisStates((prev) => ({
                                  ...prev,
                                  [book.id]: {
                                    ...prev[book.id],
                                    editedFields: {
                                      ...prev[book.id].editedFields,
                                      year: Number(e.target.value),
                                    },
                                  },
                                }))
                              }
                              className="w-full px-2 py-1 text-xs font-bold text-amber-900 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        {/* Year reasoning explanation */}
                        {suggested.yearReasoning && (
                          <div className="p-2 rounded-lg bg-white/80 border border-amber-200 text-[11px] text-amber-950">
                            <span className="font-bold block text-[10px] text-amber-800">
                              Kuidas aasta tuletati:
                            </span>
                            {suggested.yearReasoning}
                          </div>
                        )}

                        {/* Category & Publisher */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-stone-500 block mb-0.5">
                              Kategooria
                            </label>
                            <input
                              type="text"
                              value={state.editedFields?.category ?? suggested.category}
                              onChange={(e) =>
                                setAnalysisStates((prev) => ({
                                  ...prev,
                                  [book.id]: {
                                    ...prev[book.id],
                                    editedFields: {
                                      ...prev[book.id].editedFields,
                                      category: e.target.value,
                                    },
                                  },
                                }))
                              }
                              className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded-lg text-stone-900 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-stone-500 block mb-0.5">
                              Kirjastus
                            </label>
                            <input
                              type="text"
                              value={state.editedFields?.publisher ?? suggested.publisher ?? ''}
                              onChange={(e) =>
                                setAnalysisStates((prev) => ({
                                  ...prev,
                                  [book.id]: {
                                    ...prev[book.id],
                                    editedFields: {
                                      ...prev[book.id].editedFields,
                                      publisher: e.target.value,
                                    },
                                  },
                                }))
                              }
                              placeholder="nt Eesti Raamat"
                              className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded-lg text-stone-900 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Suggested Synopsis */}
                        <div>
                          <label className="text-[10px] font-bold uppercase text-stone-500 block mb-0.5">
                            Lühitutvustus
                          </label>
                          <textarea
                            rows={2}
                            value={state.editedFields?.description ?? suggested.description}
                            onChange={(e) =>
                              setAnalysisStates((prev) => ({
                                ...prev,
                                [book.id]: {
                                  ...prev[book.id],
                                  editedFields: {
                                    ...prev[book.id].editedFields,
                                    description: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        {/* Action buttons for this book */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleScanSingleBook(book)}
                            className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center gap-1"
                            title="Tuvasta uuesti"
                          >
                            <RotateCw className="w-3 h-3" /> Uuesti
                          </button>

                          {isApplied ? (
                            <span className="py-1 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs">
                              <Check className="w-3.5 h-3.5" /> Parandus vastu võetud!
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApplySingle(book)}
                              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Võta parandus vastu</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div>
            <span>Kokku raamatukogus: <strong>{books.length}</strong></span>
            <span className="mx-2">•</span>
            <span>
              Täpsustamist vajavaid: <strong className="text-amber-800">{needsReviewBooks.length}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold transition-colors"
          >
            Valmis
          </button>
        </div>
      </div>

      {/* Enlarged Photo Modal */}
      {enlargedPhotoUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setEnlargedPhotoUrl(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex items-center justify-center">
            <button
              onClick={() => setEnlargedPhotoUrl(null)}
              className="absolute -top-10 right-0 text-white p-2 hover:bg-white/20 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={enlargedPhotoUrl}
              alt="Raamatu foto suurendus"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
