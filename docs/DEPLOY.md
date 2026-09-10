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
| Branch di anteprima | tutti **tranne** `backup` (vedi sotto) |

## I branch

| Branch | A cosa serve | Dove finisce |
|---|---|---|
| `main` | Il sito vero | Il dominio pubblico |
| `develop` | Lavori in corso | Indirizzo di anteprima Cloudflare |
| `UAT` | Verifica prima di andare in produzione | Indirizzo di anteprima Cloudflare |
| `backup` | Solo copie dei contenuti, **non** contiene il sito | Nessun deploy |

Il giro: si lavora su `develop`, quando regge si porta su `UAT` per un controllo, poi su `main` che pubblica.

> **Cosa i branch NON separano: i contenuti.**
> Esiste un solo dataset Sanity, quindi `develop`, `UAT` e `main` mostrano
> tutti gli stessi coltelli. I branch servono a provare modifiche al
> **codice** senza toccare il sito pubblico; per provare i contenuti c'è la
> pubblicazione in Sanity, che è già reversibile da sola.

> **Importante: escludi `backup` dalle anteprime.**
> In Settings → Builds & deployments → *Preview deployments* → *Configure
> preview deployments* → scegli **Custom branches** e metti `backup` fra i
> branch **esclusi**. Senza questo, il backup settimanale farebbe partire ogni
> lunedì un build destinato a fallire: su quel branch non c'è il sito, solo i
> contenuti esportati.

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

Il dominio è registrato su **Aruba**, ma le risposte DNS le dà **Cloudflare**: stando sui nameserver di Cloudflare, i record per il Worker si creano da soli e non c'è un secondo pannello da tenere allineato.

1. Cloudflare → **Add a site** → il dominio, piano **Free**.
2. Cloudflare assegna due nameserver. Per questo dominio: `ray.ns.cloudflare.com` e `wren.ns.cloudflare.com`.
3. Aruba: `admin.aruba.it` → riquadro **Dominio** → **Gestione DNS e Name Server** → **SOSTITUISCI RECORD** → *Name Server personalizzati* → inserire i due di Cloudflare e **cancellare i quattro Aruba** (`dns.technorail.com`, `dns2.technorail.com`, `dns3.arubadns.net`, `dns4.arubadns.cz`).

   Il pannello accetta fino a 6 record e non protesta se li si lascia tutti insieme, ma **nameserver misti sono peggio di nameserver sbagliati**: il dominio risponde a intermittenza a seconda di chi viene interrogato, e Cloudflare non attiva mai la zona perché continua a vedere Aruba. Devono restare solo due.
4. Attendere che la modifica arrivi al **registro `.it`**. Aruba la registra subito nel proprio pannello ma la comunica al registro in un secondo momento: di norma qualche ora, dichiarate fino a 24. Da qui non si accelera.

   Si verifica interrogando l'autorevole, senza fidarsi delle cache dei resolver pubblici:

   ```bash
   nslookup -type=ns alessandromanuntacoltelli.it a.dns.it
   ```

   Finché risponde `technorail` / `arubadns`, non è ancora passato, e il pulsante *Check nameservers now* di Cloudflare dirà *pending* qualunque cosa si faccia.
5. Quando la zona è **Active**: il Worker `manunta-coltelli` → **Settings** → **Domains & Routes** → aggiungere il dominio nudo e `www`. I record necessari li crea Cloudflare.
6. Redirect permanente da `www` verso il dominio nudo, secondo la scelta di host canonico fatta sopra.
7. Aggiornare `SITO_URL` su Cloudflare e rilanciare il build: canonical, sitemap e anteprime social si ricalcolano da quella variabile.

**Non attivare il DNSSEC dal pannello Aruba.** Aruba pubblicherebbe al registro l'impronta delle *proprie* chiavi, dichiarando che solo le risposte firmate da lei sono valide — ma le risposte le dà Cloudflare, con chiavi diverse. Ogni resolver che verifica le firme scarterebbe il dominio come contraffatto: non "lento", **irraggiungibile**, e per un giorno intero, perché quelle impronte restano in cache a lungo. Si può attivare, ma da Cloudflare, che gestisce chiavi e registro insieme.

**Il pannello DNS di Aruba, da qui in avanti, non conta più.** I record che contiene (compreso l'`A` verso `62.149.128.40`, la pagina di parcheggio) sono inerti: modificarli o cancellarli non ha effetto sul sito. Su Aruba resta solo il rinnovo.

### Posta: il dominio non manda e non riceve email

Alessandro usa la sua casella personale, non un indirizzo sul dominio. Non serve quindi alcun servizio di posta — ma **un dominio senza record di posta è un dominio da cui chiunque può mandare email spacciandosi per il proprietario.** Non serve entrare in nessun account: basta un server di posta e il nome del dominio scritto nel campo mittente. Preventivi, fatture, richieste di pagamento a nome di Alessandro.

Si chiude con quattro record, da scrivere una volta sola nel DNS di Cloudflare:

| Type | Name | Content | Priorità |
|---|---|---|---|
| `MX` | `@` | `.` | `0` |
| `TXT` | `@` | `v=spf1 -all` | — |
| `TXT` | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` | — |
| `TXT` | `*._domainkey` | `v=DKIM1; p=` | — |

In ordine: l'`MX` nullo dichiara che il dominio non riceve posta (RFC 7505); l'`SPF` con `-all` dichiara che nessun server è autorizzato a spedire per questo dominio; il `DMARC` con `p=reject` chiede ai destinatari di rifiutare — non di mettere in spam — tutto ciò che non torna, `sp=reject` estende la regola ai sottodomini; il `DKIM` con chiave vuota nega ogni firma su qualunque selettore.

Manutenzione zero, nessun costo, nessuna scadenza.

`ATTENZIONE`: **se un domani servisse una casella `@` sul dominio**, questi quattro record vanno cambiati *prima* di configurarla, altrimenti le email non arrivano e nulla lo spiega. Vanno sostituiti con gli `MX` del fornitore di posta, un `SPF` che lo autorizzi, e il `DMARC` va abbassato a `p=none` durante le prove. Non è un vicolo cieco: sono quattro righe. Ma è il tipo di cosa che si dimentica, e per questo sta scritta qui.

### HTTPS

Cloudflare emette il certificato da solo. Da verificare dopo l'attivazione:

- **SSL/TLS → Overview**: modalità *Full (strict)*;
- **SSL/TLS → Edge Certificates**: *Always Use HTTPS* attivo;
- il certificato copre sia il dominio nudo che `www`;
- aprendo `http://` si viene rimandati a `https://`.

L'header HSTS lo mandiamo già noi da `_headers`. Non attivare il preload HSTS: è una decisione separata e difficile da annullare.
