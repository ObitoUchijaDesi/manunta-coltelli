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

export function urlEmail(impostazioni: ImpostazioniSito, oggetto?: string): string | null {
  const email = impostazioni.email?.trim()
  if (!email || !email.includes('@')) return null
  return oggetto ? `mailto:${email}?subject=${encodeURIComponent(oggetto)}` : `mailto:${email}`
}

export function utenteInstagram(impostazioni: ImpostazioniSito): string | null {
  const grezzo = impostazioni.instagram?.trim().replace(/^@/, '')
  return grezzo ? grezzo : null
}

export function urlInstagram(impostazioni: ImpostazioniSito): string | null {
  const utente = utenteInstagram(impostazioni)
  return utente ? `https://instagram.com/${utente}` : null
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
