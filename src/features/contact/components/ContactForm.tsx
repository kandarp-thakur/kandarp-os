"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Mail, Send } from "lucide-react";

import { Button } from "@packages/ui/Button";
import { Input } from "@packages/ui/Input";
import { Textarea } from "@packages/ui/Textarea";

interface ApiError {
    error?: string;
}

export function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<
        { kind: "success" | "error"; message: string } | undefined
    >();

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setStatus(undefined);

        const form = event.currentTarget;
        const data = new FormData(form);
        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name: data.get("name"),
                    email: data.get("email"),
                    subject: data.get("subject"),
                    message: data.get("message"),
                    website: data.get("website"),
                }),
            });
            const payload = (await response
                .json()
                .catch(() => ({}))) as ApiError;
            if (!response.ok) {
                throw new Error(
                    payload.error || "Unable to send your message.",
                );
            }

            form.reset();
            setStatus({
                kind: "success",
                message:
                    "Message queued successfully. I’ll respond as soon as possible.",
            });
        } catch (error) {
            setStatus({
                kind: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unable to send your message.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section
            aria-labelledby="contact-form-title"
            className="mt-10 w-full max-w-3xl rounded-xl border border-border-default bg-glass-bg-subtle p-5 shadow-glass sm:p-7"
        >
            <div className="mb-6 flex items-start gap-3">
                <div className="rounded-lg border border-border-accent bg-accent-subtle p-2.5 text-accent-solid">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                    <p className="font-mono text-2xs uppercase tracking-[0.15em] text-text-tertiary">
                        fallback transport
                    </p>
                    <h2
                        id="contact-form-title"
                        className="mt-1 text-xl font-semibold text-text-primary"
                    >
                        Send a message
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                        Prefer a conventional channel? This lands directly in
                        the private admin inbox.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                        name="name"
                        label="Name"
                        autoComplete="name"
                        minLength={2}
                        maxLength={100}
                        required
                    />
                    <Input
                        name="email"
                        type="email"
                        label="Email"
                        autoComplete="email"
                        maxLength={254}
                        required
                    />
                </div>
                <Input
                    name="subject"
                    label="Subject"
                    maxLength={160}
                    placeholder="Project, role, or collaboration"
                />
                <Textarea
                    name="message"
                    label="Message"
                    rows={7}
                    minLength={10}
                    maxLength={5000}
                    required
                    helperText="10–5000 characters. Please avoid including secrets."
                />

                <div
                    className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
                    aria-hidden="true"
                >
                    <label htmlFor="contact-website">Website</label>
                    <input
                        id="contact-website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div aria-live="polite" className="min-h-6 text-sm">
                        {status?.kind === "success" ? (
                            <p className="flex items-center gap-2 text-success">
                                <CheckCircle2
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                {status.message}
                            </p>
                        ) : status?.kind === "error" ? (
                            <p className="text-error">{status.message}</p>
                        ) : null}
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        leftIcon={<Send />}
                        isLoading={isSubmitting}
                        className="shrink-0"
                    >
                        Send message
                    </Button>
                </div>
            </form>
        </section>
    );
}
