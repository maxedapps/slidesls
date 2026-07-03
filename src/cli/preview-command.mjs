import { createServer } from "node:http";
import path from "node:path";
import { readFile, realpath } from "node:fs/promises";
import { parseArgs } from "../shared/args.mjs";
import { ok } from "../shared/result.mjs";
import { assertInside } from "../shared/fs.mjs";
import { DEFAULT_CONFIG, readConfig } from "../deck/config.mjs";
export async function previewCommand(argv) {
  const args = parseArgs(argv, { boolean: ["json", "help"], value: ["dir", "host", "port"] });
  if (args.help)
    return ok({
      help: `Usage: slidesls preview [dir] [--host <host>] [--port <port>] [--json]

Starts a local server, prints the URL, and keeps running until stopped.`,
    });
  const start = path.resolve(args._[0] || args.dir || ".");
  const { config: foundConfig, root } = await readConfig(start);
  const config = foundConfig || DEFAULT_CONFIG;
  const host = args.host || "127.0.0.1";
  const desiredPort = Number(args.port || 4321);
  const realRoot = await realpath(root);
  const server = createServer(async (request, response) => {
    try {
      if (!["GET", "HEAD"].includes(request.method || "GET")) {
        response.statusCode = 405;
        response.setHeader("Allow", "GET, HEAD");
        response.end("Method not allowed");
        return;
      }
      const url = new URL(request.url || "/", `http://${host}`);
      const relative =
        url.pathname === "/" ? config.paths.entry : decodeURIComponent(url.pathname.slice(1));
      if (relative.endsWith("/")) {
        response.statusCode = 404;
        response.end("Not found");
        return;
      }
      const target = path.join(root, relative);
      assertInside(root, target);
      const realTarget = await realpath(target);
      assertInside(realRoot, realTarget);
      response.setHeader("Content-Type", contentType(target));
      response.setHeader("Cache-Control", "no-store");
      if (request.method === "HEAD") response.end();
      else response.end(await readFile(realTarget));
    } catch (error) {
      response.statusCode = error instanceof URIError || error instanceof TypeError ? 400 : 404;
      response.end(response.statusCode === 400 ? "Bad request" : "Not found");
    }
  });
  const port = await listen(server, host, desiredPort);
  const url = `http://${host}:${port}/`;
  return ok({
    url,
    exportUrl: `${url}?export=1`,
    root,
    entry: config.paths.entry,
    host,
    port,
    pid: process.pid,
    note: "Server keeps running until this process is stopped.",
    agentInstructions: {
      purpose: "Preview and visually inspect a slidesls deck.",
      rules: [
        "Keep this long-running server active while using browser automation.",
        "Inspect both normal and export mode.",
      ],
      longRunningCommands: [`slidesls preview ${root} --host ${host} --port ${port}`],
    },
  });
}

function contentType(filePath) {
  return (
    {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".mjs": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
      ".avif": "image/avif",
      ".gif": "image/gif",
      ".ico": "image/x-icon",
      ".woff2": "font/woff2",
    }[path.extname(filePath).toLowerCase()] || "application/octet-stream"
  );
}

function listen(server, host, port) {
  return new Promise((resolve, reject) => {
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" && port !== 0) resolve(listen(server, host, 0));
      else reject(error);
    });
    server.listen(port, host, () => resolve(server.address().port));
  });
}
