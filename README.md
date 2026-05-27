# Jalka MM 2026 serveriga ennustustabel

See on valmis stardiprojekt, kus on eraldi frontend, Node.js backend ja Supabase PostgreSQL andmebaas.

## Mis on sees

- päris login süsteem
- paroolid bcrypt hashiga
- JWT sessioon
- mängijate lisamine ja muutmine
- mängude muutmine
- ennustuste salvestamine andmebaasi
- edetabel ja punktiarvestus
- skooride käsitsi sisestamine
- API adapter skooride automaatseks uuendamiseks
- cron kontroll iga 15 minuti järel

## Kohalik käivitus

1. Loo Supabase projekt.
2. Ava Supabase SQL editor ja käivita `backend/sql/schema.sql`.
3. Mine kausta `backend`.
4. Kopeeri `.env.example` failiks `.env` ja täida `DATABASE_URL` ning `JWT_SECRET`.
5. Paigalda sõltuvused:

```bash
npm install
```

6. Lisa algandmed:

```bash
npm run seed
```

7. Käivita server:

```bash
npm start
```

8. Ava `frontend/index.html` brauseris.

Esialgne admin:

- kasutaja: Admin
- parool: admin

Mängijate esialgne parool on `1234`.

## Frontendi API aadress

Kui backend on Renderis, ava brauseri konsoolis oma Netlify lehel ja käivita:

```js
localStorage.setItem('apiUrl', 'https://sinu-render-api.onrender.com')
location.reload()
```

## Renderisse ülespanek

1. Laadi projekt GitHubi.
2. Renderis vali New Web Service.
3. Vali backend kaust.
4. Build command: `npm install`
5. Start command: `npm start`
6. Lisa environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `FOOTBALL_API_KEY`, kui kasutad skooride API-t

Render toetab Node.js Express veebiteenuseid ja tasuta teenused sobivad hobiprojektideks, kuid mitte päris tootmiskriitiliseks kasutuseks.

## Netlifysse ülespanek

1. Mine Netlify Drop lehele.
2. Lohista `frontend` kaust sinna.
3. Pärast deployd määra `apiUrl`, nagu ülal näidatud.

Netlify dokumentatsioon kirjeldab, et saidi saab luua kausta või HTML failide lohistamisega.

## Supabase

Supabase projekt sisaldab Postgres andmebaasi. Tasuta plaan sobib sellise väikese ennustusmängu alustamiseks.

## Skooride automaatika

Failis `backend/src/scores.js` on valmis football-data.org adapter. Lisa `.env` faili `FOOTBALL_API_KEY`. Kui API 2026 MM mänge veel ei tagasta või kasutad teist API-t, jääb käsitsi skooride sisestamine tööle.

## Tähtis turvalisuse kohta

Vaheta kohe ära:

- admin parool
- kõik mängijate algsed paroolid
- `JWT_SECRET`

Tasuta hosting võib magama minna või olla piirangutega. Suurema kasutuse korral vali tasuline backend või VPS.
