# Jalka MM 2026 (Netlify + Supabase) FIX

See pakett parandab eelmise vea: GitHub repos peab olema `package.json`, `netlify/functions/api.js` ja `netlify.toml`, muidu Netlify Functions ei deploy.

## Mida see annab
- Netlify Functions API: `/api/health`, `/api/login`, `/api/password`, `/api/matches`, `/api/predictions`, `/api/leaderboard`
- Admini esmakordne loomine: `/api/setup/admin`
- Frontend: `frontend/index.html`

## Vajalikud Netlify Environment Variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`

Supabase anon key ei ole siin kohustuslik, sest kõik DB päringud tehakse serveris (Netlify Functions).

## Kohalik test
1) `npm install`
2) `npx netlify dev`
3) Ava `http://localhost:8888`
