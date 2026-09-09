import type {StructureResolver} from 'sanity/structure'

/**
 * Il menu del pannello, ridotto a due voci.
 *
 * Senza questa struttura Sanity mostrerebbe una voce per ogni tipo di
 * contenuto più i menu di servizio: troppa roba su un telefono, e roba che il
 * proprietario non deve toccare.
 */

export const ID_IMPOSTAZIONI = 'impostazioniSito'

export const struttura: StructureResolver = (S) =>
  S.list()
    .title('Contenuti')
    .items([
      S.listItem()
        .title('Coltelli')
        .schemaType('coltello')
        .child(S.documentTypeList('coltello').title('Coltelli')),

      S.divider(),

      S.listItem()
        .title('Informazioni del sito')
        .id(ID_IMPOSTAZIONI)
        .child(
          S.document()
            .schemaType('impostazioniSito')
            .documentId(ID_IMPOSTAZIONI)
            .title('Informazioni del sito'),
        ),
    ])
