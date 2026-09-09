# Come il sito va online

## Il giro completo

```
Alessandro pubblica un coltello dal telefono
        ↓
Sanity chiama un indirizzo di Cloudflare (webhook)
        ↓
Cloudflare Pages scarica il repository e lancia il build
        ↓
Astro legge i contenuti da Sanity e genera le pagine HTML
        ↓
Il sito nuovo sostituisce quello vecchio
```

Dal momento in cui preme "Pubblica" a quando la pagina è online passa circa un minuto.

Lo stesso giro parte anche a ogni `git push` sul branch `main`.

## Cosa succede quando qualcosa non funziona

Questa parte è progettata, non lasciata al caso.

| Se succede questo | Il sito pubblicato |
|---|---|
| Sanity non risponde durante il build | **Resta online invariato.** Il build fallisce e Cloudflare non sostituisce niente. |
| Manca il documento "Informazioni del sito" | **Resta online invariato.** Il build si ferma con un messaggio chiaro. |
| Un coltello è senza fotografia | Quel coltello viene saltato, gli altri escono normalmente. |
| Ci sono ancora recapiti segnaposto | **Il build fallisce.** Il controllo dei segnaposto lo impedisce. |
| GitHub non risponde | Nessun nuovo deploy parte. Il sito resta quello di prima. |
| Cloudflare ha un problema | Il sito resta servito dalla cache della rete finché possibile. |

Il principio: **un errore non pubblica mai un sito peggiore di quello che c'è già.** Il vecchio sito faceva l'opposto — se il database non rispondeva mostrava contenuti finti come se fossero veri.

## Configurazione di Cloudflare Pages

`PENDING — richiede account proprietario`

Impostazioni del progetto:

| Voce | Valore |
|---|---|
| Comando di build | `npm run build` |
| Cartella di output | `dist` |
| Versione di Node | `22` |
| Branch di produzione | `main` |

Variabili d'ambiente (Settings → Environment variables):

| Nome | Valore | Segreto? |
|---|---|---|
| `SANITY_PROJECT_ID` | identificativo del progetto | No |
| `SANITY_DATASET` | `production` | No |
| `SITO_URL` | indirizzo definitivo, senza barra finale | No |
| `CLOUDFLARE_ANALYTICS_TOKEN` | token delle statistiche | No, ma facoltativa |

Nessuna di queste è un segreto: finiscono in pagine pubbliche o servono a leggere contenuti già pubblici. **Un token Sanity con permesso di scrittura non va messo qui**, e il sito non ne ha bisogno.

## Il webhook da Sanity

`PENDING — richiede projectId/dataset/account`

1. Su Cloudflare Pages: Settings → Builds & deployments → **Deploy hooks** → creane uno per il branch `main`. Cloudflare restituisce un indirizzo.
2. Su sanity.io/manage → progetto → **API → Webhooks** → crea un webhook:
   - Indirizzo: quello copiato da Cloudflare
   - Dataset: `production`
   - Attivazione: Create, Update, Delete
   - Filtro: `_type == "coltello" || _type == "impostazioniSito"`
   - Metodo: `POST`

Il filtro evita che il sito si ricostruisca per modifiche che non lo riguardano.

L'indirizzo del deploy hook **è un segreto**: chi lo conosce può far ripartire i build a volontà. Va tenuto solo dentro Sanity.

## Verifica dopo il primo deploy

- [ ] La home si apre sul dominio giusto, in HTTPS
- [ ] Una pagina coltello mandata su WhatsApp mostra la foto di quel coltello
- [ ] `/sitemap-index.xml` risponde ed elenca tutti i coltelli pubblicati
- [ ] Gli header di sicurezza arrivano davvero (securityheaders.com)
- [ ] Nella scheda Rete del browser non compare nessun dominio esterno a parte `cdn.sanity.io`
- [ ] Pubblicando un coltello dal telefono, entro un paio di minuti compare online
- [ ] Un coltello messo in bozza sparisce dal sito al build successivo
