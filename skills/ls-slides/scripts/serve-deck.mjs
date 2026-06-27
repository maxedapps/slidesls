#!/usr/bin/env node
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { parseArgs, printJson } from "./lib/registry-source.mjs";

const help = `Usage: node skills/ls-slides/scripts/serve-deck.mjs [options]\n\nOptions:\n  --root <path>    Folder to serve (default: current working directory)\n  --entry <file>   Entry HTML file for / (default: index.html)\n  --host <host>    Host (default: 127.0.0.1)\n  --port <port>    Port (default: 4173)\n  --json          Print machine-readable server info\n  --help          Show help\n`;

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
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function isInside(root, filePath) {
  const relative = path.relative(root, filePath);
  return relative ? !relative.startsWith("..") && !path.isAbsolute(relative) : true;
}

try {
  const args = parseArgs(process.argv.slice(2), { boolean: ["json", "help"] });
  if (args.help) {
    process.stdout.write(help);
    process.exit(0);
  }

  const root = path.resolve(args.root || process.cwd());
  const entry = args.entry || "index.html";
  const host = args.host || "127.0.0.1";
  const port = Number.parseInt(args.port || "4173", 10);

  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid --port: ${args.port}`);
  }

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", `http://${host}:${port}`);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === "/") pathname = `/${entry}`;
      const relative = pathname.replace(/^\/+/, "");
      const filePath = path.resolve(root, relative);

      if (!isInside(root, filePath)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
      }

      const fileStat = await stat(filePath).catch(() => null);
      if (!fileStat || !fileStat.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type":
          mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
      });
      createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500);
      response.end(error.message);
    }
  });

  server.listen(port, host, () => {
    const info = { root, entry, host, port, url: `http://${host}:${port}/` };
    if (args.json) printJson(info);
    else console.error(`Serving ${root}/${entry} at ${info.url}`);
  });
} catch (error) {
  console.error(`serve-deck: ${error.message}`);
  process.exit(1);
}
