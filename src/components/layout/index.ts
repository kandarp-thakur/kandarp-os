/**
 * Layout primitives barrel — Kandarp OS.
 *
 * Re-exports the structural wrappers used to assemble the application shell
 * (folder-structure §4.2 `layout/`). Importing from the barrel keeps page
 * imports stable as the layout module grows:
 *
 *   import { AppShell, PageContainer } from "@/components/layout";
 *
 * @see [`AppShell`](./AppShell.tsx) — the composed shell.
 */
export { AppShell } from "./AppShell";
export { Container } from "./Container";
export { ContentWrapper } from "./ContentWrapper";
export { FooterSlot } from "./FooterSlot";
export { NavigationLayout } from "./NavigationLayout";
export { PageContainer } from "./PageContainer";
export { Section } from "./Section";
