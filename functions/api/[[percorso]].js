// Cloudflare Pages: tutte le richieste a /api/… arrivano qui (vedi lib/api.js)
import { gestisci } from '../../lib/api.js';

export const onRequest = ({ request, env }) => gestisci(request, env);
