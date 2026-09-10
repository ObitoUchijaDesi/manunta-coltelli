# Passaggio di consegne

Obiettivo di questo documento: **lo sviluppatore deve poter sparire senza che il sito ne risenta.** Non "essere meno coinvolto": sparire. Se Alessandro non riesce a rinnovare il dominio, cambiare una password o pubblicare un coltello senza chiamare qualcuno, il passaggio non è riuscito.

## Regola che vale per tutto

**Ogni account si apre con l'email di Alessandro e la sua carta, fin dal primo giorno.** Non si apre a nome dello sviluppatore per poi trasferirlo: i trasferimenti si dimenticano, si complicano, e qualcuno resta intestatario di qualcosa per anni senza accorgersene.

Dove lo sviluppatore serve, entra come **collaboratore invitato**, con un proprio account. Così Alessandro può rimuoverlo con due tocchi e non si rompe niente.

## Chi possiede cosa

| Servizio | Proprietario | Email | 2FA | Pagamento | Recupero | Rinnovo |
|---|---|---|---|---|---|---|
| Dominio (registrar) | Alessandro | la sua | Obbligatorio | Sua carta | Email + 2FA | Automatico, annuale |
| Cloudflare (Pages + DNS) | Alessandro | la stessa | Obbligatorio | Nessuno (gratuito) | Email + 2FA | Nessuno |
| GitHub (repository) | Alessandro | la stessa | Obbligatorio | Nessuno (gratuito) | Email + codici di recupero | Nessuno |
| Sanity (contenuti) | Alessandro | la stessa | Tramite Google/GitHub | Nessuno (gratuito) | Dal provider di accesso | Nessuno |
| Statistiche | Incluso in Cloudflare | — | — | — | — | — |

Una sola email per tutto, quella personale di Alessandro. Non serve un'email professionale per far funzionare il sito: se un domani ne vorrà una, si aggiunge senza toccare nulla.

`ACTION REQUIRED — ALESSANDRO`: nessuno di questi account esiste ancora.

## Ordine in cui aprirli

1. **GitHub** — serve per primo: ci va il codice.
2. **Sanity** — serve per secondo: senza `projectId` il sito non si costruisce.
3. **Cloudflare** — collega GitHub e pubblica.
4. **Dominio** — per ultimo, quando c'è già qualcosa da collegarci.

## GitHub

**Cosa deve esistere**

- Repository privato o pubblico (indifferente: non contiene segreti), di proprietà di Alessandro
- Branch `main` come branch principale
- Branch `backup`, creato da solo al primo backup
- Secret `SANITY_AUTH_TOKEN` e variabili `SANITY_PROJECT_ID`, `SANITY_DATASET` in Settings → Secrets and variables → Actions
- 2FA attivo, con i codici di recupero salvati

**Aggiungere lo sviluppatore**
Settings → Collaborators → Add people → il suo nome utente GitHub.

**Rimuovere lo sviluppatore**
Stesso posto, cestino accanto al nome. Il sito continua a funzionare: Cloudflare è collegato al repository, non alla persona.

**Scaricare tutto**
Pagina principale del repository → pulsante verde **Code** → *Download ZIP*. Dentro c'è l'intero sito.

**Clonare** (per uno sviluppatore)

```bash
git clone <indirizzo-del-repository>
```

## Sanity

**Cosa deve esistere**

- Progetto di proprietà di Alessandro, con lui come **Administrator**
- Dataset `production`
- Studio pubblicato, raggiungibile da un indirizzo `…sanity.studio`
- Token di **sola lettura** creato per il backup

**Aggiungere lo sviluppatore**
sanity.io/manage → progetto → Members → Invite. Ruolo *Editor* se deve solo sistemare contenuti, *Administrator* solo se deve toccare la configurazione.

**Rimuovere lo sviluppatore**
Stesso posto. Attenzione: Alessandro deve restare Administrator, altrimenti resta fuori dal suo stesso progetto.

**Recupero dell'accesso**
Dipende da come si è registrato. Se ha usato "Continua con Google", si recupera dall'account Google: è il metodo consigliato, perché il 2FA lo gestisce già Google.

## Cloudflare

**Cosa deve esistere**

- Account di Alessandro con 2FA
- Progetto Pages collegato al repository GitHub, branch di produzione `main`
- Deploy dei branch diversi da `main` disattivati
- Dominio aggiunto e HTTPS attivo
- Variabili d'ambiente come da `docs/DEPLOY.md`
- Deploy hook creato e incollato dentro Sanity

**Aggiungere lo sviluppatore**
Manage Account → Members → Invite. Ruolo minimo che gli serva.

**Rimuovere lo sviluppatore**
Stesso posto. Il sito resta online: è servito dalla rete, non dalla sessione di nessuno.

## Dominio

Il punto più importante di tutto il passaggio.

| Cosa | Valore |
|---|---|
| Registrar | Aruba |
| Nome | Quello configurato in `SITO_URL` (vedi `astro.config.mjs`) |
| Registrato il | 10/09/2026 |
| Scadenza | 10/09/2027 |
| Rinnovo automatico | Attivo |
| Carta | Di Alessandro |
| Email e username | Di Alessandro — **non scritti qui**, vedi sotto |
| 2FA | `DA ATTIVARE` — nel pannello Aruba risulta "Non attivo" |
| Nameserver | `ray.ns.cloudflare.com` e `wren.ns.cloudflare.com` |

**Perché email e username non sono in questa tabella.** Questo repository è pubblico. L'username Aruba è metà di una coppia di credenziali, e l'email è l'indirizzo a cui arrivano i recuperi password: scriverli qui vorrebbe dire pubblicarli e farli indicizzare. Si trovano nella mail di attivazione di Aruba, nella casella di Alessandro.

### Nameserver: come si impostano su Aruba

Servono a dire al registro dei domini `.it` che le risposte per questo indirizzo le dà Cloudflare. Senza questo passaggio il dominio esiste ma non porta da nessuna parte.

Percorso documentato da Aruba:

1. `admin.aruba.it` → accesso con le credenziali del dominio
2. Riquadro **Dominio**
3. **Gestione DNS e Name Server**
4. Sostituire i nameserver Aruba con i due di Cloudflare
5. Salvare, poi su Cloudflare → **Check nameservers now**

La propagazione richiede da pochi minuti a qualche ora.

**Se la voce non compare.** Succede: appare solo quando il tipo di servizio è "Dominio" e l'attivazione è conclusa. Non tirare a indovinare nei menù — l'assistenza Aruba è compresa nel prezzo, 24/7, e lo fa lei in pochi minuti. È la strada giusta anche in futuro, perché non dipende da nessuno sviluppatore.

### Se le credenziali Aruba passano da qualcun altro

Può capitare, per fare in fretta. Ma una password non è un accesso che si revoca con un clic come su GitHub o Sanity: resta nei messaggi e negli appunti. Quindi, appena il lavoro è fatto:

- [ ] Alessandro cambia la password (link **Cambio Password** nel pannello)
- [ ] Alessandro attiva la **verifica in 2 passaggi**

Con il secondo punto la vecchia password non basta più per entrare, anche se resta in giro. Sono i due passaggi che si dimenticano sempre: sono qui perché non si dimentichino.

**Alessandro deve poter rinnovare il dominio anche senza riuscire a contattare nessuno.** Concretamente: sa qual è il sito del registrar, sa con quale email entra, ha il 2FA sul telefono che usa tutti i giorni, e la carta salvata è la sua e non è scaduta.

Se il dominio scade, il sito sparisce e l'indirizzo può essere comprato da chiunque. È l'unico guasto davvero irreversibile del progetto: tutto il resto si ricostruisce dal repository e dal backup.

## Verifica finale del passaggio

Il passaggio è concluso quando Alessandro riesce a fare tutte queste cose **da solo**:

- [ ] Entrare in Sanity dal telefono e pubblicare un coltello
- [ ] Vederlo comparire sul sito
- [ ] Entrare su GitHub e trovare il repository
- [ ] Entrare su Cloudflare e vedere l'elenco dei deploy
- [ ] Entrare sul registrar e vedere la data di scadenza del dominio
- [ ] Avere il 2FA attivo su Aruba, con i codici di recupero salvati
- [ ] Aprire il sito dall'indirizzo definitivo, non da quello `.workers.dev`
- [ ] Rimuovere lo sviluppatore da GitHub, Cloudflare e Sanity
- [ ] Dopo averlo rimosso: pubblicare un altro coltello e vederlo online

L'ultimo punto è il vero test. Se funziona, il progetto è suo.

## Cosa resta allo sviluppatore

Niente di obbligatorio. Se Alessandro vuole, può lasciarlo come collaboratore per avere una mano in futuro — ma è una comodità, non una dipendenza.

Sul computer dello sviluppatore restano le cartelle `legacy/` e `_archivio/` con il vecchio sito React e il backup iniziale. Non servono più a nulla una volta che il sito è online, e possono essere cancellate.
