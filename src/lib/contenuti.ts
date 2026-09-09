import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {clientSanity, sanityConfigurato} from './sanity'
import type {Coltello, ImpostazioniSito, Immagine} from './tipi'

/**
 * Da dove arrivano i contenuti.
 *
 * Regola non negoziabile: il sito NON inventa contenuti. Il vecchio sito, se
 * il database non rispondeva, mostrava tre coltelli scritti nel codice come se
 * fossero veri. Qui, se Sanity non è configurato, il build si ferma.
 *
 * L'unica eccezione è l'anteprima locale, che va chiesta esplicitamente con
 * CONTENUTI_LOCALI=1 e che marchia ogni pagina con una fascia bene visibile.
 * Non può succedere per distrazione.
 */

export const ANTEPRIMA_LOCALE =
  (import.meta.env.CONTENUTI_LOCALI || process.env.CONTENUTI_LOCALI) === '1'

const QUERY_COLTELLI = `*[_type == "coltello" && defined(slug.current)]
  | order(coalesce(ordine, 9999) asc, nome asc) {
    "slug": slug.current,
    nome,
    descrizioneBreve,
    descrizione,
    categoria,
    materialeLama,
    materialeManico,
    altriMateriali,
    lunghezzaTotale,
    lunghezzaLama,
    anno,
    pezzoUnico,
    disponibilita,
    ordine,
    immaginePrincipale,
    galleria
  }`

const QUERY_IMPOSTAZIONI = `*[_type == "impostazioniSito"][0] {
    nomeArtigiano,
    presentazioneBreve,
    biografia,
    localita,
    whatsapp,
    email,
    instagram,
    invitoContatto,
    passaggiLavorazione[] { titolo, testo }
  }`

function fermaIlBuild(cosaManca: string): never {
  throw new Error(
    `\n\nBUILD INTERROTTO: ${cosaManca}\n\n` +
      'Il sito non pubblica contenuti finti. Servono le credenziali Sanity:\n' +
      '  SANITY_PROJECT_ID=...\n' +
      '  SANITY_DATASET=production\n\n' +
      'Per vedere il sito in locale senza Sanity, con i contenuti del vecchio\n' +
      'sito e una fascia di avviso su ogni pagina:\n' +
      '  npm run anteprima\n\n',
  )
}

// ── Anteprima locale ────────────────────────────────────────────

function immagineLocale(percorsoRelativo: string, alt: string): Immagine {
  return {origine: 'locale', percorso: `/anteprima/${percorsoRelativo.replace(/[\\/]/g, '-')}`, alt}
}

function contenutiLegacy() {
  // Risolto dalla radice del progetto, non da import.meta.url: durante il build
  // questo modulo viene impacchettato dentro dist/ e il percorso relativo
  // punterebbe nel posto sbagliato.
  const percorso = join(process.cwd(), 'scripts', 'contenuti-legacy.json')
  return JSON.parse(readFileSync(percorso, 'utf8'))
}

// ── API usata dalle pagine ──────────────────────────────────────

export async function caricaColtelli(): Promise<Coltello[]> {
  if (ANTEPRIMA_LOCALE) {
    const dati = contenutiLegacy()
    return dati.coltelli.map((c: any): Coltello => {
      const [principale, ...altre] = c.immagini as string[]
      return {
        slug: c.slug,
        nome: c.nome,
        descrizioneBreve: c.descrizioneBreve ?? '',
        descrizione: c.descrizione ?? '',
        categoria: c.categoria,
        pezzoUnico: Boolean(c.pezzoUnico),
        disponibilita: c.disponibilita,
        ordine: c.ordine,
        immaginePrincipale: immagineLocale(principale, `${c.nome}, coltello artigianale`),
        galleria: altre.map((p, i) => immagineLocale(p, `${c.nome}, dettaglio ${i + 1}`)),
      }
    })
  }

  if (!sanityConfigurato || !clientSanity) fermaIlBuild('Sanity non è configurato')

  const risultato = await clientSanity.fetch<any[]>(QUERY_COLTELLI)

  return risultato
    .filter((c) => c.slug && c.immaginePrincipale)
    .map(
      (c): Coltello => ({
        slug: c.slug,
        nome: c.nome ?? '',
        descrizioneBreve: c.descrizioneBreve ?? '',
        descrizione: c.descrizione ?? '',
        categoria: c.categoria,
        materialeLama: c.materialeLama,
        materialeManico: c.materialeManico,
        altriMateriali: c.altriMateriali,
        lunghezzaTotale: c.lunghezzaTotale,
        lunghezzaLama: c.lunghezzaLama,
        anno: c.anno,
        pezzoUnico: Boolean(c.pezzoUnico),
        disponibilita: c.disponibilita ?? 'suRichiesta',
        ordine: c.ordine,
        immaginePrincipale: {
          origine: 'sanity',
          riferimento: c.immaginePrincipale,
          alt: c.immaginePrincipale?.alt ?? '',
        },
        galleria: (c.galleria ?? []).map((g: any) => ({
          origine: 'sanity' as const,
          riferimento: g,
          alt: g?.alt ?? '',
        })),
      }),
    )
}

export async function caricaImpostazioni(): Promise<ImpostazioniSito> {
  if (ANTEPRIMA_LOCALE) {
    const dati = contenutiLegacy().impostazioniSito
    return {
      nomeArtigiano: dati.nomeArtigiano,
      presentazioneBreve: dati.presentazioneBreve,
      biografia: dati.biografia,
      invitoContatto: dati.invitoContatto,
      passaggiLavorazione: dati.passaggiLavorazione,
      // whatsapp, email, instagram e localita restano assenti: erano segnaposto.
    }
  }

  if (!sanityConfigurato || !clientSanity) fermaIlBuild('Sanity non è configurato')

  const dati = await clientSanity.fetch<ImpostazioniSito | null>(QUERY_IMPOSTAZIONI)

  if (!dati) {
    fermaIlBuild('in Sanity manca il documento "Informazioni del sito"')
  }

  return {
    ...dati,
    passaggiLavorazione: dati.passaggiLavorazione ?? [],
  }
}
