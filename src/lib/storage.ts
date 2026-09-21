import { Book } from '../types';
import { SAMPLE_BOOKS } from '../data/sampleBooks';

const DB_NAME = 'RaamatukoguDB';
const DB_VERSION = 1;
const STORE_NAME = 'books';
const FALLBACK_KEY = 'raamatukogu_books_v1';

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB pole toetatud'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Load all books from storage
export async function loadBooks(): Promise<Book[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as Book[];
        if (result && result.length > 0) {
          resolve(result);
        } else {
          // Initialize with sample books on first launch
          saveAllBooks(SAMPLE_BOOKS)
            .then(() => resolve(SAMPLE_BOOKS))
            .catch(() => resolve(SAMPLE_BOOKS));
        }
      };

      request.onerror = () => {
        // Fallback to localStorage
        const local = localStorage.getItem(FALLBACK_KEY);
        if (local) {
          try {
            resolve(JSON.parse(local));
            return;
          } catch {
            // Ignore parse error
          }
        }
        resolve(SAMPLE_BOOKS);
      };
    });
  } catch (e) {
    console.warn('IndexedDB viga, kasutame localStorage:', e);
    const local = localStorage.getItem(FALLBACK_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return SAMPLE_BOOKS;
  }
}

// Save single book
export async function saveBook(book: Book): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(book);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const books = await loadBooks();
    const index = books.findIndex((b) => b.id === book.id);
    if (index >= 0) {
      books[index] = book;
    } else {
      books.unshift(book);
    }
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(books));
  }
}

// Delete book
export async function deleteBook(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const books = await loadBooks();
    const updated = books.filter((b) => b.id !== id);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(updated));
  }
}

// Save all books
export async function saveAllBooks(books: Book[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      books.forEach((book) => store.put(book));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(books));
  }
}

// Reset to default sample books
export async function resetToSampleBooks(): Promise<Book[]> {
  await saveAllBooks(SAMPLE_BOOKS);
  return SAMPLE_BOOKS;
}

// Helper to compress images uploaded by user (to prevent huge payload & conserve memory)
export function compressImage(file: File | Blob, maxWidth = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Export books as JSON file
export function exportBooksToJson(books: Book[]): void {
  const dataStr = JSON.stringify(books, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `raamatukogu_eksport_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export books as CSV (Excel compatible with UTF-8 BOM)
export function exportBooksToCsv(books: Book[]): void {
  const headers = [
    'ID',
    'Pealkiri',
    'Autor',
    'Aasta',
    'Müügihind (€)',
    'Väärtus (€)',
    'Kategooria',
    'Seisukord',
    'Staatus',
    'Kirjastus',
    'Lühitutvustus',
    'Märkused'
  ];

  const rows = books.map((b) => [
    b.id,
    `"${(b.title || '').replace(/"/g, '""')}"`,
    `"${(b.author || '').replace(/"/g, '""')}"`,
    b.year,
    b.price,
    b.value,
    `"${(b.category || '').replace(/"/g, '""')}"`,
    b.condition,
    b.status === 'available' ? 'Müügis' : b.status === 'reserved' ? 'Broneeritud' : 'Müüdud',
    `"${(b.publisher || '').replace(/"/g, '""')}"`,
    `"${(b.description || '').replace(/"/g, '""')}"`,
    `"${(b.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `raamatukogu_nimekiri_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import books from uploaded JSON file
export function importBooksFromJson(file: File): Promise<Book[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) {
          throw new Error('Fail ei sisalda raamatute nimekirja massiivi.');
        }
        const validated: Book[] = imported.map((item, idx) => ({
          id: item.id || `imported-${Date.now()}-${idx}`,
          title: String(item.title || 'Nimetu raamat'),
          author: String(item.author || 'Tundmatu autor'),
          year: Number(item.year) || 2000,
          description: String(item.description || ''),
          value: Number(item.value) || 10,
          price: Number(item.price) || 5,
          photoUrl: item.photoUrl || '',
          category: item.category || 'Muu',
          condition: item.condition || 'Hea',
          status: item.status || 'available',
          publisher: item.publisher || '',
          notes: item.notes || '',
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now(),
        }));
        resolve(validated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
