# Costi

Prezzi verificati sulle pagine ufficiali a settembre 2026. Vanno **ricontrollati al momento dell'attivazione**: i piani cambiano.

## Riepilogo

| Voce | Costo | Categoria |
|---|---|---|
| Dominio `.it` | circa 10–20 € l'anno | **OBBLIGATORIO** |
| Cloudflare Pages | 0 € | GRATUITO |
| Sanity | 0 € | GRATUITO |
| GitHub | 0 € | GRATUITO |
| Statistiche | 0 € | OPZIONALE, incluso in Cloudflare |
| Email professionale | 0 € | OPZIONALE, non usata |
| Backup | 0 € | Incluso in GitHub |

**Costo ricorrente totale: il solo dominio.** La condizione che ci eravamo dati è rispettata.

## Dettaglio

### Dominio `.it` — OBBLIGATORIO

Circa **10–20 € l'anno** secondo il registrar. Alcuni partono da circa 9 € più IVA.

Attenzione alle offerte a 0,99 € o 3,99 €: valgono **solo il primo anno**. Prima di registrare, guarda il prezzo di **rinnovo**, non quello di registrazione.

Nel prezzo dovrebbero essere già inclusi, senza sovrapprezzo: gestione DNS, privacy WHOIS, blocco del trasferimento.

`DA VERIFICARE AL MOMENTO DELL'ATTIVAZIONE` — prezzo esatto del registrar scelto.

### Sanity — GRATUITO

Piano Free, 0 €, senza scadenza:

| Limite | Incluso | Quanto ne useremo |
|---|---|---|
| Utenti | 20 | 1, forse 2 |
| Documenti | 10.000 | qualche decina |
| Dataset | 2 (pubblici) | 1 |
| Richieste CDN | 1 milione al mese | poche migliaia |
| Banda | 100 GB al mese | qualche GB |
| Spazio fotografie | 100 GB | qualche centinaio di MB |

**Se si superasse:** piano Growth, 15 $ per utente al mese. Per un catalogo artigianale è uno scenario che non si presenta: 10.000 documenti sono migliaia di coltelli.

**Nota:** sul piano gratuito il dataset è pubblico. Per un catalogo che è pubblico per definizione va bene, ma significa che nel CMS non vanno messi dati personali.

### Cloudflare Pages — GRATUITO

Le richieste ai file statici sono **gratuite e illimitate**: il sito è fatto solo di file statici, quindi rientra interamente in questa voce.

`DA VERIFICARE AL MOMENTO DELL'ATTIVAZIONE` — numero di build al mese incluse nel piano gratuito e limiti di banda. Non sono dichiarati nella pagina che ho consultato. Anche col limite più basso che Cloudflare ha applicato storicamente, un sito che si ricostruisce quando Alessandro pubblica un coltello resta lontanissimo dalla soglia.

**Se si superasse:** piano a pagamento, indicativamente 5 $ al mese. Scenario che richiederebbe decine di pubblicazioni al giorno.

### GitHub — GRATUITO

Repository e GitHub Actions sono gratuiti nei limiti del piano Free.

`DA VERIFICARE AL MOMENTO DELL'ATTIVAZIONE` — minuti di Actions inclusi. Il backup gira **una volta a settimana** e dura pochi minuti: circa 10–15 minuti al mese, ben dentro qualsiasi soglia.

Se il repository fosse pubblico, i minuti di Actions sono illimitati.

### Statistiche — OPZIONALE

Cloudflare Web Analytics è incluso nell'account Cloudflare, senza costo aggiuntivo. Attualmente **non attivo**.

### Email professionale — OPZIONALE, non usata

Il sito non ne ha bisogno: usa l'email personale di Alessandro per i contatti e per gli account. Se un domani volesse un indirizzo tipo `info@<dominio>`, molti registrar includono un inoltro gratuito, oppure si prende una casella a pagamento (indicativamente 1–6 € al mese). Non cambia nulla nel sito.

### Backup — GRATUITO

Incluso in GitHub. L'archivio completo resta 90 giorni; i testi restano per sempre.

## Cosa costerebbe la crescita

| Se succede | Cosa cambia | Costo |
|---|---|---|
| Il catalogo arriva a 200 coltelli | Niente | 0 € |
| Il sito riceve molte più visite | Niente: file statici su CDN | 0 € |
| Serve un secondo utente nel CMS | Niente, il piano gratuito ne prevede 20 | 0 € |
| Si superano 100 GB di banda su Sanity al mese | Passaggio al piano Growth | 15 $ per utente al mese |
| Si vuole un'email `info@` dedicata | Casella email | 1–6 € al mese |

Nessuno di questi scenari è dietro l'angolo.

## Da rifare prima della consegna

- [ ] Prezzo reale del dominio sul registrar scelto, **rinnovo compreso**
- [ ] Limiti attuali del piano gratuito di Cloudflare Pages
- [ ] Minuti di GitHub Actions inclusi
- [ ] Conferma che i limiti Sanity siano ancora quelli di questa tabella
