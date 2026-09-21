import React, { useState } from 'react';
import { Layers, Tag, Calendar, Globe, ChevronDown, ChevronUp, Clock, Check } from 'lucide-react';
import { GroupByOption, TimePeriodDef, TimePeriodKey } from '../types';
import { TIME_PERIODS } from '../lib/bookSorting';

interface CategoryBarProps {
  categories: string[];
  categoryCounts: Record<string, number>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;

  languages: string[];
  languageCounts: Record<string, number>;
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;

  periodCounts: Record<string, number>;
  selectedPeriod: TimePeriodKey;
  onSelectPeriod: (period: TimePeriodKey) => void;

  totalBooks: number;
  groupBy: GroupByOption;
  onGroupByChange: (groupBy: GroupByOption) => void;

  isAllCollapsed?: boolean;
  onToggleCollapseAll?: () => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  categoryCounts,
  selectedCategory,
  onSelectCategory,
  languages,
  languageCounts,
  selectedLanguage,
  onSelectLanguage,
  periodCounts,
  selectedPeriod,
  onSelectPeriod,
  totalBooks,
  groupBy,
  onGroupByChange,
  isAllCollapsed = false,
  onToggleCollapseAll,
}) => {
  // Local active tab for the pills carousel: 'category' | 'period' | 'language'
  const [activePillTab, setActivePillTab] = useState<'category' | 'period' | 'language'>('category');

  return (
    <div className="mb-6 space-y-3">
      {/* Control bar: Pills category/period/language mode switcher and grouping dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs">
        {/* Left: Tab selectors to switch pill view */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActivePillTab('category');
              if (groupBy === 'none') onGroupByChange('category');
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activePillTab === 'category'
                ? 'bg-amber-100 text-amber-950 shadow-2xs font-bold'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-800" />
            <span>Kategooriad ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePillTab('period');
              if (groupBy === 'none') onGroupByChange('period');
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activePillTab === 'period'
                ? 'bg-amber-100 text-amber-950 shadow-2xs font-bold'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-800" />
            <span>Ajavahemikud / Ajastud</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePillTab('language');
              if (groupBy === 'none') onGroupByChange('language');
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activePillTab === 'language'
                ? 'bg-amber-100 text-amber-950 shadow-2xs font-bold'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-800" />
            <span>Keeled ({languages.length})</span>
          </button>
        </div>

        {/* Right: Grouping mode selector & Collapse/Expand */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <Layers className="w-3.5 h-3.5 text-amber-800" />
            <span className="font-medium text-stone-500 hidden md:inline">Grupeeri:</span>
            <select
              id="group-by-select"
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value as GroupByOption)}
              className="py-1.5 px-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="category">🏷️ Kategooriate kaupa</option>
              <option value="period">⏳ Ajavahemike / Ajastute kaupa</option>
              <option value="language">🌐 Keelte kaupa</option>
              <option value="none">📋 Ilma grupeerimata</option>
            </select>
          </div>

          {groupBy !== 'none' && onToggleCollapseAll && (
            <button
              type="button"
              onClick={onToggleCollapseAll}
              className="py-1.5 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-medium flex items-center gap-1 transition-colors"
              title={isAllCollapsed ? 'Ava kõik plokid' : 'Ahenda kõik plokid'}
            >
              {isAllCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ava kõik</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ahenda</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Pills Carousel based on activePillTab */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-stone-300">
        {/* CATEGORY PILLS */}
        {activePillTab === 'category' && (
          <>
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <span>Kõik kategooriad</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedCategory === 'all'
                    ? 'bg-stone-800 text-amber-200'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {totalBooks}
              </span>
            </button>

            {categories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-amber-900 text-amber-100'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {/* TIME PERIOD / ERA PILLS */}
        {activePillTab === 'period' && (
          <>
            <button
              type="button"
              onClick={() => onSelectPeriod('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                selectedPeriod === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <span>Kõik ajastud</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedPeriod === 'all'
                    ? 'bg-stone-800 text-amber-200'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {totalBooks}
              </span>
            </button>

            {TIME_PERIODS.map((period) => {
              const count = periodCounts[period.key] || 0;
              const isSelected = selectedPeriod === period.key;

              return (
                <button
                  key={period.key}
                  type="button"
                  onClick={() => onSelectPeriod(period.key)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                  title={period.description}
                >
                  <span>{period.shortLabel}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-amber-900 text-amber-100'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {/* LANGUAGE PILLS */}
        {activePillTab === 'language' && (
          <>
            <button
              type="button"
              onClick={() => onSelectLanguage('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                selectedLanguage === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <span>Kõik keeled</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedLanguage === 'all'
                    ? 'bg-stone-800 text-amber-200'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {totalBooks}
              </span>
            </button>

            {languages.map((lang) => {
              const count = languageCounts[lang] || 0;
              const isSelected = selectedLanguage === lang;

              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onSelectLanguage(lang)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span>{lang}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected
                        ? 'bg-amber-900 text-amber-100'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
