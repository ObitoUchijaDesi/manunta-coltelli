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

## Come si ripristina

**Testi e fotografie** (dall'archivio completo):

```bash
tar -xzf contenuti-completi.tar.gz
cd studio
npx sanity dataset import ../<cartella-estratta>/data.ndjson production --replace
```

**Solo i testi** (dal branch `backup`):

```bash
cd studio
npx sanity dataset import ../contenuti.ndjson production --replace
```

`--replace` sovrascrive i documenti con lo stesso identificativo. Senza, l'import si ferma sui duplicati.

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
