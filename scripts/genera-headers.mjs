/**
 * Scrive dist/_headers per Cloudflare Pages.
 *
 * La Content-Security-Policy non è copiata da nessuna parte: viene costruita
 * leggendo le pagine appena generate. Gli script inline del sito (menu e
 * lightbox) finiscono nella policy come impronte sha256, così non serve
 * 'unsafe-inline' e nessuno script estraneo può essere eseguito nemmeno se
 * riuscisse a entrare nell'HTML.
 *
 * Va eseguito DOPO "astro build" — ci pensa "npm run build".
 */

import {createHash} from 'node:crypto'
import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(QUI, '..', 'dist')

const analiticheAttive = Boolean(process.env.CLOUDFLARE_ANALYTICS_TOKEN)

// ── Raccolta degli script inline ────────────────────────────────

function tutteLePagine(cartella) {
  const trovate = []
  for (const voce of readdirSync(cartella)) {
    const percorso = join(cartella, voce)
    if (statSync(percorso).isDirectory()) trovate.push(...tutteLePagine(percorso))
    else if (voce.endsWith('.html')) trovate.push(percorso)
  }
  return trovate
}

const pagine = tutteLePagine(DIST)
const impronte = new Set()
let inlineTrovati = 0
const risorseEsterne = new Set()

for (const pagina of pagine) {
  const html = readFileSync(pagina, 'utf8')

  // Solo gli script eseguibili. I blocchi application/ld+json sono dati, non
  // codice: i browser non li eseguono e la CSP non li blocca.
  for (const trovato of html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)) {
    inlineTrovati++
    impronte.add(createHash('sha256').update(trovato[1], 'utf8').digest('base64'))
  }

  // Inventario di ciò che la pagina carica da fuori (src/href assoluti).
  for (const trovato of html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) {
    risorseEsterne.add(new URL(trovato[1]).origin)
  }
}

// ── Costruzione della policy ────────────────────────────────────

const script = ["'self'", ...[...impronte].sort().map((h) => `'sha256-${h}'`)]
const connect = ["'self'"]

if (analiticheAttive) {
  script.push('https://static.cloudflareinsights.com')
  connect.push('https://cloudflareinsights.com')
}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  // Il sito non ha nessun modulo: nessuna destinazione di invio è lecita.
  "form-action 'none'",
  // Le fotografie in produzione arrivano dalla CDN di Sanity.
  "img-src 'self' https://cdn.sanity.io",
  // I font sono ospitati da noi: nessun dominio esterno.
  "font-src 'self'",
  // Nessuno stile inline: gli attributi style= sono stati tolti e i fogli
  // sono file veri (build.inlineStylesheets: 'never').
  "style-src 'self'",
  `script-src ${script.join(' ')}`,
  `connect-src ${connect.join(' ')}`,
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ')

const contenuto = `# Generato da scripts/genera-headers.mjs — non modificare a mano.
# La CSP è costruita sulle risorse realmente presenti nelle pagine generate.

/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
  X-Frame-Options: DENY

# I nomi dei file sotto /_astro/ contengono l'impronta del contenuto:
# se cambia il contenuto cambia il nome, quindi si possono tenere per sempre.
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# I font hanno nomi stabili: un mese, così una eventuale sostituzione arriva
# ai visitatori in tempi ragionevoli.
/font/*
  Cache-Control: public, max-age=2592000

/*.woff2
  Cache-Control: public, max-age=2592000
`

writeFileSync(join(DIST, '_headers'), contenuto, 'utf8')

console.log('HEADER DI SICUREZZA GENERATI')
console.log(`  pagine analizzate      ${pagine.length}`)
console.log(`  script inline trovati  ${inlineTrovati} (${impronte.size} distinti)`)
console.log(`  impronte nella CSP     ${impronte.size}`)
console.log(`  statistiche            ${analiticheAttive ? 'attive (domini Cloudflare ammessi)' : 'spente'}`)
console.log(`  origini esterne nelle pagine: ${[...risorseEsterne].join(', ') || 'nessuna'}`)

// Rete di sicurezza: se compare un dominio esterno che la CSP non prevede,
// meglio accorgersene al build che scoprirlo dal sito rotto in produzione.
const ammessi = new Set([
  'https://www.alessandromanuntacoltelli.it',
  'https://cdn.sanity.io',
  'https://static.cloudflareinsights.com',
])
const inattesi = [...risorseEsterne].filter((o) => !ammessi.has(o))

if (inattesi.length > 0) {
  console.error(`\nATTENZIONE: origini esterne non previste dalla CSP: ${inattesi.join(', ')}`)
  console.error('Aggiornare genera-headers.mjs oppure togliere la risorsa.\n')
  process.exit(1)
}
