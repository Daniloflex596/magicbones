/* ==========================================================================
   L'accesso all'app Bottega: il PIN diventa una "tessera" firmata (HMAC
   SHA-256 con il segreto SEGRETO), salvata come cookie HttpOnly. Funziona
   uguale su Cloudflare e in Node (Web Crypto).
   ========================================================================== */
const enc = new TextEncoder();
export const COOKIE = 'mb_bottega';
export const DURATA = 180 * 24 * 3600;   // 6 mesi: Claudia non deve rifare il PIN ogni volta

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function daB64url(s) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}
function chiave(segreto) {
  return crypto.subtle.importKey('raw', enc.encode(segreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function creaTessera(segreto, ora = Date.now(), durata = DURATA) {
  if (!segreto || segreto.length < 16) throw new Error('SEGRETO mancante o troppo corto');
  const corpo = b64url(enc.encode(JSON.stringify({ scade: Math.floor(ora / 1000) + durata })));
  const firma = new Uint8Array(await crypto.subtle.sign('HMAC', await chiave(segreto), enc.encode(corpo)));
  return corpo + '.' + b64url(firma);
}

export async function tesseraValida(segreto, tessera, ora = Date.now()) {
  if (!segreto || typeof tessera !== 'string') return false;
  const [corpo, firma] = tessera.split('.');
  if (!corpo || !firma) return false;
  try {
    const ok = await crypto.subtle.verify('HMAC', await chiave(segreto), daB64url(firma), enc.encode(corpo));
    if (!ok) return false;
    const { scade } = JSON.parse(new TextDecoder().decode(daB64url(corpo)));
    return typeof scade === 'number' && scade > ora / 1000;
  } catch (e) {
    return false;
  }
}

// confronto a tempo costante: non dice "quante cifre erano giuste"
export function pinGiusto(dato, atteso) {
  const a = enc.encode(String(dato || '')), b = enc.encode(String(atteso || ''));
  if (!b.length) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i] || 0) ^ b[i];
  return diff === 0;
}

export function leggiCookie(request, nome) {
  const c = request.headers.get('Cookie') || '';
  for (const parte of c.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nome) return v.join('=');
  }
  return null;
}

export function cookieTessera(tessera, durata = DURATA) {
  return `${COOKIE}=${tessera}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${durata}`;
}
