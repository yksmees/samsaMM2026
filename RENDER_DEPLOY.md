# Render deploy

1. Lae selle ZIP-i sisu GitHubi
2. Renderis loo Web Service oma repo pealt
3. Pane env:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - JWT_SECRET
4. Start command: `npm start`
5. Ava `/api/health`

Kui database on juba tehtud, võid kohe kasutada.
Kui mitte, käivita Supabase SQL Editoris `sql/schema.sql` ja `sql/leaderboard_rpc.sql`.
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
