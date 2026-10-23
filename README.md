# Cammirka

Cameron Mirka's wildlife photography site. Next.js frontend + AWS Amplify
Gen 2 backend (Cognito + API Gateway + Lambda + DynamoDB + S3/CloudFront) in
one repo.

This frontend is a from-scratch rebuild (previously a CRA + MUI app) — same
backend, same capabilities, new UI. The backend under `amplify/` was not
changed as part of that rebuild.

## Setup

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Fill in `.env.local` with the backend config values. These are public
config (already shipped to every browser), not secrets:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_PHOTO_API_URL` | `custom.photoApi.url` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `auth.user_pool_id` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `auth.user_pool_client_id` |
| `NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID` | `auth.identity_pool_id` |
| `NEXT_PUBLIC_AWS_REGION` | `auth.aws_region` |
| `NEXT_PUBLIC_CLOUDFRONT_DOMAIN` | `custom.cloudfront.domain` |

all from a generated `src/amplify_outputs.json` — produced by running a
backend sandbox or deploy (see `NEXT_STEPS.md` section 9), or copied from
whichever environment's config you're pointing the frontend at.

Open [http://localhost:3000](http://localhost:3000). The app talks directly
to the real, already-deployed AWS backend — there is no local/mock backend.
Admin actions (delete folder/photo, remove user, etc.) are real and
irreversible against that backend, so test them against a disposable
folder/photo first.

## Scripts

- `npm run dev` — local dev server (Turbopack)
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — ESLint
- `npm run test` — Vitest (once), `npm run test:watch` for watch mode
- `npx tsc --noEmit` — type-check

## Structure

```
amplify/            Backend: Cognito, API Gateway, Lambda functions, infra (CDK)
src/
  app/
    (public)/       Home, Archive, About — no auth
    (auth)/login/   Custom sign-in/sign-up/confirm + invite redemption
    (private)/      Account, My Photos — behind RequireAuth
    (admin)/admin/  Admin console, split by section — behind RequireAdmin
  lib/
    api/            Typed client functions for every backend route
    query/          TanStack Query hooks (data + mutations, optimistic updates)
    auth/           Cognito auth context, route guards, invite-code flow
  components/       Shared UI (gallery grid, lightbox, tag input)
```

## Known intentional differences from the pre-rebuild frontend

- No Amplify `<Authenticator>` widget — fully custom auth forms.
- No nanogallery2/jQuery, and the old app's dead `pages/home/*` /
  `pages/about/*Section.tsx` component trees were not ported (confirmed
  unused before removal).
- Batch tag edits in the admin photo library commit each photo to the
  backend sequentially and stop on the first failure, but do **not** revert
  already-succeeded photos in that batch back to their old tags in the UI —
  the backend already committed those, so reverting the UI would just make
  it lie about server state.

## Known follow-up needed before deploying this branch

`amplify.yml`'s frontend build phase (`npm run build`, publishing a
`build/` directory) still assumes the old CRA output. Next.js's build
output and Amplify Hosting's SSR deployment artifacts work differently —
this needs to be updated and verified against an actual Amplify Hosting
build before this branch is deployed. Not changed here since it couldn't
be verified without a real deploy.
