/**
 * Controllo dei segnaposto prima della pubblicazione.
 *
 * Legge le pagine appena generate e cerca ciò che non deve finire online: i
 * recapiti di esempio del vecchio sito, le diciture "DA INSERIRE", la fascia
 * dell'anteprima locale, indirizzi example.com, identificativi finti.
 *
 * Due modalità:
 * - anteprima locale (CONTENUTI_LOCALI=1): i segnaposto sono previsti, il
 *   comando riporta ma non fallisce.
 * - produzione: un segnaposto bloccante fa fallire il build, quindi il deploy
 *   non parte e Cloudflare tiene online la versione precedente.
 *
 * Va eseguito DOPO "astro build" — ci pensa "npm run build".
 */

import {readdirSync, readFileSync, statSync} from 'node:fs'
import {dirname, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(QUI, '..', 'dist')

const anteprima = process.env.CONTENUTI_LOCALI === '1'

function tutteLePagine(cartella) {
  const trovate = []
  for (const voce of readdirSync(cartella)) {
    const percorso = join(cartella, voce)
    if (statSync(percorso).isDirectory()) trovate.push(...tutteLePagine(percorso))
    else if (voce.endsWith('.html')) trovate.push(percorso)
  }
  return trovate
}

/** Testi che non devono comparire in una pagina pubblicata. */
const TESTI_VIETATI = [
  {cerca: '+39 000 000 0000', cosa: 'numero di telefono di esempio'},
  {cerca: '000 000 0000', cosa: 'numero di telefono di esempio'},
  {cerca: 'DA INSERIRE', cosa: 'campo lasciato da compilare'},
  {cerca: 'DA VERIFICARE', cosa: 'campo lasciato da verificare'},
  {cerca: 'example.com', cosa: 'dominio di esempio'},
  {cerca: 'ANTEPRIMA LOCALE', cosa: 'fascia dell’anteprima: questa NON è una build di produzione'},
  {cerca: 'info@alessandromanunta.it', cosa: 'email di esempio del vecchio sito'},
  {cerca: 'lorem ipsum', cosa: 'testo riempitivo'},
]

const pagine = tutteLePagine(DIST)
const bloccanti = []
const avvisi = []

for (const pagina of pagine) {
  const html = readFileSync(pagina, 'utf8')
  const minuscolo = html.toLowerCase()
  const nome = relative(DIST, pagina).replace(/\\/g, '/')

  for (const {cerca, cosa} of TESTI_VIETATI) {
    if (minuscolo.includes(cerca.toLowerCase())) {
      bloccanti.push(`${nome}: ${cosa} ("${cerca}")`)
    }
  }
}

// ── Recapiti: assenti significa sito non pronto ─────────────────
const tuttoHtml = pagine.map((p) => readFileSync(p, 'utf8')).join('\n')

if (!tuttoHtml.includes('wa.me/')) {
  bloccanti.push('nessun link WhatsApp in tutto il sito: il numero non è stato inserito in Sanity')
}
if (!tuttoHtml.includes('mailto:')) {
  bloccanti.push('nessun link email in tutto il sito: l’indirizzo non è stato inserito in Sanity')
}
if (!tuttoHtml.includes('instagram.com/')) {
  avvisi.push('nessun link Instagram: il profilo non è stato inserito in Sanity')
}
if (!tuttoHtml.includes('La bottega è a')) {
  avvisi.push('località assente: senza non ci si fa trovare nelle ricerche di zona')
}

// ── Identificativi di servizio ──────────────────────────────────
const progetto = process.env.SANITY_PROJECT_ID ?? ''
if (!anteprima) {
  if (!progetto) {
    bloccanti.push('SANITY_PROJECT_ID non impostato')
  } else if (/^[xz]+$/i.test(progetto)) {
    bloccanti.push(`SANITY_PROJECT_ID è un valore finto ("${progetto}")`)
  }
}

// ── Referto ─────────────────────────────────────────────────────
const etichetta = anteprima ? 'INTENTIONAL DEVELOPMENT PLACEHOLDER' : 'BLOCKING PRODUCTION'

console.log('\nCONTROLLO SEGNAPOSTO')
console.log(`  modalità        ${anteprima ? 'anteprima locale' : 'produzione'}`)
console.log(`  pagine lette    ${pagine.length}`)
console.log(`  bloccanti       ${bloccanti.length}`)
console.log(`  avvisi          ${avvisi.length}`)

if (bloccanti.length > 0) {
  console.log(`\n[${etichetta}]`)
  for (const voce of bloccanti) console.log(`  - ${voce}`)
}

if (avvisi.length > 0) {
  console.log('\n[NON BLOCCANTE]')
  for (const voce of avvisi) console.log(`  - ${voce}`)
}

if (bloccanti.length === 0 && avvisi.length === 0) {
  console.log('\nNessun segnaposto: il sito è pubblicabile.')
}

if (bloccanti.length > 0 && !anteprima) {
  console.error(
    '\nBuild interrotto: il sito non va pubblicato con questi valori.\n' +
      'Compila i campi mancanti nel pannello Sanity e rilancia.\n',
  )
  process.exit(1)
}

console.log('')
