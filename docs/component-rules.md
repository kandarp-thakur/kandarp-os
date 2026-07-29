# Component Rules — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06

---

## 1. Purpose

This document defines the **contracts, conventions, and composition rules** for every component in Kandarp OS. It is the law for how components are structured, named, typed, and assembled.

---

## 2. Component Categories

Components live in `src/components/` and are organized by role:

| Folder | Role | Examples |
|--------|------|----------|
| `ui/` | Primitive, design-system-level building blocks | `Button`, `Input`, `Badge`, `Card` |
| `layout/` | Structural wrappers | `Container`, `Section`, `Grid`, `Stack` |
| `sections/` | Page-level composed sections | `HeroSection`, `ProjectsSection` |
| `cards/` | Content-display cards | `ProjectCard`, `ExperienceCard` |
| `forms/` | Form-related components | `ContactForm`, `FormField` |
| `navigation/` | Nav elements | `Navbar`, `MobileMenu`, `Breadcrumbs` |
| `header/` | Header region | `Header`, `Logo` |
| `footer/` | Footer region | `Footer`, `SocialLinks` |
| `shared/` | Cross-cutting shared widgets | `ThemeToggle`, `ScrollProgress` |
| `providers/` | Client-side context providers | `ThemeProvider`, `MotionProvider` |

---

## 3. Server vs. Client Components

### 3.1 Default: Server Component
Every component is a **Server Component** by default. It can fetch data, access the filesystem, and never ships JS to the client.

### 3.2 When to Use `"use client"`
A component becomes a Client Component **only if** it:
- Uses `useState`, `useReducer`, `useRef`, `useEffect`, or any React hook.
- Attaches event handlers (`onClick`, `onChange`, etc.).
- Uses browser-only APIs (`window`, `document`, `localStorage`).
- Renders a 3D canvas or animation library component.
- Is a context provider.

### 3.3 Rules
- The `"use client"` directive goes at the **very top** of the file, before any imports.
- Push `"use client"` to the **leaves** of the tree. Keep parents as Server Components.
- A Client Component may import a Server Component only if it's passed as `children` (not directly imported).
- Never add `"use client"` "just in case." Justify it.

---

## 4. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Component file | `PascalCase.tsx` | `ProjectCard.tsx` |
| Component name | `PascalCase` | `ProjectCard` |
| Hook file | `camelCase.ts` | `useTheme.ts` |
| Hook name | `camelCase` prefixed `use` | `useTheme` |
| Utility file | `camelCase.ts` or `kebab-case.ts` | `formatDate.ts` |
| Type file | `kebab-case.ts` | `project.ts` |
| Constant | `UPPER_SNAKE_CASE` | `MAX_PROJECTS` |
| Event handler prop | `on` + Event | `onSubmit`, `onProjectClick` |
| Boolean prop | `is`/`has`/`should` prefix | `isLoading`, `hasError` |

### 4.1 File = Component
- **One component per file.** A file named `ProjectCard.tsx` exports exactly one `ProjectCard`.
- Small, tightly-coupled sub-components may live in the same file **only** if they're not reused elsewhere.
- Co-located tests: `ProjectCard.test.tsx` next to `ProjectCard.tsx`.

---

## 5. Component Anatomy

Every component follows this structure:

```tsx
// 1. "use client" directive (only if needed)
"use client";

// 2. Imports (ordered: react → next → third-party → local → types → styles)
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { Project } from "@/types/project";

// 3. Types / Interfaces
interface ProjectCardProps {
  project: Project;
  onSelect?: (project: Project) => void;
}

// 4. Constants (if any)
const ANIMATION_DURATION = 0.3;

// 5. Component
export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  // hooks first
  // then handlers
  // then render
  return (/* JSX */);
}

// 6. Display name (for Client Components, optional but encouraged)
ProjectCard.displayName = "ProjectCard";
```

---

## 6. Props Contract

### 6.1 Rules
- **Every prop must be typed** via an `interface` or `type` named `<Component>Props`.
- **No `any`.** No `React.FC` (use plain function declarations).
- **Optional props use `?`** and must have sensible behavior when omitted.
- **Event handlers are optional** and prefixed with `on`.
- **Children** is typed explicitly when used: `children: React.ReactNode`.

### 6.2 Prop Ordering
Order props from most to least important:
1. Data props (the content)
2. Event handlers
3. Configuration / appearance props
4. `className` (always last, always allowed for escape hatch)

### 6.3 The `className` Escape Hatch
- Every visual component **must** accept an optional `className` prop.
- It is **merged** with internal classes (via `cn()` utility), never overridden.
- This is the only sanctioned way to override styles from the parent.

```tsx
<div className={cn("base-classes", className)} />
```

---

## 7. Composition Rules

### 7.1 Composition Over Configuration
- Prefer **small components composed together** over one component with many props.
- ❌ Bad: `<Card title="..." description="..." image="..." footer="..." />`
- ✅ Good: `<Card><Card.Header>...</Card.Header><Card.Body>...</Card.Body></Card>`

### 7.2 Compound Components
For related groups (like `Card` + `Card.Header`), use the **compound component pattern**:

```tsx
function Card({ children, className }: CardProps) { /* ... */ }
function CardHeader({ children }: CardHeaderProps) { /* ... */ }
Card.Header = CardHeader;
```

### 7.3 Slots Over Boolean Props
- If a component has many optional regions, use **slot props** (`header`, `footer`, `actions`) rather than booleans (`showHeader`, `showFooter`).
- Booleans are for binary state; slots are for content.

### 7.4 Maximum Props
- A component with **more than 7 props** is a smell. Consider splitting or composing.
- A component with **more than 200 lines** is a smell. Extract sub-components.

---

## 8. State & Data

### 8.1 Where State Lives
- **Local UI state** → `useState` / `useReducer` in the component.
- **Shared UI state** → React Context in `src/context/`.
- **Server data** → fetched in Server Components or services; passed down as props.
- **Form state** → React Hook Form (never manual `useState` for forms).

### 8.2 Lifting State
- Lift state to the **lowest common ancestor** that needs it.
- Don't reach for global context for state only two siblings share.

### 8.3 Derived State
- **Never duplicate state.** If a value can be computed from existing state, compute it.
- ❌ Bad: `const [fullName, setFullName] = useState(...)` alongside `firstName` + `lastName`.
- ✅ Good: `const fullName = \`${firstName} ${lastName}\``.

---

## 9. Event Handling

- Handlers are defined **inside** the component, named `handle<Event>`.
- They are passed to children via `on<Event>` props.
- Handlers must be **pure** or explicitly call out side effects.

```tsx
function ContactForm() {
  const handleSubmit = (data: ContactFormData) => {
    // side effect: API call
  };
  return <Form onSubmit={handleSubmit} />;
}
```

---

## 10. Accessibility Contract

Every interactive component **must**:
- Be operable via keyboard (Tab, Enter, Escape, Arrow keys where applicable).
- Have a visible focus state (focus ring, never `outline: none` without replacement).
- Have appropriate ARIA roles/labels when semantics aren't conveyed by native HTML.
- Meet **WCAG 2.1 AA** contrast for all text and interactive elements.

### 10.1 Native Over Custom
- **Always prefer native HTML elements** (`<button>`, `<a>`, `<input>`) over custom divs.
- A `<div onClick>` is a bug. Use `<button>`.
- A `<div>` with a role is a smell. Use the native element.

### 10.2 Required ARIA Patterns
| Component | Requirement |
|-----------|-------------|
| Modal/Dialog | `role="dialog"`, `aria-modal`, focus trap, Escape to close |
| Dropdown | `aria-haspopup`, `aria-expanded`, keyboard nav |
| Tabs | `role="tablist"`, `role="tab"`, `aria-selected`, arrow nav |
| Toast | `role="status"` or `role="alert"`, auto-dismiss |
| Form field | `<label>` associated via `htmlFor` or wrapping |

---

## 11. Performance Rules

### 11.1 Memoization
- Do **not** memoize by default. React is fast.
- Use `React.memo` only when a **measured** render-cost problem exists.
- Use `useMemo` / `useCallback` only for expensive computations or stable references passed to memoized children.

### 11.2 Code Splitting
- Below-the-fold sections are loaded via `next/dynamic`.
- 3D scenes are **always** dynamically imported with `{ ssr: false }`.
- Heavy libraries (e.g., syntax highlighters) are dynamically imported.

### 11.3 Images
- Always use `next/image`.
- Provide `width` and `height` (or `fill` with a sized parent) to prevent layout shift.
- Use `priority` only for the LCP image.

---

## 12. Error Boundaries

- Each major route segment wraps its content in an **error boundary** (`error.tsx`).
- Error UIs are **graceful** — they explain what happened and offer a recovery action.
- Errors are **logged** (client → Sentry, server → structured log).

---

## 13. Testing Contract

| Component Type | Test Requirement |
|----------------|------------------|
| `ui/` primitives | Unit + interaction tests (Testing Library) |
| `forms/` | Validation + submission tests |
| `cards/` | Render + prop tests |
| `sections/` | Smoke render tests |
| `hooks/` | Unit tests with `renderHook` |
| `utils/` | Unit tests (pure functions) |

- Tests are co-located: `Component.tsx` + `Component.test.tsx`.
- **No component ships without its test** if it contains logic.

---

## 14. Documentation Contract

Every non-trivial component includes a **JSDoc comment** above its declaration:

```tsx
/**
 * Displays a single project as a card with image, title, and tech badges.
 * Used in the projects grid and featured-projects section.
 *
 * @example
 * <ProjectCard project={project} onSelect={handleSelect} />
 */
export function ProjectCard(...) {}
```

---

## 15. Anti-Patterns (Banned)

| Anti-Pattern | Why Banned |
|--------------|-----------|
| `any` in props | Destroys type safety |
| `React.FC` typing | Implicit children, no generics |
| `div onClick` | Inaccessible; use `<button>` |
| Inline styles for static values | Use tokens / Tailwind |
| `useEffect` for data fetching | Use Server Components or services |
| Prop drilling > 2 levels | Use context or composition |
| God components (>200 lines) | Split into focused units |
| `index` as `key` in lists | Causes render bugs; use stable IDs |
| `dangerouslySetInnerHTML` without sanitization | XSS risk |
| Conditional hooks | Violates Rules of Hooks |

---

## 16. Review Checklist

Before a component PR is merged, confirm:

- [ ] File is in the correct category folder.
- [ ] Component is a Server Component unless it needs to be a Client Component.
- [ ] Props are fully typed; no `any`.
- [ ] `className` escape hatch is supported.
- [ ] Accessible (keyboard + screen reader + contrast).
- [ ] No banned anti-patterns.
- [ ] Test file co-located (if logic present).
- [ ] JSDoc on non-trivial components.
- [ ] Uses design tokens, not magic numbers.
- [ ] Under 200 lines (or justified split).

---

_These rules exist to keep the component library consistent, accessible, and maintainable. When in doubt, favor clarity and composition._
