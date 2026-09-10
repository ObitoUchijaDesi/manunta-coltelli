// @ts-check
import {defineConfig} from 'astro/config'
import sitemap from '@astrojs/sitemap'

/**
 * Il sito viene generato come HTML statico: nessun server, nessun database in
 * esecuzione. I contenuti si leggono da Sanity durante il build e diventano
 * file. Se Sanity non risponde, il build fallisce e Cloudflare tiene online la
 * versione precedente: il sito non va mai giù per colpa del CMS.
 */

// L'indirizzo ufficiale e' quello senza www: piu' corto da dettare e da
// scrivere. Il www esiste e reindirizza qui. Se questo valore non combacia con
// il dominio vero, i link condivisi su WhatsApp e le anteprime social puntano
// nel posto sbagliato: e' scritto qui come predefinito proprio per non
// dipendere da una variabile che qualcuno deve ricordarsi di impostare.
const SITO_URL = process.env.SITO_URL ?? 'https://alessandromanuntacoltelli.it'

export default defineConfig({
  site: SITO_URL,

  // URL con la barra finale: /coltelli/resolza-classica/
  trailingSlash: 'always',

  integrations: [
    sitemap({
      // La sitemap nasce dalle pagine effettivamente generate: un coltello
      // pubblicato in Sanity entra nella sitemap al primo build successivo,
      // uno tolto dalla pubblicazione ne esce. Nessuna lista da aggiornare a mano.
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],

  build: {
    // Fogli di stile sempre come file, mai incollati dentro l'HTML.
    // Serve alla Content-Security-Policy: senza stili inline la policy può
    // dire "style-src 'self'" senza aprire a 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
})
