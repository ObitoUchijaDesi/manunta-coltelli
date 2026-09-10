/**
 * Rifà il logo con lo sfondo trasparente.
 *
 * L'originale è nero su fondo bianco pieno. Il vecchio sito lo montava sulla
 * barra scura con "invert(1) sepia(.3) saturate(2)" e "mix-blend-mode: screen":
 * funzionava per caso, e sarebbe smesso di funzionare al primo logo diverso.
 *
 * Qui la luminosità dell'originale diventa il canale di trasparenza: il segno
 * nero diventa pieno, il bianco sparisce. Il risultato è un logo chiaro su
 * fondo trasparente, che si colora con il CSS come un qualsiasi elemento.
 *
 *   node scripts/prepara-logo.mjs
 */

import {existsSync, mkdirSync, statSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import sharp from 'sharp'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '..')
const ORIGINE = join(RADICE, 'legacy', 'public', 'logo.png')
const DESTINAZIONE = join(RADICE, 'public', 'logo.png')

if (!existsSync(ORIGINE)) {
  console.error(`\nNon trovo il logo originale in ${ORIGINE}\nRecuperalo dal backup in _archivio/.\n`)
  process.exit(1)
}

mkdirSync(dirname(DESTINAZIONE), {recursive: true})

const originale = sharp(ORIGINE).flatten({background: '#ffffff'})
const metadati = await originale.metadata()

// Maschera: nero -> opaco, bianco -> trasparente.
const alpha = await originale.clone().greyscale().negate().toColourspace('b-w').raw().toBuffer()

const larghezza = metadati.width ?? 600
const altezza = metadati.height ?? 660

// Tela bianca a cui applichiamo la maschera come trasparenza.
await sharp({
  create: {
    width: larghezza,
    height: altezza,
    channels: 3,
    background: '#f0ece4', // lo stesso avorio del testo del sito
  },
})
  .joinChannel(alpha, {raw: {width: larghezza, height: altezza, channels: 1}})
  .png({compressionLevel: 9})
  .toFile(DESTINAZIONE)

// ── Immagine di anteprima social predefinita ────────────────────
// Usata per home, contatti e privacy. Le pagine dei coltelli usano invece la
// foto del coltello: è tutto il punto della migrazione.
const SOCIAL = join(RADICE, 'public', 'social-default.jpg')
const ALTEZZA_LOGO = 380

const logoRidotto = await sharp(DESTINAZIONE)
  .resize({height: ALTEZZA_LOGO, fit: 'inside'})
  .toBuffer()

await sharp({
  create: {width: 1200, height: 630, channels: 3, background: '#0a0a0a'},
})
  .composite([{input: logoRidotto, gravity: 'center'}])
  .jpeg({quality: 86, progressive: true})
  .toFile(SOCIAL)

// ── Icona della linguetta del browser ───────────────────────────
// Il logo intero a 16 pixel è una macchia: il testo circolare e la firma
// diventano illeggibili. Si tiene la parte riconoscibile — il volto con le
// lame incrociate — su fondo scuro, così si distingue anche nelle linguette
// chiare.
const FAVICON = join(RADICE, 'public', 'favicon.png')
const LATO = 512

const emblema = await sharp(DESTINAZIONE)
  .extract({
    left: Math.round(larghezza * 0.12),
    top: Math.round(altezza * 0.22),
    width: Math.round(larghezza * 0.76),
    height: Math.round(altezza * 0.56),
  })
  .trim()
  .resize({width: Math.round(LATO * 0.84), height: Math.round(LATO * 0.84), fit: 'inside'})
  .toBuffer()

await sharp({
  create: {width: LATO, height: LATO, channels: 4, background: '#0a0a0a'},
})
  .composite([{input: emblema, gravity: 'center'}])
  .png({compressionLevel: 9})
  .toFile(FAVICON)

const pesoLogo = statSync(DESTINAZIONE).size
const pesoSocial = statSync(SOCIAL).size
const pesoFavicon = statSync(FAVICON).size

console.log('LOGO PREPARATO')
console.log(`  origine      legacy/public/logo.png (nero su fondo bianco)`)
console.log(`  destinazione public/logo.png (avorio su fondo trasparente)`)
console.log(`  dimensioni   ${larghezza}x${altezza}px, ${Math.round(pesoLogo / 1024)} KB`)
console.log(`  anteprima    public/social-default.jpg 1200x630, ${Math.round(pesoSocial / 1024)} KB`)
console.log(`  icona        public/favicon.png ${LATO}x${LATO}, ${Math.round(pesoFavicon / 1024)} KB`)
console.log('\nNiente più filtri CSS: se un giorno il logo cambia, basta sostituire il file.')
