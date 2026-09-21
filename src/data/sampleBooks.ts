import { Book } from '../types';

// Helper to generate elegant SVG cover art data URLs with authentic book feeling
function generateCoverSvg(title: string, author: string, year: number, colorBg: string, colorAccent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorBg}" />
        <stop offset="100%" stop-color="${colorAccent}" />
      </linearGradient>
      <linearGradient id="spine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(0,0,0,0.35)" />
        <stop offset="3%" stop-color="rgba(255,255,255,0.2)" />
        <stop offset="6%" stop-color="rgba(0,0,0,0.15)" />
        <stop offset="10%" stop-color="rgba(0,0,0,0)" />
      </linearGradient>
      <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.08)" />
      </pattern>
    </defs>
    <rect width="600" height="800" rx="12" fill="url(#g)" />
    <rect width="600" height="800" fill="url(#pattern)" />
    <rect width="600" height="800" fill="url(#spine)" />
    <!-- Golden vintage decorative border -->
    <rect x="36" y="36" width="528" height="728" rx="8" fill="none" stroke="rgba(253,230,138,0.3)" stroke-width="2" />
    <rect x="46" y="46" width="508" height="708" rx="6" fill="none" stroke="rgba(253,230,138,0.55)" stroke-width="1.5" stroke-dasharray="8 4" />
    
    <!-- Title and Author box -->
    <rect x="70" y="160" width="460" height="340" rx="8" fill="rgba(0,0,0,0.25)" />
    <text x="300" y="240" font-family="'Fraunces', serif" font-size="34" font-weight="bold" fill="#fef3c7" text-anchor="middle" letter-spacing="1">
      ${title.length > 22 ? title.slice(0, 20) + '...' : title}
    </text>
    <line x1="160" y1="270" x2="440" y2="270" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" />
    <text x="300" y="340" font-family="'Plus Jakarta Sans', sans-serif" font-size="22" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="2">
      ${author.toUpperCase()}
    </text>
    <text x="300" y="420" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" fill="#fde68a" text-anchor="middle" opacity="0.9">
      ILMUNUD ${year}
    </text>

    <!-- Bottom seal -->
    <circle cx="300" cy="620" r="38" fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="2" />
    <text x="300" y="626" font-family="serif" font-size="20" fill="#fef3c7" text-anchor="middle">✦ ⚜ ✦</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'book-1',
    title: 'Tõde ja õigus I',
    author: 'A. H. Tammsaare',
    year: 1926,
    description: 'Eesti kirjanduse tüvitekst Vargamäe Eespere ja Tagapere talude vahelisest igipõlisest heitlusest maa, õiguse ja tõe nimel.',
    value: 65,
    price: 35,
    photoUrl: generateCoverSvg('Tõde ja õigus I', 'A. H. Tammsaare', 1926, '#312e81', '#1e1b4b'),
    category: 'Eesti klassika',
    condition: 'Väga hea',
    status: 'available',
    publisher: 'Noor-Eesti Kirjastus',
    notes: 'Kõvaköiteline heas säilivuses eksemplar, kaaned terved, lehed puhtad.',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'book-2',
    title: 'Kevade',
    author: 'Oskar Luts',
    year: 1912,
    description: 'Pildikesi Paunvere koolielust läbi noorte poiste ja tüdrukute seikluste, rõõmude ja murede. Arno, Toots, Kiir ja Teele surematud seiklused.',
    value: 80,
    price: 45,
    photoUrl: generateCoverSvg('Kevade', 'Oskar Luts', 1912, '#064e3b', '#022c22'),
    category: 'Eesti klassika',
    condition: 'Antiikne',
    status: 'available',
    publisher: 'Postimees',
    notes: 'Varajane trükk, leheküljed kergelt koltunud, väga haruldane kollektsionääri maiuspala.',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'book-3',
    title: 'Väike prints',
    author: 'Antoine de Saint-Exupéry',
    year: 1943,
    description: 'Filosoofiline muinasjutt sõprusest, armastusest ja vastutusest. "Ainult südamega näeb hästi. Kõige tähtsam on silmale nähtamatu."',
    value: 25,
    price: 15,
    photoUrl: generateCoverSvg('Väike prints', 'A. de Saint-Exupéry', 1943, '#0c4a6e', '#164e63'),
    category: 'Maailmakirjandus',
    condition: 'Uueväärne',
    status: 'available',
    publisher: 'Eesti Raamat',
    notes: 'Suurepärases seisukorras, illustreeritud väljaanne.',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'book-4',
    title: '1984',
    author: 'George Orwell',
    year: 1949,
    description: 'Klassikaline düstoopia totalitaarsest ühiskonnast, Suure Venna lakkamatust jälgimisest, tõeministeeriumist ja vabaduse tähendusest.',
    value: 30,
    price: 20,
    photoUrl: generateCoverSvg('1984', 'George Orwell', 1949, '#831843', '#500724'),
    category: 'Düstoopia & Ulme',
    condition: 'Hea',
    status: 'reserved',
    publisher: 'Perioodika',
    notes: 'Broneeritud kliendile kuni reedeni.',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'book-5',
    title: 'Kääbik ehk Sinna ja tagasi',
    author: 'J. R. R. Tolkien',
    year: 1937,
    description: 'Võlur Gandalf ja kolmteist päkapikku eesotsas Thorin Tammiskilbiga viivad mugava koduhoidja Bilbo Paunaste suurele teekonnale lohe Smaugi aardeni.',
    value: 45,
    price: 28,
    photoUrl: generateCoverSvg('Kääbik', 'J. R. R. Tolkien', 1937, '#713f12', '#451a03'),
    category: 'Fantaasia',
    condition: 'Väga hea',
    status: 'available',
    publisher: 'Tiritamm',
    notes: 'Klassikaliste Tove Janssoni illustratsioonidega eesti keeles.',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'book-6',
    title: 'Rehepapp ehk November',
    author: 'Andrus Kivirähk',
    year: 2000,
    description: 'Vaimukas ja irooniline lugu vanast eesti külaelust, krattidest, tontidest, ahnusest ja ellujäämiskunstist rehepapp Sanderi silme läbi.',
    value: 20,
    price: 14,
    photoUrl: generateCoverSvg('Rehepapp', 'Andrus Kivirähk', 2000, '#1c1917', '#292524'),
    category: 'Eesti nüüdiskirjandus',
    condition: 'Uueväärne',
    status: 'sold',
    publisher: 'Varrak',
    notes: 'Müüdud kirjandushuvilisele 14 euro eest.',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 1,
  }
];
