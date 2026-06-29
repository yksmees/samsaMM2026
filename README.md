# Samsung JalkaMM 2026 ennustus

# Railway deploy juhend

See pakett on tehtud Railway jaoks. Supabase andmebaas jääb samaks.

## 1. GitHub

Lae selle ZIP-i sisu oma GitHub reposse.

Repo juurikas peab sisaldama:
- `frontend/`
- `sql/`
- `server.js`
- `package.json`
- `railway.json`
- `nixpacks.toml`
- `.env.example`
- `RAILWAY_DEPLOY.md`

## 2. Railway import

1. Mine Railway lehele
2. Vajuta **New Project**
3. Vali **Deploy from GitHub repo**
4. Vali see repo
5. Railway tuvastab Node.js rakenduse automaatselt
6. Build command: `npm install`
7. Start command: `npm start`

Kui Railway küsib builderit, vali **Nixpacks**.

## 3. Environment variables Railways

Railway projektis mine:
**Variables** → **New Variable**

Lisa need:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
API_FOOTBALL_KEY
```

### SUPABASE_URL
Supabase → Project Settings → API → Project URL

Peab olema kujul:

```txt
https://xxxx.supabase.co
```

Ilma `/rest/v1/` lõputa.

### SUPABASE_SERVICE_ROLE_KEY
Supabase → Project Settings → API → service_role key

### JWT_SECRET
Pane pikk juhuslik tekst, näiteks:

```txt
muuda-see-pikk-random-secret-2026
```

### API_FOOTBALL_KEY
API-Football / API-Sports dashboardist tasuta API võti.

## 4. Supabase SQL

Kui andmebaas on juba olemas ja töötab, ära kustuta midagi.

Kui sul on juba vanem tabel olemas, käivita Supabase SQL Editoris vajadusel need failid:
- `sql/fix_location_column.sql`
- `sql/api_football_result_sync_migration.sql`

Kui alustad täiesti tühjalt:
- `sql/schema.sql`
- `sql/leaderboard_rpc.sql`
- `sql/fix_location_column.sql`
- `sql/api_football_result_sync_migration.sql`

## 5. Deploy

Kui muutujad on lisatud:
1. Railway teeb deploy automaatselt
2. Kui vaja, vajuta **Redeploy**
3. Ava Railway antud domeen

Test:

```txt
https://SINU-RAILWAY-DOMEEN.up.railway.app/api/health
```

Õige vastus on umbes:

```json
{"ok":true,"time":"..."}
```

## 6. Custom domain Zone.ee domeeniga

Soovitus: kasuta alamdomeeni, näiteks:

```txt
ennustus.sinudomeen.ee
```

Railway:
1. Ava service
2. Settings → Networking
3. Custom Domain
4. Lisa `ennustus.sinudomeen.ee`
5. Railway annab DNS kirjed

Zone.ee:
1. Mine DNS haldusesse
2. Lisa Railway antud CNAME kirje
3. Lisa Railway antud TXT kirje, kui Railway seda küsib
4. Oota DNS valideerimist
5. Railway teeb HTTPS sertifikaadi automaatselt

## 7. Oluline

Railway kasutab `process.env.PORT` porti. `server.js` juba kasutab seda, seega lisamuudatust pole vaja.

Rakenduse loogikat ei ole Railway jaoks muudetud:
- logimine jääb samaks
- admin jääb samaks
- Supabase jääb samaks
- API-Football sync jääb samaks
- Teiste ennustused vaade jääb samaks


## Lisainfo eelmisest paketist

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


## Teiste ennustused
- Alagrupimängud ja play-off on eraldi tabelites.
- Tabel kasvab paremale ainult lõppenud mängudega.
- Järjestus on mängu numbri järgi.
- Esimene rida on "Õige tulemus".
- Mängijate ennustused värvitakse sama punktisüsteemi loogika järgi nagu põhitabelis.

## predictions/matrix 404 parandus
Selles paketis on `GET /api/predictions/matrix` endpoint server.js failis kindlalt olemas. Kui pärast deployd tuleb ikka 404, teeb Render tõenäoliselt vana commitit. Tee Renderis Manual Deploy → Deploy latest commit.


## Kui Railway ütleb "Missing env var: SUPABASE_URL"

Selles paketis on Supabase URL fallbackina server.js failis sees, sest URL ei ole salajane võti.

Kontrollimiseks ava:
`/api/debug/env`

Vastus peab näitama:
```json
{
  "supabase_url": "OK",
  "supabase_key": "OK",
  "jwt_secret": "OK"
}
```

Kui `supabase_key` on `MISSING`, kontrolli Railway Variables all:
- `SUPABASE_SERVICE_ROLE_KEY`
või
- `SUPABASE_SERVICE_ROLE`


## Railway Node 20 WebSocket fix

Railway kasutab Node 20 ning Supabase Realtime võib selles keskkonnas vajada `ws` paketti.
Selles paketis on:
- lisatud dependency `ws`
- lisatud `import WebSocket from "ws"`
- seadistatud Supabase `realtime.transport`

Kui varem tuli error:
`Node.js 20 detected without native WebSocket support`
siis see pakett parandab selle.


## Viimased UI muudatused
- Edetabelis on positsiooni muutuse nooled, esimesel kohal kroon ja viimasel kohal konn.
- Teiste ennustused vaates eemaldati Alagrupp / etapp ja Asukoht ja aeg read.
- Teiste ennustused värvid arvutatakse nüüd mängu tegeliku lõpptulemuse ja kasutaja ennustuse järgi.
- Õige tulemus rida on erksam ja bold.


## Admin vaate muudatused
- Lisatud mängu kustutamine dropdown-listist.
- Kustutamisel eemaldatakse ka selle mängu ennustused.
- Uue mängu lisamisel pole enam etapi välja. Etapiks pannakse automaatselt `Lisatud mäng`.
- Admini kuupäevaväljad kasutavad formaati `DD:MM:YY` ja kellaaeg `HH:MM`.
- Lisatud admin juhend.


## Viimased kasutajate ja edetabeli muudatused
- Login annab vale parooli korral selge teate.
- Admin vaates mängija lisamisel kasutatakse ainult username välja, nimi eemaldatud.
- Admin kasutajaid ei arvestata edetabelis ega teiste ennustuste vaates.
- Edetabelis on koha numbrid.
- Teiste ennustused vaates on kasutajad tähestiku järjekorras.


## Admin screenshot vaade
Admin vaates on eraldi plokk `Teiste ennustused screenshotiks`.
See näitab ühte valitud lõppenud mängu, õiget tulemust ja mitte-admin kasutajate ennustusi tähestiku järjekorras.
Vaikimisi valitakse uusim lõppenud mäng.


## Admin screenshot vaade mitme mänguga
Admin screenshot plokis saab nüüd valida ühe mängu või märkida `mitu mängu kõrvuti`.
Mitme mängu vaates kuvatakse valitud arv viimaseid lõppenud mänge kõrvuti, vanem vasakul ja uuem paremal.

## API-Football cron

Lisatud on cron endpoint `GET /api/cron/sync-results`.

Endpoint vajab `CRON_SECRET` env muutujat. Kutsu seda Railway cronist või välisest cron teenusest:

`/api/cron/sync-results?secret=SINU_CRON_SECRET`

Cron sync kasutab sama API-Football fixture kaitset kui admini sync: kui `api_football_fixture_id` on mängul olemas, ei seota seda enam teise fixture'iga ümber.

## Railway cron worker

This package includes `cron-sync-results.js` for a separate Railway cron service.

Use these settings only on the cron service:

Start command:

```bash
node cron-sync-results.js
```

Variables:

```env
CRON_SECRET=the_same_secret_as_the_web_service
CRON_TARGET_URL=https://your-samsung-domain/api/cron/sync-results
```

Cron schedule example:

```cron
*/10 * * * *
```

Do not change the web service start command. The web service should keep using `npm start`.

## Samsung update: lisaküsimuste automaatne kontroll adminis

Admini lisaküsimuste halduses on nüüd iga küsimuse juures selgem kontrollikaart. Admin valib samast valikute süsteemist õige vastuse ja vajutab `Salvesta ja arvuta punktid`. Süsteem võrdleb kasutajate `answer_value` väärtust küsimuse `correct_answer_value` väärtusega ning uuendab `is_correct` ja `points` väljad. Käsitsi `Õige` ja `Vale` nupud jäid alles varuvariandiks.


## Admin lisaküsimuste õige vastuse tühjendamine

Admin saab lisaküsimuse õige vastuse lahtri tühjaks teha ja vajutada `Salvesta ja arvuta punktid`. Sellisel juhul eemaldatakse selle küsimuse õige vastus ning süsteem märgib selle küsimuse kasutajate vastused automaatselt mitteõigeks ja punktid nulli.

## Supabase pagination fix

Serveris on lisatud `selectAll` helper, et suuremad Supabase päringud loeksid read 1000 kaupa lõpuni. See kaitseb edetabelit ja teiste ennustuste vaadet olukorras, kus `predictions` või `bonus_answers` tabelis on üle 1000 rea.

Parandus puudutab ainult lugemist. Kasutajaid, ennustusi, punkte ega SQL skeemi ei muudeta.

## 2026-06-27 Play-off tiimide automaatne uuendus API-Footballist

Tulemuste sync / cron uuendab nüüd play-off mängude kohatäited päris tiimidega, kui API-Footballis on fixture'il meeskonnad teada.

- Kui match.home või match.away on kohatäide nagu `2A`, `1C`, `W74` jne, proovib sync leida kindla API-Football fixture'i kickoff aja, vooru ja staadioni järgi.
- Kui vaste on kindel, salvestatakse `api_football_fixture_id` ning asendatakse kohatäited päris riikidega.
- Kui vaste on ebakindel või duplikaat, ei kirjutata Samsungi mängu üle.
- Olemasolevad ennustused jäävad sama `match_id` külge, kasutajaid ja ennustusi ei kustutata.

## Samsung play-off API tiimide turvaparandus

See pakk hoiab API-Football sünkroniseerimise rangelt FIFA World Cup 2026 põhiliiga peal: league id `1`, season `2026`. Muud World Cup nimelised liigad, näiteks U17, U20, naiste turniirid või muud sarjad, ignoreeritakse.

Play-off placeholderid nagu `W73`, `L101`, `2A`, `3ABCDEF` ei kuvata kasutajavaadetes enne, kui mõlemad pooled on päris riigid. Kui API-Football annab kindla FIFA World Cup 2026 vaste või bracketi W/L allikmäng on lõppenud, uuendatakse sama `matches.id` rea nähtavaid tiime. Ennustusi ja kasutajaid ei kustutata ega seota ümber.

Admini sync ja cron vastus sisaldavad lisavälju:

- `playoff_teams_updated`
- `placeholder_cleaned`
- `ignored_non_worldcup_fixtures`

SQL-i ei ole vaja.

## Lisaküsimuste lukus vaate täpsustus

Lukus lisaküsimused jäävad kasutajale nähtavaks koos tema salvestatud vastusega. Vastuse väli on mitteaktiivne ning lisaks kuvatakse lukus küsimuse juures eraldi read-only tekst `Vastus: ...`, et kasutaja näeks oma sisestatud vastust ka siis, kui brauser kuvab disabled inputi tagasihoidlikult.


## Lisaküsimuste lukus vastuste kuvamise parandus

Lukus lisaküsimuse puhul ei renderdata kasutajale enam muudetavat input/datalist välja. Kasutaja näeb oma varasemat vastust read-only kujul ja küsimuse märget `Lukus`, aga uut vastust sisestada ega salvestada ei saa. Server kontrollib lukustust endiselt üle ja tagastab vea, kui lukus küsimusele proovitakse vastust saata.


## Bonus lock hard guard

Lisaküsimuse kasutajavaade on nüüd read-only kahel juhul:
- küsimusel on `is_locked = true`;
- küsimusele on adminis juba määratud `correct_answer_value`.

See tähendab, et pärast õige vastuse salvestamist ja punktide arvutust ei saa kasutaja enam sama lisaküsimuse vastust muuta isegi siis, kui admin unustas lukus checkboxi märkida. Vastus jääb kasutajale nähtavaks.

## Admin lisaküsimuste lukustuse checkbox

Admini lisaküsimuste halduses on nüüd õige vastuse kõrval selgelt nähtav `Lukus` checkbox. Kui see on märgitud, siis kasutaja näeb oma vastust, aga ei saa seda muuta. Õige vastuse määramine lukustab kasutajavaates küsimuse samuti kontrollitud olekusse.
