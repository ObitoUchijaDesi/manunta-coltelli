/**
 * Anteprima locale del sito senza Sanity.
 *
 * Serve solo a chi sviluppa: prepara le fotografie del vecchio sito, accende
 * la modalità con i contenuti locali e avvia Astro. Ogni pagina mostra una
 * fascia di avviso, così questa modalità non può essere scambiata per il sito
 * vero nemmeno per sbaglio.
 *
 *   npm run anteprima
 *
 * Un wrapper Node invece di "VARIABILE=1 astro dev" perché su Windows quella
 * sintassi non funziona, e non vale la pena aggiungere una dipendenza per una
 * riga.
 */

import {spawn} from 'node:child_process'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = resolve(QUI, '..')

const preparazione = spawn(process.execPath, [join(QUI, 'prepara-migrazione.mjs')], {
  cwd: RADICE,
  stdio: 'inherit',
})

preparazione.on('exit', (codice) => {
  if (codice !== 0) {
    console.error('\nPreparazione dei contenuti fallita: anteprima non avviata.\n')
    process.exit(codice ?? 1)
  }

  console.log('\n── ANTEPRIMA CON CONTENUTI LOCALI ──')
  console.log('I contenuti vengono dal vecchio sito, non da Sanity.')
  console.log('Non è il sito vero: serve solo per controllare grafica e struttura.\n')

  const astro = spawn('npx', ['astro', 'dev'], {
    cwd: RADICE,
    stdio: 'inherit',
    shell: true,
    env: {...process.env, CONTENUTI_LOCALI: '1'},
  })

  astro.on('exit', (c) => process.exit(c ?? 0))
})
