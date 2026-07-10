import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import { CodeBlock } from "@/components/blog/CodeBlock";
import { cn } from "@/utils/cn";

interface MdxContentProps {
    /** The raw Markdown/MDX source to render. */
    source: string;
}

/**
 * The Markdown content renderer (blog-page-design §14).
 *
 * Renders post bodies authored in `.mdx` at build time via
 * `next-mdx-remote/rsc` — no client JS, no backend. Maps MDX elements to
 * design-system-styled equivalents: glass blockquotes (log output), terminal
 * code blocks, anchored headings, mono inline code, and accent links.
 *
 * `remark-gfm` adds tables, strikethrough, and task lists; `rehype-slug`
 * generates heading ids that match the TOC anchors (both use
 * `github-slugger`).
 *
 * A Server Component — the MDX is compiled and rendered to HTML on the
 * server at build time.
 */
export function MdxContent({ source }: MdxContentProps) {
    return (
        <div
            className={cn(
                "mx-auto max-w-[680px] font-sans text-base leading-[1.75] text-text-secondary",
                "[&_strong]:font-semibold [&_strong]:text-text-primary",
                "[&_em]:italic",
                "[_a]:text-accent-solid [&_a]:underline [&_a:hover]:text-accent-hover",
                "[_p]:mb-4",
                "[_ul]:my-4 [&_ul]:list-none [&_ul]:pl-0",
                "[_ol]:my-4 [&_ol]:list-none [&_ol]:pl-0",
                "[_li]:mb-2",
                "[_hr]:my-8 [&_hr]:border-border-subtle",
                "[_table]:my-6 [&_table]:w-full [&_table]:border-collapse",
                "[_th]:border [&_th]:border-border-subtle [&_th]:bg-glass-bg-subtle [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-mono [&_th]:text-xs [&_th]:text-text-tertiary",
                "[_td]:border [&_td]:border-border-subtle [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm",
            )}
        >
            <MDXRemote
                source={source}
                options={{
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
                        rehypePlugins: [rehypeSlug],
                    },
                }}
                components={components}
            />
        </div>
    );
}

/**
 * MDX component overrides — map raw HTML elements to design-system-styled
 * equivalents (blog-page-design §14.3–§14.7).
 */
const components = {
    // Headings — anchored, with a `#` link on hover (§14.4).
    h2: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
        <h2
            id={id}
            className="group mt-8 mb-4 scroll-mt-24 border-b border-border-subtle text-2xl font-bold text-text-primary transition-colors duration-fast ease-standard hover:border-accent"
        >
            {children}
            {id && (
                <a
                    href={`#${id}`}
                    aria-label="permalink to this heading"
                    className="ml-2 text-text-quaternary opacity-0 transition-opacity duration-fast ease-standard group-hover:opacity-100 hover:text-accent-solid"
                >
                    #
                </a>
            )}
        </h2>
    ),
    h3: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
        <h3
            id={id}
            className="group mt-6 mb-3 scroll-mt-24 text-xl font-semibold text-text-primary"
        >
            {children}
            {id && (
                <a
                    href={`#${id}`}
                    aria-label="permalink to this heading"
                    className="ml-2 text-text-quaternary opacity-0 transition-opacity duration-fast ease-standard group-hover:opacity-100 hover:text-accent-solid"
                >
                    #
                </a>
            )}
        </h3>
    ),
    h4: ({ children, id }: { children?: React.ReactNode; id?: string }) => (
        <h4
            id={id}
            className="mt-5 mb-2 scroll-mt-24 text-lg font-semibold text-text-primary"
        >
            {children}
        </h4>
    ),

    // Inline code — mono, accent, subtle background (§14.3).
    code: ({
        className,
        children,
    }: {
        className?: string;
        children?: React.ReactNode;
    }) => {
        // Block code (with a language class) is rendered by `pre` below.
        const isBlock = /language-/.test(className ?? "");
        if (isBlock) {
            return <>{children}</>;
        }
        return (
            <code
                className={cn(
                    "rounded-sm bg-accent-subtle px-1.5 py-0.5 font-mono text-sm text-accent-solid",
                )}
            >
                {children}
            </code>
        );
    },

    // Code blocks — terminal windows (§14.6).
    pre: ({ children }: { children?: React.ReactNode }) => {
        // Extract the raw text + language from the child <code> element.
        const child = Array.isArray(children) ? children[0] : children;
        const codeEl = child as {
            props?: { className?: string; children?: React.ReactNode };
        } | null;
        const className = codeEl?.props?.className ?? "";
        const langMatch = /language-(\w+)/.exec(className);
        const language = langMatch?.[1] ?? "text";
        const raw = extractText(codeEl?.props?.children);

        return (
            <CodeBlock code={raw} language={language}>
                <code className={className}>{codeEl?.props?.children}</code>
            </CodeBlock>
        );
    },

    // Blockquotes — log output (§14.5).
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="my-6 rounded-lg border-l-[3px] border-accent-solid bg-glass-bg-subtle px-4 py-3 backdrop-blur-glass-subtle">
            <span
                className="mr-2 font-mono text-accent-solid"
                aria-hidden="true"
            >
                ▸
            </span>
            <span className="italic text-text-secondary">{children}</span>
        </blockquote>
    ),

    // Unordered list — `•` accent markers (§14.7).
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="my-4 list-none space-y-2 pl-0">
            {wrapListItems(children, "•")}
        </ul>
    ),

    // Ordered list — mono numerals (§14.7).
    ol: ({ children }: { children?: React.ReactNode }) => (
        <ol className="my-4 list-none space-y-2 pl-0">
            {wrapOrderedList(children)}
        </ol>
    ),

    // Images — rounded, shadowed, with a caption slot (§14.7).
    img: ({ src, alt }: { src?: string; alt?: string }) => (
        <figure className="my-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={alt ?? ""}
                className="w-full rounded-lg shadow-glass"
            />
            {alt && (
                <figcaption className="mt-2 text-center font-mono text-xs text-text-tertiary">
                    {alt}
                </figcaption>
            )}
        </figure>
    ),
};

/** Recursively extract plain text from rendered code children. */
function extractText(node: React.ReactNode): string {
    if (node === null || node === undefined) return "";
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (typeof node === "object" && "props" in (node as object)) {
        const el = node as { props?: { children?: React.ReactNode } };
        return extractText(el.props?.children);
    }
    return "";
}

/** Wrap unordered-list items with an accent `•` marker. */
function wrapListItems(children: React.ReactNode, marker: string) {
    const items = Array.isArray(children) ? children : [children];
    return items.map((item, index) => {
        const el = item as { props?: { children?: React.ReactNode } };
        return (
            <li key={`${marker}-${index}`} className="flex gap-2.5">
                <span
                    className="mt-0.5 shrink-0 font-mono text-accent-solid"
                    aria-hidden="true"
                >
                    {marker}
                </span>
                <span className="text-text-secondary">
                    {el?.props?.children ?? item}
                </span>
            </li>
        );
    });
}

/** Wrap ordered-list items with mono numerals. */
function wrapOrderedList(children: React.ReactNode) {
    const items = Array.isArray(children) ? children : [children];
    return items.map((item, index) => {
        const el = item as { props?: { children?: React.ReactNode } };
        return (
            <li key={`ol-${index}`} className="flex gap-2.5">
                <span
                    className="mt-0.5 shrink-0 font-mono text-accent-solid"
                    aria-hidden="true"
                >
                    {index + 1}.
                </span>
                <span className="text-text-secondary">
                    {el?.props?.children ?? item}
                </span>
            </li>
        );
    });
}
