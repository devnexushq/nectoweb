// Generates public/sitemap.xml before dev & build.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const BASE_URL = "https://nectoweb.vercel.app";

interface Entry {
  path: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
}

const today = new Date().toISOString().split("T")[0];

const entries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/c/register", changefreq: "monthly", priority: "0.8" },
  { path: "/w/register", changefreq: "monthly", priority: "0.8" },
  { path: "/s/register", changefreq: "monthly", priority: "0.8" },
];

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      e.changefreq && `    <changefreq>${e.changefreq}</changefreq>`,
      e.priority && `    <priority>${e.priority}</priority>`,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  ),
  `</urlset>`,
].join("\n");

const out = resolve("public/sitemap.xml");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, xml);
console.log(`sitemap.xml written (${entries.length} entries)`);
