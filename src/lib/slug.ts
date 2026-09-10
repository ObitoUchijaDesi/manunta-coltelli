/**
 * Indirizzo di pagina a partire dal nome del coltello.
 *
 * Copia voluta di `creaSlug` in `studio/schemaTypes/coltello.ts`: lo Studio è
 * un pacchetto npm separato, con il suo bundler, e importare un file fuori
 * dalla sua radice è il genere di cosa che si rompe in silenzio dopo un
 * aggiornamento — con Alessandro che non ha nessuno da chiamare.
 *
 * Se una delle due cambia, cambiare anche l'altra. Il rischio è comunque
 * contenuto: quando il campo in Sanity è compilato vince quello, e questa
 * funzione entra in gioco solo per i coltelli che non lo hanno.
 */
export function creaSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // via gli accenti: "Resolza d'Ogliastra" -> "resolza-dogliastra"
    .replace(/['’`]/g, '') // toglie gli apostrofi senza lasciare un trattino
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '')
}

/**
 * Rende univoco un indirizzo che si ripete.
 *
 * Due coltelli con lo stesso nome generano lo stesso indirizzo, e due pagine
 * sullo stesso indirizzo fanno fallire il build. Fermare tutto sarebbe la
 * scelta peggiore: Alessandro vedrebbe il sito non aggiornarsi senza sapere
 * perché, e "percorso duplicato" non è un messaggio che si possa agire. Il
 * secondo coltello prende un numero in coda e va online comunque.
 */
export function slugUnivoco(base: string, usati: Set<string>): string {
  if (!base) return ''

  if (!usati.has(base)) {
    usati.add(base)
    return base
  }

  for (let n = 2; n <= 50; n++) {
    const tentativo = `${base}-${n}`
    if (!usati.has(tentativo)) {
      usati.add(tentativo)
      console.warn(
        `[contenuti] l'indirizzo "${base}" era già usato: questo coltello va su "${tentativo}". ` +
          'Due coltelli hanno lo stesso nome.',
      )
      return tentativo
    }
  }

  return ''
}
