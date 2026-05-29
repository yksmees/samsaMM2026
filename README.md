# Samsung JalkaMM 2026 ennustus

# Render deploy juhend

See versioon on tehtud Netlify asemel Renderi jaoks.

## 1. GitHub

Lae selle ZIP-i sisu GitHubi reposse.

Repo juurikas peab sisaldama:
- `frontend/`
- `sql/`
- `server.js`
- `package.json`
- `render.yaml`
- `README.md`

Netlify kausta enam ei ole vaja.

## 2. Render

1. Mine https://render.com
2. Logi sisse GitHubiga
3. New + → Web Service
4. Vali oma GitHub repo
5. Settings:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

## 3. Environment variables Renderis

Lisa Renderi Web Service settings alt:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

Need on samad, mis sul olid Netlifys.

## 4. Supabase

Kui tabelid on juba tehtud, ei pea uuesti tegema.

Kui alustad puhtalt:
1. Supabase → SQL Editor
2. käivita `sql/schema.sql`
3. käivita `sql/leaderboard_rpc.sql`, kui see fail on olemas

## 5. Deploy

Render deployb automaatselt.

Sinu leht tuleb aadressile umbes:
`https://samsung-jalkamm-2026.onrender.com`

## 6. Test

Ava:
`https://SINU-RENDER-URL.onrender.com/api/health`

Õige vastus:
`{"ok":true,...}`

## 7. Märkus tasuta Renderi kohta

Free plan võib pärast mitte kasutamist magama minna.
Esimene avamine võib võtta 30 kuni 60 sekundit.


## Varasem info

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
