import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {itITLocale} from '@sanity/locale-it-it'

import {schemaTypes} from './schemaTypes'
import {struttura, ID_IMPOSTAZIONI} from './struttura'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production'

if (!projectId) {
  throw new Error(
    'Manca SANITY_STUDIO_PROJECT_ID.\n' +
      'Copia studio/.env.example in studio/.env e inserisci l’identificativo del progetto Sanity.\n' +
      'L’identificativo non è un segreto: si trova su sanity.io/manage.',
  )
}

export default defineConfig({
  name: 'default',
  title: 'Alessandro Manunta Coltelli',

  projectId,
  dataset,

  plugins: [
    structureTool({structure: struttura}),
    // Interfaccia in italiano: "Publish" diventa "Pubblica".
    itITLocale(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Le informazioni del sito sono un documento unico: togliamo le azioni che
    // lo farebbero sparire per sbaglio.
    actions: (azioniPredefinite, {schemaType}) =>
      schemaType === ID_IMPOSTAZIONI
        ? azioniPredefinite.filter(
            ({action}) => !['delete', 'duplicate', 'unpublish'].includes(action ?? ''),
          )
        : azioniPredefinite,

    // E non devono comparire nel pulsante "crea nuovo": esistono già.
    newDocumentOptions: (opzioniPredefinite) =>
      opzioniPredefinite.filter((opzione) => opzione.templateId !== ID_IMPOSTAZIONI),
  },
})
