// Sitebook local server (PRD 7.1). No dependencies, run with "node server.js".
// Serves index.html and creates the client folder set on disk.
// Listens on this computer only. index.html still works on its own without it.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const APP_DIR = __dirname;
const DEFAULTS = { port: 3000, clientsRoot: "Clients" };
const MAX_BODY = 64 * 1024;

// Keep in step with FOLDERS in index.html
const FOLDERS = [
  "01 Brief and site survey",
  "02 Design",
  "03 Quotation and BOQ",
  "04 Submissions (mall, Bomba, authority)",
  "05 Contract and variations",
  "06 Site (photos, daily logs)",
  "07 Claims and invoices",
  "08 Handover and DLP",
];

function loadConfig() {
  const file = path.join(APP_DIR, "sitebook.config.json");
  let cfg = {};
  if (fs.existsSync(file)) {
    try {
      cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      console.error("sitebook.config.json is not valid JSON. " + e.message);
      process.exit(1);
    }
  }
  const port = Number(process.env.SITEBOOK_PORT || cfg.port) || DEFAULTS.port;
  const root = process.env.SITEBOOK_CLIENTS_ROOT || cfg.clientsRoot || DEFAULTS.clientsRoot;
  return { port, clientsRoot: path.resolve(APP_DIR, String(root)) };
}

// Same rules as safeName() in index.html
function safeName(s) {
  return String(s == null ? "" : s)
    .replace(/[\\/:*?"<>|\x00-\x1f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, 60)
    .trim();
}

// One line of plain text for the project sheet
function field(v) {
  return String(v == null ? "" : v).replace(/[\x00-\x1f]+/g, " ").replace(/\|/g, "/").trim().slice(0, 200);
}

function inside(root, target) {
  const rel = path.relative(root, target);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

// Next free client number for this year, read from the folders already on disk
function nextSeq(root) {
  const year = new Date().getFullYear();
  let max = 0;
  if (fs.existsSync(root)) {
    for (const name of fs.readdirSync(root)) {
      const m = /^SMB-(\d{4})-(\d{3,6})(?: |$)/.exec(name);
      if (m && +m[1] === year) max = Math.max(max, +m[2]);
    }
  }
  return max + 1;
}

function send(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
  });
  res.end(text);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject({ status: 413, error: "That request is too large." });
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("not an object");
        resolve(data);
      } catch (e) {
        reject({ status: 400, error: "The request was not valid JSON." });
      }
    });
    req.on("error", () => reject({ status: 400, error: "The request could not be read." }));
  });
}

function projectSheet(code, brand, b) {
  const rows = [
    ["Client code", code],
    ["Brand or outlet", brand],
    ["Company", b.company],
    ["Person in charge", b.pic],
    ["Phone", b.phone],
    ["Email", b.email],
    ["Project type", b.type],
    ["Area (sq ft)", b.area],
    ["Venue and unit", b.venue],
    ["Target opening", b.open],
    ["Came through", b.source],
    ["Salesperson", b.sales],
    ["Project manager", b.pm],
  ];
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return [
    `# ${code} ${brand}, project sheet`,
    "",
    `Created ${today} by Sitebook.`,
    "",
    "| Field | Detail |",
    "|---|---|",
    ...rows.map(([k, v]) => `| ${k} | ${field(v)} |`),
    "",
    "## Folders",
    "",
    ...FOLDERS.map((f, i) => `${i + 1}. ${f}`),
    "",
  ].join("\n");
}

async function createClient(req, res, cfg) {
  if (!/^application\/json\b/i.test(req.headers["content-type"] || "")) {
    return send(res, 415, { ok: false, error: "Send the client as JSON." });
  }
  if (Number(req.headers["content-length"]) > MAX_BODY) {
    res.setHeader("Connection", "close");
    return send(res, 413, { ok: false, error: "That request is too large." });
  }
  const b = await readJson(req);
  const code = String(b.code || "");
  if (!/^SMB-\d{4}-\d{3,6}$/.test(code)) {
    return send(res, 400, { ok: false, error: "The client code must look like SMB-2026-007." });
  }
  const brand = safeName(b.brand);
  if (!brand) {
    return send(res, 400, { ok: false, error: "A brand or outlet name is needed to name the folder." });
  }

  const root = cfg.clientsRoot;
  fs.mkdirSync(root, { recursive: true });
  const taken = fs.readdirSync(root).some((n) => n === code || n.startsWith(code + " "));
  if (taken) {
    return send(res, 409, { ok: false, error: `${code} already has a folder on disk.`, nextSeq: nextSeq(root) });
  }

  const name = `${code} ${brand}`;
  const folder = path.join(root, name);
  if (!inside(root, folder)) {
    return send(res, 400, { ok: false, error: "That name would put the folder outside the clients folder." });
  }

  fs.mkdirSync(folder);
  const created = [folder];
  for (const f of FOLDERS) {
    const p = path.join(folder, f);
    fs.mkdirSync(p);
    created.push(p);
  }
  const sheet = path.join(folder, `${name} project sheet.md`);
  fs.writeFileSync(sheet, projectSheet(code, brand, b), { flag: "wx" });

  console.log(`Created ${folder}`);
  send(res, 201, { ok: true, code, name, folder, created, sheet, nextSeq: nextSeq(root) });
}

function serveIndex(req, res) {
  fs.readFile(path.join(APP_DIR, "index.html"), (err, buf) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("index.html is missing beside server.js");
    }
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": buf.length,
      "Cache-Control": "no-store",
    });
    res.end(req.method === "HEAD" ? undefined : buf);
  });
}

function makeHandler(cfg) {
  const hosts = new Set([`localhost:${cfg.port}`, `127.0.0.1:${cfg.port}`, `[::1]:${cfg.port}`]);
  const origins = new Set([...hosts].map((h) => "http://" + h));

  return async (req, res) => {
    try {
      // Only answer requests addressed to this computer, and only from this page
      if (!hosts.has(req.headers.host || "")) return send(res, 403, { ok: false, error: "Open Sitebook at localhost." });
      if (req.headers.origin && !origins.has(req.headers.origin)) return send(res, 403, { ok: false, error: "Requests must come from Sitebook." });

      const url = new URL(req.url, "http://localhost").pathname;
      const read = req.method === "GET" || req.method === "HEAD";

      if (read && (url === "/" || url === "/index.html")) return serveIndex(req, res);
      if (read && url === "/api/health") {
        return send(res, 200, {
          ok: true,
          app: "sitebook",
          clientsRoot: cfg.clientsRoot + path.sep,
          nextSeq: nextSeq(cfg.clientsRoot),
        });
      }
      if (req.method === "POST" && url === "/api/clients") return await createClient(req, res, cfg);

      send(res, 404, { ok: false, error: "Not found." });
    } catch (e) {
      if (e && e.status) return send(res, e.status, { ok: false, error: e.error });
      console.error(e);
      send(res, 500, { ok: false, error: "The server could not finish that. " + (e && e.code ? e.code : "See the server window.") });
    }
  };
}

function openBrowser(url) {
  const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).on("error", () => {}).unref();
  } catch (e) {}
}

function main() {
  const cfg = loadConfig();
  const handler = makeHandler(cfg);
  const url = `http://localhost:${cfg.port}`;

  const v4 = http.createServer(handler);
  v4.on("error", (e) => {
    if (e.code === "EADDRINUSE") console.error(`Port ${cfg.port} is already in use. Close the other Sitebook window, or change "port" in sitebook.config.json.`);
    else console.error(e.message);
    process.exit(1);
  });
  v4.listen(cfg.port, "127.0.0.1", () => {
    console.log(`Sitebook is running at ${url}`);
    console.log(`Client folders go in ${cfg.clientsRoot}`);
    console.log("Press Ctrl+C to stop.");
    if (process.argv.includes("--open")) openBrowser(url);
  });

  // "localhost" can resolve to IPv6 first. Listen there too when the machine has it.
  const v6 = http.createServer(handler);
  v6.on("error", () => {});
  v6.listen(cfg.port, "::1");
}

if (require.main === module) main();
module.exports = { safeName, inside, nextSeq, FOLDERS };
