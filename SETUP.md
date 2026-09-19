# Setup guide — Neon + Workers + Pages

Developer-oriented. Secrets never go in git.

---

## Where secrets live

```
┌─────────────────┐     encrypted      ┌──────────────────┐
│ Neon Dashboard  │ ─────────────────► │ You copy URL     │
└─────────────────┘                    └────────┬─────────┘
                                                │
                     npx wrangler secret put     │
                     DATABASE_URL                ▼
                                       ┌──────────────────┐
                                       │ Cloudflare Worker│
                                       │ Secrets store    │
                                       │ (not in git)     │
                                       └──────────────────┘
```

| Secret | Command | Used for |
|--------|---------|----------|
| `DATABASE_URL` | `wrangler secret put DATABASE_URL` | Neon Postgres |
| `JWT_SECRET` | `wrangler secret put JWT_SECRET` | Admin JWT signing |
| `ADMIN_PATH` | optional | Obscure admin URL path |

**Do not** put these in:

- `wrangler.toml` `[vars]`
- `config.js`
- any `.env` committed to git
- GitHub Actions logs without masking

Local dev only: create `worker/.dev.vars` (gitignored):

```
DATABASE_URL=postgresql://...
JWT_SECRET=dev-secret-min-32-chars-long!!
```

---

## 1. Neon

1. [neon.tech](https://neon.tech) → New project  
2. Connection string → save in a password manager (not in the repo)  
3. SQL Editor → run `sql/schema.sql` → then `sql/seed.sql`

Seed admin: `admin` / `ChangeMe@2026` → change on first login.

---

## 2. Cloudflare Worker

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler deploy
```

Note the URL, e.g. `https://portfolio-api.<account>.workers.dev`.

CORS: edit `worker/wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGIN = "https://a2mbd3.pages.dev"
```

Redeploy after changing vars.

---

## 3. Cloudflare Pages (frontend)

- Connect this GitHub repo to Pages  
- Production URL: `https://a2mbd3.pages.dev`  
- Set `config.js`:

```js
window.PORTFOLIO_API = 'https://portfolio-api.<account>.workers.dev';
```

Commit & push — Pages rebuilds. No database secrets needed on Pages.

Until the Worker is live, the site falls back to `a2mbd3.json`.

---

## 4. Admin panel

```
https://portfolio-api.<account>.workers.dev/admin
```

Not linked from the portfolio. Optional:

```bash
npx wrangler secret put ADMIN_PATH
# value e.g. my-secret-panel
# then open /my-secret-panel
```

---

## 5. Fork / open-source use

Another developer:

1. Forks the repo  
2. Creates **their own** Neon project + secrets  
3. Deploys **their own** Worker  
4. Points `config.js` + `ALLOWED_ORIGIN` to **their** Pages URL  

They never get access to your Neon database.

---

## Health check

```
GET https://<worker>/api/health
→ { "ok": true, "db": true }
```

## Troubleshooting

| Issue | Check |
|-------|--------|
| CORS | `ALLOWED_ORIGIN` matches exact Pages origin |
| 500 on portfolio | `DATABASE_URL` secret + schema applied |
| 401 admin | JWT_SECRET set; login again after changing it |
| Fallback JSON | Worker URL wrong in `config.js` or Worker not deployed |
