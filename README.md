# ASHMIE CAKES & MORE

ASHMIE CAKES & MORE is a bakery storefront and training portal built with Vite and Express. Customers can create accounts, shop, and pay at checkout. Administrator registration requires the current approval code.

## Features

- Vite frontend for the web UI
- Express API for auth, dashboard, pricing, and project data
- Customer registration and sign-in
- Admin-only dashboard and payment settings
- Local JSON persistence for users, orders, and payment details
- Render deployment configuration
- Basic Node test coverage

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Start the app

```bash
npm run dev
```

This runs both the API and the frontend together.

### 3) Build the frontend

```bash
npm run build
```

### 4) Run the production server

```bash
npm run start
```

## Useful scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
npm run check
```

## Windows note

If PowerShell blocks script execution in this environment, run the commands with an explicit Node path or bypass the policy for the current session:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
npm install
npm run dev
```

Alternatively, you can run Node-based checks directly:

```powershell
node --test
```

## API overview

- `GET /api/health` — app health check
- `POST /api/auth/login` — sign in
- `POST /api/auth/signup` — create a new user
- `POST /api/auth/logout` — invalidate the current session
- `GET /api/chat/messages` — read the signed-in customer’s own support thread; admins must provide a conversation ID
- `POST /api/chat/messages` — send a support message or admin reply
- `GET /api/admin/chat/conversations` — list customer conversations (administrator only)
- `GET /api/reviews` — customer-submitted product reviews
- `POST /api/reviews` — add or update a rating and review (signed-in customer)
- `GET /api/payment-details` — checkout transfer details
- `POST /api/payments/initialize` — validate and initialize a Paystack transaction
- `GET /api/payments/verify` — verify a Paystack transaction before marking an order paid
- `POST /api/paystack/webhook` — validate Paystack payment event signatures
- `PUT /api/admin/payment-details` — update transfer details (administrator only)
- `POST /api/admin/admins` — create another administrator (administrator only)
- `GET /api/admin/overview` — business dashboard (administrator only)
- `PATCH /api/admin/orders/:orderId/status` — approve, reject, process, or complete a paid order (administrator only)
- `PUT /api/admin/admin-signup-code` — rotate the admin registration code (administrator only)
- `GET /api/dashboard` — dashboard cards and metrics
- `GET /api/pricing` — pricing plan data
- `GET /api/workspace` — workspace metrics and project summaries
- `GET /api/projects` — project list
- `POST /api/projects` — create a project

## Environment variables

Copy `.env.example` to `.env`, then set the bootstrap administrator email/password and a Paystack **test** secret key. Admin registration uses the approval code, which defaults to `RAJI` and can be changed from the admin dashboard. Keep the Paystack secret on the server; never put it in a `VITE_` variable.

```env
PORT=3001
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-long-unique-password
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_CALLBACK_URL=
VITE_APP_NAME=ASHMIE CAKES & MORE
VITE_APP_TAGLINE=Cakes, pastries & treats for every celebration.
VITE_APP_DESCRIPTION=Ashmie Cakes & More creates delightful cakes, pastries and snacks for birthdays, events and everyday treats across Nigeria.
```

The administrator signs in from the same Account portal as customers. On Render, configure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `PAYSTACK_SECRET_KEY` in the service environment settings. In the Paystack dashboard, set the webhook URL to `https://your-domain/api/paystack/webhook`. Use test keys until the integration has been verified, then replace them with live keys.

Registration defaults to customer accounts. Admin registration requires the signup code, which defaults to `RAJI` and can be rotated from the administrator dashboard. Paid orders move through Awaiting approval, Approved, Processing, and Completed; administrators can reject before completion.

## Deployment

The project includes a Render config in [render.yaml](render.yaml). It builds the frontend and starts the Express server using the production command.

## Notes

The current app uses a JSON file for persistence and in-memory sessions. For production use, move to a managed database and durable, hashed-password authentication.
