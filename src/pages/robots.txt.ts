import type {APIRoute} from 'astro'

/**
 * robots.txt generato al build.
 *
 * Scritto a mano in public/ conterrebbe il dominio fisso, e cambiare dominio
 * significherebbe ricordarsi di modificarlo. Qui l'indirizzo della sitemap
 * segue SITO_URL: se il dominio cambia, si aggiorna da solo.
 *
 * Non c'è niente da escludere: il pannello di gestione sta su un altro
 * dominio (Sanity) e il sito pubblico non ha aree riservate.
 */

export const GET: APIRoute = ({site}) => {
  const sitemap = new URL('sitemap-index.xml', site).href

  const contenuto = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`

  return new Response(contenuto, {
    headers: {'Content-Type': 'text/plain; charset=utf-8'},
  })
}
