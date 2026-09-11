/**
 * Come sta il progetto, adesso, senza chiedere niente a nessuno.
 *
 *   npm run stato
 *
 * Controlla dall'esterno quello che si puo' controllare dall'esterno: il sito
 * vero, il DNS del dominio, i contenuti pubblicati. Niente credenziali —
 * interroga le stesse cose che vede un visitatore qualsiasi.
 *
 * Serve a rispondere a "l'hanno fatto?" guardando il risultato invece di
 * fidarsi di una risposta. Le cose che NON si possono vedere da fuori — il 2FA
 * di un account, chi e' proprietario di cosa — sono elencate alla fine come
 * domande da fare, per non far credere che siano state verificate.
 */

import {Resolver} from 'node:dns/promises'

const DOMINIO = 'alessandromanuntacoltelli.it'
const SITO = `https://${DOMINIO}`
const PROGETTO_SANITY = 'axglrva9'

const resolver = new Resolver()
resolver.setServers(['1.1.1.1'])

const verde = (t) => `\x1b[32m${t}\x1b[0m`
const rosso = (t) => `\x1b[31m${t}\x1b[0m`
const giallo = (t) => `\x1b[33m${t}\x1b[0m`

let fallimenti = 0

function esito(ok, etichetta, dettaglio = '') {
  if (!ok) fallimenti++
  const segno = ok ? verde('OK  ') : rosso('NO  ')
  console.log(`  ${segno}${etichetta.padEnd(38)}${dettaglio}`)
}

function daFare(etichetta, dettaglio = '') {
  console.log(`  ${giallo('--  ')}${etichetta.padEnd(38)}${dettaglio}`)
}

async function prendi(percorso, opzioni = {}) {
  const risposta = await fetch(`${SITO}${percorso}`, {
    redirect: 'manual',
    headers: {'Cache-Control': 'no-cache'},
    ...opzioni,
  })
  return risposta
}

console.log(`\nSTATO DI ${DOMINIO}`)
console.log(`  ${new Date().toLocaleString('it-IT')}\n`)

// ── Il sito ─────────────────────────────────────────────────────
console.log('IL SITO')
try {
  const home = await prendi('/')
  esito(home.status === 200, 'la home risponde', `http ${home.status}`)

  const csp = home.headers.get('content-security-policy')
  const hsts = home.headers.get('strict-transport-security')
  esito(Boolean(csp), 'Content-Security-Policy', csp ? `${csp.length} caratteri` : 'ASSENTE')
  esito(Boolean(hsts), 'HSTS', hsts ?? 'ASSENTE')

  const conWww = await fetch(`https://www.${DOMINIO}/`, {redirect: 'manual'})
  const versoNudo = (conWww.headers.get('location') ?? '').startsWith(SITO)
  esito(conWww.status === 301 && versoNudo, 'www rimanda al dominio nudo', `http ${conWww.status}`)

  const inChiaro = await fetch(`http://${DOMINIO}/`, {redirect: 'manual'})
  esito(inChiaro.status === 301, 'http rimanda a https', `http ${inChiaro.status}`)
} catch (errore) {
  esito(false, 'il sito non risponde affatto', String(errore.message))
}

// ── Farsi trovare ───────────────────────────────────────────────
console.log('\nFARSI TROVARE')
try {
  const robots = await prendi('/robots.txt')
  const testoRobots = await robots.text()
  esito(testoRobots.includes('Allow: /'), 'robots.txt non blocca niente')

  const sitemap = await prendi('/sitemap-0.xml')
  const indirizzi = (await sitemap.text()).match(/<loc>/g)?.length ?? 0
  esito(indirizzi > 0, 'sitemap', `${indirizzi} indirizzi`)

  // La pagina servita al robot di Google, non al browser: e' l'unica prova
  // che conti quando il sito non compare nelle ricerche.
  const perGoogle = await prendi('/', {
    headers: {'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'},
  })
  esito(perGoogle.status === 200, 'Googlebot riceve la pagina', `http ${perGoogle.status}`)
} catch (errore) {
  esito(false, 'controllo non riuscito', String(errore.message))
}

// ── Il dominio ──────────────────────────────────────────────────
console.log('\nIL DOMINIO')
try {
  // Si chiede a un resolver pubblico e non all'autorevole del .it: il server
  // del registro risponde con la delega nella sezione "authority", che non e'
  // una risposta, e resolveNs torna a mani vuote. Una volta delegato, sono i
  // nameserver stessi a dichiararsi nella zona.
  const ns = (await resolver.resolveNs(DOMINIO)).sort()
  const suCloudflare = ns.every((n) => n.endsWith('.ns.cloudflare.com'))
  esito(suCloudflare, 'nameserver su Cloudflare', ns.join(' '))
} catch (errore) {
  esito(false, 'nameserver non leggibili', String(errore.message))
}

try {
  const pubblico = new Resolver()
  pubblico.setServers(['1.1.1.1'])

  const txt = (await pubblico.resolveTxt(DOMINIO)).flat().join(' ')
  esito(txt.includes('v=spf1'), 'SPF: nessuno puo\' spedire a suo nome')

  const dmarc = (await pubblico.resolveTxt(`_dmarc.${DOMINIO}`)).flat().join(' ')
  esito(dmarc.includes('p=reject'), 'DMARC: rifiuto, non spam')

  const mx = await pubblico.resolveMx(DOMINIO)
  esito(mx.length === 1 && mx[0].exchange === '', 'MX nullo: non riceve posta')

  // La proprieta' Search Console di Alessandro sara' un SECONDO record TXT di
  // verifica Google, accanto a quello dello sviluppatore.
  const verificheGoogle = (await pubblico.resolveTxt(DOMINIO))
    .flat()
    .filter((r) => r.startsWith('google-site-verification=')).length
  if (verificheGoogle >= 2) {
    esito(true, 'Search Console anche di Alessandro', `${verificheGoogle} verifiche Google`)
  } else {
    daFare('Search Console di Alessandro', `${verificheGoogle} verifica Google su 2 attese`)
  }
} catch (errore) {
  esito(false, 'record di posta non leggibili', String(errore.message))
}

// ── I contenuti ─────────────────────────────────────────────────
console.log('\nI CONTENUTI')
try {
  const groq = (q) =>
    `https://${PROGETTO_SANITY}.api.sanity.io/v2024-10-01/data/query/production?query=${encodeURIComponent(q)}`

  const coltelli = await (await fetch(groq('count(*[_type=="coltello"])'))).json()
  esito(coltelli.result > 0, 'coltelli pubblicati', String(coltelli.result))

  const info = await (
    await fetch(groq('*[_type=="impostazioniSito"][0]{instagram, facebook, whatsapp, localita}'))
  ).json()
  const i = info.result ?? {}

  esito(Boolean(i.whatsapp), 'WhatsApp')
  esito(Boolean(i.localita), 'localita\'')
  esito(Boolean(i.instagram), 'Instagram')

  if (i.facebook) {
    esito(true, 'Facebook', i.facebook)
  } else {
    daFare('Facebook', 'campo vuoto in Sanity: il pulsante non si disegna')
  }
} catch (errore) {
  esito(false, 'Sanity non risponde', String(errore.message))
}

// ── Quello che da fuori non si vede ─────────────────────────────
console.log('\nDA CHIEDERE — non si vede dall\'esterno')
console.log('  - 2FA sull\'account Aruba di Alessandro (e password cambiata, se e\' passata di mano)')
console.log('  - deploy hook rigenerato dopo essere comparso negli screenshot')
console.log('  - proprieta\' del repository GitHub, del progetto Sanity e di Cloudflare')
console.log('  - link al sito nella biografia Instagram e nella pagina Facebook')
console.log('  - indicizzazione su Google: si guarda in Search Console, alla voce Pagine')

console.log(
  fallimenti === 0
    ? `\n${verde('Nessun problema.')} Le voci in giallo sono cose che deve fare qualcuno, non guasti.\n`
    : `\n${rosso(`${fallimenti} controlli falliti.`)} Guarda le righe NO qui sopra.\n`,
)

process.exit(fallimenti > 0 ? 1 : 0)
