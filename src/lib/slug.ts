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
 * Assegna a ogni coltello il suo indirizzo, risolvendo i nomi ripetuti.
 *
 * Due coltelli chiamati allo stesso modo generano lo stesso indirizzo, e due
 * pagine sullo stesso indirizzo fanno fallire il build. Fermare tutto sarebbe
 * la scelta peggiore: Alessandro vedrebbe il sito non aggiornarsi senza sapere
 * perché, e "percorso duplicato" non è un messaggio su cui possa agire. Il
 * secondo prende un numero in coda e va online comunque.
 *
 * Il punto delicato è QUALE dei due prende il numero. La prima versione
 * assegnava i numeri nell'ordine in cui i coltelli arrivavano dalla query,
 * cioè per campo "ordine" e nome: bastava che Alessandro cambiasse l'ordine
 * della vetrina perché due indirizzi si scambiassero, e un link mandato su
 * WhatsApp settimane prima avrebbe aperto l'altro coltello. Senza nessun
 * errore, senza che nulla sembrasse rotto.
 *
 * Qui l'ordine è quello dell'identificativo del documento, che non cambia mai
 * per tutta la vita del coltello.
 */
export function assegnaIndirizzi(voci: {id: string; base: string}[]): Map<string, string> {
  const perBase = new Map<string, {id: string; base: string}[]>()

  for (const voce of voci) {
    if (!voce.base) continue
    const gruppo = perBase.get(voce.base)
    if (gruppo) gruppo.push(voce)
    else perBase.set(voce.base, [voce])
  }

  const indirizzi = new Map<string, string>()

  for (const [base, gruppo] of perBase) {
    if (gruppo.length === 1) {
      indirizzi.set(gruppo[0].id, base)
      continue
    }

    const ordinati = [...gruppo].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    const assegnati = ordinati.map((voce, i) => {
      const indirizzo = i === 0 ? base : `${base}-${i + 1}`
      indirizzi.set(voce.id, indirizzo)
      return indirizzo
    })

    console.warn(
      `[contenuti] ${gruppo.length} coltelli hanno lo stesso nome: gli indirizzi diventano ` +
        `${assegnati.join(', ')}. Funziona, ma per chi guarda il catalogo due schede con lo ` +
        'stesso nome sono indistinguibili: meglio nomi diversi.',
    )
  }

  return indirizzi
}
