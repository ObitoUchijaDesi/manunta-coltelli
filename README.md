# Alessandro Manunta Coltelli

Sito vetrina dei coltelli artigianali di Alessandro Manunta. **Non è un e-commerce**: nessun carrello, nessun checkout, nessun pagamento, nessun account cliente.

Questo README è per chi deve lavorare sul codice. Il proprietario ha la sua guida in [`docs/MANUALE-ALESSANDRO.md`](docs/MANUALE-ALESSANDRO.md) e non ha bisogno di leggere questo file.

## Architettura in due righe

I contenuti stanno in Sanity. Al momento del build Astro li legge e produce file HTML statici, che Cloudflare Pages serve. **Nel browser dei visitatori non arriva nessun SDK, nessuna chiave e nessuna chiamata a database.**

| Pezzo | Cosa | Perché |
|---|---|---|
| [Astro](https://astro.build) | Genera il sito | Ogni coltello ha una pagina HTML vera, quindi un'anteprima corretta quando il link viene mandato su WhatsApp |
| [Sanity](https://sanity.io) | Contenuti | Il proprietario pubblica dal telefono; nessun pannello su misura da mantenere |
| Cloudflare Pages | Hosting | Deploy dal repository, HTTPS incluso, gratuito |
| Sanity Image CDN | Fotografie | Ridimensiona e converte in WebP da sola |

Due decisioni che sembrano dettagli e non lo sono:

- **Se Sanity non risponde durante il build, il build fallisce.** Il sito non mostra mai contenuti di ripiego. La versione già pubblicata resta online.
- **Gli script inline entrano nella CSP come hash sha256**, generati dopo il build leggendo le pagine reali. Non c'è `unsafe-inline`.

## Requisiti

- Node **22.12 o superiore**
- npm 10+

## Installazione

```bash
npm install
cd studio && npm install && cd ..
```

## Variabili d'ambiente

Copia gli esempi e compila:

```bash
cp .env.example .env
cp studio/.env.example studio/.env
```

| Variabile | Dove | Segreta | Serve a |
|---|---|---|---|
| `SANITY_PROJECT_ID` | `.env` | No | Leggere i contenuti al build |
| `SANITY_DATASET` | `.env` | No | Quasi sempre `production` |
| `SITO_URL` | `.env` | No | Canonical, sitemap, anteprime social |
| `SANITY_STUDIO_PROJECT_ID` | `studio/.env` | No | Il prefisso `SANITY_STUDIO_` è obbligatorio |
| `SANITY_STUDIO_DATASET` | `studio/.env` | No | — |
| `CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare | No | Facoltativa: senza, nessuno script di statistiche |
| `SANITY_AUTH_TOKEN` | Secret GitHub | **Sì** | Solo per il backup. Di sola lettura |

Nessun token di scrittura serve a questo progetto. Se ti ritrovi a doverne usare uno, fermati e chiediti perché.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Sviluppo con contenuti da Sanity |
| `npm run anteprima` | Sviluppo **senza Sanity**, con i contenuti del vecchio sito e una fascia rossa su ogni pagina |
| `npm run build` | Build + generazione degli header + controllo dei segnaposto |
| `npm run preview` | Serve `dist/`, **senza** gli header |
| `npm run prova-produzione` | Serve `dist/` **applicando** `dist/_headers`. Serve a verificare la CSP prima del deploy |
| `npm run check` | `astro check` |
| `npm run prepara-migrazione` | Rigenera l'import dei contenuti legacy |
| `cd studio && npm run dev` | Pannello in locale |
| `cd studio && npm run deploy` | Pubblica il pannello su `…sanity.studio` |

`npm run anteprima` richiede la cartella `legacy/`, che **non è nel repository**: esiste solo sul computer di chi ha fatto la migrazione. Su un clone pulito quel comando non funziona, ed è normale.

## Struttura

```
src/
  components/    componenti .astro
  layouts/       Base.astro — head, SEO, Open Graph, navbar, footer
  lib/           accesso ai dati e utilità
    sanity.ts      client, solo al build. perspective: 'published'
    contenuti.ts   caricamento contenuti e blocco dei contenuti finti
    immagini.ts    srcset, dimensioni, immagine social
    contatti.ts    link WhatsApp/email e testi precompilati
    tipi.ts        forme dei dati
  pages/         una pagina per file; /coltelli/[slug].astro genera le schede
  styles/
    global.css     portato dal vecchio sito, ripulito
    font.css       generato, non modificare a mano
studio/          Sanity Studio (progetto npm separato)
  schemaTypes/     coltello.ts, impostazioniSito.ts
  struttura.ts     menu del pannello, ridotto a due voci
scripts/         utilità di build e manutenzione
docs/            documentazione
```

`legacy/` e `_archivio/` esistono solo in locale, sono escluse dal repository e possono essere cancellate a migrazione conclusa.

## Modello dei contenuti

**`coltello`** — nome, slug, foto principale, galleria, due descrizioni, materiali (lama/manico/altri), dimensioni, anno, pezzo unico, disponibilità, ordine, categoria.

**`impostazioniSito`** — documento unico: nome dell'artigiano, presentazione, biografia, località, contatti, invito al contatto, passaggi della lavorazione.

Regola da non violare: **disponibilità e pubblicazione sono cose diverse.** La disponibilità è un campo (`disponibile` / `nonDisponibile` / `suRichiesta`). Nascondere un coltello si fa con *Annulla pubblicazione* in Sanity, non mettendolo come non disponibile. Il client legge con `perspective: 'published'`, quindi le bozze non escono mai.

## Convenzioni

- **Italiano** per nomi di campi, variabili, commenti e messaggi. Il progetto verrà ereditato da persone italiane e il CMS è in italiano: mescolare le lingue crea attrito inutile.
- **Niente framework client.** Il JavaScript pubblico è quello inline del menu e della lightbox, circa 1,9 KB in tutto. Se una funzionalità richiede React, quasi certamente non serve.
- **Niente dipendenze senza motivo.** Prima di aggiungerne una: si può fare con Astro, il browser o venti righe?
- **Nessun contenuto di ripiego.** Se i dati mancano, il build fallisce o l'elemento non viene disegnato. Mai inventare.
- **Se un recapito manca, il pulsante non esiste.** Meglio nessun pulsante che uno rotto.

## Sicurezza

- Nessun segreto nel repository né nella cronologia
- CSP costruita dalle pagine reali, senza `unsafe-inline` né `unsafe-eval`
- HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `X-XSS-Protection` rimosso
- Font ospitati sul dominio: nessuna richiesta a Google
- Zero cookie, zero `localStorage`, zero `sessionStorage`

Dopo ogni modifica al JavaScript inline, `npm run build` rigenera gli hash della CSP da solo. Non serve toccare `_headers` a mano — anzi, non va toccato: viene sovrascritto.

## Documentazione

| File | Per chi |
|---|---|
| [`docs/MANUALE-ALESSANDRO.md`](docs/MANUALE-ALESSANDRO.md) | Il proprietario |
| [`docs/HANDOVER.md`](docs/HANDOVER.md) | Chi consegna il progetto |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Cloudflare, webhook, dominio |
| [`docs/BACKUP.md`](docs/BACKUP.md) | Backup e ripristino |
| [`docs/TEST-PRODUZIONE.md`](docs/TEST-PRODUZIONE.md) | Verifiche dopo la pubblicazione |
| [`docs/RISORSE-ESTERNE.md`](docs/RISORSE-ESTERNE.md) | Cosa contatta il sito |
| [`docs/COSTI.md`](docs/COSTI.md) | Costi e limiti dei piani gratuiti |
