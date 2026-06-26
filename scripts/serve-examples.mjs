#!/usr/bin/env node
import { createServer } from "node:http";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const examplesRoot = path.join(repoRoot, "examples");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
]);

function parseArgs(argv) {
  const options = { host: "localhost", port: 4173 };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--host") {
      options.host = argv[index + 1] || options.host;
      index += 1;
    } else if (arg === "--port") {
      const port = Number.parseInt(argv[index + 1] || "", 10);
      if (Number.isFinite(port)) {
        options.port = port;
      }
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }

  return options;
}

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function redirect(response, location) {
  send(response, 302, `Redirecting to ${location}`, { Location: location });
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function getExamples() {
  const entries = await readdir(examplesRoot, { withFileTypes: true });
  const examples = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const indexPath = path.join(examplesRoot, entry.name, "index.html");
    if (await fileExists(indexPath)) {
      examples.push(entry.name);
    }
  }

  return examples.sort((a, b) => a.localeCompare(b));
}

async function renderExamplesIndex() {
  const examples = await getExamples();
  const list = examples
    .map((example) => `<li><a href="/examples/${example}/">${example}</a></li>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ls_slides examples</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0b0d12; color: #f5f7fb; font: 18px/1.5 system-ui, sans-serif; }
      main { width: min(720px, calc(100vw - 48px)); }
      h1 { margin: 0 0 12px; font-size: 48px; letter-spacing: -0.04em; }
      p { margin: 0 0 24px; color: #bcc3d0; }
      ul { display: grid; gap: 10px; padding: 0; margin: 0; list-style: none; }
      a { display: block; padding: 16px 18px; border: 1px solid rgb(255 255 255 / 12%); border-radius: 14px; background: #181b23; color: #bfdbfe; text-decoration: none; }
      a:hover { border-color: rgb(96 165 250 / 35%); background: #20242e; }
    </style>
  </head>
  <body>
    <main>
      <h1>ls_slides examples</h1>
      <p>Select an example deck.</p>
      <ul>${list || "<li>No examples with index.html found.</li>"}</ul>
    </main>
  </body>
</html>`;
}

async function resolveStaticPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const normalizedPath = path.normalize(decodedPath).replace(/^[/\\]+/, "");
  const filePath = path.join(repoRoot, normalizedPath);
  const relative = path.relative(repoRoot, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat) {
    return null;
  }

  if (fileStat.isDirectory()) {
    const indexPath = path.join(filePath, "index.html");
    return (await fileExists(indexPath)) ? indexPath : null;
  }

  return fileStat.isFile() ? filePath : null;
}

async function handleRequest(request, response) {
  if (!request.url) {
    send(response, 400, "Bad request");
    return;
  }

  const url = new URL(request.url, "http://localhost");

  if (url.pathname === "/") {
    redirect(response, "/examples/");
    return;
  }

  if (url.pathname === "/examples" || url.pathname === "/examples/") {
    send(response, 200, await renderExamplesIndex(), {
      "Content-Type": "text/html; charset=utf-8",
    });
    return;
  }

  const filePath = await resolveStaticPath(url.pathname);
  if (!filePath) {
    send(response, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  send(response, 200, await readFile(filePath), {
    "Content-Type": mimeTypes.get(extension) || "application/octet-stream",
  });
}

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  console.log(
    `Usage: pnpm serve:examples [-- --host localhost --port 4173]\n\nServes the repository root and renders /examples/ as an index of example decks.`,
  );
  process.exit(0);
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    send(response, 500, "Internal server error", { "Content-Type": "text/plain; charset=utf-8" });
  });
});

server.listen(options.port, options.host, () => {
  const baseUrl = `http://${options.host}:${options.port}`;
  console.log(`ls_slides examples server running at ${baseUrl}/examples/`);
  console.log(`Project intro: ${baseUrl}/examples/project-intro/`);
});
