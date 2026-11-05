// Independent Websecure worker watchdog. Zero dependencies. Exits 1 when the
// worker heartbeat is stale, missing, or the check itself cannot be completed.
export async function checkWorker({url, key, worker, maxAgeSeconds, fetcher = fetch}) {
  if (!/^https:\/\/[a-z0-9-]{6,63}\.supabase\.co$/.test(url || '')) return {ok: false, reason: 'bad_project_url'};
  if (!key) return {ok: false, reason: 'missing_key'};
  let res;
  try {
    res = await fetcher(`${url}/rest/v1/rpc/ws_worker_freshness`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`},
      body: JSON.stringify({p_worker: worker, p_max_age_seconds: maxAgeSeconds}),
      signal: AbortSignal.timeout(15000),
    });
  } catch { return {ok: false, reason: 'unreachable'}; }
  if (!res.ok) return {ok: false, reason: `http_${res.status}`};
  let body;
  try { body = await res.json(); } catch { return {ok: false, reason: 'bad_response'}; }
  if (body?.healthy === true && Number.isInteger(body.age_seconds)) return {ok: true, ageSeconds: body.age_seconds};
  return {ok: false, reason: body?.age_seconds == null ? 'no_heartbeat' : 'stale', ageSeconds: body?.age_seconds ?? null};
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await checkWorker({
    url: process.env.SUPABASE_URL, key: process.env.SUPABASE_ANON_KEY,
    worker: process.env.WORKER_ID || 'oracle-mumbai-1', maxAgeSeconds: Number(process.env.MAX_AGE_SECONDS || 900),
  });
  console.log(JSON.stringify(r));
  if (!r.ok) { console.error('WEBSECURE WORKER ALERT: ' + r.reason); process.exit(1); }
}
