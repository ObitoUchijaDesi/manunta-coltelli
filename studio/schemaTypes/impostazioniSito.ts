import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Le informazioni che compaiono in più punti del sito: chi è Alessandro,
 * come lo si contatta, i passaggi della lavorazione.
 *
 * Esiste un solo documento di questo tipo (vedi struttura.ts). Qui NON vanno
 * impostazioni tecniche: niente chiavi, niente indirizzi di server, niente SEO
 * avanzata. Sono cose che il proprietario non deve poter rompere.
 */

/** Valori rimasti nel vecchio sito che non sono mai stati sostituiti con quelli veri. */
const SEGNAPOSTO_NOTI = [
  '+39 000 000 0000',
  '000 000 0000',
  'info@alessandromanunta.it',
  'DA INSERIRE',
]

const avvisaSeSegnaposto = (valore: unknown) => {
  if (typeof valore !== 'string' || valore.trim() === '') return true
  const normalizzato = valore.trim().toLowerCase()
  const eSegnaposto = SEGNAPOSTO_NOTI.some((s) => normalizzato === s.toLowerCase())
  return eSegnaposto ? 'Questo è un valore di esempio: sostituiscilo con quello vero.' : true
}

export const impostazioniSito = defineType({
  name: 'impostazioniSito',
  title: 'Informazioni del sito',
  type: 'document',
  fieldsets: [
    {name: 'contatti', title: 'Contatti', options: {collapsible: true, collapsed: false}},
    {name: 'processo', title: 'Come lavori', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    defineField({
      name: 'nomeArtigiano',
      title: 'Nome dell’artigiano',
      type: 'string',
      initialValue: 'Alessandro Manunta',
      validation: (Rule) => Rule.required().error('Serve il nome.'),
    }),
    defineField({
      name: 'presentazioneBreve',
      title: 'Frase di apertura',
      type: 'text',
      rows: 3,
      description: 'Le due righe che si leggono per prime entrando nel sito.',
    }),
    defineField({
      name: 'biografia',
      title: 'Chi sono',
      type: 'text',
      rows: 8,
      description: 'Il testo della sezione di presentazione.',
    }),
    defineField({
      name: 'localita',
      title: 'Dove lavori',
      type: 'string',
      description:
        'Per esempio il paese e la provincia. Serve a farti trovare da chi cerca un coltelliere in zona.',
    }),

    // ── Contatti ───────────────────────────────────────────────
    defineField({
      name: 'whatsapp',
      title: 'Numero WhatsApp',
      type: 'string',
      fieldset: 'contatti',
      description: 'Con il prefisso internazionale, per esempio +39 333 1234567.',
      validation: (Rule) => Rule.custom(avvisaSeSegnaposto).warning(),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      fieldset: 'contatti',
      validation: (Rule) => [
        Rule.email().warning('Controlla l’indirizzo: non sembra un’email valida.'),
        Rule.custom(avvisaSeSegnaposto).warning(),
      ],
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'string',
      fieldset: 'contatti',
      description: 'Solo il nome utente, per esempio: alessandromanunta',
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'string',
      fieldset: 'contatti',
      description:
        'Il nome della tua pagina, per esempio: alessandromanuntacoltelli. Se preferisci puoi incollare l’indirizzo intero copiato dal browser. Lascia vuoto se non hai una pagina Facebook: il pulsante non verrà disegnato.',
    }),

    // ── Processo ───────────────────────────────────────────────
    defineField({
      name: 'invitoContatto',
      title: 'Invito a scriverti',
      type: 'text',
      rows: 3,
      fieldset: 'processo',
      description: 'Il testo che invita chi visita il sito a mettersi in contatto.',
    }),
    defineField({
      name: 'passaggiLavorazione',
      title: 'Passaggi della lavorazione',
      type: 'array',
      fieldset: 'processo',
      description: 'I passaggi dal primo contatto alla consegna. Si possono trascinare.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'passaggio',
          fields: [
            defineField({
              name: 'titolo',
              title: 'Titolo',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'testo',
              title: 'Descrizione',
              type: 'text',
              rows: 3,
            }),
          ],
          preview: {
            select: {title: 'titolo', subtitle: 'testo'},
          },
        }),
      ],
    }),
  ],

  preview: {
    prepare: () => ({title: 'Informazioni del sito'}),
  },
})
