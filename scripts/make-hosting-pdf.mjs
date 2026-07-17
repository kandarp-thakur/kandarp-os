// Generates a PDF guide: "How to Host a Next.js Project on Vercel"
// Uses pdfkit (pure Node, no browser). Run: node scripts/make-hosting-pdf.mjs
import PDFDocument from "pdfkit";
import { createWriteStream } from "fs";

const OUT = "docs/host-nextjs-on-vercel.pdf";

const doc = new PDFDocument({
    size: "A4",
    margins: { top: 64, bottom: 64, left: 64, right: 64 },
    info: {
        Title: "How to Host a Next.js Project on Vercel",
        Author: "Kandarp OS",
        Subject: "Deployment Guide",
    },
});

const stream = createWriteStream(OUT);
doc.pipe(stream);

// ---- Palette ----
const INK = "#0B0F19";
const ACCENT = "#2563EB";
const MUTED = "#475569";
const CODE_BG = "#0F172A";
const CODE_FG = "#E2E8F0";
const LINE = "#E2E8F0";

const pageW = doc.page.width;
const contentW = pageW - 128;

// ---- Helpers ----
function hr() {
    doc
        .moveDown(0.4)
        .strokeColor(LINE)
        .lineWidth(1)
        .moveTo(64, doc.y)
        .lineTo(pageW - 64, doc.y)
        .stroke()
        .moveDown(0.6);
}

function h1(text) {
    doc
        .font("Helvetica-Bold")
        .fontSize(26)
        .fillColor(INK)
        .text(text, 64, 72, { width: contentW });
    doc.moveDown(0.3);
}

function subtitle(text) {
    doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(MUTED)
        .text(text, 64, doc.y, { width: contentW });
    doc.moveDown(0.8);
}

function h2(text) {
    doc.moveDown(0.6);
    doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(ACCENT)
        .text(text, 64, doc.y, { width: contentW });
    doc.moveDown(0.2);
}

function h3(text) {
    doc.moveDown(0.4);
    doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(INK)
        .text(text, 64, doc.y, { width: contentW });
    doc.moveDown(0.1);
}

function p(text) {
    doc.font("Helvetica").fontSize(10.5).fillColor(INK).text(text, 64, doc.y, {
        width: contentW,
        lineGap: 3,
    });
    doc.moveDown(0.3);
}

function bullet(text) {
    doc
        .font("Helvetica")
        .fontSize(10.5)
        .fillColor(INK)
        .text(`•  ${text}`, 80, doc.y, { width: contentW - 32, lineGap: 3 });
    doc.moveDown(0.15);
}

function code(lines) {
    const arr = Array.isArray(lines) ? lines : [lines];
    const blockH = arr.length * 13 + 14;
    // background
    doc
        .roundedRect(64, doc.y, contentW, blockH, 6)
        .fillColor(CODE_BG)
        .fill();
    doc.fillColor(CODE_FG);
    arr.forEach((ln, i) => {
        doc
            .font("Courier")
            .fontSize(9.5)
            .fillColor(CODE_FG)
            .text(ln, 76, doc.y + (i === 0 ? 8 : 0), { width: contentW - 24 });
    });
    doc.y += blockH + 6;
    doc.moveDown(0.3);
}

function note(text) {
    doc
        .roundedRect(64, doc.y, contentW, 0, 6)
        .fillColor("#EFF6FF")
        .fill();
    const startY = doc.y + 8;
    doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#1E3A8A")
        .text(`!  ${text}`, 80, startY, { width: contentW - 32, lineGap: 3 });
    const h = doc.y - startY + 8;
    doc
        .roundedRect(64, startY - 8, contentW, h, 6)
        .fillColor("#EFF6FF")
        .fill();
    doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#1E3A8A")
        .text(`!  ${text}`, 80, startY, { width: contentW - 32, lineGap: 3 });
    doc.y = startY + h + 6;
    doc.moveDown(0.3);
}

function footer(pageNum) {
    doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(
            `Kandarp OS  •  Hosting a Next.js Project on Vercel  •  Page ${pageNum}`,
            64,
            doc.page.height - 40,
            { width: contentW, align: "center" },
        );
}

// ---- Cover ----
doc
    .roundedRect(0, 0, pageW, 180, 0)
    .fillColor(ACCENT)
    .fill();
doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor("#FFFFFF")
    .text("Hosting a Next.js Project", 64, 70, { width: contentW });
doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor("#FFFFFF")
    .text("on Vercel", 64, 108, { width: contentW });
doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#DBEAFE")
    .text("A complete step-by-step deployment guide", 64, 150, {
        width: contentW,
    });

doc.y = 210;
subtitle(
    "This guide covers two methods — the Vercel dashboard (easiest) and the Vercel CLI (for automation). It also explains how to connect a custom domain and set environment variables.",
);

hr();

// ---- Prerequisites ----
h2("1. Prerequisites");
p("Before you start, make sure you have:");
bullet("A Next.js project that builds locally with `npm run build`.");
bullet("A GitHub/GitLab/Bitbucket repository with your code pushed to it.");
bullet("A free Vercel account (sign up at https://vercel.com/signup).");
bullet("Node.js 18.17+ installed on your machine (for the CLI method).");
bullet("A custom domain purchased from a registrar (optional, for step 5).");

// ---- Method A: Dashboard ----
h2("2. Method A — Deploy via the Vercel Dashboard (easiest)");
p("This is the recommended way for most users. No local tools required.");

h3("Step 1: Import your repository");
bullet("Go to https://vercel.com/new.");
bullet("Under “Import Git Repository”, find your repo.");
bullet(
    "If it is not listed, click “Adjust GitHub App Permissions” and grant access.",
);
bullet("Click “Import”.");

h3("Step 2: Configure the project");
p(
    "Vercel auto-detects Next.js from package.json and next.config. Leave the defaults:",
);
bullet("Framework Preset: Next.js");
bullet("Build Command: next build (auto-filled)");
bullet("Output Directory: .next (auto-filled)");
bullet("Install Command: npm install (auto-filled)");
p("Click “Deploy”. The first build finishes in 2–3 minutes.");

h3("Step 3: Watch the build");
p(
    "Vercel runs `npm install` then `next build`. When it finishes you get a live URL like:",
);
code("https://your-project-name.vercel.app");

note(
    "If the build fails on Vercel but passes locally, the most common cause is a peer-dependency conflict (ERESOLVE) on a fresh install. Add a file named .npmrc in your project root with the line: legacy-peer-deps=true — then commit and redeploy.",
);

// ---- Method B: CLI ----
h2("3. Method B — Deploy via the Vercel CLI");
p("Use this when you want to deploy from your terminal or automate deploys.");

h3("Step 1: Install the Vercel CLI");
code("npm i -g vercel");

h3("Step 2: Log in");
code("vercel login");
p("Follow the prompts (email or GitHub). This authenticates your machine.");

h3("Step 3: Deploy a preview");
p("From your project root, run:");
code("vercel");
p(
    "Answer the prompts (set up and deploy, confirm scope, project name, directory). This creates a preview deployment at a unique *.vercel.app URL.",
);

h3("Step 4: Deploy to production");
code("vercel --prod");
p("This promotes the build to your production URL.");

note(
    "To skip the interactive prompts, use: vercel --prod --yes. If the auto-generated project name is rejected, the CLI will tell you — just retry.",
);

// ---- Environment Variables ----
h2("4. Set Environment Variables");
p(
    "Environment variables are NOT copied from your .env.local. You must add them in Vercel.",
);

h3("Via the dashboard");
bullet("Go to Project → Settings → Environment Variables.");
bullet("Add each variable (name + value).");
bullet("Choose the environment: Production, Preview, or Development.");
bullet("Click “Redeploy” so the new build picks them up.");

h3("Via the CLI");
p("Add a variable (you will be prompted for the value):");
code("vercel env add VARIABLE_NAME production");
p("Pull variables locally to .env.local:");
code("vercel env pull .env.local");
p("Remove a variable:");
code("vercel env rm VARIABLE_NAME production --yes");

note(
    "Never commit real secrets to git. Add them only in the Vercel dashboard or via the CLI. Keep .env.local in .gitignore.",
);

// ---- Custom Domain ----
h2("5. Connect a Custom Domain");

h3("Step 1: Add the domain in Vercel");
bullet("Go to Project → Settings → Domains.");
bullet("Click “Add”, enter your domain (e.g. mysite.com), click “Add”.");
bullet("Add the www variant (www.mysite.com) and set it to redirect to the root.");

h3("Step 2: Create DNS records at your registrar");
p("Vercel shows you the exact records. Typically:");
code([
    "Type     Host     Value / Points to",
    "A        @        76.76.21.21",
    "CNAME    www      cname.vercel-dns.com",
]);

h3("Step 3: Verify");
bullet(
    "Wait for the DNS + Domain Configuration checks to turn green (minutes to 48h).",
);
bullet(
    "Vercel auto-provisions an SSL/TLS certificate via Let's Encrypt.",
);
bullet("Once it says “Valid Certificate”, your site is live at https://mysite.com.");

h3("Step 4: Update NEXT_PUBLIC_SITE_URL");
p(
    "If your app uses the site URL for metadata/sitemap/OG tags, set NEXT_PUBLIC_SITE_URL to your final domain (https://mysite.com) and redeploy.",
);

// ---- Automatic Deploys ----
h2("6. Automatic Deploys from Git");
p(
    "Once your repo is connected, every `git push` to your main branch triggers a new production deployment. Pull requests get isolated Preview deployments with their own URLs.",
);
code([
    "git add .",
    "git commit -m \"feat: update site\"",
    "git push origin main   # triggers a production deploy",
]);

// ---- Common Issues ----
h2("7. Common Issues & Fixes");

h3("Build fails: npm install exits with code 1 (ERESOLVE)");
p("Peer-dependency conflict on a fresh install. Fix:");
code("echo legacy-peer-deps=true > .npmrc");
p("Commit it and redeploy.");

h3("Build fails: Node version mismatch");
p(
    "Set the Node version in Project → Settings → General → Node.js Version (18.x, 20.x, or 22.x). Match your local version.",
);

h3("Domain stays “Pending”");
p(
    "Double-check the A/CNAME records at your registrar. DNS propagation can take up to 48 hours. Lower the TTL to speed it up.",
);

h3("Environment variable not taking effect");
p(
    "Environment variables are baked in at build time. After adding or changing one, you must Redeploy — just changing the value does not update the live site.",
);

h3("404 on dynamic routes after deploy");
p(
    "Make sure the required environment variables are present for the Production environment, then redeploy.",
);

// ---- Summary ----
h2("8. Summary Checklist");
bullet("Project builds locally with `npm run build`.");
bullet("Code pushed to a Git repository.");
bullet("Imported into Vercel (dashboard or CLI).");
bullet("First deployment is live at *.vercel.app.");
bullet("Environment variables added and redeployed.");
bullet("Custom domain added in Settings → Domains.");
bullet("DNS A + CNAME records created at registrar.");
bullet("SSL certificate provisioned (green checkmark).");
bullet("NEXT_PUBLIC_SITE_URL set to final domain + redeploy.");

hr();
p(
    "That’s it — your Next.js project is now live on Vercel with your custom domain. Every future push to your main branch redeploys automatically.",
);

// ---- Footer on first page ----
footer(1);

// ---- Page break + second page footer ----
doc.addPage();
footer(2);

doc.end();

stream.on("finish", () => {
    console.log(`PDF written to ${OUT}`);
});
