/**
 * Prepara l'import dei contenuti del vecchio sito dentro Sanity.
 *
 * Non tocca nulla di remoto: legge scripts/contenuti-legacy.json, copia le
 * fotografie da legacy/public/ e scrive un file .ndjson pronto per il comando
 * ufficiale di import. Gli originali non vengono modificati.
 *
 *   node scripts/prepara-migrazione.mjs
 *   cd studio && npx sanity dataset import ../scripts/migrazione/coltelli.ndjson production
 *
 * I coltelli vengono scritti come BOZZE (_id con prefisso "drafts."): dopo
 * l'import nessuno di essi è online. Alessandro li apre dal telefono, controlla
 * i campi lasciati vuoti e pubblica lui.
 */

import {copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '..')
const SORGENTE_IMMAGINI = join(RADICE, 'legacy', 'public')
const DESTINAZIONE = join(QUI, 'migrazione')
const DESTINAZIONE_IMMAGINI = join(DESTINAZIONE, 'immagini')
// Copia usata solo dall'anteprima locale (npm run anteprima), fuori dal repository.
const DESTINAZIONE_ANTEPRIMA = join(RADICE, 'public', 'anteprima')

const contenuti = JSON.parse(readFileSync(join(QUI, 'contenuti-legacy.json'), 'utf8'))

if (!existsSync(SORGENTE_IMMAGINI)) {
  console.error(
    `\nNon trovo le fotografie in ${SORGENTE_IMMAGINI}\n` +
      'La cartella legacy/ serve solo per la migrazione e non è nel repository.\n' +
      'Se è stata rimossa, recuperala dal backup in _archivio/.\n',
  )
  process.exit(1)
}

// Cartella pulita a ogni esecuzione: l'output è sempre rigenerabile.
rmSync(DESTINAZIONE, {recursive: true, force: true})
rmSync(DESTINAZIONE_ANTEPRIMA, {recursive: true, force: true})
mkdirSync(DESTINAZIONE_IMMAGINI, {recursive: true})
mkdirSync(DESTINAZIONE_ANTEPRIMA, {recursive: true})

const righe = []
const problemi = []
const daVerificare = []

/** "cinghiale/01.jpeg" -> "cinghiale-01.jpeg" */
const nomePiatto = (percorsoRelativo) => percorsoRelativo.replace(/[\\/]/g, '-')

function copiaImmagine(percorsoRelativo) {
  const origine = join(SORGENTE_IMMAGINI, percorsoRelativo)
  if (!existsSync(origine)) {
    problemi.push(`Fotografia mancante: ${percorsoRelativo}`)
    return null
  }
  const nome = nomePiatto(percorsoRelativo)
  copyFileSync(origine, join(DESTINAZIONE_IMMAGINI, nome))
  copyFileSync(origine, join(DESTINAZIONE_ANTEPRIMA, nome))
  return nome
}

function riferimentoImmagine(nomeFile, alt) {
  return {
    _type: 'image',
    _sanityAsset: `image@file://./immagini/${nomeFile}`,
    ...(alt ? {alt} : {}),
  }
}

// ── Coltelli ────────────────────────────────────────────────────
for (const coltello of contenuti.coltelli) {
  const immaginiCopiate = coltello.immagini.map(copiaImmagine).filter(Boolean)

  if (immaginiCopiate.length === 0) {
    problemi.push(`"${coltello.nome}" resterebbe senza fotografie: import annullato.`)
    continue
  }

  const [principale, ...altre] = immaginiCopiate

  const documento = {
    // Prefisso "drafts.": entra come bozza, non come contenuto pubblicato.
    _id: `drafts.coltello-${coltello.slug}`,
    _type: 'coltello',
    nome: coltello.nome,
    slug: {_type: 'slug', current: coltello.slug},
    descrizioneBreve: coltello.descrizioneBreve,
    descrizione: coltello.descrizione,
    disponibilita: coltello.disponibilita,
    pezzoUnico: coltello.pezzoUnico,
    ordine: coltello.ordine,
    immaginePrincipale: riferimentoImmagine(principale, `${coltello.nome}, coltello artigianale`),
  }

  if (coltello.categoria) documento.categoria = coltello.categoria

  if (altre.length > 0) {
    documento.galleria = altre.map((nome, indice) => ({
      _key: `foto${indice + 1}`,
      ...riferimentoImmagine(nome, `${coltello.nome}, dettaglio ${indice + 1}`),
    }))
  }

  righe.push(JSON.stringify(documento))

  for (const voce of coltello.daVerificare ?? []) {
    daVerificare.push(`${coltello.nome} — ${voce}`)
  }
}

// ── Informazioni del sito ───────────────────────────────────────
const impostazioni = contenuti.impostazioniSito

righe.push(
  JSON.stringify({
    // Documento unico: id fisso, atteso da struttura.ts.
    // Anche questo entra come bozza: i recapiti sono ancora vuoti.
    _id: 'drafts.impostazioniSito',
    _type: 'impostazioniSito',
    nomeArtigiano: impostazioni.nomeArtigiano,
    presentazioneBreve: impostazioni.presentazioneBreve,
    biografia: impostazioni.biografia,
    invitoContatto: impostazioni.invitoContatto,
    passaggiLavorazione: impostazioni.passaggiLavorazione.map((passaggio, indice) => ({
      _key: `passaggio${indice + 1}`,
      _type: 'passaggio',
      titolo: passaggio.titolo,
      testo: passaggio.testo,
    })),
    // whatsapp, email, instagram e localita restano assenti: erano segnaposto.
  }),
)

for (const voce of impostazioni.daVerificare ?? []) {
  daVerificare.push(`Informazioni del sito — ${voce}`)
}

// ── Scrittura ───────────────────────────────────────────────────
const percorsoNdjson = join(DESTINAZIONE, 'coltelli.ndjson')
writeFileSync(percorsoNdjson, righe.join('\n') + '\n', 'utf8')

console.log('\nMIGRAZIONE PREPARATA')
console.log(`  documenti     ${righe.length} (${contenuti.coltelli.length} coltelli + 1 informazioni sito)`)
console.log(`  fotografie    ${contenuti.coltelli.reduce((n, c) => n + c.immagini.length, 0)}`)
console.log(`  file          scripts/migrazione/coltelli.ndjson`)
console.log('  stato         tutti i documenti sono BOZZE: nulla va online da solo')

if (problemi.length > 0) {
  console.log('\nPROBLEMI')
  for (const p of problemi) console.log(`  ! ${p}`)
}

console.log(`\nDA COMPLETARE A MANO DOPO L'IMPORT (${daVerificare.length} voci)`)
for (const v of daVerificare) console.log(`  - ${v}`)

console.log('\nPer importare, quando esisterà il progetto Sanity:')
console.log('  cd studio')
console.log('  npx sanity login')
console.log('  npx sanity dataset import ../scripts/migrazione/coltelli.ndjson production\n')

if (problemi.length > 0) process.exit(1)
