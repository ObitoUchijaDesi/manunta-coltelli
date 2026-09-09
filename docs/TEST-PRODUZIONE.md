# Verifiche dopo la pubblicazione

Da eseguire **dopo** che dominio, Cloudflare e Sanity sono reali e collegati. Prima non ha senso: metà di queste verifiche non è simulabile in locale.

Segna ogni riga solo quando l'hai vista funzionare davvero.

## DNS e HTTPS

- [ ] `https://<dominio>` risponde
- [ ] `https://www.<dominio>` reindirizza permanentemente all'host canonico (o viceversa, secondo la scelta)
- [ ] `http://<dominio>` reindirizza a `https://`
- [ ] Il certificato è valido e copre entrambi gli host
- [ ] Nessun avviso di contenuto misto nella console del browser

```bash
curl -sI https://<dominio> | head -1
curl -sI http://<dominio> | grep -i location
curl -sI https://www.<dominio> | grep -i location
```

## Pagine

- [ ] `/` — home
- [ ] `/coltelli/` — catalogo, con tutti i coltelli pubblicati
- [ ] `/coltelli/<slug>/` — una pagina per ogni coltello
- [ ] `/contatti/`
- [ ] `/privacy/`
- [ ] Un indirizzo inventato mostra la pagina 404
- [ ] Tutti i link della navbar, del footer e delle briciole funzionano

## Anteprima social

Il motivo per cui il sito è stato rifatto. Va verificato sul serio.

- [ ] Manda il link di un coltello a te stesso su **WhatsApp**: deve comparire **la foto di quel coltello**, il suo nome e la sua descrizione. Non il logo
- [ ] Ripeti con un secondo coltello: la foto deve essere diversa
- [ ] Prova anche su Telegram o Facebook, se li usi

Se WhatsApp mostra ancora un'anteprima vecchia, è la sua cache: prova con un coltello mai condiviso prima.

Controllo dal terminale, senza cache di mezzo:

```bash
curl -s https://<dominio>/coltelli/<slug>/ | grep -E 'og:(title|image|description)'
```

## Google

- [ ] `/robots.txt` risponde e indica la sitemap
- [ ] `/sitemap-index.xml` risponde
- [ ] La sitemap contiene tutti i coltelli pubblicati e nessuna bozza
- [ ] Ogni pagina ha il canonical giusto, sul dominio definitivo
- [ ] Registra il sito su Google Search Console e invia la sitemap

## Header di sicurezza

**Non basta guardare il file `_headers`**: vanno letti quelli che arrivano davvero al browser.

```bash
curl -sI https://<dominio>/ | grep -iE 'content-security|strict-transport|x-content-type|referrer|permissions|x-frame'
```

- [ ] `Content-Security-Policy` presente e uguale a quella generata
- [ ] `Strict-Transport-Security` presente
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` presente
- [ ] `X-XSS-Protection` **assente**
- [ ] Verifica esterna su securityheaders.com

## Console del browser

- [ ] Zero violazioni CSP su home, catalogo, pagina coltello, contatti, privacy
- [ ] Zero errori JavaScript
- [ ] Nella scheda Rete: solo il dominio del sito e `cdn.sanity.io`
- [ ] Nella scheda Applicazione: nessun cookie, nessun dato in Local Storage o Session Storage

## Prestazioni

- [ ] Lighthouse su mobile: prestazioni, accessibilità, best practice, SEO
- [ ] Le fotografie arrivano ridimensionate, non a piena risoluzione (controlla i pesi nella scheda Rete)
- [ ] La pagina non "salta" mentre carica

## Telefono vero

Non l'emulatore del browser: un telefono in mano.

- [ ] Home, catalogo e pagina coltello si leggono bene
- [ ] La lightbox si apre, scorre col dito e si chiude
- [ ] Il menu si apre e si chiude
- [ ] Il pulsante WhatsApp apre WhatsApp con il messaggio già scritto
- [ ] Il pulsante email apre il programma di posta con oggetto e testo
- [ ] Nessun testo tagliato, nessuna barra di scorrimento orizzontale

## Browser

- [ ] Chrome
- [ ] Firefox
- [ ] **Safari** — su Mac e su iPhone, con attenzione alla lightbox

`PENDING — manual test Safari reale`: non eseguibile nell'ambiente di sviluppo attuale.

## Tastiera

Con un computer, senza toccare il mouse:

- [ ] `Tab` attraversa i link in un ordine sensato e il focus si vede sempre
- [ ] Il primo `Tab` sulla pagina rivela "Salta al contenuto principale"
- [ ] `Invio` sulla foto apre la lightbox
- [ ] Dentro la lightbox `Tab` resta dentro e non finisce sulla pagina sotto
- [ ] `Freccia sinistra` e `Freccia destra` cambiano foto
- [ ] `Esc` chiude la lightbox
- [ ] Dopo la chiusura il focus torna sulla foto da cui eri partito
- [ ] Il menu del telefono si apre da tastiera e annuncia se è aperto

## Backup

- [ ] Fai partire il workflow a mano da GitHub → Actions
- [ ] Termina senza errori
- [ ] L'archivio si scarica e contiene `data.ndjson` e la cartella delle immagini
- [ ] Il branch `backup` esiste e contiene `contenuti/contenuti.ndjson`
- [ ] Il push sul branch `backup` **non** ha fatto partire un deploy su Cloudflare

## Pubblicazione dal CMS

- [ ] Modifica un testo in Sanity e pubblica
- [ ] Su Cloudflare compare un nuovo deploy entro un minuto
- [ ] La modifica è online
- [ ] Metti un coltello in bozza: al deploy successivo sparisce dal sito e dalla sitemap

## Comportamento in caso di guasto

- [ ] Fai fallire un build di proposta (per esempio togliendo temporaneamente `SANITY_PROJECT_ID`): il sito precedente deve restare online
- [ ] Rimetti la variabile e verifica che il deploy successivo vada a buon fine
