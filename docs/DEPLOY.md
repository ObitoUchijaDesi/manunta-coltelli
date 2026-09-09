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
| Branch di anteprima | **Nessuno** (vedi sotto) |

> **Importante: disattiva i deploy dei branch diversi da `main`.**
> In Settings → Builds & deployments → *Preview deployments*, scegli "None".
> Senza questa impostazione, il backup settimanale che scrive sul branch
> `backup` farebbe partire un build inutile ogni lunedì — e quel branch non
> contiene il sito, quindi il build fallirebbe ogni volta.

## Variabili d'ambiente

Tre categorie, con regole diverse.

### PUBLIC — finiscono nelle pagine, non sono segreti

| Nome | Scopo | Dove | Produzione | Preview |
|---|---|---|---|---|
| `SANITY_PROJECT_ID` | Dice al build da quale progetto leggere | Cloudflare Pages → Environment variables | Sì | Sì |
| `SANITY_DATASET` | Quasi sempre `production` | Cloudflare Pages → Environment variables | Sì | Sì |
| `SITO_URL` | Indirizzo definitivo senza barra finale. Costruisce canonical, sitemap e anteprime social: se è sbagliato, i link condivisi puntano nel posto sbagliato | Cloudflare Pages → Environment variables | Sì | Sì |

### BUILD ONLY — servono a costruire il sito, non compaiono nelle pagine

Nessuna, al momento. Il build legge Sanity tramite il solo `SANITY_PROJECT_ID`: il dataset è pubblico sul piano gratuito, quindi non serve nessun token in lettura.

### SECRET — mai nel repository, mai nel browser

| Nome | Scopo | Dove | Chi lo vede |
|---|---|---|---|
| `SANITY_AUTH_TOKEN` | Token di **sola lettura** per il backup settimanale | GitHub → Settings → Secrets and variables → Actions → *Secrets* | Solo il workflow |
| Deploy hook URL | Indirizzo che fa partire un build. Chi lo conosce può far ripartire i deploy a volontà | Incollato dentro Sanity, nella configurazione del webhook | Chi amministra Sanity |

`CLOUDFLARE_ANALYTICS_TOKEN` è facoltativa: senza, non viene generato nessuno script di statistiche. Non è un segreto (finirebbe nella pagina), ma va aggiunta solo dopo la verifica descritta in `docs/RISORSE-ESTERNE.md`.

> **Un token Sanity con permesso di scrittura non va messo da nessuna parte in questo progetto.** Il sito non ne ha bisogno: legge contenuti già pubblici e scrive solo file statici.

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

### Il deploy hook è un segreto

| Domanda | Risposta |
|---|---|
| Chi lo crea | Alessandro, dal suo account Cloudflare |
| Dove si copia | Nella configurazione del webhook su sanity.io/manage |
| Dove si conserva | Solo lì. E, se serve, nel gestore di password di Alessandro |
| Chi può vederlo | Chi amministra Cloudflare e chi amministra Sanity |
| Come si rigenera | Si elimina il vecchio hook su Cloudflare, se ne crea uno nuovo e si aggiorna il webhook su Sanity. Il vecchio smette di funzionare all'istante |
| Come si verifica | Si modifica un testo in Sanity, si pubblica, e su Cloudflare deve comparire un nuovo deploy entro un minuto |

Non deve finire nel repository, nel sito, in un documento condiviso o in un campo visibile del CMS.

## Se il build fallisce

Proprietà garantita dal modo in cui Cloudflare Pages funziona, non da un accorgimento nostro: **un deploy diventa attivo solo se il build è andato a buon fine.** Se fallisce:

- la versione precedente resta servita, invariata;
- la produzione non viene toccata;
- il backup non è coinvolto in alcun modo — è un workflow separato che non fa deploy;
- nell'elenco dei deploy su Cloudflare compare il tentativo fallito con il log completo.

Questo vale sia che a fallire sia Astro, sia che a fallire sia il controllo dei segnaposto o quello degli header.

## Verifica dopo il primo deploy

- [ ] La home si apre sul dominio giusto, in HTTPS
- [ ] Una pagina coltello mandata su WhatsApp mostra la foto di quel coltello
- [ ] `/sitemap-index.xml` risponde ed elenca tutti i coltelli pubblicati
- [ ] Gli header di sicurezza arrivano davvero (securityheaders.com)
- [ ] Nella scheda Rete del browser non compare nessun dominio esterno a parte `cdn.sanity.io`
- [ ] Pubblicando un coltello dal telefono, entro un paio di minuti compare online
- [ ] Un coltello messo in bozza sparisce dal sito al build successivo

---

## Il dominio

`ACTION REQUIRED — ALESSANDRO`

### Prima di comprare

Il nome ipotizzato durante il lavoro è `alessandromanuntacoltelli.it`, ma **non è una scelta definitiva**. È lungo da dettare al telefono. Alternative più corte da valutare insieme ad Alessandro: `manuntacoltelli.it`, `coltellimanunta.it`.

Prima dell'acquisto va verificata la disponibilità sul registrar scelto.

### Chi lo compra

**Alessandro, con la sua email e la sua carta.** Non lo sviluppatore, nemmeno "per comodità, poi lo trasferiamo": il trasferimento di un dominio è la cosa più fastidiosa da sistemare dopo, e se un domani non ci si parla più, il sito muore al primo rinnovo non pagato.

Al momento della registrazione:

- rinnovo automatico **attivo**;
- 2FA sull'account del registrar;
- email di recupero che Alessandro controlla davvero;
- privacy WHOIS attiva se inclusa.

### Host canonico

Si sceglie **uno solo** dei due, e l'altro reindirizza in modo permanente.

Raccomandazione: **senza `www`** — `https://alessandromanuntacoltelli.it`. È più corto da dettare, più corto da scrivere su un biglietto da visita, e non c'è nessun motivo tecnico per preferire l'altro su un sito statico.

Qualunque sia la scelta, `SITO_URL` su Cloudflare deve corrispondere esattamente, senza barra finale.

### DNS

Il modo più semplice è portare il dominio sui nameserver di Cloudflare: da lì i record per Pages si configurano da soli.

1. Cloudflare → **Add a site** → inserisci il dominio.
2. Cloudflare mostra due nameserver.
3. Sul pannello del registrar, sostituisci i nameserver con quelli di Cloudflare.
4. Attendi la propagazione (di solito minuti, a volte qualche ora).
5. Cloudflare Pages → progetto → **Custom domains** → aggiungi sia il dominio nudo che `www`.
6. Imposta il redirect permanente da `www` verso il dominio nudo (o viceversa, secondo la scelta fatta).

### HTTPS

Cloudflare emette il certificato da solo. Da verificare dopo l'attivazione:

- **SSL/TLS → Overview**: modalità *Full (strict)*;
- **SSL/TLS → Edge Certificates**: *Always Use HTTPS* attivo;
- il certificato copre sia il dominio nudo che `www`;
- aprendo `http://` si viene rimandati a `https://`.

L'header HSTS lo mandiamo già noi da `_headers`. Non attivare il preload HSTS: è una decisione separata e difficile da annullare.
