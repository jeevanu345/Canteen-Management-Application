# Instant Canteen

Instant Canteen is a mobile-oriented ordering prototype for campus canteens. Students can browse available items and place orders before break periods, while staff can maintain menus and process incoming orders.

## Payment scope

The interface can present or launch a UPI payment flow. A QR code or payment-app redirect alone does not prove settlement. Treat an order as paid only if the configured backend receives and verifies a trusted payment-provider confirmation.

## Current stack

- React and TypeScript
- Vite
- Tailwind CSS
- Supabase authentication and data access

## Main workflows

- Student authentication and menu browsing
- Order creation
- Staff menu management
- Staff order review and status updates
- UPI-oriented payment handoff

The exact production status of payment verification and notification integrations should be confirmed before deployment.

## Local setup

```bash
git clone https://github.com/jeevanu345/Canteen-Management-Application.git
cd Canteen-Management-Application
npm install
```

Create an untracked `.env.local` file:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then run:

```bash
npm run dev
```

The default Vite development URL is `http://localhost:5173`.

## Validation

```bash
npm run lint
npm run build
```

## Data and security considerations

- Enforce student and staff authorization in Supabase policies, not only in the UI.
- Verify order ownership and allowed state transitions on trusted infrastructure.
- Never expose service-role keys in Vite environment variables.
- Use a payment-provider verification mechanism before representing an order as paid.

## Current limitations

- Automated tests are not documented.
- Payment verification requires validation against the deployed configuration.
- Schema migrations and seeded demo data are not yet documented at the repository root.
