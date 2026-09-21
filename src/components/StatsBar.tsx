import React from 'react';
import { Book } from '../types';
import { BookOpen, Tag, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface StatsBarProps {
  books: Book[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ books }) => {
  const totalBooks = books.length;
  const availableBooks = books.filter((b) => b.status === 'available');
  const reservedBooks = books.filter((b) => b.status === 'reserved');
  const soldBooks = books.filter((b) => b.status === 'sold');

  const totalValue = books.reduce((sum, b) => sum + (Number(b.value) || 0), 0);
  const totalAvailablePrice = availableBooks.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  const totalSoldPrice = soldBooks.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const avgPrice = totalBooks > 0 ? (totalAvailablePrice / (availableBooks.length || 1)).toFixed(1) : '0';

  return (
    <div id="stats-overview-bar" className="bg-white/90 backdrop-blur border border-amber-900/10 rounded-2xl p-4 shadow-sm mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total books */}
        <div id="stat-total-books" className="flex items-center space-x-3 p-2 rounded-xl bg-amber-50/50">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Raamatuid</div>
            <div className="text-xl font-bold text-stone-900">
              {totalBooks} <span className="text-xs font-normal text-stone-500">tk</span>
            </div>
          </div>
        </div>

        {/* Available for sale */}
        <div id="stat-available-books" className="flex items-center space-x-3 p-2 rounded-xl bg-emerald-50/50">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Müügis</div>
            <div className="text-xl font-bold text-emerald-900">
              {availableBooks.length} <span className="text-xs font-normal text-stone-500">tk</span>
            </div>
          </div>
        </div>

        {/* Total catalog value */}
        <div id="stat-total-value" className="flex items-center space-x-3 p-2 rounded-xl bg-blue-50/50">
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Koguväärtus</div>
            <div className="text-xl font-bold text-blue-900">
              {totalValue.toLocaleString('et-EE')} <span className="text-xs font-normal text-stone-500">€</span>
            </div>
          </div>
        </div>

        {/* Total sale price of available books */}
        <div id="stat-sale-potential" className="flex items-center space-x-3 p-2 rounded-xl bg-amber-100/50">
          <div className="p-2.5 rounded-lg bg-amber-200 text-amber-900">
            <span className="font-bold text-base">€</span>
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Müügipotentsiaal</div>
            <div className="text-xl font-bold text-amber-950">
              {totalAvailablePrice.toLocaleString('et-EE')} <span className="text-xs font-normal text-stone-500">€</span>
            </div>
          </div>
        </div>

        {/* Reserved & Sold count */}
        <div id="stat-sold-summary" className="flex items-center space-x-3 p-2 rounded-xl bg-stone-100/70 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Broneeritud / Müüdud</div>
            <div className="text-sm font-semibold text-stone-900 flex items-center gap-1.5 mt-0.5">
              <span className="text-amber-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 inline" /> {reservedBooks.length}
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-stone-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 inline text-emerald-600" /> {soldBooks.length} ({totalSoldPrice} €)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
