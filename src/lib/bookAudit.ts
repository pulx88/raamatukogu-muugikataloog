import { Book, BookScanResult } from '../types';

/**
 * Checks if a book needs manual or AI review because of missing, suspicious or default data.
 */
export function isBookNeedingReview(book: Book): boolean {
  return getBookReviewReasons(book).length > 0;
}

/**
 * Returns human-readable reasons why a book is flagged for review.
 */
export function getBookReviewReasons(book: Book): string[] {
  const reasons: string[] = [];
  const currentYear = new Date().getFullYear();

  // Suspicious or default year
  if (!book.year || book.year <= 0) {
    reasons.push('Ilmumisaasta puudub');
  } else if (book.year >= currentYear - 1) {
    reasons.push(`Kahtlane aasta (${book.year} – tõenäoliselt süsteemi vaikimisi aasta)`);
  }

  // Missing or default author
  const authorClean = (book.author || '').trim().toLowerCase();
  if (!authorClean || authorClean === 'määramata autor' || authorClean === 'tundmatu autor' || authorClean === 'autor') {
    reasons.push('Autor tuvastamata ("Määramata autor")');
  }

  // Generic or file-like title
  const titleClean = (book.title || '').trim();
  if (
    !titleClean ||
    titleClean === 'Tuvastamata pealkiri' ||
    /^img[-_\d]/i.test(titleClean) ||
    /^dsc[-_\d]/i.test(titleClean) ||
    /^p\d{6,}/i.test(titleClean) ||
    /^batch[-_\d]/i.test(titleClean) ||
    /^raamat lk/i.test(titleClean) ||
    titleClean.length < 2
  ) {
    reasons.push('Pealkiri on failinimi või üldine kohatäide');
  }

  // Empty or missing synopsis
  if (!book.description || book.description.trim().length < 15) {
    reasons.push('Lühitutvustus puudub');
  }

  return reasons;
}

/**
 * Calls the upgraded backend to scan or review a book with deep Estonian bibliophile AI.
 */
export async function scanBookWithAI(params: {
  imageBase64?: string;
  existingTitle?: string;
  existingAuthor?: string;
  currentYear?: number;
  notes?: string;
  reviewMode?: boolean;
}): Promise<BookScanResult> {
  const res = await fetch('/api/scan-book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: params.imageBase64,
      existingTitle: params.existingTitle,
      existingAuthor: params.existingAuthor,
      currentYear: params.currentYear,
      notes: params.notes,
      reviewMode: params.reviewMode ?? true,
    }),
  });

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || 'Raamatu analüüsimine ebaõnnestus');
  }

  return json.data;
}
