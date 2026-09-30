// Project Management Tool, local server (PRD 7.1, 7.2 and 7.3). No dependencies, run with "node server.js".
// Serves index.html, creates the client folder set on disk, saves what the user adds to data/state.json,
// and prints issued quotations to PDF using the Chrome or Edge already on the computer.
// Listens on this computer only. index.html still works on its own without it.
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const APP_NAME = "Project Management Tool";
const APP_DIR = __dirname;
const DEFAULTS = { port: 3000, clientsRoot: "Clients", dataDir: "data" };
const MAX_BODY = 64 * 1024;
const MAX_STATE = 1024 * 1024;
const MAX_ROWS = 5000;

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

// What the page is allowed to save. Sample data is never saved, it lives in index.html.
const STATE_KEYS = ["projects", "posts", "checkins", "apprDone", "snagsFixed", "quotes"];

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
  const data = process.env.SITEBOOK_DATA_DIR || cfg.dataDir || DEFAULTS.dataDir;
  return {
    port,
    clientsRoot: path.resolve(APP_DIR, String(root)),
    dataDir: path.resolve(APP_DIR, String(data)),
    browser: process.env.SITEBOOK_BROWSER || cfg.browser || "",
  };
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

function fail(status, error, extra) {
  return Object.assign({ status, error }, extra);
}

function readJson(req, max) {
  return new Promise((resolve, reject) => {
    if (!/^application\/json\b/i.test(req.headers["content-type"] || "")) {
      return reject(fail(415, "Send the request as JSON."));
    }
    if (Number(req.headers["content-length"]) > max) {
      return reject(fail(413, "That request is too large."));
    }
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > max) {
        reject(fail(413, "That request is too large."));
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
        reject(fail(400, "The request was not valid JSON."));
      }
    });
    req.on("error", () => reject(fail(400, "The request could not be read.")));
  });
}

// ---------- client folders (PRD 7.1) ----------

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
    `Created ${today} by the ${APP_NAME}.`,
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
  const b = await readJson(req, MAX_BODY);
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

// ---------- saved changes (PRD 7.2) ----------

function emptyState() {
  return Object.fromEntries(STATE_KEYS.map((k) => [k, []]));
}

// Keeps the known lists only, and checks each row is the plain shape the page writes
function cleanState(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) throw fail(400, "The saved data must be an object.");
  const out = emptyState();
  for (const k of STATE_KEYS) {
    const rows = s[k] === undefined ? [] : s[k];
    if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw fail(400, `The list "${k}" is not valid.`);
    for (const r of rows) {
      const ok = k === "apprDone" ? Number.isFinite(r) : r && typeof r === "object" && !Array.isArray(r);
      if (!ok) throw fail(400, `The list "${k}" holds a row that is not valid.`);
    }
    out[k] = rows;
  }
  return out;
}

function readState(cfg) {
  const file = path.join(cfg.dataDir, "state.json");
  if (!fs.existsSync(file)) return { rev: 0, state: emptyState() };
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    return { rev: Number(raw.rev) || 0, state: cleanState(raw.state) };
  } catch (e) {
    // Never overwrite a file we could not read, the owner may want what is in it
    throw fail(500, "The saved data file could not be read. Fix or remove data/state.json, then reload.");
  }
}

async function saveState(req, res, cfg) {
  const b = await readJson(req, MAX_STATE);
  const current = readState(cfg);
  if (Number(b.rev) !== current.rev) {
    return send(res, 409, { ok: false, error: "The saved data was changed in another window.", rev: current.rev });
  }
  const state = cleanState(b.state);
  const rev = current.rev + 1;

  fs.mkdirSync(cfg.dataDir, { recursive: true });
  const file = path.join(cfg.dataDir, "state.json");
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ version: 1, rev, savedAt: new Date().toISOString(), state }, null, 2));
  // One step of undo. The save before this one is kept beside it.
  if (fs.existsSync(file)) fs.copyFileSync(file, path.join(cfg.dataDir, "state.prev.json"));
  fs.renameSync(tmp, file);
  send(res, 200, { ok: true, rev });
}

// ---------- quotation PDF (PRD 7.3) ----------

// Chrome or Edge can print a page to PDF with no window. We use whichever is installed.
function findBrowser(cfg) {
  const c = [];
  if (cfg.browser) c.push(cfg.browser);
  if (process.platform === "win32") {
    const pf = process.env.ProgramFiles || "C:\\Program Files";
    const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
    const local = process.env.LOCALAPPDATA || "";
    c.push(
      path.join(pf, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(pf86, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(local, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(pf86, "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(pf, "Microsoft", "Edge", "Application", "msedge.exe")
    );
  } else if (process.platform === "darwin") {
    c.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    );
  } else {
    c.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge");
  }
  return c.find((p) => p && fs.existsSync(p)) || null;
}

// The quotation is wrapped in the page's own stylesheet so the PDF matches the screen
function printPage(html) {
  const index = fs.readFileSync(path.join(APP_DIR, "index.html"), "utf8");
  const style = (index.match(/<style>[\s\S]*?<\/style>/) || [""])[0];
  const fonts = (index.match(/<link rel="stylesheet"[^>]*>/) || [""])[0];
  const safe = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Quotation</title>${fonts}${style}</head><body><div id="qDoc"><div class="panel">${safe}</div></div></body></html>`;
}

// Edge's launcher returns before the file is written, so we watch the file rather than the exit code
function printPdf(browser, htmlFile, pdfFile) {
  return new Promise((resolve, reject) => {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "pmt-print-"));
    const args = [
      "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
      "--user-data-dir=" + profile, "--virtual-time-budget=5000", "--no-pdf-header-footer",
      "--print-to-pdf=" + pdfFile, "file:///" + htmlFile.replace(/\\/g, "/"),
    ];
    let child, done = false, lastSize = -1;
    const started = Date.now();
    const finish = (err) => {
      if (done) return;
      done = true;
      clearInterval(timer);
      try { if (child && child.exitCode === null) child.kill(); } catch (e) {}
      setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} }, 3000);
      err ? reject(err) : resolve();
    };
    const timer = setInterval(() => {
      let size = -1;
      try { size = fs.statSync(pdfFile).size; } catch (e) {}
      if (size > 0 && size === lastSize) return finish();
      lastSize = size;
      if (Date.now() - started > 30000) finish(new Error("The browser took too long to make the PDF."));
    }, 300);
    try {
      child = spawn(browser, args, { stdio: "ignore" });
      child.on("error", (e) => finish(new Error("The browser could not be started. " + e.message)));
    } catch (e) {
      finish(e);
    }
  });
}

async function quotePdf(req, res, cfg) {
  const b = await readJson(req, MAX_STATE);
  const no = String(b.no || "");
  if (!/^SMQ-\d{4}-\d{3,6}$/.test(no)) {
    return send(res, 400, { ok: false, error: "The quotation number must look like SMQ-2026-041." });
  }
  const html = typeof b.html === "string" ? b.html.trim() : "";
  if (!html) return send(res, 400, { ok: false, error: "There is no quotation to print." });

  const browser = findBrowser(cfg);
  if (!browser) {
    return send(res, 501, { ok: false, error: "No Chrome or Edge was found on this computer, so the PDF was not made. Use Print or save as PDF instead, or set \"browser\" in sitebook.config.json." });
  }

  // Into the client's 03 folder when it exists, otherwise into Clients/Quotations
  const root = cfg.clientsRoot;
  fs.mkdirSync(root, { recursive: true });
  const code = String(b.code || "");
  let folder = null;
  if (/^SMB-\d{4}-\d{3,6}$/.test(code)) {
    const hit = fs.readdirSync(root).find((n) => n === code || n.startsWith(code + " "));
    if (hit) folder = path.join(root, hit, FOLDERS[2]);
  }
  if (!folder) folder = path.join(root, "Quotations");
  fs.mkdirSync(folder, { recursive: true });

  const base = safeName(no + " " + String(b.title || "")) || no;
  let pdf = path.join(folder, base + ".pdf");
  for (let n = 2; fs.existsSync(pdf); n++) pdf = path.join(folder, `${base} (${n}).pdf`);
  if (!inside(root, pdf)) {
    return send(res, 400, { ok: false, error: "That name would put the PDF outside the clients folder." });
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pmt-quote-"));
  const htmlFile = path.join(tmpDir, "quotation.html");
  fs.writeFileSync(htmlFile, printPage(html));
  try {
    await printPdf(browser, htmlFile, pdf);
  } catch (e) {
    return send(res, 500, { ok: false, error: "The PDF was not made. " + e.message });
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }

  console.log(`Saved ${pdf}`);
  send(res, 201, { ok: true, pdf, folder, where: path.relative(root, folder) });
}

// ---------- server ----------

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
      if (!hosts.has(req.headers.host || "")) return send(res, 403, { ok: false, error: "Open the tool at localhost." });
      if (req.headers.origin && !origins.has(req.headers.origin)) return send(res, 403, { ok: false, error: "Requests must come from the tool's own page." });

      const url = new URL(req.url, "http://localhost").pathname;
      const read = req.method === "GET" || req.method === "HEAD";

      if (read && (url === "/" || url === "/index.html")) return serveIndex(req, res);
      if (read && url === "/api/health") {
        return send(res, 200, {
          ok: true,
          app: "sitebook",
          store: true,
          pdf: !!findBrowser(cfg),
          clientsRoot: cfg.clientsRoot + path.sep,
          nextSeq: nextSeq(cfg.clientsRoot),
        });
      }
      if (read && url === "/api/state") return send(res, 200, Object.assign({ ok: true }, readState(cfg)));
      if (req.method === "PUT" && url === "/api/state") return await saveState(req, res, cfg);
      if (req.method === "POST" && url === "/api/clients") return await createClient(req, res, cfg);
      if (req.method === "POST" && url === "/api/quotes/pdf") return await quotePdf(req, res, cfg);

      send(res, 404, { ok: false, error: "Not found." });
    } catch (e) {
      if (e && e.status) {
        if (e.status === 413) res.setHeader("Connection", "close");
        const { status, ...rest } = e;
        return send(res, status, Object.assign({ ok: false }, rest));
      }
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
    if (e.code === "EADDRINUSE") console.error(`Port ${cfg.port} is already in use. Close the other window running the tool, or change "port" in sitebook.config.json.`);
    else console.error(e.message);
    process.exit(1);
  });
  v4.listen(cfg.port, "127.0.0.1", () => {
    console.log(`${APP_NAME} is running at ${url}`);
    console.log(`Client folders go in ${cfg.clientsRoot}`);
    console.log(`Changes are saved in ${path.join(cfg.dataDir, "state.json")}`);
    const browser = findBrowser(cfg);
    console.log(browser ? `Quotation PDFs are made with ${browser}` : "No Chrome or Edge found, quotation PDFs are off. The Print button still works.");
    console.log("Press Ctrl+C to stop.");
    if (process.argv.includes("--open")) openBrowser(url);
  });

  // "localhost" can resolve to IPv6 first. Listen there too when the machine has it.
  const v6 = http.createServer(handler);
  v6.on("error", () => {});
  v6.listen(cfg.port, "::1");
}

if (require.main === module) main();
module.exports = { safeName, inside, nextSeq, cleanState, findBrowser, FOLDERS };
