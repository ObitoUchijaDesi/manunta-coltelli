/**
 * Serve la cartella dist applicando davvero gli header di dist/_headers.
 *
 * "astro preview" ignora il file _headers, quindi senza questo la Content-
 * Security-Policy si scoprirebbe rotta solo in produzione. Qui invece si apre
 * il sito, si guarda la console del browser e si vede subito se la policy
 * blocca qualcosa che serve.
 *
 *   npm run prova-produzione
 *
 * Serve solo per le verifiche locali: non fa parte del sito pubblicato.
 */

import {createReadStream, existsSync, readFileSync, statSync} from 'node:fs'
import {createServer} from 'node:http'
import {dirname, extname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(QUI, '..', 'dist')
const PORTA = Number(process.env.PORTA ?? 4178)

if (!existsSync(join(DIST, '_headers'))) {
  console.error('\nManca dist/_headers. Esegui prima: npm run build\n')
  process.exit(1)
}

/**
 * Le regole si rileggono a ogni richiesta, non una volta all'avvio.
 *
 * Tenerle in memoria significa che dopo un "npm run build" il server continua
 * a servire la policy vecchia: gli hash degli script non combaciano più e la
 * pagina risulta rotta per un motivo che non esiste. Costato mezz'ora una volta.
 */
function leggiRegole() {
  const regole = []
  let regolaCorrente = null

  for (const riga of readFileSync(join(DIST, '_headers'), 'utf8').split('\n')) {
    const pulita = riga.replace(/\r$/, '')
    if (!pulita.trim() || pulita.trimStart().startsWith('#')) continue

    if (!pulita.startsWith(' ') && !pulita.startsWith('\t')) {
      regolaCorrente = {schema: pulita.trim(), header: []}
      regole.push(regolaCorrente)
      continue
    }

    const separatore = pulita.indexOf(':')
    if (separatore > 0 && regolaCorrente) {
      regolaCorrente.header.push([
        pulita.slice(0, separatore).trim(),
        pulita.slice(separatore + 1).trim(),
      ])
    }
  }

  return regole
}

const combacia = (schema, percorso) => {
  if (schema === '/*') return true
  if (schema.endsWith('/*')) return percorso.startsWith(schema.slice(0, -1))
  if (schema.startsWith('/*.')) return percorso.endsWith(schema.slice(2))
  return schema === percorso
}

const TIPI = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

const server = createServer((richiesta, risposta) => {
  const percorso = decodeURIComponent(new URL(richiesta.url ?? '/', 'http://x').pathname)

  let file = join(DIST, percorso)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!existsSync(file)) file = join(DIST, '404.html')

  // Fuori da dist non si esce.
  if (!resolve(file).startsWith(DIST)) {
    risposta.writeHead(403).end('Vietato')
    return
  }

  for (const regola of leggiRegole()) {
    if (!combacia(regola.schema, percorso)) continue
    for (const [nome, valore] of regola.header) risposta.setHeader(nome, valore)
  }

  risposta.setHeader('Content-Type', TIPI[extname(file)] ?? 'application/octet-stream')
  createReadStream(file).pipe(risposta)
})

server.listen(PORTA, '127.0.0.1', () => {
  console.log(`\nSito servito CON gli header di produzione su http://127.0.0.1:${PORTA}/`)
  console.log(`Regole in dist/_headers: ${leggiRegole().length} (rilette a ogni richiesta)`)
  console.log('\nApri la console del browser: se la CSP blocca qualcosa, lo scrive lì.')
  console.log('Ctrl+C per fermare.\n')
})
