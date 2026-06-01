# Samsung JalkaMM 2026 ennustus

See pakett on Render + Supabase jaoks.

## Mis on tehtud
- Logimine jäetud samaks
- Ennustuskeskkond lähtub `vohma_ennustus.xlsx` punktisüsteemist
- FIFA World Cup 2026 kõik 104 mängu tulevad `FIFA Men's World Cup 2026 Sortable Schedule.xlsx` põhjal
- Mängude ajad salvestatakse UTC-s, aga kuvatakse Eesti aja järgi
- Ennustus läheb lukku 1 tund enne kickoff aega
- Admin saab:
  - laadida ametliku mängutabeli
  - lisada uue mängu
  - muuta käsitsi mängu tulemust
  - muuta käsitsi mängu aega Eesti aja järgi, et testida lukku

## Punktisüsteem vohma tabeli järgi
- 4p täpne skoor
- kui tulemus on õige: 2p + 1p õige koduväravate arvu eest + 1p õige võõrsilväravate arvu eest
- kui tulemus on vale: 1p iga õige väravate arvu eest

## Render env
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET

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


## Riikide nimed
Ametlikus ajakava failis olnud placeholderid on asendatud praegu teadaolevate riikidega:
- UEFA A → Bosnia and Herzegovina
- UEFA B → Sweden
- UEFA C → Türkiye
- UEFA D → Czechia
- FIFA 1 → Congo DR
- FIFA 2 → Iraq

Knockout-mängudes jäävad kohatäitjad kujul W73, 2A jne, sest need selguvad turniiri käigus.


## Kui admin vaates tuleb viga location veeru kohta
Käivita Supabase SQL Editoris fail `sql/fix_location_column.sql`.
Pärast seda vajuta admin vaates uuesti `Lae ametlik mängutabel`.
See asendab vanad `GroupTeam...` read ametliku FIFA 2026 tabeli ridadega.


## Lisavaade pärast lukku ja värvikoodid
- Kui mäng on lukku läinud, näevad kõik sisselogitud kasutajad teiste mängijate ennustusi.
- Lõppenud mängud värvuvad tabelis:
  - roheline = täpne skoor
  - sinine = 3 punkti
  - kollane = 2 punkti
  - oranž = 1 punkt
  - punane = 0 punkti


## API-Football tasuta tulemuste sünkroniseerimine
Valisin tasuta variandiks API-Footballi, sest nende free plan annab 100 päringut päevas, kõik endpointid on saadaval ning neil on eraldi FIFA World Cup 2026 juhend. World Cup 2026 jaoks kasutab API-Football `league=1` ja `season=2026`.

### Lisa Render env
- `API_FOOTBALL_KEY` = sinu tasuta API-Football võtme väärtus dashboardist

### Kuidas töötab
- mängutabeli laadimisel proovib server tulemusi automaatselt sünkroniseerida (maksimaalselt kord 30 minuti jooksul)
- admin vaates on nupp **Sünkroniseeri tulemused**
- admini käsitsi sisestatud tulemus märgitakse `manual_result_override=true` ja automaatika seda enam üle ei kirjuta

### Kui andmebaas on juba olemas
Käivita Supabase SQL Editoris fail:
- `sql/api_football_result_sync_migration.sql`
