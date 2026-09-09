// @ts-check
import {defineConfig} from 'astro/config'
import sitemap from '@astrojs/sitemap'

/**
 * Il sito viene generato come HTML statico: nessun server, nessun database in
 * esecuzione. I contenuti si leggono da Sanity durante il build e diventano
 * file. Se Sanity non risponde, il build fallisce e Cloudflare tiene online la
 * versione precedente: il sito non va mai giù per colpa del CMS.
 */

const SITO_URL = process.env.SITO_URL ?? 'https://www.alessandromanuntacoltelli.it'

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
    // Un solo foglio di stile invece di tanti frammenti: su rete mobile
    // conta più il numero di richieste della dimensione.
    inlineStylesheets: 'auto',
  },
})
