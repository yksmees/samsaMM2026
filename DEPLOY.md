# Ühe repo deploy juhend

See versioon on tehtud nii, et saad kogu kausta GitHubi panna ja sealt edasi Render + Netlify + Supabase kaudu avalikuks teha.

## 1. Loo Supabase andmebaas

1. Ava Supabase ja tee uus projekt.
2. Mine SQL Editorisse.
3. Käivita `backend/sql/schema.sql`.
4. Ava Project Settings → Database ja kopeeri connection string.
5. Connection string läheb Renderisse `DATABASE_URL` väärtuseks.

## 2. Pane kood GitHubi

1. Tee GitHubis uus repo.
2. Laadi selle ZIP faili sisu reposse.
3. Kontrolli, et repo juures oleksid kaustad `backend` ja `frontend`.

## 3. Deploy backend Renderisse

Kõige lihtsam viis:

1. Render → New → Web Service.
2. Vali GitHub repo.
3. Root Directory: `backend`.
4. Build Command: `npm install`.
5. Start Command: `npm start`.
6. Lisa Environment variables:
   - `DATABASE_URL` Supabase connection string
   - `JWT_SECRET` pikk juhuslik tekst
   - `CORS_ORIGIN` Netlify aadress, esialgu võid panna `*` asemel hiljem päris aadressi
   - `FOOTBALL_API_KEY` jäta tühjaks kuni skoori API võtme saad
7. Deploy.

Alternatiiv: Render oskab lugeda ka faili `render.yaml`, aga käsitsi variant on alguses lihtsam.

## 4. Käivita andmete import

Renderi Shellis või lokaalselt:

```bash
cd backend
npm install
npm run seed
```

Kui käivitad lokaalselt Supabase vastu, tee enne `backend/.env` fail `.env.render.example` järgi.

Algne login:

- kasutaja: `Admin`
- parool: `admin`

Muuda admini parool kohe pärast esimest sisselogimist.

## 5. Deploy frontend Netlifysse

Variant A, GitHubist:

1. Netlify → Add new site → Import from Git.
2. Vali sama repo.
3. Base directory: `frontend`.
4. Publish directory: `frontend` või `.` olenevalt Netlify vaatest.
5. Build command jäta tühjaks.

Variant B, drag and drop:

1. Ava kaust `frontend`.
2. Muuda `config.js` sees API aadress Renderi omaks.
3. Lohista kogu `frontend` kaust Netlifysse.

`frontend/config.js` peab sisaldama näiteks:

```js
window.JALKA_API_URL = 'https://sinu-api.onrender.com';
```

## 6. Ühenda CORS

Kui Netlify leht on loodud, kopeeri selle aadress Renderi `CORS_ORIGIN` muutujasse.

Näide:

```txt
https://jalka-mm-2026.netlify.app,http://localhost:5173
```

Seejärel tee Renderis redeploy.

## 7. Kontroll

1. Ava Render API aadress `/health`. Peab näitama `{ ok: true }`.
2. Ava Netlify leht.
3. Logi sisse `Admin` / `admin`.
4. Lisa mängija ja testi ennustuse salvestust.

## Kohalik test Dockeriga

```bash
docker compose up --build
```

Teises terminalis:

```bash
docker compose exec api npm run seed
```

Frontendit saad avada otse `frontend/index.html` failina või serveerida lihtserveriga.
