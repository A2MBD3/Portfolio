# Portfolio + Neon + Cloudflare Workers Setup

পাবলিক সাইট: GitHub Pages  
API + অ্যাডমিন: Cloudflare Worker  
ডাটাবেজ: Neon Postgres (Free)

অ্যাডমিন প্যানেল পাবলিক সাইটে লিংক করা নেই — শুধু Worker URL-এ পাওয়া যায়।

---

## ১. Neon Database

1. https://neon.tech এ অ্যাকাউন্ট খুলুন
2. নতুন প্রজেক্ট তৈরি করুন
3. Connection string কপি করুন (এমন দেখাবে):
   `postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`
4. Neon SQL Editor-এ খুলুন:
   - আগে `sql/schema.sql` পুরোটা রান করুন
   - তারপর `sql/seed.sql` রান করুন

**ডিফল্ট অ্যাডমিন**
- Username: `admin`
- Password: `ChangeMe@2026`
- প্রথম লগইনের পর Password মেনু থেকে বদলে নিন

---

## ২. Cloudflare Worker

```bash
cd worker
npm install
npx wrangler login
```

Secrets সেট করুন:

```bash
npx wrangler secret put DATABASE_URL
# Neon connection string পেস্ট করুন

npx wrangler secret put JWT_SECRET
# যেকোনো লম্বা র‍্যান্ডম স্ট্রিং (যেমন: openssl rand -hex 32)
```

`wrangler.toml` এ `ALLOWED_ORIGIN` চেক করুন:
```toml
ALLOWED_ORIGIN = "https://a2mbd3.github.io"
```

ডিপ্লয়:

```bash
npx wrangler deploy
```

ডিপ্লয়ের পর URL পাবেন, যেমন:
`https://portfolio-api.<subdomain>.workers.dev`

---

## ৩. Frontend কানেক্ট

রুটের `config.js` ফাইলে Worker URL দিন:

```js
window.PORTFOLIO_API = 'https://portfolio-api.YOUR_SUBDOMAIN.workers.dev';
```

GitHub-এ পুশ করলে Pages আপডেট হবে।

API কাজ না করলে সাইট স্বয়ংক্রিয়ভাবে পুরনো `a2mbd3.json` fallback ব্যবহার করবে।

---

## ৪. অ্যাডমিন প্যানেল

URL (পাবলিক সাইটে লিংক নেই):

```
https://portfolio-api.YOUR_SUBDOMAIN.workers.dev/admin
```

লগইন → Profile / Skills / Projects / Social / Settings / Messages এডিট করুন।

ঐচ্ছিক: আরও লুকাতে চাইলে Worker env-এ `ADMIN_PATH` সেট করুন (যেমন `panel-x7k2`) — তখন URL হবে `/panel-x7k2`।

---

## ৫. API Endpoints

| Method | Path | Auth | কাজ |
|--------|------|------|-----|
| GET | `/api/portfolio` | না | পুরো পোর্টফোলিও ডেটা |
| POST | `/api/contact` | না | কন্টাক্ট মেসেজ সেভ |
| GET | `/api/health` | না | DB হেলথ চেক |
| POST | `/api/admin/login` | না | অ্যাডমিন লগইন |
| * | `/api/admin/*` | JWT | CRUD অপারেশন |
| GET | `/admin` | UI | অ্যাডমিন প্যানেল |

---

## ৬. ফোল্ডার স্ট্রাকচার

```
/
  index.html, script.js, style.css, config.js   ← পাবলিক সাইট
  a2mbd3.json                                  ← fallback (API চালু হলে আর লাগে না)
  sql/schema.sql, sql/seed.sql
  worker/
    src/index.js                               ← API + Admin UI
    wrangler.toml, package.json
  SETUP.md
```

---

## ট্রাবলশুট

- **CORS error**: `ALLOWED_ORIGIN` ঠিক আছে কিনা দেখুন
- **DB error**: `DATABASE_URL` secret ও Neon IP/ssl চেক করুন
- **401 Admin**: নতুন করে লগইন, JWT_SECRET একই আছে কিনা
- **Health**: `GET /api/health` খুলে DB কানেকশন টেস্ট করুন
