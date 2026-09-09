import {createClient, type SanityClient} from '@sanity/client'

/**
 * Il collegamento a Sanity esiste SOLO durante il build.
 *
 * Il sito pubblicato è fatto di file statici: nel browser dei visitatori non
 * arriva né questo client né la libreria. È il motivo per cui non c'è nessuna
 * chiave da proteggere lato sito e nessun database da attaccare.
 */

const projectId = import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
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
