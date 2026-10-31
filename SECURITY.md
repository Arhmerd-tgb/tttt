# Security notes

## Authentication and sessions

- Passwords are hashed with Node `scrypt` (16-byte random salt, 64-byte key) and verified with `timingSafeEqual`. Legacy SHA-256 hashes are still accepted and are upgraded to `scrypt` on the next successful sign-in.
- Session tokens are 32 random bytes (base64url). Only the SHA-256 hash of each token is persisted, and sessions expire after `SESSION_TTL_HOURS` (default 720 hours / 30 days).
- Sign-out deletes the server-side session, so a stolen token stops working immediately.
- Admin-only routes require `role: "admin"` on every request; role checks are enforced server-side.
- The bootstrap default administrator (`admin@ashmie.io`) is disabled when `NODE_ENV=production` unless `ALLOW_DEFAULT_ADMIN=true` is explicitly set.
- Admin sign-up requires the rotating admin code (`ADMIN_SIGNUP_CODE`, stored as a SHA-256 hash in the data store).

## Transport and headers

- Content Security Policy, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP and HSTS (when served over HTTPS) are applied to every response.
- `X-Powered-By` is disabled.
- API responses are sent with `Cache-Control: no-store`.
- CORS is an allowlist: local dev origins, `capacitor://localhost`, `https://localhost`, plus `CORS_ALLOWED_ORIGINS`.
- `TRUST_PROXY` must be set to the number of proxy hops (e.g. `1` on Render) so rate limits see real client IPs.

## Abuse protection

- Global limit: 600 requests per IP per minute.
- Sign-in/sign-up: 30 requests per IP per 15 minutes.
- Payment initialize/verify: 20 requests per IP per 5 minutes.
- Chat send and review submit: 60 requests per IP per 5 minutes.
- JSON bodies are capped at 512 KB (8 MB only for chat uploads and admin product images); the Paystack webhook is capped at 1 MB and verified by HMAC signature.

## Data handling

- `data/store.json` contains real customer records and is git-ignored. Back it up securely and restrict file permissions on the production host.
- Product, category, training and chat values are escaped before being inserted into HTML; image sources are restricted to `https:` URLs or genuine PNG/JPEG/WebP data URLs under 2 MB.
- The Paystack secret key stays on the server. Order totals are always recalculated from server-side prices before a payment is initialized.

## Native app hardening

- Android: `allowBackup=false`, `usesCleartextTraffic=false`, network security config rejects cleartext, and device-transfer/cloud-backup rules exclude app data.
- iOS: App Transport Security stays enabled (`NSAllowsArbitraryLoads=false`), and only the `ashmie` URL scheme is registered.
- Session tokens are stored with Capacitor Preferences (app-private storage) instead of browser `localStorage`.

## Production checklist

- [ ] Set `NODE_ENV=production`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a long unique `ADMIN_SIGNUP_CODE`.
- [ ] Set `TRUST_PROXY=1` when running behind a reverse proxy or platform load balancer.
- [ ] Set `CORS_ALLOWED_ORIGINS` to the exact public web origin (for example `https://ashmie.example.com`).
- [ ] Set `PUBLIC_APP_URL` and `PAYSTACK_CALLBACK_URL`; use live Paystack keys only after end-to-end testing.
- [ ] Serve the API over HTTPS only; HSTS is emitted for secure requests.
- [ ] Keep `data/store.json` out of version control and back it up.
- [ ] Build native apps with `VITE_API_BASE_URL` pointing at the HTTPS API.
- [ ] Rotate `ADMIN_SIGNUP_CODE` after onboarding staff.
