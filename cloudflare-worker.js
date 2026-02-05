/**
 * SubTrack - Cloudflare Worker
 * Handles authentication and data storage via KV
 */

const COOKIE_NAME = 'subtrack_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const GITHUB_ORIGIN = 'https://panpapadopoulos.github.io';
const GITHUB_PATH = '/subtrack';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // 1. API routes (KV Data storage)
        if (url.pathname.startsWith('/api/')) {
            return handleAPI(request, env, url);
        }

        // 2. Auth handlers
        if (url.pathname === '/login' && request.method === 'POST') {
            return handleLogin(request, env, url);
        }
        if (url.pathname === '/logout') {
            return handleLogout();
        }

        // 3. Authentication Check
        const isAuthenticated = await checkAuth(request, env);
        if (!isAuthenticated) {
            return serveLoginPage();
        }

        // 4. Proxy content from GitHub Pages
        return proxyToGitHub(request, url);
    }
};

async function checkAuth(request, env) {
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const authToken = cookies[COOKIE_NAME];
    if (!authToken) return false;
    try {
        const expectedToken = btoa(env.PASSWORD);
        return authToken === expectedToken;
    } catch {
        return false;
    }
}

async function handleLogin(request, env, url) {
    try {
        const formData = await request.formData();
        const password = formData.get('password');
        if (password === env.PASSWORD) {
            const token = btoa(env.PASSWORD);
            return new Response(null, {
                status: 302,
                headers: {
                    'Location': '/',
                    'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`
                }
            });
        }
        return serveLoginPage('Invalid password');
    } catch (e) {
        return serveLoginPage('Login failed: ' + e.message);
    }
}

function handleLogout() {
    return new Response(null, {
        status: 302,
        headers: {
            'Location': '/',
            'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
        }
    });
}

async function handleAPI(request, env, url) {
    const isAuthenticated = await checkAuth(request, env);
    if (!isAuthenticated) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (url.pathname === '/api/data') {
        if (request.method === 'GET') {
            const data = await env.SUBTRACK_DATA.get('user_data', 'json');
            return new Response(JSON.stringify(data || { jobs: [], payments: [] }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        if (request.method === 'POST') {
            try {
                const data = await request.json();
                await env.SUBTRACK_DATA.put('user_data', JSON.stringify(data));
                return new Response(JSON.stringify({ success: true }));
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 400 });
            }
        }
    }
    return new Response('Not found', { status: 404 });
}

async function proxyToGitHub(request, url) {
    let path = url.pathname;

    // Normalize root path
    if (path === '/' || !path.includes('.')) {
        path = '/index.html';
    }

    const githubUrl = `${GITHUB_ORIGIN}${GITHUB_PATH}${path}`;

    try {
        const response = await fetch(githubUrl, {
            headers: {
                'Host': 'panpapadopoulos.github.io',
                'User-Agent': 'SubTrack-Pro-Worker',
                'Accept': request.headers.get('Accept') || '*/*',
            }
        });

        if (!response.ok) {
            if (response.status === 404 && !path.includes('.')) {
                return fetch(`${GITHUB_ORIGIN}${GITHUB_PATH}/index.html`, {
                    headers: { 'Host': 'panpapadopoulos.github.io' }
                });
            }
            return new Response(`Origin Error: ${response.status} for ${githubUrl}`, {
                status: response.status,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        const newHeaders = new Headers(response.headers);
        newHeaders.delete('X-Frame-Options');
        newHeaders.delete('Content-Security-Policy');
        newHeaders.set('X-Proxied-By', 'SubTrack-Proxy');

        return new Response(response.body, {
            status: response.status,
            headers: newHeaders
        });
    } catch (e) {
        return new Response(`Worker Exception: ${e.message}`, { status: 502 });
    }
}

function parseCookies(header) {
    const cookies = {};
    if (!header) return cookies;
    header.split(';').forEach(c => {
        const [n, ...r] = c.trim().split('=');
        if (n) cookies[n] = r.join('=');
    });
    return cookies;
}

function serveLoginPage(error = '') {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SubTrack - Login</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f172a' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20'/%3E%3Cpath d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'/%3E%3Ccircle cx='12' cy='12' r='3' fill='%2310b981' stroke='none'/%3E%3C/svg%3E" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Inter', sans-serif; background:#0f172a; min-height:100vh; display:flex; align-items:center; justify-content:center; }
        .card { background:white; border-radius:32px; padding:48px; width:100%; max-width:420px; box-shadow:0 25px 50px rgba(0,0,0,0.5); }
        .logo { display:flex; align-items:center; gap:12px; margin-bottom:12px; font-weight:900; font-size:24px; color:#0f172a; }
        h1 { font-size:28px; font-weight:900; color:#0f172a; margin-bottom:32px; }
        .error { color:#dc2626; margin-bottom:16px; font-weight:700; padding:12px; background:#fef2f2; border-radius:12px; font-size:14px; }
        input { width:100%; padding:16px; font-size:16px; border:2px solid #e2e8f0; border-radius:16px; margin-bottom:16px; }
        button { width:100%; padding:18px; background:#0f172a; color:white; border:none; border-radius:16px; font-weight:800; cursor:pointer; font-size:16px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">
            <div style="background:#0f172a; color:white; padding:8px 12px; border-radius:12px; position:relative; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                S
                <div style="position:absolute; top:-4px; right:-4px; width:10px; height:10px; background:#10b981; border:2px solid white; border-radius:50%;"></div>
            </div>
            SubTrack
        </div>
        <h1>Welcome back</h1>
        ${error ? `<div class="error">${error}</div>` : ''}
        <form method="POST" action="/login">
            <input type="password" name="password" placeholder="Enter password" required autofocus>
            <button type="submit">Sign In</button>
        </form>
    </div>
</body>
</html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
