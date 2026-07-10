# Component Inventory — Kandarp OS

> **Status:** ✅ Active
> **Last Updated:** 2026-07-06
> **Scope:** Every reusable component in the system. No implementation — list only.

---

## UI

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `Button` | Primary action trigger (gradient, glass, ghost, outline, danger) |
| 2 | `IconButton` | Icon-only action button with aria-label |
| 3 | `ButtonGroup` | Horizontally grouped buttons with shared styling |
| 4 | `Badge` | Small status/label indicator |
| 5 | `Chip` | Removable tag/filter pill |
| 6 | `Tag` | Static label pill |
| 7 | `Avatar` | User/profile image with fallback initials |
| 8 | `AvatarGroup` | Overlapping stacked avatars |
| 9 | `Tooltip` | Hover/focus contextual label |
| 10 | `Popover` | Floating content panel anchored to trigger |
| 11 | `Dropdown` | Menu of actions/options |
| 12 | `Menu` | Vertical list of menu items with dividers |
| 13 | `ContextMenu` | Right-click action menu |
| 14 | `Divider` | Horizontal/vertical separator line |
| 15 | `Spinner` | Loading indicator (animated) |
| 16 | `Skeleton` | Content placeholder shimmer |
| 17 | `Progress` | Linear progress bar |
| 18 | `ProgressCircular` | Circular progress indicator |
| 19 | `Alert` | Inline banner (info, success, warning, error) |
| 20 | `Toast` | Transient notification |
| 21 | `Modal` | Centered dialog with scrim backdrop |
| 22 | `Drawer` | Side-sliding panel |
| 23 | `BottomSheet` | Mobile bottom-sliding panel |
| 24 | `Tabs` | Tabbed navigation with active indicator |
| 25 | `Accordion` | Collapsible content sections |
| 26 | `Collapse` | Single collapsible panel |
| 27 | `Switch` | Toggle on/off control |
| 28 | `Slider` | Range value selector |
| 29 | `Rating` | Star/point rating display |
| 30 | `Breadcrumb` | Hierarchical path navigation |
| 31 | `Pagination` | Page navigation control |
| 32 | `Table` | Data table with sortable headers |
| 33 | `EmptyState` | Placeholder for empty/no-data states |
| 34 | `ErrorState` | Placeholder for error states |
| 35 | `Kbd` | Keyboard key indicator |
| 36 | `CodeBlock` | Syntax-highlighted code display |
| 37 | `CodeInline` | Inline code snippet |
| 38 | `GradientText` | Accent-gradient text span |
| 39 | `Eyebrow` | Uppercase overline label |
| 40 | `Stat` | Metric + label display |
| 41 | `Counter` | Animated number counter |
| 42 | `Marquee` | Auto-scrolling horizontal content |
| 43 | `GlassPanel` | Base glassmorphism surface wrapper |

---

## Layout

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `Container` | Max-width content wrapper |
| 2 | `Section` | Vertical page section with rhythm |
| 3 | `Grid` | CSS grid wrapper with responsive columns |
| 4 | `Stack` | Flexbox stack (vertical/horizontal) |
| 5 | `Cluster` | Wrapping flex cluster |
| 6 | `Sidebar` | Fixed/aside content column |
| 7 | `SplitView` | Two-pane resizable split |
| 8 | `Center` | Centered content (both axes) |
| 9 | `Spacer` | Explicit whitespace block |
| 10 | `AspectRatio` | Fixed ratio media container |
| 11 | `Media` | Media object (image + text side-by-side) |
| 12 | `Frame` | Decorative bordered media frame |
| 13 | `PageHeader` | Standardized page title + subtitle block |
| 14 | `SectionHeader` | Section title + eyebrow + description |
| 15 | `ContentWrapper` | Reading-width content limiter |
| 16 | `SafeArea` | Mobile safe-area inset padding |
| 17 | `ScrollArea` | Custom-styled scrollable region |
| 18 | `StickyBox` | Sticky-positioned wrapper with shrink-on-scroll |

---

## 3D

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `Canvas3D` | R3F canvas wrapper with fallback + Suspense |
| 2 | `HeroScene` | 3D hero background scene |
| 3 | `ParticleField` | Floating particle system |
| 4 | `FloatingGeometry` | Animated geometric shapes |
| 5 | `Orb` | Central glowing 3D sphere |
| 6 | `DistortionSphere` | Shader-distorted animated sphere |
| 7 | `WireframePlane` | Grid/wireframe ground plane |
| 8 | `Stars` | Starfield background |
| 9 | `ProjectOrb` | 3D navigable project node |
| 10 | `ProjectOrbScene` | Spatial project navigation scene |
| 11 | `Model` | GLTF/GLB model loader wrapper |
| 12 | `Text3D` | 3D extruded text |
| 13 | `Float` | Floating motion wrapper for 3D objects |
| 14 | `OrbitControlsWrapper` | Camera orbit controls (disabled on mobile) |
| 15 | `CameraRig` | Animated camera path controller |
| 16 | `LightingRig` | Standardized 3D lighting setup |
| 17 | `Environment3D` | HDR environment loader |
| 18 | `ContactShadows3D` | Soft contact shadow plane |
| 19 | `PostProcessing` | Bloom/DOF/noise post-effects |
| 20 | `ShaderMaterial` | Custom GLSL shader material wrapper |
| 21 | `GradientShader` | Animated gradient background shader |
| 22 | `NoiseShader` | Noise texture shader |
| 23 | `SceneFallback` | 2D image/CSS fallback for WebGL-unsupported |
| 24 | `Loader3D` | 3D asset loading progress indicator |
| 25 | `PerformanceGate` | Conditionally renders 3D based on device tier |

---

## Animations

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `FadeIn` | Fade-in on mount/scroll enter |
| 2 | `FadeUp` | Fade + translate-y on enter |
| 3 | `FadeDown` | Fade + translate-y (downward) on enter |
| 4 | `FadeLeft` | Fade + translate-x (leftward) on enter |
| 5 | `FadeRight` | Fade + translate-x (rightward) on enter |
| 6 | `ScaleIn` | Scale + fade on enter |
| 7 | `SlideIn` | Slide from edge on enter |
| 8 | `Stagger` | Sequential child reveal container |
| 9 | `StaggerItem` | Child of Stagger with incremental delay |
| 10 | `Reveal` | Scroll-triggered reveal wrapper |
| 11 | `Parallax` | Scroll-speed parallax layer |
| 12 | `ParallaxLayer` | Individual parallax depth layer |
| 13 | `Magnetic` | Cursor-magnetic hover effect |
| 14 | `Tilt` | 3D tilt-on-hover card effect |
| 15 | `Shimmer` | Skeleton shimmer animation |
| 16 | `GradientShift` | Animated gradient background |
| 17 | `Typewriter` | Typing text effect |
| 18 | `MarqueeScroll` | Infinite marquee scroll |
| 19 | `ScrollProgress` | Top-of-page scroll progress bar |
| 20 | `PageTransition` | Route change transition wrapper |
| 21 | `AnimatedText` | Word/character-by-word text reveal |
| 22 | `AnimatedCounter` | Number count-up on enter |
| 23 | `MotionConfig` | Global motion config + reduced-motion provider |
| 24 | `Presence` | Animate exit wrapper |
| 25 | `HoverLift` | Hover translateY lift wrapper |

---

## Shared

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `ThemeToggle` | Light/dark theme switcher |
| 2 | `ThemeToggleGroup` | Multi-theme selector (future) |
| 3 | `ScrollToTop` | Floating scroll-to-top button |
| 4 | `ScrollProgressIndicator` | Reading progress bar |
| 5 | `CommandPalette` | Cmd+K command menu |
| 6 | `SearchOverlay` | Full-screen search overlay |
| 7 | `SocialLinks` | Social media link cluster |
| 8 | `SocialIcon` | Single social platform icon link |
| 9 | `Logo` | Brand logo (text + mark) |
| 10 | `LogoMark` | Logo icon only |
| 11 | `BackToHome` | 404/empty-state home link |
| 12 | `CopyButton` | Copy-to-clipboard button with feedback |
| 13 | `ShareButton` | Web Share API trigger |
| 14 | `LanguageToggle` | i18n language switcher (future) |
| 15 | `SoundToggle` | UI sound effects toggle |
| 16 | `ReducedMotionToggle` | Manual motion-reduction toggle |
| 17 | `CookieBanner` | GDPR consent banner |
| 18 | `AnalyticsOptOut` | Analytics opt-out control |
| 19 | `LiveIndicator` | Pulsing "live" status dot |
| 20 | `StatusDot` | Colored status indicator |
| 21 | `ExternalLink` | Anchor with target + rel noopener |
| 22 | `MailLink` | Mailto anchor with obfuscation |
| 23 | `Favicon` | Dynamic favicon (theme-aware) |
| 24 | `SkipLink` | Accessibility skip-to-content link |
| 25 | `FocusTrap` | Keyboard focus containment wrapper |

---

## Forms

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `Form` | React Hook Form wrapper with Zod resolver |
| 2 | `FormField` | Label + input + helper/error wrapper |
| 3 | `FormLabel` | Accessible form label |
| 4 | `FormHelperText` | Helper text below input |
| 5 | `FormErrorText` | Error text below input |
| 6 | `FormSuccess` | Success message block |
| 7 | `Input` | Standard text input |
| 8 | `InputSearch` | Search input with clear button |
| 9 | `InputPassword` | Password input with visibility toggle |
| 10 | `InputOTP` | One-time-password input |
| 11 | `Textarea` | Multiline text input |
| 12 | `InputMask` | Masked input (phone, date) |
| 13 | `Select` | Custom dropdown select |
| 14 | `MultiSelect` | Multi-value select with chips |
| 15 | `Combobox` | Searchable select input |
| 16 | `Checkbox` | Checkbox control |
| 17 | `CheckboxGroup` | Group of checkboxes |
| 18 | `Radio` | Radio control |
| 19 | `RadioGroup` | Group of radios |
| 20 | `Switch` | Toggle switch (form variant) |
| 21 | `Slider` | Range slider (form variant) |
| 22 | `DatePicker` | Date selection input |
| 23 | `DateRangePicker` | Date range selection |
| 24 | `TimePicker` | Time selection input |
| 25 | `FileUpload` | Drag-and-drop file input |
| 26 | `ImageUpload` | Image upload with preview |
| 27 | `ColorPicker` | Color selection input |
| 28 | `RatingInput` | Star rating form control |
| 29 | `ToggleGroup` | Segmented multi-option control |
| 30 | `FormActions` | Submit/cancel button row |
| 31 | `FormProgress` | Multi-step form progress indicator |
| 32 | `FormStepper` | Multi-step form navigation |
| 33 | `ContactForm` | Composed contact form (name, email, message) |
| 34 | `NewsletterForm` | Email-only subscribe form |
| 35 | `Fieldset` | Grouped form section with legend |

---

## Terminal

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `Terminal` | Terminal emulator shell container |
| 2 | `TerminalHeader` | Window chrome (dots, title) |
| 3 | `TerminalBody` | Scrollable terminal output area |
| 4 | `TerminalLine` | Single output line (prompt/response) |
| 5 | `TerminalPrompt` | Input prompt with blinking cursor |
| 6 | `TerminalCursor` | Blinking block cursor |
| 7 | `TerminalCommand` | Executable command definition |
| 8 | `TerminalOutput` | Command result renderer |
| 9 | `TerminalHistory` | Command history manager |
| 10 | `TerminalAutocomplete` | Tab-completion suggestion |
| 11 | `TerminalTheme` | Terminal color scheme provider |
| 12 | `CommandRegistry` | Maps commands to handlers |
| 13 | `CommandHelp` | `--help` output renderer |
| 14 | `CommandNotFound` | Unknown command error output |
| 15 | `BootSequence` | Animated startup boot text |
| 16 | `TypewriterLine` | Typing-effect terminal line |
| 17 | `TerminalBanner` | ASCII art banner |
| 18 | `TerminalMenu` | Interactive menu selector |
| 19 | `TerminalProgress` | Inline progress bar for commands |
| 20 | `TerminalTable` | Tabular data in terminal style |

---

## Infrastructure

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `Providers` | Composed provider tree root |
| 2 | `ThemeProvider` | Theme context provider |
| 3 | `MotionProvider` | Framer Motion config provider |
| 4 | `AnalyticsProvider` | Analytics initialization provider |
| 5 | `ErrorBoundary` | React error boundary with fallback |
| 6 | `AsyncBoundary` | Suspense boundary with fallback |
| 7 | `RouteGuard` | Auth-protected route wrapper |
| 8 | `ApiProvider` | API client context provider |
| 9 | `ToastProvider` | Toast notification context |
| 10 | `ModalProvider` | Global modal manager context |
| 11 | `CommandPaletteProvider` | Cmd+K state context |
| 12 | `ScrollProvider` | Scroll position context |
| 13 | `MediaQueryProvider` | Responsive breakpoint context |
| 14 | `DeviceProvider` | Device capability detection context |
| 15 | `KeyboardProvider` | Global keyboard shortcut handler |
| 16 | `NetworkStatus` | Online/offline indicator + context |
| 17 | `PerformanceMonitor` | Web vitals tracker (dev) |
| 18 | `DebugPanel` | Dev-only debug overlay |
| 19 | `FeatureFlag` | Conditional feature render wrapper |
| 20 | `EnvBadge` | Environment indicator (dev/staging/prod) |
| 21 | `NoScript` | `<noscript>` fallback content |
| 22 | `SkipToContent` | Accessibility skip link target |
| 23 | `StructuredData` | JSON-LD injector |
| 24 | `MetaHead` | Per-route metadata injector |
| 25 | `Analytics` | Event tracking wrapper |
| 26 | `ErrorReporter` | Sentry/error reporting boundary |
| 27 | `ServiceWorker` | PWA service worker registrar |
| 28 | `InstallPrompt` | PWA install banner |

---

## Navigation

| # | Component | Purpose |
|---|-----------|---------|
| 1 | `Navbar` | Primary top navigation bar |
| 2 | `NavList` | Vertical/horizontal nav item list |
| 3 | `NavItem` | Single navigation link with active state |
| 4 | `NavLink` | Next.js Link with active styling |
| 5 | `MobileMenu` | Full-screen mobile navigation |
| 6 | `Hamburger` | Mobile menu toggle button |
| 7 | `MegaMenu` | Multi-column dropdown nav |
| 8 | `DropdownNav` | Dropdown navigation item |
| 9 | `TabNav` | Tab-style navigation bar |
| 10 | `PillNav` | Pill-style segmented navigation |
| 11 | `Footer` | Site footer region |
| 12 | `FooterNav` | Footer link columns |
| 13 | `FooterBottom` | Copyright + legal links row |
| 14 | `Breadcrumbs` | Breadcrumb trail (alias of UI Breadcrumb) |
| 15 | `BackButton` | History-back navigation button |
| 16 | `NextPrevNav` | Previous/next page navigation |
| 17 | `TableOfContents` | Auto-generated content TOC |
| 18 | `AnchorNav` | Sticky in-page anchor navigation |
| 19 | `LanguageNav` | Language switcher nav |
| 20 | `SkipNav` | Accessibility skip navigation |
| 21 | `ScrollSpy` | Active-section-on-scroll tracker |
| 22 | `ProgressBar` | Reading progress bar (top of page) |
| 23 | `Header` | Composed header region (logo + nav + actions) |
| 24 | `HeaderActions` | Header right-side action cluster |
| 25 | `StickyHeader` | Scroll-aware shrinking header wrapper |

---

## Summary

| Category | Count |
|----------|-------|
| UI | 43 |
| Layout | 18 |
| 3D | 25 |
| Animations | 25 |
| Shared | 25 |
| Forms | 35 |
| Terminal | 20 |
| Infrastructure | 28 |
| Navigation | 25 |
| **Total** | **244** |

---

_This inventory is the complete component surface area of Kandarp OS. Every component maps to a folder in `src/components/` (or `src/3d/`, `src/providers/`). New components must be added here before implementation._
