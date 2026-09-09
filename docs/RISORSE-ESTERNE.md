# Cosa contatta il sito

Inventario ricavato dalle pagine generate, non da supposizioni. Rigeneralo dopo ogni modifica importante con `npm run build`: lo script degli header fallisce se compare un dominio non previsto.

## Automatico — contattato aprendo una pagina

| Dominio | Perché | Dato che arriva a terzi |
|---|---|---|
| Il dominio del sito | HTML, CSS, font, logo | Nessuno: è il sito stesso |
| `cdn.sanity.io` | Fotografie dei coltelli | Indirizzo IP e user agent del visitatore |

E basta. Due domini, di cui uno è il sito.

Se le statistiche vengono accese si aggiunge `static.cloudflareinsights.com` (script) e `cloudflareinsights.com` (invio dei dati). Oggi sono spente.

### Statistiche: verifica conclusa

Cloudflare dichiara nella propria documentazione che Web Analytics **non usa alcuno stato lato client** — né cookie né localStorage — e **non costruisce impronte digitali** dei visitatori a partire da indirizzo IP, user agent o altri dati. Le visite non vengono contate su identificativi univoci ma sugli eventi di navigazione; le metriche sulle prestazioni arrivano dalla Performance API del browser.

Conclusione tecnica: **si può attivare senza introdurre il banner del consenso.** Resta spento solo perché serve l'account Cloudflare di Alessandro per generare il token.

Quando verrà acceso, due cose vanno fatte insieme:

1. aggiungere `CLOUDFLARE_ANALYTICS_TOKEN` fra le variabili di Cloudflare Pages;
2. aggiungere alla pagina privacy una riga che dica che il sito misura le visite in forma aggregata, senza cookie e senza identificare le persone.

La valutazione legale finale resta di un professionista: qui c'è solo il comportamento tecnico verificato.

## Su click — solo se il visitatore decide di uscire

| Dominio | Da dove | Cosa succede |
|---|---|---|
| `wa.me` | Pulsanti WhatsApp | Si apre WhatsApp con un messaggio già scritto |
| `instagram.com` | Link nel footer e nei contatti | Si apre il profilo |
| `mailto:` | Pulsanti email | Apre il programma di posta. **Non è una richiesta web**: non contatta nessun server |

Sono normali collegamenti. Non caricano niente finché non li apre il visitatore, e la differenza è sostanziale: un riquadro Instagram incorporato contatterebbe Meta a ogni visita, un link no. Per questo nel sito non ci sono riquadri social incorporati.

## Cosa NON viene contattato

- `fonts.googleapis.com` e `fonts.gstatic.com` — i caratteri sono ospitati sul dominio del sito
- Google Analytics o qualsiasi altro sistema di misurazione
- Reti pubblicitarie, pixel di tracciamento, servizi di A/B testing
- Supabase — fuori dall'architettura
- Qualsiasi servizio che riceva moduli di contatto: non ce ne sono

## Memoria del browser

Verificato sul sorgente e sull'HTML generato: **zero** occorrenze di `document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`, `fetch`, `XMLHttpRequest` e `navigator.sendBeacon`.

Il sito non scrive niente nel browser di chi lo visita e non conserva identificativi. È la ragione per cui non c'è la finestra del consenso: non c'è nulla da consentire.

Il vecchio sito invece usava `localStorage` per tenere una copia dei contenuti e `sessionStorage` per la sessione di amministrazione. Nessuno dei due esiste più.

## Come rifare questa verifica

```bash
npm run build
grep -rhoE '(src|href)="https?://[^"]+"' dist --include='*.html' | sort -u
grep -rE "document.cookie|localStorage|sessionStorage|indexedDB" dist --include='*.html'
```

Il secondo comando non deve restituire niente.
