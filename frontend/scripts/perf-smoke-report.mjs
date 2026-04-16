import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const baseDir = fileURLToPath(new URL("..", import.meta.url));
const outDir = join(baseDir, "..", "docs", "qa", "reports", "WEDA-15");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = join(baseDir, urlPath);
  try {
    const data = await readFile(filePath);
    const type = mime[extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

const endpoints = ["/index.min.html", "/styles.min.css", "/app.min.js"];
const results = [];

for (const endpoint of endpoints) {
  const start = performance.now();
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`);
  const content = await response.text();
  const end = performance.now();
  results.push({ endpoint, ms: Number((end - start).toFixed(1)), bytes: Buffer.byteLength(content, "utf8") });
}

server.close();

const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);
const report = { generatedAt: new Date().toISOString(), totalBytes, assets: results };

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, "perf-smoke.json"), JSON.stringify(report, null, 2), "utf8");

console.log(`Wrote ${join(outDir, "perf-smoke.json")}`);