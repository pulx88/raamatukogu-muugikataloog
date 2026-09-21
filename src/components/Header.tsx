import React, { useState } from 'react';
import { BookStatus, SortOption, TimePeriodKey } from '../types';
import { TIME_PERIODS } from '../lib/bookSorting';
import {
  BookMarked,
  Plus,
  UploadCloud,
  FileSpreadsheet,
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  X,
  Sparkles,
  AlertTriangle,
  Globe,
  Calendar,
  RotateCcw,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: 'all' | BookStatus;
  onStatusFilterChange: (status: 'all' | BookStatus) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  categories: string[];
  languageFilter: string;
  onLanguageFilterChange: (lang: string) => void;
  languages: string[];
  periodFilter: TimePeriodKey;
  onPeriodFilterChange: (period: TimePeriodKey) => void;
  customYearRange: { min: number; max: number };
  onCustomYearRangeChange: (range: { min: number; max: number }) => void;
  sortOption: SortOption;
  onSortOptionChange: (sort: SortOption) => void;
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onOpenAddModal: () => void;
  onOpenBatchModal: () => void;
  onOpenExportImportModal: () => void;
  onOpenReviewModal?: () => void;
  needsReviewCount?: number;
  onResetFilters: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories = [],
  languageFilter = 'all',
  onLanguageFilterChange,
  languages = [],
  periodFilter = 'all',
  onPeriodFilterChange,
  customYearRange = { min: 1900, max: new Date().getFullYear() },
  onCustomYearRangeChange,
  sortOption,
  onSortOptionChange,
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  onOpenBatchModal,
  onOpenExportImportModal,
  onOpenReviewModal,
  needsReviewCount = 0,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    categoryFilter !== 'all' ||
    languageFilter !== 'all' ||
    periodFilter !== 'all';

  return (
    <header className="mb-6 space-y-4">
      {/* Top Brand & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 flex items-center justify-center shadow-md shadow-amber-950/10 shrink-0">
            <BookMarked className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="font-serif-title text-2xl md:text-3xl font-bold text-stone-900 tracking-tight leading-none">
              Raamatukogu & Müügikataloog
            </h1>
            <p className="text-xs text-stone-600 mt-1 font-medium">
              Sinu raamatute fotod, tutvustused, väljalaske aastad, väärtused ja müügihinnad
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Book Button */}
          <button
            id="open-add-book-modal-btn"
            type="button"
            onClick={onOpenAddModal}
            className="py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Lisa raamat</span>
          </button>

          {/* AI Reviewer & Auditor */}
          {onOpenReviewModal && (
            <button
              id="open-review-modal-btn"
              type="button"
              onClick={onOpenReviewModal}
              className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors ${
                needsReviewCount > 0
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-400 text-amber-950'
                  : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
              }`}
              title="Vaata üle ja täpsusta AI-ga raamatute ilmumisaastad ja andmed"
            >
              <Sparkles className="w-4 h-4 text-amber-800" />
              <span>AI Ülevaataja</span>
              {needsReviewCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-800 text-white text-[10px] font-bold">
                  {needsReviewCount}
                </span>
              )}
            </button>
          )}

          {/* Batch Photo Upload & Google Photos ZIP */}
          <button
            id="open-batch-upload-modal-btn"
            type="button"
            onClick={onOpenBatchModal}
            className="py-2.5 px-3.5 rounded-xl bg-amber-50/70 hover:bg-amber-100 border border-amber-900/20 text-stone-900 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Laadi üles Google Fotode ZIP arhiiv või mitu fotot korraga"
          >
            <UploadCloud className="w-4 h-4 text-amber-800" />
            <span>Google Fotod (ZIP) / Hulgilaadimine</span>
          </button>

          {/* Export / Import */}
          <button
            id="open-export-import-modal-btn"
            type="button"
            onClick={onOpenExportImportModal}
            className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Excel eksport ja varukoopiad"
          >
            <FileSpreadsheet className="w-4 h-4 text-stone-600" />
            <span>Eksport / Excel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-xs space-y-3">
        {/* Row 1: Search, Status Tabs, View Toggle */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-books-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Otsi pealkirja, autori, aasta või kirjastuse järgi..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-stone-800"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto shrink-0">
            {(
              [
                { id: 'all', label: 'Kõik' },
                { id: 'available', label: 'Müügis' },
                { id: 'reserved', label: 'Broneeritud' },
                { id: 'sold', label: 'Müüdud' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusFilterChange(tab.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center self-end lg:self-auto bg-stone-100 p-1 rounded-xl shrink-0">
            <button
              id="grid-view-mode-btn"
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Galerii vaade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="table-view-mode-btn"
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="Tabeli vaade"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Comprehensive Multi-Criteria Filtering & Sorting Bar */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Dropdown with Optgroups */}
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <span className="font-semibold text-stone-500 text-[11px] hidden sm:inline">Sorteeri:</span>
              <div className="relative">
                <select
                  id="sort-books-select"
                  value={sortOption}
                  onChange={(e) => onSortOptionChange(e.target.value as SortOption)}
                  className="py-1.5 pl-2.5 pr-7 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <optgroup label="🔥 Populaarsus">
                    <option value="popularity-desc">Populaarsus: Enim vaadatud ees</option>
                    <option value="popularity-asc">Populaarsus: Vähem vaadatud ees</option>
                  </optgroup>
                  <optgroup label="📅 Ilmumisaeg & Ajavahemikud">
                    <option value="year-desc">Ilmumisaasta: Uuemad enne</option>
                    <option value="year-asc">Ilmumisaasta: Vanemad enne</option>
                    <option value="period-asc">Ajavahemik: Varaseim ajastu enne</option>
                    <option value="period-desc">Ajavahemik: Hilisem ajastu enne</option>
                  </optgroup>
                  <optgroup label="✍️ Autor & Pealkiri">
                    <option value="author-asc">Autor: A kuni Z</option>
                    <option value="author-desc">Autor: Z kuni A</option>
                    <option value="title-asc">Pealkiri: A kuni Z</option>
                    <option value="title-desc">Pealkiri: Z kuni A</option>
                  </optgroup>
                  <optgroup label="💰 Hind & Väärtus">
                    <option value="price-asc">Hind: Odavamast kallimani</option>
                    <option value="price-desc">Hind: Kallimast odavamani</option>
                    <option value="value-desc">Turuväärtus: Kõrgeim enne</option>
                    <option value="value-asc">Turuväärtus: Madalaim enne</option>
                  </optgroup>
                  <optgroup label="🌐 Keel & Kategooria">
                    <option value="language-asc">Keel: A kuni Z</option>
                    <option value="language-desc">Keel: Z kuni A</option>
                    <option value="category-asc">Kategooria: A kuni Z</option>
                    <option value="category-desc">Kategooria: Z kuni A</option>
                  </optgroup>
                  <optgroup label="⏱️ Lisamise aeg">
                    <option value="newest">Lisatud: Uuemad enne</option>
                    <option value="oldest">Lisatud: Vanemad enne</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Time Period / Era Filter */}
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <Calendar className="w-3.5 h-3.5 text-amber-700 hidden sm:inline" />
              <select
                id="period-filter-select"
                value={periodFilter}
                onChange={(e) => onPeriodFilterChange(e.target.value as TimePeriodKey)}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${
                  periodFilter !== 'all'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <option value="all">Kõik ajavahemikud / aastad</option>
                {TIME_PERIODS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
                <option value="custom">⚙️ Kohandatud ajavahemik...</option>
              </select>
            </div>

            {/* Language Filter */}
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <Globe className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />
              <select
                id="language-filter-select"
                value={languageFilter}
                onChange={(e) => onLanguageFilterChange(e.target.value)}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${
                  languageFilter !== 'all'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <option value="all">Kõik keeled</option>
                {(languages || []).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang} keel
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs text-stone-700">
              <Filter className="w-3.5 h-3.5 text-stone-400 hidden sm:inline" />
              <select
                id="category-filter-select"
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors ${
                  categoryFilter !== 'all'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <option value="all">Kõik kategooriad</option>
                {(categories || []).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters button if any filter is active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="py-1 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Lähtesta kõik filtrid"
            >
              <RotateCcw className="w-3 h-3 text-stone-500" />
              <span>Tühjenda filtrid</span>
            </button>
          )}
        </div>

        {/* Custom Year Range inputs when 'custom' period is chosen */}
        {periodFilter === 'custom' && (
          <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-wrap items-center gap-3 text-xs text-amber-950">
            <span className="font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-800" />
              Määra aastate vahemik:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-stone-600">Alates:</label>
              <input
                type="number"
                value={customYearRange.min || ''}
                onChange={(e) =>
                  onCustomYearRangeChange({
                    ...customYearRange,
                    min: Number(e.target.value) || 1900,
                  })
                }
                className="w-20 px-2 py-1 bg-white rounded-lg border border-amber-300 text-xs font-semibold focus:outline-none"
                placeholder="1900"
              />
              <span className="text-stone-400">—</span>
              <label className="text-stone-600">Kuni:</label>
              <input
                type="number"
                value={customYearRange.max || ''}
                onChange={(e) =>
                  onCustomYearRangeChange({
                    ...customYearRange,
                    max: Number(e.target.value) || new Date().getFullYear(),
                  })
                }
                className="w-20 px-2 py-1 bg-white rounded-lg border border-amber-300 text-xs font-semibold focus:outline-none"
                placeholder={String(new Date().getFullYear())}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

