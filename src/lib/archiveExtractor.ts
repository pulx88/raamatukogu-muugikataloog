import JSZip from 'jszip';
import { compressImage } from './storage';

export interface ExtractedImageItem {
  id: string;
  name: string;
  dataUrl: string;
  titleHint?: string;
  descriptionHint?: string;
  dateHint?: number;
}

// Extract images from a ZIP archive (e.g. Google Takeout / Google Photos download)
export async function extractImagesFromZip(
  file: File,
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<ExtractedImageItem[]> {
  // Check if file is still downloading or empty
  if (file.size === 0) {
    throw new Error('Valitud ZIP fail on tühi (0 baiti). Kontrolli, kas allalaadimine Google Fotodest on lõppenud.');
  }

  let arrayBuffer: ArrayBuffer;
  try {
    if (typeof file.arrayBuffer === 'function') {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    }
  } catch (readErr: any) {
    console.error('Faili lugemise viga:', readErr);
    throw new Error(
      'Brauser ei saanud ZIP-faili lugeda (fail võib olla veel allalaadimisel või Windowsi poolt lukus). ' +
      'Kõige lihtsam lahendus: tee ZIP-failil oma arvutis paremklõps -> "Paki kõik lahti" (Extract All) ja kasuta siin nuppu "2. Vali lahtipakitud kaust".'
    );
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch (zipErr: any) {
    console.error('JSZip parse error:', zipErr);
    throw new Error(
      'Faili lahtipakkimine ebaõnnestus. Kontrolli, et tegemist on terve ZIP-failiga, või paki see arvutis lahti ja vali fotod nupuga "2. Vali lahtipakitud kaust".'
    );
  }

  const imageEntries: { path: string; file: JSZip.JSZipObject }[] = [];
  const jsonMetadataMap = new Map<string, any>();

  // Scan all entries in ZIP
  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    if (relativePath.includes('__MACOSX') || relativePath.startsWith('.')) return;

    const lower = relativePath.toLowerCase();

    // Skip JSON sidecars here (processed later)
    if (lower.endsWith('.json')) {
      return;
    }

    if (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.bmp') ||
      lower.endsWith('.heic') ||
      lower.endsWith('.heif') ||
      lower.endsWith('.avif') ||
      lower.endsWith('.tif') ||
      lower.endsWith('.tiff')
    ) {
      imageEntries.push({ path: relativePath, file: zipEntry });
    }
  });

  if (imageEntries.length === 0) {
    throw new Error(
      'ZIP failist ei leitud ühtegi fotot (.jpg, .png jne). Kui fotod on arvutis juba lahti pakitud, kasuta nuppu "Vali kaust" või "Vali fotod".'
    );
  }

  // Try to load any Google Takeout JSON sidecars if present
  for (const item of imageEntries) {
    const jsonPath = `${item.path}.json`;
    const jsonEntry = zip.file(jsonPath);
    if (jsonEntry) {
      try {
        const text = await jsonEntry.async('text');
        const parsed = JSON.parse(text);
        jsonMetadataMap.set(item.path, parsed);
      } catch {
        // Ignore json parse error
      }
    }
  }

  const results: ExtractedImageItem[] = [];
  const total = imageEntries.length;

  for (let i = 0; i < total; i++) {
    const item = imageEntries[i];
    const fileName = item.path.split('/').pop() || item.path;

    if (onProgress) {
      onProgress(i + 1, total, fileName);
    }

    try {
      const blob = await item.file.async('blob');
      // Convert to compressed webp/jpeg dataUrl
      const dataUrl = await compressImage(blob, 1200, 0.85);

      const meta = jsonMetadataMap.get(item.path);
      const cleanTitle = fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/^IMG \d+/i, '')
        .trim();

      results.push({
        id: `zip-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        name: fileName,
        dataUrl,
        titleHint: meta?.title || (cleanTitle.length > 2 ? cleanTitle : ''),
        descriptionHint: meta?.description || '',
        dateHint: meta?.photoTakenTime?.timestamp ? Number(meta.photoTakenTime.timestamp) * 1000 : undefined,
      });
    } catch (err) {
      console.warn(`Faili ${fileName} töötlemine ebaõnnestus:`, err);
    }
  }

  return results;
}

// Extract pages from a multi-page PDF document
export async function extractImagesFromPdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedImageItem[]> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker src to unpkg cdn matching version
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const results: ExtractedImageItem[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, numPages);
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Render PDF page to canvas
        const renderContext = {
          canvasContext: ctx as any,
          viewport: viewport,
          canvas: canvas as any,
        };
        await (page.render(renderContext as any) as any).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        results.push({
          id: `pdf-page-${pageNum}-${Date.now()}`,
          name: `Lehekülg ${pageNum}`,
          dataUrl,
          titleHint: `Raamat lk ${pageNum}`,
        });
      }
    } catch (err) {
      console.warn(`PDF lehekülje ${pageNum} renderdamise viga:`, err);
    }
  }

  return results;
}
