# Plan: direct-to-S3 bulk upload for the local app

## Context

The existing upload path (`/upload-image` → `uploadImageFunction`) works for the
admin web UI, but it's the wrong shape for a bulk tool dumping hundreds or
thousands of raw camera photos into a folder:

- The request body is base64-encoded JSON through API Gateway, capped at
  **10MB per request** (`buildUploadPayload`'s `MAX_UPLOAD_REQUEST_BYTES`).
  Base64 adds ~33% overhead, so the real per-file ceiling is closer to 7.5MB
  — too small for full-resolution camera JPEGs/RAWs.
- Thumbnailing and `PhotoMetadataTable` writes happen synchronously inside
  that one Lambda call, so a thousand-file batch would mean a thousand slow,
  serial (or awkwardly parallel) API calls all paying that encode/decode tax.

The fix: the local app uploads the raw file **straight to S3** via a
presigned URL (S3 has no such size ceiling — multi-GB objects are routine),
and an **S3 event automatically triggers a Lambda** to do the thumbnailing
and metadata work after the fact. The local app never touches the existing
`/upload-image` endpoint for bulk photos.

## Decisions already made

1. **Post-upload processing is event-driven**, not a "confirm" call from the
   app. The app uploads and moves on; S3 → Lambda handles the rest
   automatically and independently of whether the app is still running.
2. **Auth is interactive admin login** — the app logs into the same Cognito
   user pool everything else uses, not a separate long-lived service
   credential.

## Architecture

```
Local app                          AWS
----------                         ---
1. Admin logs in (Cognito SRP)
2. POST /presign-bulk-upload   -->  presignBulkUpload Lambda (admin-only)
   { folderId, fileNames[] }        validates folder, returns one presigned
                                     PUT URL per file, scoped to
                                     bulk-incoming/{folderId}/{fileName}
   <-- { uploads: [{fileName, uploadUrl, key}] }

3. PUT raw file bytes          -->  S3, straight to
   directly to each uploadUrl         bulk-incoming/{folderId}/{fileName}
   (no Lambda/API Gateway in          (app is done with this file now)
   this step at all)

                                    S3 "ObjectCreated" event, scoped to
                                    prefix bulk-incoming/, fires automatically
                                    -->  processBulkUpload Lambda:
                                         - reads the object
                                         - measures width/height
                                         - generates a thumbnail (same Jimp
                                           logic uploadImageFunction already
                                           has)
                                         - copies full-size to
                                           {folderId}/full/{fileName}
                                         - writes thumb to
                                           {folderId}/thumb/{fileName}
                                         - writes PhotoMetadataTable row
                                           (category: "bulk", width, height)
                                         - deletes the bulk-incoming/ staging
                                           object
```

### Why a `bulk-incoming/` staging prefix, not the canonical key directly

If the app PUT straight to `{folderId}/full/{fileName}` and the S3
notification watched the whole bucket (or the whole folder), the
processing Lambda's own write of `{folderId}/thumb/{fileName}` could
re-trigger itself, and there'd be no clean way to tell "uploaded, not yet
processed" apart from "already processed." Staging under a dedicated
`bulk-incoming/` prefix:

- scopes the S3 event notification to one unambiguous prefix filter
- makes "stuck" uploads visible (anything left under `bulk-incoming/` for
  more than a few minutes means processing failed or hasn't run)
- keeps the processing Lambda's own writes (`{folderId}/full/`,
  `{folderId}/thumb/`) completely outside the triggering prefix, so it can
  never re-trigger itself

## New backend pieces

- **`amplify/functions/presignBulkUpload/`** (new Lambda, admin-only,
  `POST /presign-bulk-upload`). Body: `{ folderId, fileNames: string[] }`.
  Validates the folder exists (reuse the check `uploadImageFunction` already
  does), rejects `folderId === "public"` outright (bulk photos must never be
  reachable from the public gallery — same rule already enforced for the
  existing upload path). For each filename, sanitizes it and checks whether
  `{folderId}/full/{fileName}` already exists; if so, appends a short random
  suffix before building the key, so a camera reusing filenames (e.g.
  `IMG_0001.jpg` across two shoots) never silently overwrites an earlier
  upload. Returns one presigned `PutObjectCommand` URL per file (via
  `getSignedUrl`, ~5–10 minute expiry), batched in one call so a
  thousand-file run isn't a thousand separate presign round-trips — the
  local app should request these in chunks (e.g. 50–100 filenames per call).

- **`amplify/functions/processBulkUpload/`** (new Lambda, **not**
  API-facing — triggered only by the S3 event notification, same shape as
  `retentionSweep`). On invocation: downloads the object from
  `bulk-incoming/{folderId}/{fileName}`, measures dimensions via Jimp,
  generates the thumbnail (lift the existing `createThumbnail` logic out of
  `uploadImageFunction` into `amplify/functions/shared/` so both Lambdas use
  the same code — don't duplicate it), writes `full/`+`thumb/` objects at
  the canonical keys, calls `syncPhotoTags` with
  `attributes: { category: "bulk", width, height }`, then deletes the
  staging object. On any failure, logs and **does not delete** the staging
  object, so it stays visible as stuck/needing attention rather than
  silently vanishing.

- **S3 event notification** on the bucket, prefix filter `bulk-incoming/`,
  `ObjectCreated` events, targeting `processBulkUpload`.

  **Caveat to check before wiring this up:** the bucket is imported via
  `Bucket.fromBucketName` in `backend.ts`, not created by this CDK app.
  CDK's `addEventNotification` on an imported bucket works (via a custom
  resource that calls `PutBucketNotificationConfiguration`), but that API
  call **replaces the bucket's whole notification configuration** unless
  CDK is told about every existing rule. Before adding this, run
  `aws s3api get-bucket-notification-configuration --bucket my-photo-site-assets`
  and confirm there's nothing already configured that this would clobber.

- **Guardrails on `processBulkUpload`** given it can fire in large,
  near-simultaneous bursts:
  - Reserved concurrency (e.g. 50–100) so a multi-thousand-photo burst can't
    starve every other Lambda in the account of its share of the default
    1,000 concurrent-execution account limit.
  - An on-failure destination (SQS dead-letter queue) so a photo that fails
    processing after S3/Lambda's automatic retries is logged somewhere
    visible, not silently dropped.

## Local app responsibilities

1. **Auth**: interactive Cognito login (SRP), same user pool as the web
   app. Store the resulting tokens for the session; refresh them if a
   large batch runs long enough for the ID token (1 hour) to expire —
   mirror the refresh behavior `aws-amplify/auth`'s `fetchAuthSession`
   already provides on the web side.
2. **Presign in batches**: call `/presign-bulk-upload` with chunks of
   filenames (not one file at a time), building a local queue of
   `{fileName, uploadUrl, key}`.
3. **Upload with bounded concurrency**: PUT each file to its presigned URL;
   run several in parallel (not all at once — pick a sane cap, e.g. 5–10
   concurrent) rather than one at a time or fully unbounded.
4. **Retry on failure**: a presigned URL PUT can fail transiently (network
   blip); retry a handful of times with backoff before giving up on a file
   and reporting it.
5. **Progress/completion is upload-only, not processing-complete**: once
   the PUT succeeds, the app's job for that file is done — it has no
   visibility into thumbnailing/metadata finishing (that's async and
   decoupled by design). If the app wants to confirm a file is fully usable
   before considering the whole batch "done," it would need to poll
   `GET /photos?folderId=...&category=bulk` and check the file shows up
   with a `liked`/`category` field populated — optional, not required for
   the core flow to work.

## Open items that need a decision before building

- **CORS on the bucket**: only needed if the local app issues the PUT from
  a browser-engine context (Electron/Tauri renderer, or any web-tech GUI)
  with `fetch`. A plain native process or Node/Python script making a
  server-side HTTPS request doesn't go through browser CORS at all. Confirm
  which kind of app this is before deciding whether a bucket CORS rule is
  needed.
- **Duplicate-folder-name collisions across runs**: the random-suffix
  approach above avoids silent overwrites, but means a re-run of the same
  shoot produces duplicates rather than replacing. Fine for a one-shot bulk
  dump; worth confirming that's the desired behavior rather than "re-running
  should overwrite."
- **What the local app shows the photographer for "stuck" files**: since
  processing is decoupled, the app has no natural way to surface a
  processing failure back to the person running it. Worth deciding whether
  that's acceptable (check CloudWatch/DLQ manually if something seems
  missing) or whether a lightweight "list what's still in `bulk-incoming/`"
  admin view is worth adding later.

## Rollout checklist

1. Check the bucket's existing notification configuration (see caveat above)
   before wiring the new one.
2. Extract shared thumbnail/dimension logic out of `uploadImageFunction`
   into `amplify/functions/shared/` first, so `processBulkUpload` doesn't
   duplicate it.
3. Build `presignBulkUpload` and `processBulkUpload`, wire the S3 event
   notification, set reserved concurrency + DLQ on `processBulkUpload`.
4. Deploy, then test with a small batch (5–10 files) before trying
   hundreds/thousands — confirm thumbnails, dimensions, and `category: "bulk"`
   all land correctly, and that a deliberately-corrupted test file ends up
   in the DLQ instead of vanishing silently.
5. Only then point the real local app at it for a full bulk run.
