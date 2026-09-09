import {createImageUrlBuilder} from '@sanity/image-url'
import {clientSanity} from './sanity'
import type {Immagine} from './tipi'

/**
 * Costruzione degli indirizzi delle fotografie.
 *
 * Con Sanity il ridimensionamento e la conversione in WebP li fa la loro CDN:
 * chiediamo la larghezza che serve e arriva già pronta. Il vecchio sito
 * spediva ai telefoni gli stessi JPEG da 700 KB del desktop.
 */

const costruttore = clientSanity ? createImageUrlBuilder(clientSanity) : null

/** Larghezze richieste al CDN: coprono telefono, tablet e desktop retina. */
export const LARGHEZZE_SCHEDA = [400, 600, 800, 1200]
export const LARGHEZZE_DETTAGLIO = [600, 900, 1200, 1600, 2000]

export function urlImmagine(immagine: Immagine, larghezza: number): string {
  if (immagine.origine === 'locale') return immagine.percorso

  if (!costruttore) {
    throw new Error('Immagine Sanity richiesta senza un client Sanity configurato.')
  }

  return costruttore
    .image(immagine.riferimento as never)
    .width(larghezza)
    .fit('max')
    .auto('format') // WebP o AVIF secondo il browser, JPEG per i vecchi
    .quality(78)
    .url()
}

export function srcsetImmagine(immagine: Immagine, larghezze: number[]): string | undefined {
  // Un file locale non ha varianti: senza srcset il browser usa src e basta.
  if (immagine.origine === 'locale') return undefined
  return larghezze.map((l) => `${urlImmagine(immagine, l)} ${l}w`).join(', ')
}

/**
 * Immagine per l'anteprima social, 1200x630 ritagliata.
 *
 * Forzata in JPEG: i generatori di anteprima di WhatsApp e Facebook non
 * gestiscono in modo affidabile i formati moderni, e qui contano 30 KB in più
 * molto meno di un'anteprima che non compare.
 */
export function urlSocial(immagine: Immagine, sito: URL | undefined): string | undefined {
  if (immagine.origine === 'locale') {
    return sito ? new URL(immagine.percorso, sito).href : undefined
  }

  return costruttore
    ?.image(immagine.riferimento as never)
    .width(1200)
    .height(630)
    .fit('crop')
    .format('jpg')
    .quality(80)
    .url()
}

/**
 * Larghezza e altezza vere della fotografia.
 *
 * Sanity le scrive dentro l'identificativo dell'immagine
 * ("image-a1b2c3-2000x1500-jpg"), quindi si leggono senza scaricare il file.
 * Servono per gli attributi width/height: senza, la pagina "salta" mentre le
 * foto arrivano, che è uno dei difetti misurati sul vecchio sito.
 */
export function dimensioniImmagine(immagine: Immagine): {larghezza: number; altezza: number} | null {
  if (immagine.origine === 'locale') return null

  const riferimento = (immagine.riferimento as {asset?: {_ref?: string}})?.asset?._ref
  if (!riferimento) return null

  const corrispondenza = riferimento.match(/-(\d+)x(\d+)-/)
  if (!corrispondenza) return null

  return {larghezza: Number(corrispondenza[1]), altezza: Number(corrispondenza[2])}
}

/**
 * Testo alternativo. Se chi ha caricato la foto non l'ha scritto, se ne compone
 * uno sensato dal nome del coltello: meglio di un attributo vuoto, e non
 * costringe Alessandro a scrivere una descrizione per ogni fotografia.
 */
export function altImmagine(immagine: Immagine, nomeColtello: string, indice?: number): string {
  if (immagine.alt?.trim()) return immagine.alt.trim()
  return indice && indice > 1
    ? `${nomeColtello}, coltello artigianale — foto ${indice}`
    : `${nomeColtello}, coltello artigianale forgiato a mano`
}
