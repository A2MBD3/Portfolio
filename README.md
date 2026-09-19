# Abdullah Al Mamun — Portfolio

Dynamic portfolio powered by **Cloudflare Workers + Neon Postgres**.

- **Public site:** GitHub Pages (this repo)
- **API & Admin:** Cloudflare Worker (`worker/`)
- **Database:** Neon (serverless Postgres)

Data is loaded from the API. Local `a2mbd3.json` is only a fallback until the Worker is deployed.

## Quick links

- Setup guide: [SETUP.md](./SETUP.md)
- SQL schema: `sql/schema.sql`
- Seed data: `sql/seed.sql`
- Worker source: `worker/src/index.js`

## Admin panel

Not linked from the public site. After deploy:

`https://<your-worker>.workers.dev/admin`

Default login (change immediately): `admin` / `ChangeMe@2026`
