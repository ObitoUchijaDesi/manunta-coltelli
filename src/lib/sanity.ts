import {createClient, type SanityClient} from '@sanity/client'

/**
 * Il collegamento a Sanity esiste SOLO durante il build.
 *
 * Il sito pubblicato è fatto di file statici: nel browser dei visitatori non
 * arriva né questo client né la libreria. È il motivo per cui non c'è nessuna
 * chiave da proteggere lato sito e nessun database da attaccare.
 */

/**
 * Identificativo del progetto e del dataset.
 *
 * Scritti qui, non solo in una variabile di pannello. Non sono segreti: il
 * projectId si legge nell'indirizzo di ogni fotografia del sito
 * (cdn.sanity.io/images/axglrva9/production/...) e il dataset e' pubblico in
 * lettura per chiunque lo conosca. Nasconderli non protegge niente; le
 * scritture richiedono un token, che qui non c'e' e non serve.
 *
 * Sono qui per una ragione pratica. Stavano solo fra le variabili di
 * Cloudflare, dove valevano per il branch di produzione: al primo build di un
 * branch di prova il sito non le trovava e il build si fermava, con un errore
 * che parlava di credenziali mancanti quando in realta' mancava una
 * configurazione. Un valore che non e' segreto sta nel codice, dove segue il
 * branch e non va ricordato a mano in nessun pannello.
 *
 * Le variabili d'ambiente restano e vincono: servono per puntare a un altro
 * progetto o a un dataset di prova senza toccare il codice.
 */
const PROGETTO_PREDEFINITO = 'axglrva9'

const projectId =
  import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || PROGETTO_PREDEFINITO
const dataset = import.meta.env.SANITY_DATASET || process.env.SANITY_DATASET || 'production'

export const sanityConfigurato = Boolean(projectId)

export const clientSanity: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2026-09-01',

      // Al build serve l'ultimissima versione, non una copia in cache:
      // altrimenti Alessandro pubblica e non vede il cambiamento.
      useCdn: false,

      // Solo contenuti pubblicati. Le bozze restano nel pannello e non
      // finiscono mai online, nemmeno per sbaglio.
      perspective: 'published',
    })
  : null
