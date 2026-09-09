import {defineField, defineType} from 'sanity'

/**
 * Un coltello del catalogo.
 *
 * Regola di fondo: DISPONIBILITÀ e PUBBLICAZIONE sono due cose diverse.
 * - La disponibilità è un'informazione commerciale scritta in questo campo.
 * - La pubblicazione è lo stato del documento in Sanity: finché è una bozza,
 *   il coltello non esce sul sito. Si nasconde un coltello con "Annulla
 *   pubblicazione", non mettendolo come non disponibile.
 *
 * Le validazioni sono pensate per non dare fastidio: una bozza si salva sempre,
 * anche incompleta. Sono i controlli marcati come errore che impediscono la
 * pubblicazione finché mancano nome, foto e indirizzo della pagina.
 */

export const DISPONIBILITA = [
  {title: 'Disponibile', value: 'disponibile'},
  {title: 'Non disponibile', value: 'nonDisponibile'},
  {title: 'Su richiesta', value: 'suRichiesta'},
] as const

export const CATEGORIE = [
  {title: 'Resolza', value: 'resolza'},
  {title: 'Coltello da caccia', value: 'caccia'},
  {title: 'Coltello da cucina', value: 'cucina'},
  {title: 'Da collezione', value: 'collezione'},
  {title: 'Altro', value: 'altro'},
] as const

/** Indirizzo leggibile: niente accenti, apostrofi o caratteri strani. */
export function creaSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // via gli accenti: "Resolza d'Ogliastra" -> "resolza-dogliastra"
    .replace(/['’`]/g, '') // toglie gli apostrofi senza lasciare un trattino
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '')
}

/** Campo alt riusato da tutte le immagini. */
const campoAlt = defineField({
  name: 'alt',
  title: 'Descrizione della foto',
  type: 'string',
  description:
    'Facoltativa. Serve a chi non può vedere l’immagine. Se la lasci vuota viene usato il nome del coltello.',
})

export const coltello = defineType({
  name: 'coltello',
  title: 'Coltello',
  type: 'document',
  fieldsets: [
    {name: 'materiali', title: 'Materiali', options: {collapsible: true, collapsed: false}},
    {name: 'dimensioni', title: 'Dimensioni', options: {collapsible: true, collapsed: true}},
    {name: 'altro', title: 'Altre informazioni', options: {collapsible: true, collapsed: true}},
  ],
  fields: [
    // ── 1. Nome ────────────────────────────────────────────────
    defineField({
      name: 'nome',
      title: 'Nome del coltello',
      type: 'string',
      validation: (Rule) => Rule.required().error('Il nome è obbligatorio.'),
    }),

    // ── 2. Foto ────────────────────────────────────────────────
    defineField({
      name: 'immaginePrincipale',
      title: 'Foto principale',
      type: 'image',
      description:
        'È la foto che si vede nel catalogo e quando mandi il link del coltello su WhatsApp.',
      options: {hotspot: true},
      fields: [campoAlt],
      validation: (Rule) => Rule.required().error('Serve almeno la foto principale per pubblicare.'),
    }),
    defineField({
      name: 'galleria',
      title: 'Altre foto',
      type: 'array',
      description: 'Puoi aggiungerne quante vuoi. Si possono trascinare per cambiarne l’ordine.',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [campoAlt],
        },
      ],
      options: {layout: 'grid'},
    }),

    // ── 3. Descrizioni ─────────────────────────────────────────
    defineField({
      name: 'descrizioneBreve',
      title: 'Descrizione breve',
      type: 'text',
      rows: 2,
      description: 'Una o due righe. Compare sotto il nome nel catalogo.',
      validation: (Rule) =>
        Rule.max(200).warning('Meglio restare sotto le 200 lettere: qui il testo viene troncato.'),
    }),
    defineField({
      name: 'descrizione',
      title: 'Descrizione completa',
      type: 'text',
      rows: 8,
      description: 'Il testo della pagina del coltello. Racconta pure con calma.',
    }),

    // ── 4. Materiali ───────────────────────────────────────────
    defineField({
      name: 'materialeLama',
      title: 'Materiale della lama',
      type: 'string',
      fieldset: 'materiali',
      description: 'Per esempio: acciaio damasco, acciaio al carbonio.',
    }),
    defineField({
      name: 'materialeManico',
      title: 'Materiale del manico',
      type: 'string',
      fieldset: 'materiali',
      description: 'Per esempio: corno di muflone, legno di ginepro.',
    }),
    defineField({
      name: 'altriMateriali',
      title: 'Altri materiali',
      type: 'string',
      fieldset: 'materiali',
      description: 'Facoltativo. Ghiere, borchie, fodero.',
    }),

    // ── 5. Dimensioni ──────────────────────────────────────────
    defineField({
      name: 'lunghezzaTotale',
      title: 'Lunghezza totale (cm)',
      type: 'number',
      fieldset: 'dimensioni',
      validation: (Rule) => Rule.min(0).error('Non può essere un numero negativo.'),
    }),
    defineField({
      name: 'lunghezzaLama',
      title: 'Lunghezza della lama (cm)',
      type: 'number',
      fieldset: 'dimensioni',
      validation: (Rule) => Rule.min(0).error('Non può essere un numero negativo.'),
    }),

    // ── 6. Disponibilità ───────────────────────────────────────
    defineField({
      name: 'disponibilita',
      title: 'Disponibilità',
      type: 'string',
      description:
        'Per togliere un coltello dal sito non usare questo campo: usa "Annulla pubblicazione".',
      initialValue: 'disponibile',
      options: {
        list: [...DISPONIBILITA],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required().error('Indica se il coltello è disponibile.'),
    }),

    // ── 7. Altro (chiuso di default) ───────────────────────────
    defineField({
      name: 'categoria',
      title: 'Tipo di coltello',
      type: 'string',
      fieldset: 'altro',
      options: {list: [...CATEGORIE]},
    }),
    defineField({
      name: 'anno',
      title: 'Anno di realizzazione',
      type: 'number',
      fieldset: 'altro',
      validation: (Rule) =>
        Rule.min(1950)
          .max(new Date().getFullYear() + 1)
          .warning('Controlla l’anno: sembra fuori dal periodo previsto.'),
    }),
    defineField({
      name: 'pezzoUnico',
      title: 'Pezzo unico',
      type: 'boolean',
      fieldset: 'altro',
      description: 'Attiva se è un esemplare irripetibile.',
      initialValue: false,
    }),
    defineField({
      name: 'ordine',
      title: 'Ordine nel catalogo',
      type: 'number',
      fieldset: 'altro',
      description: 'Numero più basso = compare prima. Se lo lasci vuoto va in fondo.',
    }),
    defineField({
      name: 'slug',
      title: 'Indirizzo della pagina',
      type: 'slug',
      fieldset: 'altro',
      description:
        'Si scrive da solo partendo dal nome. Se il coltello è già online, cambiarlo rompe i link già condivisi: meglio lasciarlo com’è.',
      options: {
        source: 'nome',
        maxLength: 64,
        slugify: creaSlug,
      },
      validation: (Rule) =>
        Rule.required().error('Premi "Genera" per creare l’indirizzo della pagina.'),
    }),
  ],

  preview: {
    select: {
      title: 'nome',
      media: 'immaginePrincipale',
      disponibilita: 'disponibilita',
      categoria: 'categoria',
      pezzoUnico: 'pezzoUnico',
    },
    prepare({title, media, disponibilita, categoria, pezzoUnico}) {
      const etichettaDisponibilita = DISPONIBILITA.find((d) => d.value === disponibilita)?.title
      const etichettaCategoria = CATEGORIE.find((c) => c.value === categoria)?.title
      const sottotitolo = [
        etichettaCategoria,
        etichettaDisponibilita,
        pezzoUnico ? 'Pezzo unico' : null,
      ]
        .filter(Boolean)
        .join(' · ')

      return {
        title: title || 'Coltello senza nome',
        subtitle: sottotitolo || 'Da completare',
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Ordine del catalogo',
      name: 'ordineCatalogo',
      by: [
        {field: 'ordine', direction: 'asc'},
        {field: 'nome', direction: 'asc'},
      ],
    },
    {
      title: 'Nome (A-Z)',
      name: 'nomeAsc',
      by: [{field: 'nome', direction: 'asc'}],
    },
    {
      title: 'Aggiunti di recente',
      name: 'recenti',
      by: [{field: '_createdAt', direction: 'desc'}],
    },
  ],
})
