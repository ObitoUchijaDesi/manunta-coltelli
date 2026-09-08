# Alessandro Manunta Coltelli

Sito vetrina per i coltelli artigianali di Alessandro Manunta. **Non è un e-commerce**: non ci sono carrello, checkout o pagamenti.

## Architettura

| Pezzo | Servizio | Perché |
|---|---|---|
| Sito | [Astro](https://astro.build) | Genera HTML statico: ogni coltello ha una pagina vera, con la sua anteprima quando il link viene mandato su WhatsApp |
| Contenuti | [Sanity](https://sanity.io) | Il proprietario aggiunge i coltelli dal telefono; niente pannello su misura da mantenere |
| Hosting | Cloudflare Pages | Deploy automatico dal repository, HTTPS incluso, gratuito |
| Foto | Sanity Image CDN | Ridimensiona e converte in WebP da sola |

Il sito pubblico **non contiene database né SDK**: al momento del build i contenuti vengono letti da Sanity e trasformati in file statici. Se Sanity non risponde, il sito già pubblicato resta online invariato.

## Sviluppo

```bash
npm install
npm run dev
```

Copia `.env.example` in `.env` e inserisci i valori del progetto Sanity. Il file `.env` non va mai versionato.

## Struttura del repository

```
src/            sorgenti del sito Astro
studio/         pannello di gestione dei contenuti (Sanity Studio)
public/         file serviti così come sono (favicon, robots)
docs/           documentazione di progetto e manuale per il proprietario
```

Le cartelle `legacy/` e `_archivio/` esistono solo sul computer di chi sviluppa, sono escluse dal repository e contengono il vecchio sito React e il materiale di lavorazione. Possono essere eliminate a migrazione conclusa.

## Pubblicazione

Ogni push sul branch `main` avvia il build e la pubblicazione su Cloudflare Pages. Quando il proprietario pubblica un contenuto da Sanity, un webhook avvia lo stesso processo.

## Documentazione

- `docs/MANUALE-PROPRIETARIO.md` — come gestire il sito dal telefono
- `docs/HANDOVER.md` — account, proprietà e procedura di passaggio
- `docs/MANUTENZIONE.md` — cosa controllare e ogni quanto
