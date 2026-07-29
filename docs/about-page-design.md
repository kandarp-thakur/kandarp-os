# About Page Design — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Aesthetic:** Glassmorphism · Light · Minimal · Terminal-native
> **Scope:** Design only. No implementation.

---

## 0. Concept Summary

The About page is **not a bio**. It's a **terminal session**. Instead of paragraphs, the visitor reads a sequence of Linux commands — `whoami`, `neofetch`, `hostnamectl` — whose outputs *are* the content. Education, experience, mission, and goals are all rendered as terminal output, formatted like real system information.

This is the "OS" identity made literal: the portfolio *is* an operating system, and the About page is its system inspector.

**One-line vision:** *Don't tell them who you are. Show them the system readout.*

---

## 1. Page Layout

### 1.1 Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  [Navbar — glass, sticky]                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─ Page Header ───────────────────────────────────────────┐   │
│   │  // ABOUT                                                │   │
│   │  System Information                                      │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─ Terminal Session (main content) ───────────────────────┐   │
│   │                                                          │   │
│   │  $ whoami                                                │   │
│   │  > kandarp                                               │   │
│   │                                                          │   │
│   │  $ neofetch                                              │   │
│   │  [neofetch ASCII art + system info]                      │   │
│   │                                                          │   │
│   │  $ hostnamectl                                           │   │
│   │  [system identity output]                                │   │
│   │                                                          │   │
│   │  $ cat /etc/education.conf                               │   │
│   │  [education output]                                      │   │
│   │                                                          │   │
│   │  $ systemctl status career.service                      │   │
│   │  [experience output]                                     │   │
│   │                                                          │   │
│   │  $ cat /etc/motd                                         │   │
│   │  [mission output]                                        │   │
│   │                                                          │   │
│   │  $ cat /etc/goals.list                                  │   │
│   │  [goals output]                                          │   │
│   │                                                          │   │
│   │  $ _                                                     │   │
│   │                                                          │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   [Footer]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Layout Rules
- **Single column**, centered, `container-default` (1152px max).
- **Terminal session** is the primary content block — large, glass, prominent.
- **Page header** is minimal — eyebrow + title only.
- **No sidebar** — the terminal IS the content.
- **Vertical rhythm:** `space-12` between header and terminal.

---

## 2. Page Header

### 2.1 Anatomy

```
// ABOUT
System Information
```

### 2.2 Styling

| Element | Spec |
|---------|------|
| Eyebrow | `// ABOUT`, `text-2xs`, `font-mono`, `text-tertiary`, `tracking-[0.15em]`, uppercase |
| Title | `System Information`, `text-h1` (36px), `font-bold`, `text-primary` |
| Subtitle | `Runtime details for kandarp@portfolio-os`, `text-base`, `text-secondary`, `font-mono` |
| Alignment | Left-aligned |
| Animation | Fade up on scroll enter |

---

## 3. The Terminal Session

### 3.1 Terminal Container

A large glass terminal that holds the entire command sequence:

| Property | Value |
|----------|-------|
| Background | `glass-bg-strong` (`rgba(255,255,255,0.80)`) |
| Backdrop blur | `24px` |
| Border | `1px solid border-default` + glass edge |
| Border radius | `radius-2xl` (20px) |
| Shadow | `shadow-glass` |
| Width | 100% (max 800px, centered) |
| Padding (body) | `space-6` (24px) |

### 3.2 Terminal Header

```
● ● ●    kandarp@portfolio-os: ~/about — zsh
```

| Element | Spec |
|---------|------|
| Traffic lights | 3 dots (red, yellow, green), 12px |
| Title | `kandarp@portfolio-os: ~/about — zsh`, `font-mono`, `text-xs`, `text-tertiary` |
| Divider | `border-subtle` below |

### 3.3 Terminal Body

| Property | Value |
|----------|-------|
| Font | JetBrains Mono (`font-mono`) |
| Size | `text-sm` (14px) desktop, `text-xs` (12px) mobile |
| Line height | 1.7 (generous for readability) |
| Color (prompt `$`) | `text-tertiary` |
| Color (command) | `text-primary` |
| Color (output `>`) | `accent-solid` |
| Color (output text) | `text-secondary` |
| Color (keys/labels) | `text-tertiary`, `font-medium` |
| Color (values) | `text-primary` |
| Cursor | Block `█`, blinks 530ms |

### 3.4 Execution Model

The terminal **types out each command sequentially**, as if a user is running them live:

| Phase | Action | Duration |
|-------|--------|----------|
| 1. Type command | Char-by-char typing | 60ms/char |
| 2. Execute | Cursor moves to next line, brief pause | 300ms |
| 3. Render output | Output appears (fade-in or instant) | 200ms |
| 4. Pause | Read time before next command | 800ms |
| 5. Next command | Repeat from step 1 | — |

### 3.5 Scroll-Triggered Execution

Commands execute **as they scroll into view** (not all at once on load):

| Command | Trigger |
|---------|---------|
| `whoami` | Terminal enters viewport |
| `neofetch` | After whoami output visible |
| `hostnamectl` | After neofetch visible |
| `cat /etc/education.conf` | Scrolled to mid-terminal |
| `systemctl status career.service` | Scrolled further |
| `cat /etc/motd` | Scrolled further |
| `cat /etc/goals.list` | Near bottom |

### 3.6 Reduced Motion
- All commands and outputs appear **instantly** (no typing).
- Cursor is static (no blink).
- Terminal is fully readable as a static document.

---

## 4. Command 1 — `whoami`

### 4.1 Purpose
The simplest introduction — just the name.

### 4.2 Output

```
$ whoami
> kandarp
```

### 4.3 Content
- **Command:** `whoami`
- **Output:** `kandarp` (lowercase, terminal convention)
- **Duration:** Quick — establishes the terminal metaphor immediately.

---

## 5. Command 2 — `neofetch`

### 5.1 Purpose
The signature system summary — a neofetch-style display with ASCII art on the left and system info on the right. This is the "at a glance" identity card.

### 5.2 Output Layout

```
$ neofetch
                    kandarp@portfolio-os
       ▟█▙          ────────────────────
      ▟███▙         OS: Kandarp OS v1.0
     ▟█████▙        Host: Portfolio Platform
    ▟███████▙       Kernel: TypeScript 5.4
   ▟█████████▙      Uptime: 6 years, 3 months
  ▟███████████▙     Shell: zsh 5.9
 ▟█████████████▙    Resolution: 1920x1080
▟███████████████▙   Terminal: kandarp-term
 ▟█████████████▙    CPU: Curiosity (8 cores) @ 3.2GHz
  ▟███████████▙     Memory: 8192MiB / ∞MiB
   ▟█████████▙      Disk: 42 projects, 1.2k commits
    ▟███████▙        Network: Always online
     ▟█████▙         Theme: Glassmorphism [Light]
      ▟███▙          Icons: Lucide
       ▟█▙           Font: Inter / JetBrains Mono
```

### 5.3 ASCII Art

| Property | Value |
|----------|-------|
| Shape | Diamond/gem (matching logo mark) or stylized "K" |
| Color | `accent-gradient` (each line shifts hue slightly) |
| Size | ~12 lines tall |
| Alignment | Left column |

### 5.4 System Info Fields

| Field | Value | Meaning |
|-------|-------|---------|
| OS | Kandarp OS v1.0 | The portfolio itself |
| Host | Portfolio Platform | What it runs on |
| Kernel | TypeScript 5.4 | Core language |
| Uptime | 6 years, 3 months | Years of experience |
| Shell | zsh 5.9 | Preferred shell |
| Resolution | 1920x1080 | Display |
| Terminal | kandarp-term | Custom terminal |
| CPU | Curiosity (8 cores) | Mind/skills |
| Memory | 8192MiB / ∞MiB | Learning capacity |
| Disk | 42 projects, 1.2k commits | Body of work |
| Network | Always online | Availability |
| Theme | Glassmorphism [Light] | Design system |
| Icons | Lucide | Icon library |
| Font | Inter / JetBrains Mono | Typography |

### 5.5 Rules
- **ASCII art is the logo mark** — consistent with navbar/hero.
- **Values are real** — actual experience years, real project count, real commit count.
- **Layout is two-column** — art left, info right, aligned with spaces.
- **Color:** Art in gradient, labels in `text-tertiary`, values in `text-primary`.

---

## 6. Command 3 — `hostnamectl`

### 6.1 Purpose
System identity — the "official" machine info. Presents personal identity and location in a dry, system-admin format.

### 6.2 Output

```
$ hostnamectl
   Static hostname: kandarp-os
   Pretty hostname: Kandarp Khandwala
         Icon name: developer
           Chassis: ☁ cloud-native
        Machine ID: 0xK4ND4RP
           Boot ID: 2026-07-06
  Operating System: Earth (Asia/Calcutta)
    Kernel Version: Human v28
      Architecture: x86_64 + curiosity
```

### 6.3 Fields

| Field | Value | Meaning |
|-------|-------|---------|
| Static hostname | `kandarp-os` | System name |
| Pretty hostname | `Kandarp Khandwala` | Full name |
| Icon name | `developer` | Role icon |
| Chassis | `☁ cloud-native` | Deployment style |
| Machine ID | `0xK4ND4RP` | Unique ID (hex-style) |
| Boot ID | Today's date | "Born" date |
| Operating System | `Earth (Asia/Calcutta)` | Location + timezone |
| Kernel Version | `Human v28` | Age |
| Architecture | `x86_64 + curiosity` | Stack + mindset |

---

## 7. Command 4 — `cat /etc/education.conf`

### 7.1 Purpose
Education history, formatted as a configuration file — each institution as a config block.

### 7.2 Output

```
$ cat /etc/education.conf
[university]
name=Indian Institute of Technology
degree=B.Tech Computer Science
status=completed
years=2018-2022
gpa=8.7/10
highlights= Distributed Systems, ML, OS Design

[certification]
name=AWS Solutions Architect
provider=Amazon Web Services
status=active
year=2024

[certification]
name=Certified Kubernetes Administrator
provider=Cloud Native Computing Foundation
status=active
year=2025
```

### 7.3 Format Rules
- **INI/config format** — `[section]` headers, `key=value` pairs.
- **Sections:** `[university]`, `[certification]` (repeatable).
- **Keys are lowercase, snake_case** — terminal convention.
- **Values are plain text** — no markdown.
- **Blank line between blocks** for readability.
- **Color:** Section headers in `accent-solid`, keys in `text-tertiary`, values in `text-primary`.

---

## 8. Command 5 — `systemctl status career.service`

### 8.1 Purpose
Work experience, formatted as a systemd service status — each role as a service unit. This is the experience section, disguised as system administration.

### 8.2 Output

```
$ systemctl status career.service
● career.service — Professional Career
     Loaded: loaded (/etc/systemd/system/career.service)
     Active: active (running) since 2022-06-01
   Main PID: 1 (kandarp)
     Status: "Building scalable systems"

  [role-1] Senior Software Engineer @ TechCorp
           Loaded: 2024-Present
           Tasks: Backend architecture, DevOps, mentoring
           Status: ● active

  [role-2] Software Engineer @ StartupInc
           Loaded: 2022-2024
           Tasks: Full-stack development, CI/CD, cloud migration
           Status: ● completed

  [role-3] Software Engineer Intern @ BigTech
           Loaded: 2021-2022
           Tasks: Feature development, testing, documentation
           Status: ● completed
```

### 8.3 Format Rules
- **systemd status format** — `●` bullets, `Loaded:` / `Tasks:` / `Status:` fields.
- **Each role is a `[role-N]` block** — numbered chronologically (most recent first).
- **Status indicators:** `● active` (current), `● completed` (past).
- **Tasks are comma-separated** — concise, no paragraphs.
- **Color:** Service name in `accent-solid`, labels in `text-tertiary`, values in `text-primary`, status dots colored (green=active, blue=completed).

---

## 9. Command 6 — `cat /etc/motd`

### 9.1 Purpose
The "message of the day" — the mission statement. In Linux, `/etc/motd` displays on login. Here, it's the personal mission.

### 9.2 Output

```
$ cat /etc/motd
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   "To build systems that scale, interfaces that delight,     ║
║    and tools that empower — treating every line of code     ║
║    as a craft and every user as a guest worth respecting."   ║
║                                                              ║
║   — kandarp@portfolio-os                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

### 9.3 Format Rules
- **Boxed in ASCII art border** — `╔═╗║╚═╝` characters.
- **Quote is centered** within the box.
- **Attribution** at bottom: `— kandarp@portfolio-os`.
- **Color:** Border in `text-tertiary`, quote in `text-primary`, attribution in `accent-solid`.
- **Max width:** 60 characters (terminal standard).

---

## 10. Command 7 — `cat /etc/goals.list`

### 10.1 Purpose
Goals, formatted as a checklist file — each goal as a line item with a status marker.

### 10.2 Output

```
$ cat /etc/goals.list
[x] Ship Kandarp OS v1.0 (portfolio platform)
[x] Achieve AWS Solutions Architect certification
[x] Contribute to 5+ open-source projects
[ ] Build and release a developer tool with 1k+ stars
[ ] Speak at a major tech conference
[ ] Mentor 10+ junior developers
[ ] Architect a system serving 1M+ users
[ ] Write a technical book or long-form guide
```

### 10.3 Format Rules
- **Checklist format** — `[x]` for done, `[ ]` for pending.
- **One line per goal** — concise, no paragraphs.
- **Ordered by:** completed first, then pending (chronological).
- **Color:** `[x]` in `success` green, `[ ]` in `text-tertiary`, goal text in `text-primary`.
- **No more than 8 goals** — keep it focused.

---

## 11. Command Sequence Summary

| # | Command | Content | Format |
|---|---------|---------|--------|
| 1 | `whoami` | Name | Single word |
| 2 | `neofetch` | System summary | ASCII art + key-value |
| 3 | `hostnamectl` | Identity + location | systemd-style key-value |
| 4 | `cat /etc/education.conf` | Education | INI config blocks |
| 5 | `systemctl status career.service` | Experience | systemd service status |
| 6 | `cat /etc/motd` | Mission | ASCII-boxed quote |
| 7 | `cat /etc/goals.list` | Goals | Checklist |

---

## 12. Visual Hierarchy

### 12.1 Command Separation

Each command block is separated by a **blank line** and a subtle divider:

```
$ whoami
> kandarp

  ────────────────────────────────────────────

$ neofetch
> ...
```

| Property | Value |
|----------|-------|
| Divider | `border-subtle`, full width of terminal body |
| Margin above | `space-4` |
| Margin below | `space-4` |
| Style | Dashed or solid hairline |

### 12.2 Command Prompts

| Element | Color | Weight |
|---------|-------|--------|
| `$` (user prompt) | `text-tertiary` | regular |
| command text | `text-primary` | medium |
| `>` (output prefix) | `accent-solid` | regular |
| output text | `text-secondary` | regular |
| `#` (comment, if any) | `text-quaternary` | regular, italic |

---

## 13. Interaction

### 13.1 Typing Animation
- Each command **types out** when scrolled into view (IntersectionObserver).
- **Typing speed:** 60ms/char (commands), output appears instantly.
- **Cursor blinks** during typing and pauses.
- **Only one command types at a time** — sequential, not parallel.

### 13.2 Hover on Output
- Hovering over a neofetch value or education block **highlights** it subtly (`overlay-hover`).
- No tooltips — the terminal output is self-explanatory.

### 13.3 Copy Button
- A small `CopyButton` in the terminal header copies the **entire session** as plain text.
- Useful for sharing the "system readout."

### 13.4 Reduced Motion
- All content appears instantly.
- No typing, no cursor blink.
- Terminal is a static, readable document.

---

## 14. Responsive Behavior

| Element | Desktop | Mobile |
|---------|---------|--------|
| Terminal width | 800px max | Full-width (minus padding) |
| Font size | `text-sm` (14px) | `text-xs` (12px) |
| Neofetch layout | Two-column (art + info) | Stacked (art above info) |
| ASCII art | Full size | Scaled down or simplified |
| MOTD box | 60-char width | 40-char width (re-wrapped) |
| Goals list | Full width | Full width |

### 14.1 Mobile Neofetch
On narrow screens, the neofetch switches to **stacked layout**:
```
       ▟█▙
      ▟███▙
     ▟█████▙
    ▟███████▙
   ▟█████████▙
  ▟███████████▙
 ▟█████████████▙
▟███████████████▙

kandarp@portfolio-os
────────────────────
OS: Kandarp OS v1.0
Host: Portfolio Platform
Kernel: TypeScript 5.4
...
```

---

## 15. Accessibility

| Concern | Solution |
|---------|----------|
| **Terminal is decorative** | `aria-hidden="true"` on the visual terminal |
| **Real content in DOM** | A visually-hidden `<section>` contains the same info as semantic HTML (headings, lists, paragraphs) |
| **Screen reader version** | `<h2>Education</h2>`, `<ul>` for goals, `<blockquote>` for mission — hidden visually, present semantically |
| **Color independence** | `[x]` vs `[ ]` conveys status by character, not just color |
| **Keyboard** | Copy button is keyboard-accessible; terminal itself is not interactive |
| **Contrast** | All text ≥ 4.5:1 against glass background |
| **Motion** | Full reduced-motion fallback (instant content) |

### 15.1 Dual-Content Strategy
The page renders **two versions** of the content:
1. **Visual:** The terminal session (for sighted users).
2. **Semantic:** A visually-hidden (`sr-only`) structured HTML version (for screen readers + SEO).

Both contain identical information; only the presentation differs.

---

## 16. SEO

| Element | Value |
|---------|-------|
| Title | `About — Kandarp Khandwala` |
| Description | `System information for kandarp@portfolio-os — education, experience, mission, and goals.` |
| OG title | `About Kandarp Khandwala` |
| OG description | `Full-stack engineer & DevOps architect. Education, experience, mission, and goals.` |
| Structured data | `Person` schema with education, occupation, address |

---

## 17. Component Mapping

| Element | Component(s) |
|---------|-------------|
| Terminal shell | `Terminal`, `TerminalHeader`, `TerminalBody` |
| Each command | `TerminalPrompt`, `TerminalCommand`, `TerminalOutput` |
| Typing animation | `TypewriterLine`, `Typewriter` |
| Cursor | `TerminalCursor` |
| Neofetch art | `TerminalBanner` (ASCII art) |
| Copy button | `CopyButton` |
| Page header | `PageHeader`, `Eyebrow` |
| Section wrapper | `Section`, `Container` |
| Entrance animation | `Reveal`, `FadeUp` |
| Semantic fallback | Visually hidden `<section>` with `Eyebrow`, headings, lists |

---

## 18. Design Rules Summary

1. **No paragraphs.** Every piece of content is a terminal command + output.
2. **Seven commands, seven sections.** whoami, neofetch, hostnamectl, education, career, motd, goals.
3. **Real Linux formats.** INI configs, systemd status, motd boxes, checklists — authentic.
4. **Sequential typing.** Commands type out as scrolled into view, one at a time.
5. **Neofetch is the centerpiece.** ASCII art + system info = the identity card.
6. **Color is semantic.** Labels tertiary, values primary, accents accent, status colored.
7. **Dual content for a11y.** Visual terminal + hidden semantic HTML.
8. **Mobile stacks gracefully.** Neofetch art above info; font scales down.
9. **Reduced motion = static document.** Fully readable, zero animation.
10. **Copy button shares the readout.** The whole session is copyable as plain text.

---

_The About page doesn't describe the developer — it boots the system. Every command reveals a layer, and by the last prompt, the visitor knows exactly who's running the machine._
