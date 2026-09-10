/** Le forme dei dati usate dal sito, indipendenti da dove arrivano. */

export type Disponibilita = 'disponibile' | 'nonDisponibile' | 'suRichiesta'

export type Categoria = 'resolza' | 'caccia' | 'cucina' | 'collezione' | 'altro'

/**
 * Una fotografia può venire da Sanity (e allora si può ritagliare e
 * ridimensionare al volo) oppure da un file locale, che si usa solo per
 * l'anteprima in sviluppo. Il resto del sito non deve sapere quale delle due è.
 */
export type Immagine =
  | {origine: 'sanity'; riferimento: unknown; alt: string}
  | {origine: 'locale'; percorso: string; alt: string}

export type Coltello = {
  slug: string
  nome: string
  descrizioneBreve: string
  descrizione: string
  categoria?: Categoria
  materialeLama?: string
  materialeManico?: string
  altriMateriali?: string
  lunghezzaTotale?: number
  lunghezzaLama?: number
  anno?: number
  pezzoUnico: boolean
  disponibilita: Disponibilita
  ordine?: number
  immaginePrincipale: Immagine
  galleria: Immagine[]
}

export type PassaggioLavorazione = {
  titolo: string
  testo: string
}

export type ImpostazioniSito = {
  nomeArtigiano: string
  presentazioneBreve: string
  biografia: string
  localita?: string
  whatsapp?: string
  email?: string
  instagram?: string
  facebook?: string
  invitoContatto: string
  passaggiLavorazione: PassaggioLavorazione[]
}

export const ETICHETTE_DISPONIBILITA: Record<Disponibilita, string> = {
  disponibile: 'Disponibile',
  nonDisponibile: 'Non disponibile',
  suRichiesta: 'Su richiesta',
}

export const ETICHETTE_CATEGORIA: Record<Categoria, string> = {
  resolza: 'Resolza',
  caccia: 'Coltello da caccia',
  cucina: 'Coltello da cucina',
  collezione: 'Da collezione',
  altro: 'Altro',
}
