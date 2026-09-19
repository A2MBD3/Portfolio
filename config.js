/**
 * Public API base URL only — safe to commit.
 * Secrets (Neon DATABASE_URL, JWT_SECRET) live ONLY in Cloudflare Worker secrets.
 *
 * After: cd worker && npx wrangler deploy
 * set this to your workers.dev URL.
 */
window.PORTFOLIO_API = 'https://portfolio-api.a2mbd3.workers.dev';
