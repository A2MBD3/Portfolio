/**
 * Portfolio API + Admin Panel
 * Cloudflare Worker + Neon Postgres
 */
import { neon } from '@neondatabase/serverless';

const encoder = new TextEncoder();

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

function corsHeaders(origin, env) {
  const allowed = env.ALLOWED_ORIGIN || '*';
  const o = origin && (allowed === '*' || origin === allowed || origin.endsWith('.workers.dev'))
    ? origin
    : allowed;
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

async function pbkdf2Verify(password, stored) {
  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
  const expected = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const actual = new Uint8Array(derived);
  if (actual.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < actual.length; i++) ok |= actual[i] ^ expected[i];
  return ok === 0;
}

async function pbkdf2Hash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));
  return `${saltB64}:${hashB64}`;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64url(data) {
  const str = typeof data === 'string' ? data : String.fromCharCode(...new Uint8Array(data));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJwt(payload, secret) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

async function verifyJwt(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );
    const ok = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(`${header}.${body}`));
    if (!ok) return null;
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function getBearer(req) {
  const h = req.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function requireAdmin(req, env) {
  const token = getBearer(req);
  if (!token || !env.JWT_SECRET) return null;
  return verifyJwt(token, env.JWT_SECRET);
}

function db(env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL not configured');
  return neon(env.DATABASE_URL);
}

/** Build public portfolio payload matching old a2mbd3.json shape */
async function getPortfolio(sql) {
  const [settings] = await sql`SELECT * FROM site_settings WHERE id = 1`;
  const [profile] = await sql`SELECT * FROM profile WHERE id = 1`;
  const skills = await sql`SELECT name, level, icon, category FROM skills WHERE visible = true ORDER BY sort_order, id`;
  const projects = await sql`SELECT name, description, icon, link, image_url, tech_stack FROM projects WHERE visible = true ORDER BY sort_order, id`;
  const social = await sql`SELECT name, url, icon, color FROM social_links WHERE visible = true ORDER BY sort_order, id`;
  const navigation = await sql`SELECT label, icon, section FROM navigation WHERE visible = true ORDER BY sort_order, id`;

  if (!settings || !profile) {
    return null;
  }

  return {
    site: {
      title: settings.title,
      description: settings.description,
      lang: settings.lang,
    },
    theme: {
      primaryColor: settings.primary_color,
      secondaryColor: settings.secondary_color,
      accentColor: settings.accent_color,
      backgroundColor: settings.background_color,
      surfaceColor: settings.surface_color,
      fontFamily: settings.font_family,
      glassEffect: settings.glass_effect,
      glassOpacity: settings.glass_opacity,
      rainEffect: settings.rain_effect,
      rainDropCount: settings.rain_drop_count,
    },
    music: {
      enabled: settings.music_enabled,
      volume: settings.music_volume,
      shakeToChange: settings.music_shake,
      tracks: settings.music_tracks || [],
    },
    personal: {
      name: profile.name,
      profession: profile.profession,
      education: profile.education,
      field: profile.field,
      goal: profile.goal,
      passion: profile.passion,
      location: profile.location,
      college: profile.college,
      department: profile.department,
      bio: profile.bio,
    },
    profileDetails: profile.profile_details || [],
    aboutItems: profile.about_items || [],
    contact: {
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      freefire: profile.freefire,
    },
    contactForm: {
      enabled: settings.contact_form_enabled,
      submitButtonText: settings.contact_button_text,
      successMessage: settings.contact_success_msg,
      errorMessage: settings.contact_error_msg,
    },
    social,
    hobbies: profile.hobbies || [],
    skills: skills.map((s) => ({ name: s.name, level: s.level, icon: s.icon, category: s.category })),
    tools: projects.map((p) => ({
      name: p.name,
      description: p.description,
      icon: p.icon,
      link: p.link,
      image: p.image_url,
      tech: p.tech_stack || [],
    })),
    images: {
      profile: profile.profile_images || [],
      freefire_bg: profile.freefire_bg || '',
    },
    navigation,
    footer: { text: settings.footer_text },
  };
}

async function handlePublic(req, env, path, cors) {
  const sql = db(env);
  const method = req.method;

  if (path === '/api/portfolio' && method === 'GET') {
    const data = await getPortfolio(sql);
    if (!data) return json({ error: 'Portfolio not found' }, 404, cors);
    return json(data, 200, cors);
  }

  if (path === '/api/contact' && method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }
    const message = (body.message || body.msg || '').trim();
    if (!message || message.length < 2) {
      return json({ error: 'Message required' }, 400, cors);
    }
    // honeypot
    if (body.website || body._hp) {
      return json({ ok: true }, 200, cors);
    }
    await sql`
      INSERT INTO messages (name, email, phone, subject, message, social_link, meta)
      VALUES (
        ${body.name || ''},
        ${body.email || ''},
        ${body.phone || ''},
        ${body.subject || ''},
        ${message},
        ${body.socialLink || body.social_link || ''},
        ${JSON.stringify(body.meta || {})}::jsonb
      )
    `;
    return json({ ok: true }, 200, cors);
  }

  if (path === '/api/health' && method === 'GET') {
    try {
      await sql`SELECT 1`;
      return json({ ok: true, db: true }, 200, cors);
    } catch (e) {
      return json({ ok: false, db: false, error: String(e.message) }, 500, cors);
    }
  }

  return json({ error: 'Not found' }, 404, cors);
}

async function handleAdminApi(req, env, path, cors) {
  const sql = db(env);
  const method = req.method;

  // Login — no auth
  if (path === '/api/admin/login' && method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }
    const username = (body.username || '').trim();
    const password = body.password || '';
    if (!username || !password) return json({ error: 'Username and password required' }, 400, cors);

    const [user] = await sql`SELECT id, username, password_hash FROM admin_users WHERE username = ${username}`;
    if (!user || !(await pbkdf2Verify(password, user.password_hash))) {
      return json({ error: 'Invalid credentials' }, 401, cors);
    }
    if (!env.JWT_SECRET) return json({ error: 'JWT_SECRET not set' }, 500, cors);

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days
    const token = await signJwt({ sub: user.id, username: user.username, exp }, env.JWT_SECRET);
    return json({ token, username: user.username, expiresIn: 7 * 24 * 3600 }, 200, cors);
  }

  // All other admin routes need auth
  const session = await requireAdmin(req, env);
  if (!session) return json({ error: 'Unauthorized' }, 401, cors);

  if (path === '/api/admin/me' && method === 'GET') {
    return json({ username: session.username, id: session.sub }, 200, cors);
  }

  if (path === '/api/admin/password' && method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, cors);
    }
    if (!body.newPassword || body.newPassword.length < 8) {
      return json({ error: 'Password must be at least 8 characters' }, 400, cors);
    }
    const hash = await pbkdf2Hash(body.newPassword);
    await sql`UPDATE admin_users SET password_hash = ${hash} WHERE id = ${session.sub}`;
    return json({ ok: true }, 200, cors);
  }

  // Full portfolio for admin (includes hidden)
  if (path === '/api/admin/portfolio' && method === 'GET') {
    const data = await getPortfolio(sql);
    const skills = await sql`SELECT * FROM skills ORDER BY sort_order, id`;
    const projects = await sql`SELECT * FROM projects ORDER BY sort_order, id`;
    const social = await sql`SELECT * FROM social_links ORDER BY sort_order, id`;
    const navigation = await sql`SELECT * FROM navigation ORDER BY sort_order, id`;
    const [settings] = await sql`SELECT * FROM site_settings WHERE id = 1`;
    const [profile] = await sql`SELECT * FROM profile WHERE id = 1`;
    const msgCount = await sql`SELECT COUNT(*)::int AS c FROM messages WHERE is_read = false`;
    return json({
      settings,
      profile,
      skills,
      projects,
      social,
      navigation,
      unreadMessages: msgCount[0]?.c || 0,
      public: data,
    }, 200, cors);
  }

  // Profile
  if (path === '/api/admin/profile' && method === 'PUT') {
    const b = await req.json();
    await sql`
      UPDATE profile SET
        name = COALESCE(${b.name ?? null}, name),
        profession = COALESCE(${b.profession ?? null}, profession),
        education = COALESCE(${b.education ?? null}, education),
        field = COALESCE(${b.field ?? null}, field),
        goal = COALESCE(${b.goal ?? null}, goal),
        passion = COALESCE(${b.passion ?? null}, passion),
        location = COALESCE(${b.location ?? null}, location),
        college = COALESCE(${b.college ?? null}, college),
        department = COALESCE(${b.department ?? null}, department),
        bio = COALESCE(${b.bio ?? null}, bio),
        email = COALESCE(${b.email ?? null}, email),
        phone = COALESCE(${b.phone ?? null}, phone),
        address = COALESCE(${b.address ?? null}, address),
        freefire = COALESCE(${b.freefire ?? null}, freefire),
        profile_images = COALESCE(${b.profile_images ? JSON.stringify(b.profile_images) : null}::jsonb, profile_images),
        freefire_bg = COALESCE(${b.freefire_bg ?? null}, freefire_bg),
        profile_details = COALESCE(${b.profile_details ? JSON.stringify(b.profile_details) : null}::jsonb, profile_details),
        about_items = COALESCE(${b.about_items ? JSON.stringify(b.about_items) : null}::jsonb, about_items),
        hobbies = COALESCE(${b.hobbies ? JSON.stringify(b.hobbies) : null}::jsonb, hobbies),
        updated_at = NOW()
      WHERE id = 1
    `;
    return json({ ok: true }, 200, cors);
  }

  // Settings
  if (path === '/api/admin/settings' && method === 'PUT') {
    const b = await req.json();
    await sql`
      UPDATE site_settings SET
        title = COALESCE(${b.title ?? null}, title),
        description = COALESCE(${b.description ?? null}, description),
        lang = COALESCE(${b.lang ?? null}, lang),
        footer_text = COALESCE(${b.footer_text ?? null}, footer_text),
        primary_color = COALESCE(${b.primary_color ?? null}, primary_color),
        secondary_color = COALESCE(${b.secondary_color ?? null}, secondary_color),
        accent_color = COALESCE(${b.accent_color ?? null}, accent_color),
        background_color = COALESCE(${b.background_color ?? null}, background_color),
        surface_color = COALESCE(${b.surface_color ?? null}, surface_color),
        rain_effect = COALESCE(${b.rain_effect ?? null}, rain_effect),
        music_enabled = COALESCE(${b.music_enabled ?? null}, music_enabled),
        contact_form_enabled = COALESCE(${b.contact_form_enabled ?? null}, contact_form_enabled),
        contact_success_msg = COALESCE(${b.contact_success_msg ?? null}, contact_success_msg),
        contact_error_msg = COALESCE(${b.contact_error_msg ?? null}, contact_error_msg),
        contact_button_text = COALESCE(${b.contact_button_text ?? null}, contact_button_text),
        music_tracks = COALESCE(${b.music_tracks ? JSON.stringify(b.music_tracks) : null}::jsonb, music_tracks),
        updated_at = NOW()
      WHERE id = 1
    `;
    return json({ ok: true }, 200, cors);
  }

  // Skills CRUD
  if (path === '/api/admin/skills' && method === 'GET') {
    const rows = await sql`SELECT * FROM skills ORDER BY sort_order, id`;
    return json(rows, 200, cors);
  }
  if (path === '/api/admin/skills' && method === 'POST') {
    const b = await req.json();
    const [row] = await sql`
      INSERT INTO skills (name, level, icon, category, sort_order, visible)
      VALUES (${b.name}, ${b.level ?? 50}, ${b.icon || 'fa-code'}, ${b.category || 'general'}, ${b.sort_order ?? 0}, ${b.visible !== false})
      RETURNING *
    `;
    return json(row, 201, cors);
  }
  if (path.startsWith('/api/admin/skills/') && method === 'PUT') {
    const id = parseInt(path.split('/').pop(), 10);
    const b = await req.json();
    await sql`
      UPDATE skills SET
        name = COALESCE(${b.name ?? null}, name),
        level = COALESCE(${b.level ?? null}, level),
        icon = COALESCE(${b.icon ?? null}, icon),
        category = COALESCE(${b.category ?? null}, category),
        sort_order = COALESCE(${b.sort_order ?? null}, sort_order),
        visible = COALESCE(${b.visible ?? null}, visible)
      WHERE id = ${id}
    `;
    return json({ ok: true }, 200, cors);
  }
  if (path.startsWith('/api/admin/skills/') && method === 'DELETE') {
    const id = parseInt(path.split('/').pop(), 10);
    await sql`DELETE FROM skills WHERE id = ${id}`;
    return json({ ok: true }, 200, cors);
  }

  // Projects CRUD
  if (path === '/api/admin/projects' && method === 'GET') {
    const rows = await sql`SELECT * FROM projects ORDER BY sort_order, id`;
    return json(rows, 200, cors);
  }
  if (path === '/api/admin/projects' && method === 'POST') {
    const b = await req.json();
    const [row] = await sql`
      INSERT INTO projects (name, description, icon, link, image_url, tech_stack, sort_order, visible)
      VALUES (
        ${b.name},
        ${b.description || ''},
        ${b.icon || 'fa-code'},
        ${b.link || ''},
        ${b.image_url || ''},
        ${JSON.stringify(b.tech_stack || [])}::jsonb,
        ${b.sort_order ?? 0},
        ${b.visible !== false}
      )
      RETURNING *
    `;
    return json(row, 201, cors);
  }
  if (path.startsWith('/api/admin/projects/') && method === 'PUT') {
    const id = parseInt(path.split('/').pop(), 10);
    const b = await req.json();
    await sql`
      UPDATE projects SET
        name = COALESCE(${b.name ?? null}, name),
        description = COALESCE(${b.description ?? null}, description),
        icon = COALESCE(${b.icon ?? null}, icon),
        link = COALESCE(${b.link ?? null}, link),
        image_url = COALESCE(${b.image_url ?? null}, image_url),
        tech_stack = COALESCE(${b.tech_stack ? JSON.stringify(b.tech_stack) : null}::jsonb, tech_stack),
        sort_order = COALESCE(${b.sort_order ?? null}, sort_order),
        visible = COALESCE(${b.visible ?? null}, visible)
      WHERE id = ${id}
    `;
    return json({ ok: true }, 200, cors);
  }
  if (path.startsWith('/api/admin/projects/') && method === 'DELETE') {
    const id = parseInt(path.split('/').pop(), 10);
    await sql`DELETE FROM projects WHERE id = ${id}`;
    return json({ ok: true }, 200, cors);
  }

  // Social CRUD
  if (path === '/api/admin/social' && method === 'GET') {
    return json(await sql`SELECT * FROM social_links ORDER BY sort_order, id`, 200, cors);
  }
  if (path === '/api/admin/social' && method === 'POST') {
    const b = await req.json();
    const [row] = await sql`
      INSERT INTO social_links (name, url, icon, color, sort_order, visible)
      VALUES (${b.name}, ${b.url}, ${b.icon || 'fa-link'}, ${b.color || '#888'}, ${b.sort_order ?? 0}, ${b.visible !== false})
      RETURNING *
    `;
    return json(row, 201, cors);
  }
  if (path.startsWith('/api/admin/social/') && method === 'PUT') {
    const id = parseInt(path.split('/').pop(), 10);
    const b = await req.json();
    await sql`
      UPDATE social_links SET
        name = COALESCE(${b.name ?? null}, name),
        url = COALESCE(${b.url ?? null}, url),
        icon = COALESCE(${b.icon ?? null}, icon),
        color = COALESCE(${b.color ?? null}, color),
        sort_order = COALESCE(${b.sort_order ?? null}, sort_order),
        visible = COALESCE(${b.visible ?? null}, visible)
      WHERE id = ${id}
    `;
    return json({ ok: true }, 200, cors);
  }
  if (path.startsWith('/api/admin/social/') && method === 'DELETE') {
    const id = parseInt(path.split('/').pop(), 10);
    await sql`DELETE FROM social_links WHERE id = ${id}`;
    return json({ ok: true }, 200, cors);
  }

  // Messages
  if (path === '/api/admin/messages' && method === 'GET') {
    const rows = await sql`SELECT * FROM messages ORDER BY created_at DESC LIMIT 100`;
    return json(rows, 200, cors);
  }
  if (path.startsWith('/api/admin/messages/') && method === 'PATCH') {
    const id = parseInt(path.split('/').pop(), 10);
    const b = await req.json();
    await sql`UPDATE messages SET is_read = ${b.is_read !== false} WHERE id = ${id}`;
    return json({ ok: true }, 200, cors);
  }
  if (path.startsWith('/api/admin/messages/') && method === 'DELETE') {
    const id = parseInt(path.split('/').pop(), 10);
    await sql`DELETE FROM messages WHERE id = ${id}`;
    return json({ ok: true }, 200, cors);
  }

  return json({ error: 'Not found' }, 404, cors);
}

// Minimal admin SPA (embedded)
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0f0f14;color:#e4e4e7;min-height:100vh}
.hidden{display:none!important}
#loginView{max-width:360px;margin:15vh auto;padding:2rem;background:#16161d;border-radius:12px;border:1px solid #27272a}
#loginView h1{font-size:1.25rem;margin-bottom:1.5rem;color:#a78bfa}
label{display:block;font-size:.85rem;color:#a1a1aa;margin-bottom:.35rem}
input,textarea,select{width:100%;padding:.65rem .75rem;margin-bottom:1rem;border-radius:8px;border:1px solid #3f3f46;background:#09090b;color:#fff}
button,.btn{background:#7c3aed;color:#fff;border:none;padding:.65rem 1.2rem;border-radius:8px;cursor:pointer;font-weight:600}
button:hover{background:#6d28d9}
.btn-ghost{background:transparent;border:1px solid #3f3f46}
.err{color:#f87171;font-size:.85rem;margin-bottom:1rem}
#app{display:flex;min-height:100vh}
nav{width:220px;background:#16161d;border-right:1px solid #27272a;padding:1.5rem 1rem;flex-shrink:0}
nav h2{font-size:.9rem;color:#a78bfa;margin-bottom:1.5rem}
nav a{display:block;padding:.5rem .75rem;color:#a1a1aa;text-decoration:none;border-radius:6px;margin-bottom:.25rem;font-size:.9rem}
nav a:hover,nav a.active{background:#27272a;color:#fff}
main{flex:1;padding:1.5rem 2rem;overflow:auto}
h1{font-size:1.4rem;margin-bottom:1.25rem}
.card{background:#16161d;border:1px solid #27272a;border-radius:10px;padding:1.25rem;margin-bottom:1rem}
.card h3{font-size:1rem;margin-bottom:.75rem}
.row{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}
.table{width:100%;border-collapse:collapse;font-size:.9rem}
.table th,.table td{text-align:left;padding:.5rem;border-bottom:1px solid #27272a}
.badge{background:#7c3aed33;color:#c4b5fd;padding:.15rem .5rem;border-radius:999px;font-size:.75rem}
.toast{position:fixed;bottom:1.5rem;right:1.5rem;background:#22c55e;color:#fff;padding:.75rem 1.25rem;border-radius:8px;display:none}
.toast.show{display:block}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
@media(max-width:768px){#app{flex-direction:column}nav{width:100%} .grid2{grid-template-columns:1fr}}
</style>
</head>
<body>
<div id="loginView">
  <h1>🔐 Admin Login</h1>
  <div id="loginErr" class="err hidden"></div>
  <label>Username</label>
  <input id="username" autocomplete="username" value="admin">
  <label>Password</label>
  <input id="password" type="password" autocomplete="current-password">
  <button id="loginBtn" style="width:100%">Login</button>
</div>

<div id="app" class="hidden">
  <nav>
    <h2>Portfolio Admin</h2>
    <a href="#dashboard" data-page="dashboard" class="active">Dashboard</a>
    <a href="#profile" data-page="profile">Profile</a>
    <a href="#skills" data-page="skills">Skills</a>
    <a href="#projects" data-page="projects">Projects</a>
    <a href="#social" data-page="social">Social</a>
    <a href="#settings" data-page="settings">Settings</a>
    <a href="#messages" data-page="messages">Messages <span id="msgBadge" class="badge hidden">0</span></a>
    <a href="#password" data-page="password">Password</a>
    <a href="#" id="logoutBtn" style="margin-top:2rem;color:#f87171">Logout</a>
  </nav>
  <main id="main"></main>
</div>
<div id="toast" class="toast"></div>

<script>
const API = location.origin;
let token = localStorage.getItem('admin_token') || '';

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function logout() {
  token = '';
  localStorage.removeItem('admin_token');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginView').classList.remove('hidden');
}

document.getElementById('loginBtn').onclick = async () => {
  const err = document.getElementById('loginErr');
  err.classList.add('hidden');
  try {
    const data = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      })
    });
    token = data.token;
    localStorage.setItem('admin_token', token);
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    showPage('dashboard');
  } catch (e) {
    err.textContent = e.message;
    err.classList.remove('hidden');
  }
};

document.getElementById('logoutBtn').onclick = (e) => { e.preventDefault(); logout(); };

document.querySelectorAll('nav a[data-page]').forEach(a => {
  a.onclick = (e) => {
    e.preventDefault();
    document.querySelectorAll('nav a').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    showPage(a.dataset.page);
  };
});

async function showPage(page) {
  const main = document.getElementById('main');
  main.innerHTML = '<p style="color:#71717a">Loading...</p>';
  try {
    if (page === 'dashboard') {
      const d = await api('/api/admin/portfolio');
      document.getElementById('msgBadge').textContent = d.unreadMessages;
      document.getElementById('msgBadge').classList.toggle('hidden', !d.unreadMessages);
      main.innerHTML = \`
        <h1>Dashboard</h1>
        <div class="grid2">
          <div class="card"><h3>Profile</h3><p>\${d.profile?.name || '-'}</p><p style="color:#a1a1aa;font-size:.9rem">\${d.profile?.profession || ''}</p></div>
          <div class="card"><h3>Unread messages</h3><p style="font-size:2rem;color:#a78bfa">\${d.unreadMessages}</p></div>
          <div class="card"><h3>Skills</h3><p>\${d.skills?.length || 0} items</p></div>
          <div class="card"><h3>Projects</h3><p>\${d.projects?.length || 0} items</p></div>
        </div>
        <p style="margin-top:1rem;color:#71717a;font-size:.85rem">Public site loads data from <code>/api/portfolio</code></p>
      \`;
    } else if (page === 'profile') {
      const d = await api('/api/admin/portfolio');
      const p = d.profile || {};
      main.innerHTML = \`
        <h1>Profile</h1>
        <div class="card">
          <div class="grid2">
            <div><label>Name</label><input id="p_name" value="\${esc(p.name)}"></div>
            <div><label>Profession</label><input id="p_profession" value="\${esc(p.profession)}"></div>
            <div><label>Email</label><input id="p_email" value="\${esc(p.email)}"></div>
            <div><label>Location</label><input id="p_location" value="\${esc(p.location)}"></div>
            <div><label>Education</label><input id="p_education" value="\${esc(p.education)}"></div>
            <div><label>College</label><input id="p_college" value="\${esc(p.college)}"></div>
            <div><label>FreeFire UID</label><input id="p_freefire" value="\${esc(p.freefire)}"></div>
            <div><label>Address</label><input id="p_address" value="\${esc(p.address)}"></div>
          </div>
          <label>Bio</label>
          <textarea id="p_bio" rows="4">\${esc(p.bio)}</textarea>
          <button id="saveProfile">Save Profile</button>
        </div>
      \`;
      document.getElementById('saveProfile').onclick = async () => {
        await api('/api/admin/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name: val('p_name'), profession: val('p_profession'), email: val('p_email'),
            location: val('p_location'), education: val('p_education'), college: val('p_college'),
            freefire: val('p_freefire'), address: val('p_address'), bio: val('p_bio')
          })
        });
        toast('Profile saved');
      };
    } else if (page === 'skills') {
      const skills = await api('/api/admin/skills');
      main.innerHTML = \`
        <h1>Skills</h1>
        <div class="card">
          <div class="row" style="margin-bottom:1rem">
            <input id="sk_name" placeholder="Name" style="flex:1;margin:0">
            <input id="sk_level" type="number" min="0" max="100" value="50" style="width:80px;margin:0">
            <input id="sk_cat" placeholder="category" value="tech" style="width:100px;margin:0">
            <button id="addSkill">Add</button>
          </div>
          <table class="table"><thead><tr><th>Name</th><th>Level</th><th>Category</th><th></th></tr></thead>
          <tbody>\${skills.map(s => \`<tr>
            <td>\${esc(s.name)}</td><td>\${s.level}</td><td>\${esc(s.category)}</td>
            <td><button class="btn-ghost" onclick="delSkill(\${s.id})">Delete</button></td>
          </tr>\`).join('')}</tbody></table>
        </div>
      \`;
      document.getElementById('addSkill').onclick = async () => {
        await api('/api/admin/skills', {
          method: 'POST',
          body: JSON.stringify({ name: val('sk_name'), level: +val('sk_level'), category: val('sk_cat') })
        });
        toast('Added'); showPage('skills');
      };
      window.delSkill = async (id) => {
        if (!confirm('Delete?')) return;
        await api('/api/admin/skills/' + id, { method: 'DELETE' });
        toast('Deleted'); showPage('skills');
      };
    } else if (page === 'projects') {
      const projects = await api('/api/admin/projects');
      main.innerHTML = \`
        <h1>Projects</h1>
        <div class="card">
          <label>Name</label><input id="pr_name">
          <label>Description</label><textarea id="pr_desc" rows="2"></textarea>
          <label>Link</label><input id="pr_link" placeholder="https://... or p/page.html">
          <label>Icon (fa-xxx)</label><input id="pr_icon" value="fa-code">
          <button id="addProject">Add Project</button>
        </div>
        <div class="card">
          <table class="table"><thead><tr><th>Name</th><th>Link</th><th>Visible</th><th></th></tr></thead>
          <tbody>\${projects.map(p => \`<tr>
            <td>\${esc(p.name)}</td><td style="max-width:180px;overflow:hidden;text-overflow:ellipsis">\${esc(p.link)}</td>
            <td>\${p.visible ? 'Yes' : 'No'}</td>
            <td><button class="btn-ghost" onclick="delProject(\${p.id})">Delete</button></td>
          </tr>\`).join('')}</tbody></table>
        </div>
      \`;
      document.getElementById('addProject').onclick = async () => {
        await api('/api/admin/projects', {
          method: 'POST',
          body: JSON.stringify({ name: val('pr_name'), description: val('pr_desc'), link: val('pr_link'), icon: val('pr_icon') })
        });
        toast('Added'); showPage('projects');
      };
      window.delProject = async (id) => {
        if (!confirm('Delete?')) return;
        await api('/api/admin/projects/' + id, { method: 'DELETE' });
        toast('Deleted'); showPage('projects');
      };
    } else if (page === 'social') {
      const social = await api('/api/admin/social');
      main.innerHTML = \`
        <h1>Social Links</h1>
        <div class="card">
          <div class="row">
            <input id="so_name" placeholder="Name" style="flex:1;margin:0">
            <input id="so_url" placeholder="URL" style="flex:2;margin:0">
            <input id="so_icon" placeholder="fa-github" style="width:110px;margin:0">
            <button id="addSocial">Add</button>
          </div>
        </div>
        <div class="card">
          <table class="table"><thead><tr><th>Name</th><th>URL</th><th></th></tr></thead>
          <tbody>\${social.map(s => \`<tr>
            <td>\${esc(s.name)}</td><td>\${esc(s.url)}</td>
            <td><button class="btn-ghost" onclick="delSocial(\${s.id})">Delete</button></td>
          </tr>\`).join('')}</tbody></table>
        </div>
      \`;
      document.getElementById('addSocial').onclick = async () => {
        await api('/api/admin/social', {
          method: 'POST',
          body: JSON.stringify({ name: val('so_name'), url: val('so_url'), icon: val('so_icon') || 'fa-link' })
        });
        toast('Added'); showPage('social');
      };
      window.delSocial = async (id) => {
        if (!confirm('Delete?')) return;
        await api('/api/admin/social/' + id, { method: 'DELETE' });
        toast('Deleted'); showPage('social');
      };
    } else if (page === 'settings') {
      const d = await api('/api/admin/portfolio');
      const s = d.settings || {};
      main.innerHTML = \`
        <h1>Site Settings</h1>
        <div class="card">
          <label>Title</label><input id="st_title" value="\${esc(s.title)}">
          <label>Description</label><input id="st_desc" value="\${esc(s.description)}">
          <label>Footer text</label><input id="st_footer" value="\${esc(s.footer_text)}">
          <label>Primary color</label><input id="st_primary" value="\${esc(s.primary_color)}">
          <div class="row" style="margin:1rem 0">
            <label><input type="checkbox" id="st_rain" \${s.rain_effect ? 'checked' : ''}> Rain effect</label>
            <label><input type="checkbox" id="st_music" \${s.music_enabled ? 'checked' : ''}> Music</label>
            <label><input type="checkbox" id="st_form" \${s.contact_form_enabled ? 'checked' : ''}> Contact form</label>
          </div>
          <button id="saveSettings">Save Settings</button>
        </div>
      \`;
      document.getElementById('saveSettings').onclick = async () => {
        await api('/api/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({
            title: val('st_title'), description: val('st_desc'), footer_text: val('st_footer'),
            primary_color: val('st_primary'),
            rain_effect: document.getElementById('st_rain').checked,
            music_enabled: document.getElementById('st_music').checked,
            contact_form_enabled: document.getElementById('st_form').checked
          })
        });
        toast('Settings saved');
      };
    } else if (page === 'messages') {
      const msgs = await api('/api/admin/messages');
      main.innerHTML = \`
        <h1>Messages</h1>
        <div class="card">
          \${msgs.length === 0 ? '<p style="color:#71717a">No messages yet</p>' : ''}
          \${msgs.map(m => \`
            <div style="border-bottom:1px solid #27272a;padding:1rem 0;opacity:\${m.is_read ? .6 : 1}">
              <div class="row" style="justify-content:space-between">
                <strong>\${esc(m.name || 'Anonymous')}</strong>
                <span style="font-size:.8rem;color:#71717a">\${new Date(m.created_at).toLocaleString()}</span>
              </div>
              <p style="font-size:.85rem;color:#a1a1aa">\${esc(m.email)} \${esc(m.phone)}</p>
              <p style="margin:.5rem 0">\${esc(m.message)}</p>
              <button class="btn-ghost" onclick="markRead(\${m.id})">Mark read</button>
              <button class="btn-ghost" onclick="delMsg(\${m.id})">Delete</button>
            </div>
          \`).join('')}
        </div>
      \`;
      window.markRead = async (id) => {
        await api('/api/admin/messages/' + id, { method: 'PATCH', body: JSON.stringify({ is_read: true }) });
        showPage('messages');
      };
      window.delMsg = async (id) => {
        if (!confirm('Delete?')) return;
        await api('/api/admin/messages/' + id, { method: 'DELETE' });
        showPage('messages');
      };
    } else if (page === 'password') {
      main.innerHTML = \`
        <h1>Change Password</h1>
        <div class="card" style="max-width:400px">
          <label>New password (min 8)</label>
          <input id="newPass" type="password">
          <button id="savePass">Update Password</button>
        </div>
      \`;
      document.getElementById('savePass').onclick = async () => {
        await api('/api/admin/password', {
          method: 'POST',
          body: JSON.stringify({ newPassword: val('newPass') })
        });
        toast('Password updated');
      };
    }
  } catch (e) {
    main.innerHTML = '<p class="err">' + esc(e.message) + '</p>';
  }
}

function val(id) { return document.getElementById(id).value; }
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Auto login if token exists
(async () => {
  if (token) {
    try {
      await api('/api/admin/me');
      document.getElementById('loginView').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      showPage('dashboard');
    } catch { logout(); }
  }
})();
</script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname.replace(/\/+$/, '') || '/';
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      // Admin UI — not linked from public site
      const adminPath = env.ADMIN_PATH || 'admin';
      if (path === `/${adminPath}` || path === `/${adminPath}/`) {
        return new Response(ADMIN_HTML, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow',
            'Cache-Control': 'no-store',
          },
        });
      }

      if (path.startsWith('/api/admin')) {
        return await handleAdminApi(request, env, path, cors);
      }

      if (path.startsWith('/api/')) {
        return await handlePublic(request, env, path, cors);
      }

      return json({
        service: 'portfolio-api',
        endpoints: ['GET /api/portfolio', 'POST /api/contact', 'GET /api/health', `GET /${adminPath}`],
      }, 200, cors);
    } catch (e) {
      console.error(e);
      return json({ error: e.message || 'Server error' }, 500, cors);
    }
  },
};
