import { cp, mkdir, rm } from "node:fs/promises";

const files = [
  "index.html",
  "project.html",
  "about.html",
  "contact.html",
  "studio.html",
  "service.html",
  "styles.css",
  "work.css",
  "fixed-pages.css",
  "subpages.css",
  "script.js",
  "work.js",
  "project-detail.css",
  "content.js",
  "_headers",
  "assets",
  "content",
  "admin",
  "work"
];

await rm("out", { recursive: true, force: true });
await mkdir("out", { recursive: true });

for (const file of files) {
  await cp(file, `out/${file}`, { recursive: true });
}

console.log("Static site copied to out/");
