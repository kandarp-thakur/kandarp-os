# Media — Kandarp OS Backend

> Storage abstraction and image optimization for the media library.
> Local disk (dev) or Cloudinary (prod) with zero route-handler changes.

---

## Overview

The media library stores uploaded files and their optimized variants. The
**storage abstraction** ([`storage.ts`](../../src/lib/admin/storage.ts)) lets the
app run with local disk (dev) or Cloudinary (prod) — the provider is selected at
module load based on env config.

The **image-optimization pipeline** ([`image-optimization.ts`](../../src/lib/admin/image-optimization.ts))
generates responsive variants (thumbnail/medium/large) in the original format +
WebP + AVIF, plus an inline blur placeholder, using [sharp](https://sharp.pixelplumbing.com/).

---

## Storage Providers

### Provider Selection

The provider is selected once at module load:

```ts
if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    return new CloudinaryStorageProvider();
}
return new LocalStorageProvider();
```

If all three Cloudinary env vars are present, Cloudinary is used. Otherwise, local
disk. This means the same code runs in dev (local disk) and prod (Cloudinary) with
zero route-handler changes.

### Interface

```ts
interface StorageProvider {
    upload(
        key: StorageKey,
        buffer: Buffer,
        mimeType: string,
    ): Promise<UploadResult>;
    read(key: StorageKey): Promise<Buffer>;
    delete(key: StorageKey): Promise<void>;
    deleteMany(keys: StorageKey[]): Promise<void>;
    publicUrl(key: StorageKey): string;
    readonly isRemote: boolean;
}
```

### Local Storage

- **Location**: `public/media/<uuid>.<ext>`
- **Public URL**: `/media/<filename>` (served statically by Next.js)
- **Atomic writes**: temp file + rename (crash-safe)
- **Use case**: development, self-hosted deploys without a CDN

### Cloudinary Storage

- **Location**: `<CLOUDINARY_UPLOAD_FOLDER>/<public-id>` in the Cloudinary cloud
- **Public URL**: `https://res.cloudinary.com/<cloud>/image/upload/<id>` (CDN-backed)
- **Variants**: on-the-fly URL transforms (no separate files uploaded)
- **Use case**: production, CDN-backed delivery

---

## Image Optimization

### Variant Buckets

| Size        | Max Width | Use Case                              |
| ----------- | --------- | ------------------------------------- |
| `thumbnail` | 320 px    | Grid/list previews, mobile thumbnails |
| `medium`    | 768 px    | Tablet + most card images             |
| `large`     | 1280 px   | Desktop / hero / full-bleed           |

Each variant is emitted in:

- The **original format** (kept)
- **WebP** (best compression for photos)
- **AVIF** (best compression, modern browsers)

Variants wider than the source are skipped (no upscaling), except `thumbnail`
which always generates.

### Blur Placeholder

A tiny (20px wide) heavily-blurred JPEG, encoded as a base64 data URI. The public
site inlines this in `<img>`/`<picture>` so the frame is never empty while the
real image loads, then cross-fades.

### Provider Behavior

| Operation               | Local                        | Cloudinary                      |
| ----------------------- | ---------------------------- | ------------------------------- |
| Upload original         | Write to `public/media/`     | Upload to Cloudinary            |
| Generate variants       | Write separate files to disk | Build URL transforms (no files) |
| Read source (for sharp) | `fs.readFileSync`            | `fetch` from CDN                |
| Crop source             | Overwrite file on disk       | Re-upload cropped buffer        |
| Delete asset            | `unlinkSync` all files       | `destroy` the public id         |
| Delete variants         | `unlinkSync` variant files   | No-op (URL transforms)          |

The `variantUrl()` helper builds Cloudinary transform URLs so the public site's
`<picture>` srcset logic works unchanged regardless of provider.

---

## Upload Constraints

| Constraint            | Value                     | Enforcement                                    |
| --------------------- | ------------------------- | ---------------------------------------------- |
| Max file size         | 10 MB                     | Upload route + middleware (12 MB body limit)   |
| Allowed image formats | JPG, PNG, WebP, AVIF, GIF | MIME type allowlist                            |
| Filename              | `<uuid>.<ext>`            | Extension from MIME type (never user-supplied) |
| Non-image documents   | PDF, TXT, MD, JSON, ZIP   | Allowed (no optimization)                      |

### Path Traversal Prevention

The on-disk filename is derived from the validated MIME type — never the
user-supplied name. A malicious name like `../../evil.js` or `shell.exe` cannot
control the on-disk filename or bypass the type check.

---

## Cloudinary Setup

### 1. Create a Cloudinary Account

Sign up at [cloudinary.com](https://cloudinary.com) (free tier: 25 credits/month).

### 2. Get Your Credentials

From the Cloudinary dashboard, copy:

- **Cloud name** → `CLOUDINARY_CLOUD_NAME`
- **API key** → `CLOUDINARY_API_KEY`
- **API secret** → `CLOUDINARY_API_SECRET`

### 3. Set Environment Variables

```bash
# .env.local (or production env)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_FOLDER=kandarp-os
```

### 4. Restart the Server

The storage provider is selected at module load. Restart `npm run dev` (or
redeploy) after changing env vars.

### 5. Verify

Upload an image via the admin media library. The asset's `path` should be a
`https://res.cloudinary.com/...` URL (not `/media/...`).

---

## MediaAsset Schema

```ts
interface MediaAsset {
    id: string;
    name: string; // <uuid>.<ext>
    originalName: string; // user-supplied name (display only)
    mimeType: string;
    size: number; // bytes
    path: string; // public URL (local: /media/..., cloud: https://...)
    alt: string;
    folder: string; // virtual folder path
    width?: number;
    height?: number;
    tags: string[];
    metadata: Record<string, unknown>;
    usageCount: number;
    optimized: boolean;
    variants: MediaVariant[];
    blurDataUrl: string;
    focalPoint: { x: number; y: number } | null;
    archivedAt: string | null;
}
```

### MediaVariant

```ts
interface MediaVariant {
    size: "thumbnail" | "medium" | "large";
    width: number;
    height: number;
    path: string; // original-format variant URL
    webp?: string; // WebP variant URL
    avif?: string; // AVIF variant URL
    bytes: number;
}
```

---

## API Endpoints

| Method | Path                             | Permission     | Description                         |
| ------ | -------------------------------- | -------------- | ----------------------------------- |
| GET    | `/api/admin/media`               | `media:read`   | List media assets                   |
| POST   | `/api/admin/media`               | `media:write`  | (not used — use upload)             |
| GET    | `/api/admin/media/<id>`          | `media:read`   | Get one asset                       |
| PATCH  | `/api/admin/media/<id>`          | `media:write`  | Update (alt, tags, focal point)     |
| DELETE | `/api/admin/media/<id>`          | `media:delete` | Delete (removes files + nulls refs) |
| POST   | `/api/admin/media/upload`        | `media:write`  | Upload (multipart/form-data)        |
| POST   | `/api/admin/media/<id>/crop`     | `media:write`  | Crop source + re-optimize           |
| POST   | `/api/admin/media/<id>/optimize` | `media:write`  | Re-run optimization                 |
