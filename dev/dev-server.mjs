import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const baseDir = fileURLToPath(new URL("../frontend", import.meta.url));
const vendors = [
  { name: "ShutterLoom Weddings", category: "photography", tier: "mid", city: "Ahmedabad" },
  { name: "Mogra & Gold Decor Studio", category: "decor", tier: "premium", city: "Vadodara" },
  { name: "Rasoi Ritual Caterers", category: "catering", tier: "economy", city: "Surat" },
  { name: "Apsara Bridal Makeup", category: "makeup", tier: "mid", city: "Ahmedabad" }
];

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/vendors")) {
    const url = new URL(req.url, "http://localhost");
    const category = url.searchParams.get("category") ?? "all";
    const tier = url.searchParams.get("tier") ?? "all";
    const city = url.searchParams.get("city") ?? "";
    const items = vendors.filter((v) =>
      (category === "all" || v.category === category) &&
      (tier === "all" || v.tier === tier) &&
      (city === "" || v.city.toLowerCase().includes(city.toLowerCase()))
    );
    const body = JSON.stringify({ items });
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
    res.end(body);
    return;
  }

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

server.listen(5173, () => {
  console.log("Dev server: http://127.0.0.1:5173");
});