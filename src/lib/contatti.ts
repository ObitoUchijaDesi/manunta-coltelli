import type {ImpostazioniSito} from './tipi'

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

export function utenteInstagram(impostazioni: ImpostazioniSito): string | null {
  const grezzo = impostazioni.instagram?.trim().replace(/^@/, '')
  return grezzo ? grezzo : null
}

export function urlInstagram(impostazioni: ImpostazioniSito): string | null {
  const utente = utenteInstagram(impostazioni)
  return utente ? `https://instagram.com/${utente}` : null
}

/**
 * Testi precompilati.
 *
 * Contengono solo il nome del coltello, mai dati di chi scrive: il messaggio
 * finisce nell'indirizzo del link, e un indirizzo si può registrare nella
 * cronologia del browser o nei log di chi sta in mezzo.
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
   */
  perColtello: (nomeColtello: string) =>
    `Ciao Alessandro, sono interessato al coltello ${nomeColtello}. Potresti darmi più informazioni?`,

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
