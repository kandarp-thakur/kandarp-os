# Profile Images

This directory contains all **profile-related** personal branding assets used throughout the website.

---

## Purpose

All personal branding images belong here. This includes:

- Hero Portrait
- About Portrait
- Transparent PNG
- WebP Versions
- Mobile Optimized Images
- Future Portrait Variants

> **Only profile-related images belong here.**
> Do **not** place project or blog images in this folder.

---

## Directory Structure

```
public/
└── images/
    └── profile/
        ├── portrait.png
        ├── portrait.webp
        ├── portrait-mobile.webp
        ├── portrait-dark.webp
        └── README.md
```

---

## Naming Convention

- Use **lowercase**.
- Use **kebab-case**.

### ✅ Correct

- `portrait.png`
- `portrait.webp`
- `portrait-mobile.webp`
- `portrait-dark.webp`

### ❌ Incorrect

- `IMG001.png`
- `final.png`
- `newimage.png`
- `photo1.png`

---

## Image Guidelines

### Preferred Formats

| Format | Use Case |
| ------ | -------- |
| WebP   | Preferred for production |
| PNG    | Only when transparency is required |
| AVIF   | Future support |

### Maximum Dimensions

| Device  | Max Dimensions |
| ------- | -------------- |
| Desktop | 3000 × 4000    |
| Mobile  | 1200 × 1600    |

### Optimization

- Images should be **optimized** before use.
- Keep file sizes as small as possible without visible quality loss.
- Prefer **WebP** for production.
- Keep **transparent PNG** only when transparency is required.

---

## Usage

The **Hero** section should load:

```
/images/profile/portrait.webp
```

Fallback:

```
/images/profile/portrait.png
```

### Rules

- Always use the **Next.js `Image` component**.
- **Never** hardcode absolute URLs (e.g. `https://example.com/...`).
- Use relative paths rooted at `/images/profile/`.

---

## Future CMS

> ⚠️ This folder is **temporary** for development.

Later, all profile images will be managed through the **Admin Panel Media Library**.

The image path should eventually become **dynamic**, with the Hero loading the active profile image from the CMS instead of a hardcoded file.

### Design Requirement

Design the code so that replacing the static path with a **database-driven URL** requires **minimal changes**. Prefer centralizing the profile image path in a single config or data module (e.g. `src/data/hero.ts`) so that swapping the static string for a CMS-sourced value is a one-line change.
