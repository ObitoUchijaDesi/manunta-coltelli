# Guasti che non fanno rumore

Elenco dei difetti che questo progetto ha davvero avuto e che **non davano alcun errore**: build verde, nessun avviso, pagina che si apre. Si scoprono solo misurando, e uno di questi è rimasto nascosto per giorni.

Non è una raccolta di teoria: ogni voce è successa qui. Se un domani qualcosa "sembra a posto ma non funziona", è probabile che sia una di queste.

---

## `animation-timeline` dentro la scorciatoia `animation`

**Cosa sembrava** — le schede del catalogo dovevano comparire in dissolvenza scorrendo. Non comparivano. Nessun errore in console, CSS presente nel file servito.

**Cosa succedeva** — il codice era:

```css
animation: comparsa linear both;
animation-timeline: view();
```

Il minificatore le compatta in `animation: linear both comparsa view()`. Ma `animation-timeline` **non è ammesso dentro la scorciatoia `animation`**: il browser considera invalida l'intera dichiarazione e la scarta. Risultato: `animation-name` resta `none` e non si anima niente.

**Come accorgersene** — nella console del browser:

```js
getComputedStyle(document.querySelector('.knife-card')).animationName
```

Se risponde `"none"` mentre nel foglio di stile c'è un'animazione, è questo.

**Regola** — con le animazioni legate allo scorrimento, sempre le proprietà per esteso: `animation-name`, `animation-timing-function`, `animation-fill-mode`, `animation-timeline`. Mai la scorciatoia.

---

## Gli attributi `width` e `height` battono `aspect-ratio`

**Cosa sembrava** — fotografie schiacciate o stirate, ma solo alcune, e solo con le immagini vere di Sanity.

**Cosa succedeva** — `width` e `height` scritti nell'HTML diventano larghezza e altezza in CSS. Con una foto verticale da 1536×2048, l'altezza imposta vinceva sul rapporto dichiarato e l'immagine si deformava.

**Regola** — gli attributi servono (evitano che la pagina salti mentre carica), ma vanno accompagnati da `height: auto` nel CSS, altrimenti `aspect-ratio` è decorativo.

**In più** — se l'`<img>` è prodotto da un altro componente Astro, porta l'ambito di *quel* componente: una regola normale non lo raggiunge e serve `:global()`. Sono due difetti diversi che si presentano insieme e si confondono.

---

## Il dominio del sito scritto a mano in due posti

**Cosa sembrava** — il sito funzionava, i link condivisi su WhatsApp aprivano la pagina giusta. Tutto bene.

**Cosa succedeva** — l'indirizzo del sito era in `astro.config.mjs` **e** in una variabile `SITO_URL` su Cloudflare. Passando dal `www` al dominio nudo se ne è aggiornato uno solo, e per un deploy tutti i canonical, la sitemap e le anteprime social hanno dichiarato il nome sbagliato. Niente di rotto a vista: solo Google e i social che ricevevano un indirizzo diverso da quello vero.

**Regola** — un valore, un posto. `SITO_URL` su Cloudflare **non va impostata**: vedi `docs/DEPLOY.md`.

**Ricaduta, lo stesso giorno** — `SANITY_PROJECT_ID` stava solo fra le variabili di Cloudflare, valide per il branch di produzione. Al primo build di un branch di prova non veniva trovata e il build si fermava con «Sanity non è configurato»: un messaggio che parlava di credenziali mancanti mentre mancava una configurazione, e che ha portato a cercare nel posto sbagliato. Ora sta in `src/lib/sanity.ts`, dove segue il branch. Non è un segreto: si legge nell'indirizzo di ogni fotografia del sito.

Stessa famiglia di problema: `scripts/genera-headers.mjs` teneva il dominio in una lista scritta a mano, e al cambio ha dichiarato il sito stesso "dominio esterno" fermando il build. Ora lo ricava dal canonical delle pagine appena generate.

---

## Un campo obbligatorio che si compila solo con un pulsante

**Cosa sembrava** — Alessandro non riusciva a pubblicare. Il pannello diceva «Indirizzo della pagina: Richiesto».

**Cosa succedeva** — il campo era obbligatorio, ma l'unico modo di riempirlo era premere **Genera**, dentro una sezione richiusa in fondo al modulo. Dal telefono era invisibile.

**Regola** — vale per tutto lo schema di Sanity: se un campo è obbligatorio, deve potersi compilare **guardando lo schermo di un telefono, senza istruzioni**. Se serve sapere dove premere, il campo non va reso obbligatorio: il valore lo calcola il build.

---

## Indirizzi che dipendono dall'ordine

**Cosa sembrava** — due coltelli con lo stesso nome ottenevano `resolza-classica` e `resolza-classica-2`. Corretto.

**Cosa succedeva** — il numero era assegnato nell'ordine in cui i coltelli arrivavano dalla query, cioè per campo *ordine* e nome. Bastava che Alessandro riordinasse la vetrina perché i due indirizzi **si scambiassero**, e un link mandato su WhatsApp settimane prima avrebbe aperto l'altro coltello.

**Regola** — tutto ciò che finisce in un indirizzo pubblico va legato a qualcosa che non cambia. Qui è `_id` del documento. Mai l'ordine di una lista, mai la posizione, mai un contatore.

---

## Gli header di sicurezza spariti al primo deploy

**Cosa sembrava** — primo deploy riuscito, sito online, tutto verde.

**Cosa succedeva** — `wrangler` aveva eseguito da sé `astro add cloudflare`, aggiungendo un adattatore e spostando l'output in `dist/client`. Il file `dist/_headers` non veniva più caricato: **zero CSP, zero HSTS**, e nessun messaggio da nessuna parte.

**Come accorgersene** — mai fidarsi del fatto che il file esista in locale. Si controlla sulla risposta vera:

```bash
curl -sI https://alessandromanuntacoltelli.it/ | grep -i "content-security-policy\|strict-transport"
```

**Regola** — di un header di sicurezza si è sicuri solo leggendolo dalla rete. In locale `npm run prova-produzione` serve i file con gli stessi header, ma non prova che Cloudflare li stia mandando.
