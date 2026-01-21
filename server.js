import "dotenv/config";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import whaleAlerts from "./netlify/function/whale-alerts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 5173;

const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith("/api/whale-alerts")) {
    if (req.method !== "GET") {
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method not allowed");
      return;
    }

    try {
      const request = new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
      });
      const response = await whaleAlerts(request);
      const body = Buffer.from(await response.arrayBuffer());
      const headers = Object.fromEntries(response.headers.entries());
      res.writeHead(response.status, headers);
      res.end(body);
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const sanitizedPath = path.normalize(urlPath).replace(/^\.\.(\/|\\)/, "");
  const filePath = path.join(__dirname, sanitizedPath);
  const ext = path.extname(filePath);

  const fileBuffer = await readFileSafe(filePath);
  if (!fileBuffer) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
  });
  res.end(fileBuffer);
});

server.listen(port, () => {
  console.log(`Static server running at http://localhost:${port}`);
});
