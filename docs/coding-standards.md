# Coding Standards — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06

---

## 1. Purpose

This document defines the **non-negotiable rules** for writing code in Kandarp OS. It governs TypeScript, React, Next.js, styling, commits, and reviews. Code that violates these standards does not merge.

---

## 2. TypeScript Standards

### 2.1 Strict Mode
- `strict: true` is **always on**. No relaxation.
- `noUncheckedIndexedAccess: true` — array access returns `T | undefined`.
- `noImplicitOverride: true`, `noFallthroughCasesInSwitch: true`.

### 2.2 Type Rules

| Rule | Detail |
|------|--------|
| **No `any`** | Use `unknown` + narrowing, or a proper type. ESLint blocks `any`. |
| **No `@ts-ignore`** | Use `@ts-expect-error` with a justification comment, or fix the type. |
| **No `as` casts** | Unless unavoidable; require a comment explaining why. |
| **Infer from Zod** | Types come from `z.infer<typeof schema>`. No duplicate type definitions. |
| **Explicit return types** | Required on exported functions and React components. |
| **No `React.FC`** | Use plain function declarations: `function Component() {}`. |
| **Enums banned** | Use union types or `as const` objects. |

### 2.3 Type Organization
- Shared types live in `src/types/`.
- Component-local types (used only in one file) may be defined inline.
- Never export a type from a component file — move it to `src/types/` if shared.

### 2.4 Naming
- Types/Interfaces: `PascalCase` (e.g., `Project`, `ContactFormData`).
- Type aliases preferred over interfaces unless extending.
- Suffix props types with `Props`: `ButtonProps`, `ProjectCardProps`.

---

## 3. React Standards

### 3.1 Function Components
```tsx
// ✅ Good
function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// ❌ Bad
const Button: React.FC<ButtonProps> = ({ label, onClick }) => ...
```

### 3.2 Hooks Rules
- Hooks are called at the **top level** only — never in conditions, loops, or nested functions.
- Custom hooks start with `use` and return either a value or a tuple `[state, action]`.
- Hooks that return objects use **named properties**, not positional tuples (except `useState`).

### 3.3 Effects
- `useEffect` is a **last resort**. Prefer derived state, event handlers, or Server Components.
- Every effect must have a **comment** explaining why it's necessary if it's non-trivial.
- Always specify the dependency array. Never `[]` unless truly mount-once.

### 3.4 Keys
- Lists use **stable, unique IDs** as keys. Never use array index.
- If no ID exists, generate one at the data layer.

### 3.5 Conditional Rendering
```tsx
// ✅ Short-circuit for null
{isLoading && <Spinner />}

// ✅ Ternary for either/or
{user ? <Profile /> : <Login />}

// ❌ Never render undefined
{maybeValue && <Component value={maybeValue} />}  // type-unsafe
```

---

## 4. Next.js App Router Standards

### 4.1 Server Components First
- Default to Server Components. Add `"use client"` only when justified (see [`component-rules.md`](./component-rules.md)).
- Data fetching happens in Server Components via `async/await`, not `useEffect`.

### 4.2 Metadata
- Every route exports `metadata` (static) or `generateMetadata` (dynamic).
- Title follows template: `"%s | Kandarp"`.
- Open Graph + Twitter cards on all public routes.

### 4.3 Route Handlers
- Input is validated with Zod before any logic runs.
- Responses use the standard envelope: `{ success, data?, error? }`.
- Correct HTTP status codes. No 200-with-error-body.

### 4.4 No `next/link` Abuse
- Use `<Link>` for internal navigation. Never `<a>` for internal routes.
- External links use `<a>` with `target="_blank"` and `rel="noopener noreferrer"`.

---

## 5. Styling Standards

### 5.1 Tailwind First
- Use Tailwind utilities for all styling.
- **No inline styles** except for runtime-computed values (e.g., 3D transforms, dynamic dimensions).

### 5.2 Token Usage
- Colors, spacing, radii, shadows come from **design tokens** (see [`design-system.md`](./design-system.md)).
- Never hardcode hex values, pixel spacing, or magic numbers in components.

### 5.3 Class Composition
- Use the `cn()` utility (clsx + tailwind-merge) for conditional classes.
- Never string-concatenate class names.

```tsx
// ✅ Good
<div className={cn("p-4 rounded-lg", isActive && "bg-accent", className)} />

// ❌ Bad
<div className={`p-4 rounded-lg ${isActive ? "bg-accent" : ""}`} />
```

### 5.4 Responsive
- **Mobile-first.** Base styles target mobile; `sm:`, `md:` override up.
- Never write desktop-first then scale down.

### 5.5 Dark Mode
- Use `dark:` variants driven by the theme system.
- Never write component-specific theme logic. Tokens handle it.

---

## 6. Import Standards

### 6.1 Order
Imports are grouped and ordered:
1. React / Next.js built-ins
2. Third-party packages
3. Local aliases (`@/...`)
4. Types (`import type`)
5. Styles / assets

Blank line between groups.

### 6.2 Aliases
- Always use path aliases (`@/`, `@components/`, etc.).
- Never use relative paths deeper than `./` or a single `../`.

### 6.3 Type Imports
- Use `import type` for type-only imports:
  ```tsx
  import type { Project } from "@/types/project";
  ```

---

## 7. Error Handling

### 7.1 Never Swallow Errors
- No empty `catch` blocks. At minimum, log the error.
- No `try/catch` that returns `undefined` silently.

### 7.2 Expected vs. Unexpected Errors
- **Expected errors** (validation, not-found) → handled with typed results.
- **Unexpected errors** (server crash) → propagate to error boundary + log.

### 7.3 API Routes
- Validate input → return 400 with `{ error: { code, message } }`.
- Wrap logic in try/catch → return 500 on unexpected failure.
- Never leak stack traces in production responses.

---

## 8. Security Standards

| Rule | Detail |
|------|--------|
| **No secrets in client code** | Anything prefixed `NEXT_PUBLIC_` is public. Audit every use. |
| **Sanitize HTML** | `dangerouslySetInnerHTML` requires DOMPurify sanitization. |
| **Validate all input** | Zod on every API route and form. No exceptions. |
| **CSRF protection** | Same-site cookies + token for mutations. |
| **Rate limiting** | API routes are rate-limited (Edge middleware). |
| **Dependency audit** | `npm audit` passes in CI. No high/critical vulnerabilities. |

---

## 9. Performance Standards

| Rule | Detail |
|------|--------|
| **No unnecessary client JS** | Server Components by default. |
| **Dynamic import heavy code** | 3D, syntax highlighters, charts → `next/dynamic`. |
| **`next/image` always** | No raw `<img>` except for external/uncontrolled URLs. |
| **`next/font` always** | No `<link>` font loading. |
| **No render-blocking** | Above-the-fold is lean; below-the-fold is deferred. |
| **Bundle budgets** | Initial JS < 150KB gzip. Enforced in CI. |

---

## 10. Testing Standards

### 10.1 What to Test
| Layer | Test Type | Tool |
|-------|-----------|------|
| `src/utils/` | Unit tests | Vitest / Jest |
| `src/hooks/` | Hook tests | `renderHook` |
| `src/components/ui/` | Component + interaction | Testing Library |
| `src/services/` | Integration (mocked) | Vitest + mocks |
| API routes | Route handler tests | Vitest + mocks |

### 10.2 Test Rules
- Tests are **co-located**: `Component.tsx` → `Component.test.tsx`.
- Test **behavior**, not implementation. Assert on output, not internals.
- No snapshot tests as the sole assertion (brittle). Use sparingly with intent.
- Coverage target: **≥ 80%** on `utils/`, `hooks/`, `services/`.

### 10.3 Naming
- Test files: `<subject>.test.ts(x)`.
- Test descriptions: `describe("ComponentName")` → `it("should <behavior>")`.

---

## 11. Git Standards

### 11.1 Branch Naming
| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<scope>-<description>` | `feat/contact-form` |
| Fix | `fix/<scope>-<description>` | `fix/header-overflow` |
| Docs | `docs/<topic>` | `docs/architecture-update` |
| Chore | `chore/<description>` | `chore/update-deps` |
| Refactor | `refactor/<scope>` | `refactor/theme-provider` |

### 11.2 Commit Messages (Conventional Commits)
```
<type>(<scope>): <subject>

<body>

<footer>
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`.
- **Subject:** imperative mood, lowercase, no period, ≤ 72 chars.
- **Body:** explain *why*, not *what*. Wrap at 72 chars.
- **Footer:** reference issues, breaking changes (`BREAKING CHANGE:`).

Examples:
```
feat(contact): add validated contact form with email service
fix(nav): prevent mobile menu overflow on iOS
docs(architecture): add 3D subsystem performance contract
```

### 11.3 PR Rules
- One concern per PR. Small, reviewable.
- PR description includes: **What**, **Why**, **How to test**.
- Screenshots/GIFs for visual changes.
- All CI checks green before merge.
- **Squash and merge** to keep history clean.
- At least one approval required.

---

## 12. Code Review Standards

### 12.1 Reviewer Checklist
- [ ] Follows folder structure ([`folder-structure.md`](./folder-structure.md))
- [ ] No `any`, no `@ts-ignore`, no banned patterns
- [ ] Types are complete and inferred from Zod where applicable
- [ ] Uses design tokens, no magic numbers
- [ ] Accessible (keyboard, ARIA, contrast)
- [ ] Tests added/updated for logic changes
- [ ] Docs updated if behavior changed
- [ ] No secrets committed
- [ ] Performance impact considered

### 12.2 Review Etiquette
- Review the **code**, not the author.
- Be specific. "This is wrong" → "This will break when X because Y."
- Distinguish **blocking** (must fix) from **suggestion** (nice to have).
- Approve only when truly ready. Don't rubber-stamp.

---

## 13. File & Function Size Limits

| Item | Limit | Action if exceeded |
|------|-------|--------------------|
| Component file | 200 lines | Split into sub-components |
| Function | 50 lines | Extract helper |
| Hook | 100 lines | Split logic |
| Import count | 15 per file | Review coupling |
| Props per component | 7 | Refactor composition |

---

## 14. Comments & Documentation

### 14.1 When to Comment
- **Why**, not **what**. Code shows what; comments show why.
- Comment non-obvious business rules, workarounds, and performance hacks.
- Every `@ts-expect-error`, `as`, or `eslint-disable` requires a `// reason:` comment.

### 14.2 JSDoc
- Public utilities and hooks have JSDoc with `@param` and `@returns`.
- Non-trivial components have a JSDoc summary + `@example`.

### 14.3 TODOs
- Format: `// TODO(<name>): <description> — <issue/ticket>`
- Never leave a TODO without an owner or ticket reference.

---

## 15. Banned Patterns Summary

| Pattern | Reason |
|---------|--------|
| `any` | Destroys type safety |
| `@ts-ignore` | Hides real type errors |
| `as` (without justification) | Unsafe cast |
| `React.FC` | Implicit children, no generics |
| `enum` | Use unions / `as const` |
| `console.log` in committed code | Use a logger; remove before merge |
| `index` as `key` | Render bugs |
| `dangerouslySetInnerHTML` unsanitized | XSS risk |
| `useEffect` for fetching | Use Server Components / services |
| Inline styles for static values | Use tokens / Tailwind |
| Relative paths beyond `../` | Use aliases |
| Raw `<img>` | Use `next/image` |
| Empty `catch` | Swallows errors |
| `any`-typed `catch (e)` | Use `unknown` + narrowing |

---

## 16. Enforcement

These standards are enforced by:
1. **ESLint** — static analysis, blocks merge on error.
2. **Prettier** — formatting, auto-fixes on save + commit.
3. **TypeScript compiler** — `tsc --noEmit` in CI.
4. **Husky + lint-staged** — pre-commit hooks run lint + format on staged files.
5. **Commitlint** — enforces conventional commit format.
6. **Lighthouse CI** — performance/SEO/a11y budgets.
7. **Code review** — human judgment for what tools can't catch.

> **Rule:** If a tool can enforce it, the tool enforces it. If a human must enforce it, this document is the reference.

---

_Standards are not bureaucracy — they are the shared language that lets a team (or a future you) move fast without breaking things. Follow them, and the codebase stays a joy to work in._
