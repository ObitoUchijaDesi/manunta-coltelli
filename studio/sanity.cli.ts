import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },

  /**
   * Il pannello ospitato da Sanity si aggiorna da solo.
   *
   * È una scelta deliberata: qui l'obiettivo è che il progetto sopravviva senza
   * un manutentore. Un pannello che si aggiorna da sé resta compatibile con le
   * API negli anni; uno congelato smette di funzionare e nessuno se ne accorge
   * finché non serve. Il sito pubblico invece NON si aggiorna da solo: quello
   * passa sempre da un commit e da un build.
   */
  deployment: {
    autoUpdates: true,

    // Identificativo dell'applicazione creata al primo deploy. Non è un
    // segreto: serve solo a far sapere alla CLI quale studio aggiornare,
    // così i deploy successivi non chiedono conferma.
    appId: 'idmo8g272gnp0vd909m6aclh',
  },
})
