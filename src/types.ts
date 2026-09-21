export type BookCondition = 'Uueväärne' | 'Väga hea' | 'Hea' | 'Rahuldav' | 'Antiikne';
export type BookStatus = 'available' | 'reserved' | 'sold';

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  description: string;
  value: number; // Hinnanguline antikvaarne / turuväärtus eurodes
  price: number; // Müügihind eurodes
  photoUrl: string; // Pildi andmed (Data URL või pildi URL)
  category: string;
  condition: BookCondition;
  status: BookStatus;
  language?: string; // nt "Eesti", "Inglise", "Vene", "Saksa", "Soome"
  publisher?: string;
  isbn?: string;
  pages?: number;
  notes?: string;
  viewsCount?: number; // Vaatamiste arv populaarsuse mõõtmiseks
  popularityScore?: number; // Arvutatud populaarsusskoor
  yearConfidence?: 'high' | 'medium' | 'approximate';
  yearReasoning?: string;
  aiReviewed?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SortOption =
  | 'popularity-desc' // Populaarseimad ees
  | 'popularity-asc' // Vähem populaarsed ees
  | 'year-desc' // Ilmumisaasta: uuemad enne
  | 'year-asc' // Ilmumisaasta: vanemad enne
  | 'period-asc' // Ajavahemik: varasemast hilisemani
  | 'period-desc' // Ajavahemik: hilisemast varasemani
  | 'author-asc' // Autor: A - Z
  | 'author-desc' // Autor: Z - A
  | 'title-asc' // Pealkiri: A - Z
  | 'title-desc' // Pealkiri: Z - A
  | 'price-asc' // Hind: odavamad enne
  | 'price-desc' // Hind: kallimad enne
  | 'value-desc' // Väärtus: kõrgeim enne
  | 'value-asc' // Väärtus: madalaim enne
  | 'language-asc' // Keel: A - Z
  | 'language-desc' // Keel: Z - A
  | 'category-asc' // Kategooria: A - Z
  | 'category-desc' // Kategooria: Z - A
  | 'newest' // Lisamise aeg: uuemad enne
  | 'oldest'; // Lisamise aeg: vanemad enne

export type TimePeriodKey =
  | 'all'
  | 'pre-1940'
  | '1940-1960'
  | '1961-1990'
  | '1991-2000'
  | '2001-2015'
  | '2016-present'
  | 'custom';

export type GroupByOption = 'category' | 'period' | 'language' | 'none';

export interface TimePeriodDef {
  key: TimePeriodKey;
  label: string;
  shortLabel: string;
  description: string;
  minYear?: number;
  maxYear?: number;
}

export interface BookScanResult {
  title: string;
  author: string;
  year: number;
  yearConfidence?: 'high' | 'medium' | 'approximate';
  yearReasoning?: string;
  description: string;
  estimatedValue: number;
  suggestedPrice: number;
  category: string;
  language?: string;
  condition?: BookCondition;
  publisher?: string;
}
