# Backup dei contenuti

Un backup che vive nello stesso servizio del dato originale non è un backup. Per questo le copie escono da Sanity e finiscono su GitHub.

## Cosa viene salvato, dove, ogni quanto

| Copia | Cosa contiene | Dove | Ogni quanto | Per quanto resta |
|---|---|---|---|---|
| Archivio completo | Testi **e fotografie vere** | Artefatti del workflow "Backup dei contenuti" | Ogni lunedì, più a richiesta | **90 giorni** (limite del piano gratuito GitHub) |
| Solo testi | Coltelli e informazioni del sito, senza foto | Branch `backup`, file `contenuti/contenuti.ndjson` | Ogni lunedì, solo se qualcosa è cambiato | Per sempre, con lo storico |

L'export di Sanity scarica i file veri delle fotografie, non i soli riferimenti: è stato verificato sulla documentazione del comando. Il passo è configurato **senza** `--no-strict-asset-verification`, quindi se una fotografia non si scarica il backup fallisce invece di produrre un archivio incompleto che sembra a posto.

## Cosa NON è coperto

- **Le fotografie più vecchie di 90 giorni.** Passata quella finestra restano solo su Sanity e sul telefono di chi le ha scattate. Per conservarle davvero va scaricato l'archivio completo ogni tanto e messo da parte: è scritto nel manuale del proprietario.
- **Gli account.** Nessun backup sostituisce l'accesso: se si perde l'account Sanity, i contenuti ci sono ma il pannello no.
- **Il sito.** Non serve: il sito è nel repository e si ricostruisce da zero con un comando.

## Come si scarica

1. Vai su GitHub, scheda **Actions**.
2. Apri **Backup dei contenuti** e scegli l'ultima esecuzione riuscita.
3. In fondo alla pagina, sezione **Artifacts**, scarica `contenuti-completi-…`.

Per i soli testi basta aprire il branch `backup` e prendere `contenuti/contenuti.ndjson`.

## Come ripristinare Sanity da un backup

Procedura completa, da seguire in ordine.

### 1. Trova il backup giusto

Decidi prima di cosa hai bisogno:

- **hai perso anche le fotografie** → serve l'archivio completo, quindi un backup degli ultimi 90 giorni;
- **hai perso solo testi** (qualcuno ha sovrascritto una descrizione) → basta il branch `backup`, che arriva indietro nel tempo quanto serve.

### 2. Scaricalo

Archivio completo: GitHub → **Actions** → **Backup dei contenuti** → l'esecuzione riuscita più recente → sezione **Artifacts** in fondo → `contenuti-completi-…`. Arriva come `.zip` che contiene il `.tar.gz`.

Solo testi: GitHub → menu dei branch → `backup` → `contenuti/contenuti.ndjson` → **Raw** → salva.

### 3. Prepara i file

```bash
unzip contenuti-completi-*.zip
tar -xzf contenuti-completi.tar.gz
```

Dentro trovi `data.ndjson` (i documenti) e una cartella `images/` con i file veri delle fotografie.

### 4. Importa

```bash
cd studio
npx sanity login
npx sanity dataset import ../data.ndjson production --replace
```

`--replace` sovrascrive i documenti che hanno lo stesso identificativo. Senza, l'import si ferma appena ne trova uno già presente.

### 5. Cosa succede alle fotografie

Questo è il punto che si sbaglia più spesso.

- **Importando dall'archivio completo**, la CLI carica anche i file delle immagini e ricollega i riferimenti: le fotografie tornano davvero.
- **Importando dal solo `contenuti.ndjson` del branch `backup`**, le immagini **non** vengono ricreate. Quel file contiene i testi e i riferimenti alle immagini: se le immagini esistono ancora su Sanity i riferimenti si riagganciano, se sono state cancellate i coltelli restano senza foto.

Detto altrimenti: il branch `backup` serve a recuperare un testo, non a ricostruire il catalogo da zero.

### 6. Verifica che sia andata

1. Apri il pannello: i coltelli ci sono, con le loro fotografie.
2. Controlla un coltello a caso: nome, descrizione, materiali, disponibilità.
3. Guarda quanti documenti sono stati importati — la CLI lo stampa a fine import — e confrontalo con quanti te ne aspettavi.
4. Lancia un build: `npm run build`. Se passa il controllo dei segnaposto, i contenuti sono completi.
5. Apri il sito ricostruito e controlla una pagina coltello.

### 7. Se il ripristino peggiora la situazione

L'import non tocca il sito pubblicato. Finché non parte un nuovo build, online resta la versione precedente: c'è tempo per rimediare senza fretta.

## Come si fa un backup a mano

Serve solo la CLI di Sanity e l'accesso al progetto:

```bash
cd studio
npx sanity login
npx sanity dataset export production backup-$(date +%Y-%m-%d).tar.gz
```

## Cosa serve perché il workflow funzioni

In **Settings → Secrets and variables → Actions** del repository:

| Nome | Tipo | Valore |
|---|---|---|
| `SANITY_AUTH_TOKEN` | Secret | Token Sanity di **sola lettura** (Viewer) |
| `SANITY_PROJECT_ID` | Variable | Identificativo del progetto |
| `SANITY_DATASET` | Variable | `production` |

Il token va creato su sanity.io/manage con permessi di sola lettura: al backup non serve poter scrivere, e un token che non può scrivere non può fare danni se finisce nel posto sbagliato.

`PENDING — richiede projectId/dataset/account`: finché il progetto Sanity non esiste, il workflow fallisce al primo passo con un messaggio che dice cosa manca. È voluto: meglio un fallimento visibile che un backup che sembra funzionare e non salva niente.
