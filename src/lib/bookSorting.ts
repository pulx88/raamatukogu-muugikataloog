import { Book, SortOption, TimePeriodDef, TimePeriodKey } from '../types';

export const TIME_PERIODS: TimePeriodDef[] = [
  {
    key: 'pre-1940',
    label: 'Enne 1940 (Eesti Vabariik ja vanemad trükised)',
    shortLabel: 'Enne 1940',
    description: '1918–1940 Eesti Vabariigi ja varasema aja kultuuripärand ja trükised',
    minYear: 0,
    maxYear: 1939,
  },
  {
    key: '1940-1960',
    label: '1940–1960 (Sõja- ja sõjajärgne ajastu)',
    shortLabel: '1940–1960',
    description: 'Teise maailmasõja ja vahetult sõjajärgse perioodi väljaanded (nt ERK algus)',
    minYear: 1940,
    maxYear: 1960,
  },
  {
    key: '1961-1990',
    label: '1961–1990 (Hilisnõukogude aeg / ENSV)',
    shortLabel: '1961–1990',
    description: 'Eesti Raamat, "Mirabilia", "Seiklusjutte", Perioodika ja klassikasarjad',
    minYear: 1961,
    maxYear: 1990,
  },
  {
    key: '1991-2000',
    label: '1991–2000 (Taasiseseisvumise aastad)',
    shortLabel: '1991–2000',
    description: 'Eesti taasiseseisvumise esimese kümnendi kirjastusbuum ja uued autorid',
    minYear: 1991,
    maxYear: 2000,
  },
  {
    key: '2001-2015',
    label: '2001–2015 (2000ndad aastad)',
    shortLabel: '2001–2015',
    description: 'Kaasaegne eesti ja tõlkekirjandus sajandivahetuse järgsest ajast',
    minYear: 2001,
    maxYear: 2015,
  },
  {
    key: '2016-present',
    label: '2016–tänapäev (Uusimad väljaanded)',
    shortLabel: '2016–tänapäev',
    description: 'Viimaste aastate värsked trükid ja uusteosed',
    minYear: 2016,
    maxYear: 9999,
  },
];

export const STANDARD_LANGUAGES = [
  'Eesti',
  'Inglise',
  'Vene',
  'Saksa',
  'Soome',
  'Prantsuse',
  'Rootsi',
  'Muu',
];

/**
 * Find matching era period definition for a book's publication year
 */
export function getBookTimePeriod(year: number): TimePeriodDef {
  const numYear = Number(year) || 1980;
  for (const period of TIME_PERIODS) {
    if (period.minYear !== undefined && period.maxYear !== undefined) {
      if (numYear >= period.minYear && numYear <= period.maxYear) {
        return period;
      }
    }
  }
  return TIME_PERIODS[2]; // Default fallback to 1961-1990
}

/**
 * Calculates a composite popularity score for a book
 * Factors:
 * - Direct user views (viewsCount * 12)
 * - Interest status (reserved: +40, sold: +70)
 * - Collector interest / estimated value ratio
 */
export function calculatePopularity(book: Book): number {
  const views = book.viewsCount || 0;
  let score = views * 12;

  // Status bonus
  if (book.status === 'sold') score += 70;
  else if (book.status === 'reserved') score += 40;
  else score += 10;

  // Value & price ratio bonus (attractive bargains have higher interest)
  const diff = (book.value || 0) - (book.price || 0);
  if (diff > 0) {
    score += Math.min(diff * 2, 30);
  }

  // AI verified and complete description bonus
  if (book.year && book.year > 0) score += 5;
  if (book.author && book.author !== 'Määramata autor') score += 5;

  return score;
}

/**
 * High-precision sorting for book listings adhering to Estonian alphabetical rules
 */
export function sortBooks(books: Book[], sortOption: SortOption): Book[] {
  const list = [...books];

  return list.sort((a, b) => {
    switch (sortOption) {
      // Popularity sorting
      case 'popularity-desc': {
        const popDiff = calculatePopularity(b) - calculatePopularity(a);
        if (popDiff !== 0) return popDiff;
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      case 'popularity-asc': {
        const popDiff = calculatePopularity(a) - calculatePopularity(b);
        if (popDiff !== 0) return popDiff;
        return (a.viewsCount || 0) - (b.viewsCount || 0);
      }

      // Year / Chronological sorting
      case 'year-desc': {
        const yearDiff = (b.year || 0) - (a.year || 0);
        if (yearDiff !== 0) return yearDiff;
        return a.title.localeCompare(b.title, 'et');
      }
      case 'year-asc': {
        const yearDiff = (a.year || 0) - (b.year || 0);
        if (yearDiff !== 0) return yearDiff;
        return a.title.localeCompare(b.title, 'et');
      }

      // Time period / Era sorting
      case 'period-asc': {
        const pA = getBookTimePeriod(a.year).minYear || 0;
        const pB = getBookTimePeriod(b.year).minYear || 0;
        if (pA !== pB) return pA - pB;
        return (a.year || 0) - (b.year || 0);
      }
      case 'period-desc': {
        const pA = getBookTimePeriod(a.year).minYear || 0;
        const pB = getBookTimePeriod(b.year).minYear || 0;
        if (pA !== pB) return pB - pA;
        return (b.year || 0) - (a.year || 0);
      }

      // Author sorting
      case 'author-asc': {
        const authorDiff = (a.author || '').localeCompare(b.author || '', 'et');
        if (authorDiff !== 0) return authorDiff;
        return (a.title || '').localeCompare(b.title || '', 'et');
      }
      case 'author-desc': {
        const authorDiff = (b.author || '').localeCompare(a.author || '', 'et');
        if (authorDiff !== 0) return authorDiff;
        return (a.title || '').localeCompare(b.title || '', 'et');
      }

      // Title sorting
      case 'title-asc': {
        return (a.title || '').localeCompare(b.title || '', 'et');
      }
      case 'title-desc': {
        return (b.title || '').localeCompare(a.title || '', 'et');
      }

      // Price sorting
      case 'price-asc': {
        const priceDiff = (a.price || 0) - (b.price || 0);
        if (priceDiff !== 0) return priceDiff;
        return a.title.localeCompare(b.title, 'et');
      }
      case 'price-desc': {
        const priceDiff = (b.price || 0) - (a.price || 0);
        if (priceDiff !== 0) return priceDiff;
        return a.title.localeCompare(b.title, 'et');
      }

      // Value sorting
      case 'value-desc': {
        const valDiff = (b.value || 0) - (a.value || 0);
        if (valDiff !== 0) return valDiff;
        return a.title.localeCompare(b.title, 'et');
      }
      case 'value-asc': {
        const valDiff = (a.value || 0) - (b.value || 0);
        if (valDiff !== 0) return valDiff;
        return a.title.localeCompare(b.title, 'et');
      }

      // Language sorting
      case 'language-asc': {
        const langA = a.language?.trim() || 'Eesti';
        const langB = b.language?.trim() || 'Eesti';
        const langDiff = langA.localeCompare(langB, 'et');
        if (langDiff !== 0) return langDiff;
        return a.title.localeCompare(b.title, 'et');
      }
      case 'language-desc': {
        const langA = a.language?.trim() || 'Eesti';
        const langB = b.language?.trim() || 'Eesti';
        const langDiff = langB.localeCompare(langA, 'et');
        if (langDiff !== 0) return langDiff;
        return a.title.localeCompare(b.title, 'et');
      }

      // Category sorting
      case 'category-asc': {
        const catA = a.category?.trim() || 'Muu';
        const catB = b.category?.trim() || 'Muu';
        const catDiff = catA.localeCompare(catB, 'et');
        if (catDiff !== 0) return catDiff;
        return a.title.localeCompare(b.title, 'et');
      }
      case 'category-desc': {
        const catA = a.category?.trim() || 'Muu';
        const catB = b.category?.trim() || 'Muu';
        const catDiff = catB.localeCompare(catA, 'et');
        if (catDiff !== 0) return catDiff;
        return a.title.localeCompare(b.title, 'et');
      }

      // Timestamp sorting
      case 'newest':
        return (b.createdAt || 0) - (a.createdAt || 0);
      case 'oldest':
        return (a.createdAt || 0) - (b.createdAt || 0);

      default:
        return 0;
    }
  });
}
