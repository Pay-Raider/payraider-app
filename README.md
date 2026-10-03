# PayRaider Web App

**See how healthy a Stellar payment corridor is, check a payment before sending it, and manage API access, all in the browser.**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![Stellar](https://img.shields.io/badge/Stellar-Freighter%20%7C%20xBull%20%7C%20LOBSTR-black)

Part of [PayRaider](https://github.com/Pay-Raider): [backend](https://github.com/Pay-Raider/payraider-backend) · [plugin & SDKs](https://github.com/Pay-Raider/payraider-plugin) · [contracts](https://github.com/Pay-Raider/payraider-contracts) · [mobile](https://github.com/Pay-Raider/payraider-mobile)

---

## What you can do

| Page | What it's for |
| --- | --- |
| **Check a payment** (`/prediction`) | Enter source, destination and amount; get proceed / caution / hold, the observed success rate with a confidence interval, and healthier alternatives |
| **Corridors** (`/corridors`) | Every corridor's success rate (failed payments included), liquidity and health |
| **Anchors** (`/anchors`) | Anchor directory and reliability |
| **Dashboard** (`/dashboard`) | Network overview |
| **API keys** (`/developer/keys`) | Sign in with your Stellar wallet, create and rotate keys, and upgrade a key to the Pro plan by paying USDC |

Available in English, Spanish and Chinese.

## Quick start

Requires Node.js 20+ and pnpm, plus a running [PayRaider backend](https://github.com/Pay-Raider/payraider-backend).

```bash
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL to your backend
pnpm install
pnpm dev                       # http://localhost:3000
```

Production build:

```bash
pnpm build
pnpm start
```

Deploy on Render with the `render.yaml` Blueprint; see the [deployment guide](https://github.com/Pay-Raider/payraider-backend/blob/main/docs/DEPLOY.md).

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | yes | Backend URL, e.g. `https://api.example.com`. The app will not start without it |
| `NEXT_PUBLIC_STELLAR_NETWORK` | yes | `mainnet` or `testnet`; used for wallet payments |
| `NEXT_PUBLIC_SENTRY_DSN` | no | Error reporting |
| `INTERNAL_SECRET` | production | Protects the internal monitoring page |

`NEXT_PUBLIC_*` values are compiled into the build; rebuild after changing them.

### Wallet sign-in

Sign in with [Freighter](https://www.freighter.app/), [xBull](https://xbull.app/) or [LOBSTR](https://lobstr.co/signer-extension/): the app asks the wallet to sign a one-time challenge message, and the backend checks the signature. The same wallet signs USDC plan payments. Albedo and Rabet cannot sign messages, so they cannot be used to sign in. For sign-in to work, the backend's `SEP10_HOME_DOMAIN` must equal the host name this app is served from.

## Development

```bash
pnpm lint            # ESLint
pnpm exec tsc --noEmit
pnpm test            # Vitest unit and component tests
pnpm build
```

Browser tests (Playwright) live in `src/__tests__/e2e` and `acceptance/`.

## Project layout

| Path | Contents |
| --- | --- |
| `src/app/[locale]/` | Pages, one folder per route |
| `src/components/` | UI components |
| `src/lib/` | API clients (`api-keys.ts`, `pay-invoice.ts`, `api/`), wallet adapters (`wallets.ts`), utilities |
| `src/services/` | Wallet sign-in and anchor (SEP-6/24/31) services |
| `messages/` | Translations (`en`, `es`, `zh`) |
| `acceptance/` | End-to-end acceptance tests |

## License

[Apache 2.0](LICENSE)
