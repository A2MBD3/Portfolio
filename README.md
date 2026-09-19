# Portfolio — Cloudflare Workers + Neon

Open-source dynamic portfolio template.

| Layer | Service | Notes |
|-------|---------|--------|
| Frontend | Cloudflare Pages | e.g. `https://a2mbd3.pages.dev` |
| API + Admin | Cloudflare Workers | Secrets only in Worker env |
| Database | Neon Postgres | Connection string **never** in git |

---

## Security (important)

**Never commit secrets.** This repo is public.

| Variable | Where to store | In git? |
|----------|----------------|---------|
| `DATABASE_URL` | Worker **Secret** (`wrangler secret put`) | ❌ No |
| `JWT_SECRET` | Worker **Secret** | ❌ No |
| `ALLOWED_ORIGIN` | Worker **var** (public origin only) | ✅ OK |
| Neon password / API keys | Neon dashboard + Worker secrets | ❌ No |

Anyone can fork this repo and run their own instance. Each developer sets **their own** Neon DB and Worker secrets.

---

## Live (example)

- Site: [a2mbd3.pages.dev](https://a2mbd3.pages.dev)
- API: your `*.workers.dev` URL (set in `config.js`)
- Admin: `https://<worker>.workers.dev/admin` — **not linked** from the public site

---

## Quick start (your own deploy)

### 1. Neon
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string (keep it private)
3. In Neon SQL Editor run `sql/schema.sql`, then `sql/seed.sql`

### 2. Worker secrets (only place for Neon URL)

```bash
cd worker
npm install
npx wrangler login

# PRIVATE — stored encrypted in Cloudflare, not in the repo
npx wrangler secret put DATABASE_URL    # paste Neon connection string
npx wrangler secret put JWT_SECRET      # e.g. openssl rand -hex 32

npx wrangler deploy
```

Optional obscure admin path:

```bash
npx wrangler secret put ADMIN_PATH      # e.g. panel-x7k2
```

### 3. Frontend config

Edit `config.js` (safe to commit — only public API URL):

```js
window.PORTFOLIO_API = 'https://your-worker.workers.dev';
```

Deploy Pages from this repo. Point `ALLOWED_ORIGIN` in `worker/wrangler.toml` to your Pages URL.

### 4. Admin login

Default after seed (change immediately):

- User: `admin`
- Pass: `ChangeMe@2026`

Full steps: **[SETUP.md](./SETUP.md)**

---

## Repo layout

```
config.js              # Public API base URL only
index.html, script.js  # Frontend (Pages)
a2mbd3.json            # Offline fallback only
sql/                   # Schema + seed (no secrets)
worker/                # API + admin UI source
  wrangler.toml        # Public vars only
  src/index.js
```

---

## API

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/portfolio` | No | Full public portfolio JSON |
| `POST /api/contact` | No | Save contact message |
| `GET /api/health` | No | DB connectivity check |
| `POST /api/admin/login` | No | Returns JWT |
| `/api/admin/*` | JWT | CRUD |
| `GET /admin` | UI | Admin panel (no public link) |

---

## License / reuse

Fork freely. Replace seed data, set your own `DATABASE_URL` + `JWT_SECRET`, deploy your Worker and Pages. The original author’s Neon credentials are not in this repository and cannot be used by others.
