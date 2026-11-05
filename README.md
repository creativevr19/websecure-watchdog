# websecure-watchdog

Independent heartbeat check for the Websecure monitoring worker. Runs on GitHub's schedule (best effort) and fails, which makes GitHub email the repo owner, when the worker heartbeat is stale or missing.

Contains no secrets. Repository secrets `SUPABASE_URL` and `SUPABASE_ANON_KEY` (publishable key only) are set in GitHub settings. The database function it calls returns only `healthy` and `age_seconds`.
