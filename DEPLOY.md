# Deploy sammud (GitHub + Netlify + Supabase)

## A) Supabase
1. Tee Supabase projekt
2. SQL Editor → käivita:
   - `sql/schema.sql`
   - (soovi korral) `sql/leaderboard_rpc.sql`

3. Võta võtmed:
   - Project Settings → API → **Project URL**  → `SUPABASE_URL`
   - Project Settings → API → **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## B) GitHub
Lae repo juurika alla üles KÕIK:
- `frontend/`
- `netlify/`
- `sql/`
- `package.json`
- `netlify.toml`
- `README.md`
- `DEPLOY.md`

## C) Netlify
1. New site → Import from GitHub → vali repo
2. Build settings:
   - Build command: `npm install`
   - Publish directory: `frontend`

3. Environment variables (Site configuration → Environment variables):
   - `SUPABASE_URL` = Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service_role key
   - `JWT_SECRET` = suvaline pikk secret

4. Deploy: Deploys → Trigger deploy → Clear cache and deploy

## D) Kiirtest
Ava:
- `/.netlify/functions/api/health` → peab näitama `{ "ok": true }`
või
- `/api/health` (redirecti kaudu) → sama

## E) Loo esimene admin
Ava avaleht ja kasuta plokki “Esimene admin”.
Või tee POST:
- `/api/setup/admin` body:
  `{ "username":"admin", "display_name":"Admin", "password":"admin123" }`
