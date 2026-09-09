/**
 * Scarica i font e li ospita sul nostro dominio.
 *
 * Con i font caricati da Google, ogni visitatore apre una connessione a
 * fonts.googleapis.com e fonts.gstatic.com e il suo indirizzo IP arriva a
 * Google senza che abbia chiesto niente. Ospitandoli noi: nessuna richiesta a
 * terzi, nessun consenso da chiedere, una CSP più stretta e una richiesta in
 * meno nel percorso critico.
 *
 *   node scripts/prepara-font.mjs
 *
 * Nota importante: Cormorant Garamond e DM Sans sono font VARIABILI. Google
 * serve lo stesso identico file per ogni peso richiesto, quindi chiedere tre
 * pesi non significa tre file. Lo script se ne accorge confrontando il
 * contenuto e scrive una sola regola per famiglia/stile/sottoinsieme, con un
 * intervallo di pesi invece di un peso fisso.
 *
 * Va rieseguito solo se cambiano i font o i pesi usati. I file prodotti sono
 * versionati: chi clona il repository non deve rieseguire nulla.
 */

import {createHash} from 'node:crypto'
import {mkdirSync, writeFileSync, rmSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '..')
const CARTELLA_FONT = join(RADICE, 'public', 'font')
const FOGLIO = join(RADICE, 'src', 'styles', 'font.css')

/**
 * Solo le varianti davvero usate dal CSS del sito.
 * Cormorant Garamond: titoli (300, 400, 600) più il corsivo 400 degli <em>.
 * DM Sans: testo corrente (300, 400, 500).
 */
const RICHIESTA =
  'family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400' +
  '&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500' +
  '&display=swap'

// Con uno user agent moderno Google restituisce woff2; con uno vecchio, formati pesanti.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

// Italiano e nomi propri stanno dentro questi due sottoinsiemi.
const SOTTOINSIEMI_VOLUTI = new Set(['latin', 'latin-ext'])

const risposta = await fetch(`https://fonts.googleapis.com/css2?${RICHIESTA}`, {
  headers: {'User-Agent': UA},
})

if (!risposta.ok) {
  console.error(`Google Fonts ha risposto ${risposta.status}. Nessuna modifica.`)
  process.exit(1)
}

const cssOriginale = await risposta.text()

const blocchi = []
const regexBlocco = /\/\*\s*([a-z0-9-]+)\s*\*\/\s*(@font-face\s*{[^}]+})/g
let trovato
while ((trovato = regexBlocco.exec(cssOriginale)) !== null) {
  blocchi.push({sottoinsieme: trovato[1], corpo: trovato[2]})
}

if (blocchi.length === 0) {
  console.error('Non ho riconosciuto nessun @font-face nella risposta. Nessuna modifica.')
  process.exit(1)
}

const leggi = (corpo, proprieta) =>
  corpo.match(new RegExp(`${proprieta}:\\s*([^;]+);`))?.[1]?.trim() ?? ''

rmSync(CARTELLA_FONT, {recursive: true, force: true})
mkdirSync(CARTELLA_FONT, {recursive: true})

/** chiave = hash del file. Così più pesi che condividono lo stesso file variabile collassano in uno. */
const perContenuto = new Map()
let scartati = 0

for (const {sottoinsieme, corpo} of blocchi) {
  if (!SOTTOINSIEMI_VOLUTI.has(sottoinsieme)) {
    scartati++
    continue
  }

  const url = corpo.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1]
  if (!url) continue

  const famiglia = leggi(corpo, 'font-family').replace(/['"]/g, '')
  const peso = Number(leggi(corpo, 'font-weight'))
  const stile = leggi(corpo, 'font-style')
  const range = leggi(corpo, 'unicode-range')

  const file = await fetch(url, {headers: {'User-Agent': UA}})
  if (!file.ok) {
    console.error(`  ! non scaricato: ${famiglia} ${peso} ${stile} (${file.status})`)
    continue
  }

  const dati = Buffer.from(await file.arrayBuffer())
  const impronta = createHash('sha256').update(dati).digest('hex')

  const esistente = perContenuto.get(impronta)
  if (esistente) {
    // Stesso file, peso diverso: allarghiamo l'intervallo invece di riscaricarlo.
    esistente.pesoMin = Math.min(esistente.pesoMin, peso)
    esistente.pesoMax = Math.max(esistente.pesoMax, peso)
    esistente.pesiRichiesti.push(peso)
    continue
  }

  perContenuto.set(impronta, {
    famiglia,
    stile,
    sottoinsieme,
    range,
    dati,
    pesoMin: peso,
    pesoMax: peso,
    pesiRichiesti: [peso],
  })
}

const regole = []
const salvati = []

for (const voce of perContenuto.values()) {
  const nomeFile =
    `${voce.famiglia.toLowerCase().replace(/\s+/g, '-')}-${voce.stile}-${voce.sottoinsieme}.woff2`

  writeFileSync(join(CARTELLA_FONT, nomeFile), voce.dati)
  salvati.push({...voce, nomeFile})

  const variabile = voce.pesoMin !== voce.pesoMax
  const dichiarazionePeso = variabile ? `${voce.pesoMin} ${voce.pesoMax}` : String(voce.pesoMin)

  regole.push(
    [
      voce.pesiRichiesti.length > 1
        ? `/* Font variabile: un solo file copre i pesi ${voce.pesiRichiesti.sort((a, b) => a - b).join(', ')} */`
        : null,
      '@font-face {',
      `  font-family: '${voce.famiglia}';`,
      `  font-style: ${voce.stile};`,
      `  font-weight: ${dichiarazionePeso};`,
      // swap: il testo si vede subito con il font di sistema e viene sostituito
      // appena il font arriva. Mai testo invisibile in attesa.
      '  font-display: swap;',
      `  src: url('/font/${nomeFile}') format('woff2');`,
      `  unicode-range: ${voce.range};`,
      '}',
    ]
      .filter(Boolean)
      .join('\n'),
  )
}

const intestazione = `/* Font ospitati sul nostro dominio — generato da scripts/prepara-font.mjs.
 * Non modificare a mano: rilancia lo script se cambiano i pesi usati.
 *
 * Nessuna richiesta a fonts.googleapis.com o fonts.gstatic.com: l'indirizzo IP
 * dei visitatori non arriva a terzi e non serve chiedere nessun consenso.
 *
 * Entrambe le famiglie sono font variabili: un unico file copre tutti i pesi.
 */

`

writeFileSync(FOGLIO, intestazione + regole.join('\n\n') + '\n', 'utf8')

const totale = salvati.reduce((n, f) => n + f.dati.length, 0)
const soloLatin = salvati
  .filter((f) => f.sottoinsieme === 'latin')
  .reduce((n, f) => n + f.dati.length, 0)

console.log('FONT OSPITATI IN PROPRIO')
console.log(`  file salvati        ${salvati.length}`)
console.log(`  peso su disco       ${(totale / 1024).toFixed(1)} KB`)
console.log(`  scaricati da un visitatore italiano  ${(soloLatin / 1024).toFixed(1)} KB (solo "latin")`)
console.log(`  varianti scartate   ${scartati} (cirillico, greco, vietnamita)`)
console.log(`  foglio              src/styles/font.css`)
console.log('')
for (const f of salvati) {
  const pesi = f.pesiRichiesti.length > 1 ? `${f.pesoMin}-${f.pesoMax}` : String(f.pesoMin)
  console.log(
    `  ${f.famiglia.padEnd(20)} ${pesi.padEnd(10)} ${f.stile.padEnd(7)} ${f.sottoinsieme.padEnd(10)} ${(f.dati.length / 1024).toFixed(1)} KB`,
  )
}
