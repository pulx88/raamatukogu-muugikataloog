import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for book image uploads
app.use(express.json({ limit: '25mb' }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Endpoint to scan and analyze book photo using Gemini
app.post('/api/scan-book', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType,
      existingTitle,
      existingAuthor,
      currentYear,
      notes,
      reviewMode,
    } = req.body;

    const gemini = getGeminiClient();
    if (!gemini) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY pole konfigureeritud. Saate andmed sisestada ka käsitsi.'
      });
    }

    if (!imageBase64 && !existingTitle && !existingAuthor) {
      return res.status(400).json({ error: 'Pildi andmed või pealkiri/autor on nõutud.' });
    }

    const parts: any[] = [];

    if (imageBase64) {
      let resolvedMime = mimeType || 'image/jpeg';
      const matchMime = imageBase64.match(/^data:([^;]+);base64,/);
      if (matchMime) {
        resolvedMime = matchMime[1];
      }
      const cleanBase64 = imageBase64.includes(';base64,')
        ? imageBase64.split(';base64,')[1].replace(/\s+/g, '')
        : imageBase64.replace(/\s+/g, '');

      parts.push({
        inlineData: {
          mimeType: resolvedMime,
          data: cleanBase64,
        },
      });
    }

    const promptText = `
Oled kogenud Eesti antikvaar, bibliofiil ja rahvusbibliograafia ekspert (tuttav DIGAR-i, ESTER-i, Raamatukoi ja Eesti Kirjandusmuuseumi andmetega).
Sinu ülesanne on uurida esitatud raamatu fotot${
      existingTitle || existingAuthor
        ? ` ning kasutaja seniseid andmeid (Pealkiri: "${existingTitle || 'puudub'}", Autor: "${existingAuthor || 'puudub'}", Aasta: "${currentYear || 'puudub'}", Märkmed: "${notes || 'puudub'}")`
        : ''
    }.

ERILINE FOKUS TÄPSELE TUVASTAMISELE JA ILMUMISAASTALE:
1. PEALKIRI ja AUTOR:
   - Loe hoolikalt kogu esikaanel, seljal või nähtaval lehel olev tekst (arvesta stiliseeritud, gooti või nõukogudeaegset tüpograafiat).
   - Erista autori nimi pealkirjast (nt "A. H. Tammsaare - Tõde ja õigus", "Mati Unt - Sügisball", "Eno Raud - Naksitrallid", "Jaan Kross - Keisri hull").
   - Kui autor on kaanel initsiaalidega või puudu, tuvasta teose tegelik autor eesti bibliograafia põhjal.
   - Ära lisa pealkirjale sarja nime, kui see ei ole teose enda pealkiri.

2. ILMUMISAASTA (YEAR) TUVASTAMINE:
   - TÄHTIS REEGEL: Paljudel raamatutel EI OLE aasta trükitud esikaanele! Sa pead selle tuletama köite ja väljaande visuaalse identiteedi ning bibliograafilise teadmuse põhjal:
     * Kaanekujundus, graafiline stiil, köitelaad (linane kõvaköide, lakitud ümbrispaber, pehmeköide).
     * Kirjastus ja ajastu:
       - Eesti Riiklik Kirjastus (ERK): 1949–1964
       - Eesti Raamat: 1964–1990ndad
       - Valgus: 1965–1990ndad
       - Perioodika (sh Loomingu Raamatukogu): 1957–2000ndad
       - Koolibri: alates 1991
       - Varrak, Tänapäev, Ilmamaa, Eesti Päevaleht: 1990ndad–tänapäev
       - Eesti Kirjanike Kooperatiiv (Lund), Välis-Eesti: 1950–1980ndad
       - Noor-Eesti, Loodus, Teadus, Täht (Eesti Vabariik 1918–1940)
     * Kuulsad sarjad kindlate aastatega:
       - "Seiklusjutte maalt ja merelt": 1955–1962
       - "Mirabilia": alates 1973
       - "Loomingu Raamatukogu": aastakäigud
       - "Maailm ja mõnda", "Suuri sõnameistreid", "Põhjamaade romaan", "Eesti novellivara"
   - ÄRA KUNAGI paku vana, nõukogudeaegse või ajaloolise raamatu aastaks käesolevat aastat (2025/2026)!
   - Kui täpset aastat ei tea sentimeetri pealt, paku selle väljaandekujunduse kõige tõenäolisem aasta (nt 1965 või 1978).
   - Selgita kindlasti väljal "yearReasoning" (1-2 lauset eesti keeles), kuidas ja milliste tunnuste järgi aasta tuletati (nt "Tuvastatud Eesti Riikliku Kirjastuse 1958. a väljaande kaanekujunduse järgi").
   - Märgi "yearConfidence": "high" (kui konkreetne trükk on üheselt äratuntav), "medium" (kui periood on kindel) või "approximate" (kui hinnanguline).

3. KATEGOORIA (Category):
   Vali kõige sobivam täpne kategooria:
   "Eesti klassika", "Maailmakirjandus", "Ajalugu & Biograafiad", "Krimi & Põnevikud", "Laste- ja noortekirjandus", "Fantaasia & Ulme", "Teadus & Tehnika", "Filosoofia & Religioon", "Luule & Draama", "Kodu, Käsitöö & Kokandus", "Antiiksed & Haruldased", "Muu".

4. HINNANGUD (Value & Price):
   - "estimatedValue": realistlik turuväärtus eurodes (täisarv) Eesti antikvariaatides ja järelturul (osta.ee, raamatukoi).
   - "suggestedPrice": mõistlik müügihind kiireks müügiks (nt 60-80% turuväärtusest).

5. LÜHITUTVUSTUS (Description):
   - 2-4 lauseline sisukas eestikeelne tutvustus, mis kirjeldab raamatu sisu, peategelasi või kirjanduslikku/ajaloolist väärtust.

6. KIRJASTUS (Publisher), KEEL (Language) & SEISUKORD (Condition):
   - Tuvastatud kirjastus (nt "Eesti Raamat", "Valgus", "Varrak" jne).
   - Raamatu keel: "Eesti", "Inglise", "Vene", "Saksa", "Soome", "Rootsi", "Prantsuse" või muu (kui on eesti keeles, märgi "Eesti").
   - Seisukord foto põhjal: üks valikutest ["Uueväärne", "Väga hea", "Hea", "Rahuldav", "Antiikne"].

Vasta RANGELT puhta JSON-objektina järgmises formaadis ilma lisatekstita:
{
  "title": "Täpne pealkiri",
  "author": "Autori nimi",
  "year": 1968,
  "yearConfidence": "high",
  "yearReasoning": "Kaanekujunduse ja ERK sarja järgi välja antud 1968. aastal",
  "description": "Sisukas kokkuvõte...",
  "estimatedValue": 25,
  "suggestedPrice": 18,
  "category": "Eesti klassika",
  "language": "Eesti",
  "condition": "Hea",
  "publisher": "Eesti Raamat"
}
`;

    parts.push({ text: promptText });

    // Multi-model execution with automatic fallback if primary model quota is exceeded
    let responseText = '';
    let usedModel = 'gemini-3.8-flash';

    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = response.text?.trim() || '{}';
    } catch (primaryError: any) {
      console.warn('Gemini 3.8 Flash kutsung ebaõnnestus, proovin gemini-3.1-flash-lite varumudeliga:', primaryError?.message);
      usedModel = 'gemini-3.1-flash-lite';
      
      const fallbackResponse = await gemini.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ role: 'user', parts }],
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = fallbackResponse.text?.trim() || '{}';
    }

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Mudeli vastuse parsimine JSON-ina ebaõnnestus');
      }
    }

    // Resolve publication year intelligently:
    let resolvedYear = 0;
    if (parsedData.year) {
      const num = parseInt(String(parsedData.year).replace(/\D/g, '').slice(0, 4), 10);
      if (!isNaN(num) && num > 1500 && num <= new Date().getFullYear()) {
        resolvedYear = num;
      }
    }

    // If year is still 0, try to find a 4-digit year in yearReasoning or description
    if (!resolvedYear && parsedData.yearReasoning) {
      const match = String(parsedData.yearReasoning).match(/\b(1[6-9]\d{2}|20[0-2]\d)\b/);
      if (match) {
        resolvedYear = parseInt(match[1], 10);
      }
    }

    // If still 0, use currentYear from request if it was a valid historic year
    if (!resolvedYear && currentYear && Number(currentYear) > 1700 && Number(currentYear) < new Date().getFullYear()) {
      resolvedYear = Number(currentYear);
    }

    // Never default vintage or antique books to current year
    if (!resolvedYear) {
      resolvedYear = 1980; // Reasonable neutral estimate if year cannot be determined
    }

    return res.json({
      success: true,
      usedModel,
      data: {
        title: parsedData.title?.trim() || existingTitle || 'Tuvastamata pealkiri',
        author: parsedData.author?.trim() || existingAuthor || 'Määramata autor',
        year: resolvedYear,
        yearConfidence: parsedData.yearConfidence || 'medium',
        yearReasoning: parsedData.yearReasoning || 'Aasta tuletatud teose väljaande ja kaanekujunduse järgi',
        description: parsedData.description?.trim() || '',
        estimatedValue: Number(parsedData.estimatedValue) || 15,
        suggestedPrice: Number(parsedData.suggestedPrice) || 10,
        category: parsedData.category || 'Muu',
        language: parsedData.language?.trim() || 'Eesti',
        condition: parsedData.condition || 'Hea',
        publisher: parsedData.publisher || '',
      }
    });

  } catch (error: any) {
    console.error('Error scanning book with Gemini:', error);
    return res.status(500).json({
      error: 'Raamatu analüüsimisel tekkis tõrge: ' + (error?.message || 'Tundmatu viga')
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
