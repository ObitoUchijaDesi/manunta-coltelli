import {ETICHETTE_CATEGORIA} from './tipi'
import type {Coltello, ImpostazioniSito} from './tipi'

/**
 * Costruzione dei link di contatto.
 *
 * Regola: se il recapito non c'è, il link NON si disegna. Il vecchio sito
 * generava comunque "wa.me/390000000000" da un numero segnaposto, e ogni
 * pulsante del sito portava a una conversazione con un numero inesistente.
 * Meglio un pulsante in meno che un pulsante rotto.
 */

/** Toglie spazi, trattini e parentesi: wa.me vuole solo cifre. */
export function numeroWhatsApp(impostazioni: ImpostazioniSito): string | null {
  const grezzo = impostazioni.whatsapp?.trim()
  if (!grezzo) return null
  const cifre = grezzo.replace(/\D/g, '')
  // Un numero italiano con prefisso sta sopra le 10 cifre. Sotto, è un errore
  // di compilazione: meglio non generare il link.
  return cifre.length >= 10 ? cifre : null
}

export function urlWhatsApp(impostazioni: ImpostazioniSito, messaggio?: string): string | null {
  const numero = numeroWhatsApp(impostazioni)
  if (!numero) return null
  const testo = messaggio ? `?text=${encodeURIComponent(messaggio)}` : ''
  return `https://wa.me/${numero}${testo}`
}

/**
 * Link mailto con oggetto e prima riga già scritti.
 *
 * I parametri passano da encodeURIComponent: senza, un accento o un "&" nel
 * nome di un coltello troncherebbero l'indirizzo a metà.
 */
export function urlEmail(
  impostazioni: ImpostazioniSito,
  oggetto?: string,
  corpo?: string,
): string | null {
  const email = impostazioni.email?.trim()
  if (!email || !email.includes('@')) return null

  const parametri = new URLSearchParams()
  if (oggetto) parametri.set('subject', oggetto)
  if (corpo) parametri.set('body', corpo)

  const stringa = parametri.toString().replace(/\+/g, '%20')
  return stringa ? `mailto:${email}?${stringa}` : `mailto:${email}`
}

/**
 * Nome utente Instagram, solo se è plausibile.
 *
 * Non basta che il campo non sia vuoto: durante le prove ci è finito dentro
 * un singolo punto, e il sito ci ha costruito sopra "instagram.com/." — un
 * pulsante che non porta da nessuna parte. Instagram ammette lettere, cifre,
 * punti e trattini bassi, ma un nome fatto di soli punti non esiste: qui
 * pretendiamo almeno due caratteri e almeno una lettera o cifra.
 */
export function utenteInstagram(impostazioni: ImpostazioniSito): string | null {
  const grezzo = impostazioni.instagram?.trim().replace(/^@/, '')
  if (!grezzo) return null
  if (grezzo.length < 2) return null
  if (!/^[A-Za-z0-9._]+$/.test(grezzo)) return null
  if (!/[A-Za-z0-9]/.test(grezzo)) return null
  return grezzo
}

export function urlInstagram(impostazioni: ImpostazioniSito): string | null {
  const utente = utenteInstagram(impostazioni)
  return utente ? `https://instagram.com/${utente}` : null
}

/**
 * Pagina Facebook, accettando entrambe le cose che una persona scrive.
 *
 * Chi conosce il nome della propria pagina scrive il nome; chi non lo conosce
 * apre Facebook e copia l'indirizzo dalla barra del browser. Rifiutare la
 * seconda forma vorrebbe dire un campo compilato e un pulsante mancante,
 * senza che niente lo spieghi.
 *
 * L'indirizzo incollato si accetta solo se e' davvero di Facebook: un
 * incollaggio sbagliato manderebbe i visitatori altrove con l'etichetta
 * "Facebook" addosso.
 */
export function urlFacebook(impostazioni: ImpostazioniSito): string | null {
  const grezzo = impostazioni.facebook?.trim()
  if (!grezzo) return null

  // I browser nascondono "https://" nella barra degli indirizzi: chi copia da
  // li' ottiene "facebook.com/pagina". Senza questa riga quel valore veniva
  // rifiutato e il pulsante non compariva, con il campo compilato.
  const conProtocollo = /^(www\.|m\.)?(facebook\.com|fb\.com|fb\.me)\//i.test(grezzo)
    ? `https://${grezzo}`
    : grezzo

  if (/^https?:\/\//i.test(conProtocollo)) {
    try {
      const indirizzo = new URL(conProtocollo)
      const dominio = indirizzo.hostname.replace(/^www\./, '').replace(/^m\./, '')
      if (dominio !== 'facebook.com' && dominio !== 'fb.com' && dominio !== 'fb.me') return null
      if (indirizzo.pathname === '/' && !indirizzo.search) return null
      return `https://facebook.com${indirizzo.pathname}${indirizzo.search}`
    } catch {
      return null
    }
  }

  // Stesse cautele di Instagram: un campo con dentro un solo punto non e' un
  // nome di pagina, ed e' successo davvero in questo progetto.
  const nome = grezzo.replace(/^@/, '').replace(/^\/+|\/+$/g, '')
  if (nome.length < 2) return null
  if (!/^[A-Za-z0-9.\-]+$/.test(nome)) return null
  if (!/[A-Za-z0-9]/.test(nome)) return null
  return `https://facebook.com/${nome}`
}

/**
 * Testi precompilati.
 *
 * Descrivono il coltello e nulla di chi scrive. La distinzione conta: il
 * messaggio finisce nell'indirizzo del link, e un indirizzo si può registrare
 * nella cronologia del browser e nei log di chi sta in mezzo. Le misure di una
 * lama lì dentro non fanno danno a nessuno; il nome o il telefono di un
 * visitatore sì, ed è per questo che non ce li mettiamo mai.
 */
export const messaggi = {
  /** Testo di WhatsApp dalle pagine che non parlano di un coltello preciso. */
  generico: 'Buongiorno Alessandro, vorrei avere alcune informazioni sui tuoi coltelli.',

  /**
   * Testo di WhatsApp dalla pagina o dalla scheda di un coltello.
   *
   * "al coltello X" e non "al X": i nomi cambiano genere — la Resolza è
   * femminile, il Cinghiale maschile — e anteporre "coltello" fa tornare la
   * frase con qualsiasi nome Alessandro inventi in futuro.
   *
   * Il messaggio porta con sé le caratteristiche del coltello e il suo
   * indirizzo. Il motivo è pratico: prima diceva solo il nome, e con due
   * coltelli chiamati allo stesso modo — cosa che Alessandro fa, stessa forma
   * e materiali diversi — lui riceveva la richiesta senza sapere di quale si
   * trattasse. Doveva chiedere, e chi scriveva doveva tornare a guardare.
   *
   * Compaiono solo i campi compilati: un coltello di cui si conosce soltanto
   * il nome produce lo stesso messaggio breve di prima, non un elenco di
   * righe vuote.
   */
  perColtello: (coltello: Coltello, sito?: URL | string) => {
    const dettagli: string[] = []

    if (coltello.categoria) dettagli.push(`Tipo: ${ETICHETTE_CATEGORIA[coltello.categoria]}`)
    if (coltello.materialeLama) dettagli.push(`Lama: ${coltello.materialeLama}`)
    if (coltello.materialeManico) dettagli.push(`Manico: ${coltello.materialeManico}`)
    if (coltello.altriMateriali) dettagli.push(`Altro: ${coltello.altriMateriali}`)
    if (typeof coltello.lunghezzaTotale === 'number')
      dettagli.push(`Lunghezza totale: ${coltello.lunghezzaTotale} cm`)
    if (typeof coltello.lunghezzaLama === 'number')
      dettagli.push(`Lunghezza lama: ${coltello.lunghezzaLama} cm`)
    if (coltello.anno) dettagli.push(`Anno: ${coltello.anno}`)
    if (coltello.pezzoUnico) dettagli.push('Pezzo unico')

    // L'indirizzo della pagina è l'informazione che toglie ogni dubbio: la
    // forma del percorso sta scritta qui una volta sola, così non si sfalsa
    // rispetto alle pagine vere se un domani cambia.
    const indirizzo = sito ? new URL(`/coltelli/${coltello.slug}/`, sito).href : null

    const righe = [`Ciao Alessandro, sono interessato al coltello ${coltello.nome}.`]
    if (dettagli.length > 0) righe.push('', ...dettagli)
    if (indirizzo) righe.push('', indirizzo)
    righe.push('', 'Potresti darmi più informazioni?')

    return righe.join('\n')
  },

  oggettoEmail: (nomeColtello?: string) =>
    nomeColtello
      ? `Informazioni su ${nomeColtello}`
      : 'Richiesta informazioni — Alessandro Manunta Coltelli',

  /**
   * Prima riga della email. Solo un'apertura: quello che il visitatore vuole
   * dire lo scrive lui, e non mettiamo nulla che lo riguardi nell'indirizzo.
   */
  corpoEmail: (nomeColtello?: string) =>
    nomeColtello
      ? `Buongiorno Alessandro,\n\nvorrei informazioni sul coltello ${nomeColtello}.\n\n`
      : 'Buongiorno Alessandro,\n\nvorrei avere alcune informazioni sui suoi coltelli.\n\n',
}

/** Vero se manca qualunque recapito: il sito non è pronto per la pubblicazione. */
export function recapitiIncompleti(impostazioni: ImpostazioniSito): string[] {
  const mancanti: string[] = []
  if (!numeroWhatsApp(impostazioni)) mancanti.push('WhatsApp')
  if (!urlEmail(impostazioni)) mancanti.push('email')
  if (!utenteInstagram(impostazioni)) mancanti.push('Instagram')
  if (!impostazioni.localita?.trim()) mancanti.push('località')
  return mancanti
}
