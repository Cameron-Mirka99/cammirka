# Next Steps

This project now includes:
- Amplify Gen 2 auth (email/password), with `admin` and `user` groups
- Invite‑based folder assignment via `custom:folderId`
- Admin tools for folders/invites/uploads/moves
- Protected API routes backed by Cognito
- CloudFront URLs for images

Follow these steps in order.

---

## 1) Install dependencies (local)

From the repo root:

```powershell
npm install
```

---

## 2) Update Cognito hosted UI settings in code (optional)

Edit:
- `amplify/auth/resource.ts`

If you are only using email/password (no external providers), you can skip this.

---

## 3) Set Amplify env variables

In **Amplify Console → App settings → Environment variables** (or Secrets):

- `REACT_APP_PHOTO_API_URL` = your API base URL (e.g. `https://xxxx.execute-api.us-east-1.amazonaws.com/prod`)

After setting these, **trigger a new build**.

---

## 4) Deploy backend + frontend

Commit and push all changes:

```powershell
git add .
git commit -m "Add auth, invites, folders, admin tools"
git push
```

Then wait for the Amplify build to finish.

---

## 5) Add yourself to the admin group

1. AWS Console → **Cognito** → **User Pools**
2. Open the pool created by Amplify
3. **Groups** → `admin` → **Add user**

This unlocks `/admin`.

---

## 6) Create folders and invites (admin only)

1. Sign in at `/login`
2. Go to `/admin`
3. Create a **folder** (human‑readable ID)
4. Create an **invite**
5. Send invite URL to users

Invite URLs are multi‑use and expire after ~30 days.

---

## 7) User signup flow

1. User visits `/login?invite=INVITE_CODE`
2. User signs up
3. App calls `/accept-invite` and assigns `custom:folderId`
4. User can access `/my-photos`

---

## 8) Upload & manage photos (admin only)

Use the `/admin` page to:
- Upload images to a folder
- Move images between folders

Uploads are blocked if the folder does not exist.

---

## 9) Local development (optional)

Start Amplify sandbox locally:

```powershell
npx ampx sandbox --outputs-out-dir src --outputs-format json
```

Start the frontend:

```powershell
npm start
```

---

## Troubleshooting

- **No photos returned**: confirm the user has `custom:folderId` and photos exist under that prefix in `my-photo-site-assets`.
- **Auth errors**: verify `domainPrefix` and callback/logout URLs (if you later add external providers).
- **API 401**: ensure the frontend is sending a valid Cognito ID token (handled by `authFetch`).
*** End Patch}"}}
