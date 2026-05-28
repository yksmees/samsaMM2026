# Jalka MM 2026 Ennustused (täis UI)

See versioon taastab esimese HTML demo stiili (ennustamise lahtrid, kasutajate lisamine) aga töötab serveriga:
- Netlify Functions
- Supabase PostgreSQL

## Netlify env variables
Lisa Netlify Project configuration → Environment variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET

## Supabase
SQL Editoris käivita:
- sql/schema.sql
- sql/leaderboard_rpc.sql

## Admin konto
Kui admin on juba loodud, saad kohe sisse logida.

## 104 mängu
Logi sisse adminina ja vajuta “Lisa 104 mängu”.
See lisab 72 alagrupi mängu + playoff kohatäitjad (104 kokku).

Kui tahad päris tiimide nimed ja kuupäevad, anna mulle formaat (või FIFA schedule fail) ja panen seed’i õigeks.


## Ajad (Eesti aeg)
UI näitab mängu algust Eesti ajas (Europe/Tallinn). Lukustus kasutab kickoff_utc välja.
FIFA ametlik graafik annab ajad Eastern Time järgi; admin vaates saad ajad importida.


## Ajakava automaatne sünkroniseerimine
Admin vaates nupp “Sünkroniseeri ajakava” tõmbab ametliku ajakava NBC Sports artiklist ja paneb kickoff ajad mängudele.


## Uus punktisüsteem
- 4p = täpne skoor
- 3p = õige tulemus + õiged kodumeeskonna väravad
- 2p = õige tulemus
- 1p = õiged võõrsilväravad
- 0p = vale ennustus

## Kasutajate registreerimine
Login kaardis on nüüd “Loo uus konto”. Uus kasutaja saab ise konto teha ja logitakse kohe sisse.
Admin saab endiselt kasutajaid admin vaates hallata.


## Logo ja parooli muutmine
- Veebilehel kasutatakse `frontend/assets/samsung-logo.png` faili.
- Parooli muutmine ei ole enam login plokis. See on pärast sisselogimist vaates “Minu konto”.


## Uus ametlik mängutabel
Mängud tulevad failist `FIFA Men's World Cup 2026 Sortable Schedule.xlsx`. Ajad olid tabelis US EDT/UTC-4 kujul ja salvestatakse andmebaasi UTC-na. Veebis kuvatakse need Eesti aja järgi.

## Admin testid
Admin vaates saab käsitsi sisestada mängu tulemuse mängu numbri järgi ja see arvutab punktid ümber. Samas saab käsitsi sisestada mängu aja Eesti aja järgi, et testida 1 tunni lukku.
