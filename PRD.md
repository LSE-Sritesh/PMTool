# Project Management Tool, product requirements

Renamed from Sitebook on 29 September 2026 at the owner's request. The name on screen, in the server window and in these documents has changed. File names and settings keep the old word (`sitebook.config.json`, the `SITEBOOK_` settings), because renaming those changes nothing a user sees.

Project management tool for SEMBA Malaysia Design & Construction Sdn. Bhd., a spatial design and fit-out firm in Kuala Lumpur.
Owner Sritesh Naidu, AI Lead, Lemon Sky Edge. Built as a concept prototype for a client pitch, now being taken forward as a real local application.

Version 1.0 of this document, 29 September 2026. Status of the build is in section 9.

## 1. Why this exists

SEMBA Malaysia asked Lemon Sky for three things in the 16 September 2026 meeting. A project management tool (deadlines, one place for client, PM and salesperson to talk, keeping a travelling site team in check), a sales CRM, and an AI tool for 3D design. 3D was dropped. The CRM is a separate course. This tool answers the first ask.

Two goals, in order.
1. Show SEMBA a working tool built for the way fit-out actually runs, so they see Lemon Sky as capable.
2. Make the case that learning to build with AI is worth their time, with Lemon Sky building the connected parts they cannot.

Rule that governs every feature. Nothing in the tool may promise a product or service Lemon Sky does not have. The footer says "Concept prototype". Keep it until there is a signed scope.

## 2. Who uses it

Team sizes come from SEMBA's own description on 16 September 2026.

| Role | Count at SEMBA | What they need from the tool |
|---|---|---|
| Project manager | 3 | Today's decisions, per-project status, one thread with the client, approvals waiting on others |
| Quantity surveyor | 2 | Contract sum, committed, claimed, variations, quotations |
| Site coordinator | 2 | Log a check-in from the phone with photos and a flag, see today's route |
| Business manager | 1 | Portfolio view, at-risk projects, claims outstanding |
| Managing director | 1 | Same as business manager, read only |
| Admin | 2 | New client onboarding, folder set, document filing |
| Designers | 6 | Design sign-off milestones, mall drawing resubmissions |
| Salesperson | unknown headcount | Post in the client thread, see which clients have gone quiet |
| Client | external | Updates, approvals and photos only, never money or internal flags |

Office suite (Google or Microsoft) is still unknown. Do not build against either until confirmed. Whether Tokyo HQ mandates a PM system is also unknown. Ask before any integration work.

## 3. How a fit-out job runs, the domain model

Every project moves through eight phases. Order carries meaning, the stepper and the Gantt both depend on it.

1. Brief. Client brief, site survey, mall fit-out guide obtained.
2. Design. Concept, material board, 3D, client design sign-off. Late sign-off is the most common cause of delay.
3. Submission. Drawings to mall management, Bomba (fire), DBKL or MBPJ where needed. A fixed window, typically 2 to 4 weeks, that cannot start until Design is signed off.
4. Procurement. Long-lead items ordered, subcontractors appointed.
5. Construction. Site possession to practical completion.
6. Snagging. Defects list, joint inspection with client, visual merchandising.
7. Handover. Keys, documents, retention starts.
8. DLP. Defects liability period, usually 6 months, retention released at the end.

Objects and their fields, as implemented in `index.html`.

Project. id, name, kind, venue, client (PIC, company), phase (0 to 7), status (ok, warn, bad, grey, blue), statusText, pm, sales, qs, site, design, open (ISO date), budget (contract sum), committed, claimed, vo (approved variations total), plan (phase to [start, end]), risk (one line, shown in Needs attention), milestones ([title, date, done|late|risk|due]), vos ([ref, description, amount, status]), snags ([title, open|closed]), thread ([role, name, time, message]).

Approval. id, item, proj, type (Client sign-off, Mall drawing, Bomba, Variation order, Progress claim), on (who), side (ours|theirs), days waiting, impact, state (open|done).

Site check-in. who, proj, time, note, flag (empty|warn|bad), flagText, photos (count in prototype, files in the local build).

Quotation line. section, description, qty, unit, material rate, labour rate. Amount is qty × (material + labour).

Client (new). company, brand, pic, phone, email, type, area, venue, open, source, sales, pm. Creates a Project in phase 0 and a client code `SMB-YYYY-NNN`.

## 4. Screens, what is built and how each behaves

### 4.1 Today
KPI tiles (live projects, at risk, approvals waiting, claims overdue, site check-ins today). Needs attention list built from every project's `risk` line plus every flagged site check-in, blocking items first. Site team right now. Live project cards.
Header shows the real date. All sample dates shift with the real date (see section 6).
The "Sample data" badge was removed on 30 September at Sritesh's request. The rail footer still says Concept prototype. Run from the local server, the top right shows a save status ("Changes saved on this computer" or "Not saved") and a Clear saved changes button (see section 7.2). Opened as a file, neither appears.

### 4.2 Projects
Card grid with filters (all, at risk, on site, design and submission, handed over). Click opens the detail. Detail has the phase stepper with planned dates, a risk banner, Milestones, Money (contract sum, committed, claimed, approved variations, uncommitted, with a bar), Team, then tabs. Updates is the single thread where PM, sales and client post, with a compose box that lets the demo post as any of the three. Variations is a priced table with a total. Snags can be marked fixed. Site log filters check-ins for this project. Approvals filters the queue for this project.
"Share client view" makes a private link for the project and copies it. Once shared, the button reads Copy client link and an Open client view link sits beside it. Needs the local server (see 7.4).

### 4.3 Timeline
Sixteen week Gantt starting the Monday four weeks before today. One row per project, a bar per phase, a blue line for the current week, month boundaries marked, a red outline on a phase that has run past its planned end while still current. Clicking a project name opens its detail.

### 4.4 Site team
Who is where today (two coordinators, their check-ins and planned stops). A check-in form (coordinator, project, note, flag). Saving adds to the log, refreshes Today, and shows a toast. With the local server running the form takes photos, up to 8 per check-in, and shows them as thumbnails in the log (see 7.5). The sample check-ins still show placeholder boxes.

### 4.5 Approvals
Queue sorted by days waiting. Filters for open, waiting on SEMBA, waiting on others, done. Chase shows a toast that says nothing was sent. Done marks the item and refreshes Today, including the claims overdue tile, which is summed from open progress claims.

### 4.6 Quotation (added 29 September)
Standard template for every job. Header (project picker that pre-fills client, attention, site and area, prepared by, validity, construction period, contingency, discount, service tax rate, deposit). Line items table with 14 standard sections and 19 template lines, editable inline, add and remove lines. Live totals. Generate renders the quotation document with SEMBA letterhead (address and phone from the public website), numbered lines grouped by section with section totals, material and labour columns, totals block, six standard terms, and two signature blocks. Copy as text works. Issue and file writes the total into the project's contract sum, posts a line in the project thread and advances the quotation number.
Added 1 October, at SEMBA's request for analysis on a quotation. Every line now carries a material cost and a labour cost beside the selling rates, what SEMBA pays against what the client pays. Two header fields, Markup percent on cost (typing a cost fills the selling rate from it, the rate can still be overtyped) and Target margin percent. An Analysis panel under the line items, marked SEMBA only, shows three boxes (profit after discount with margin and markup, profit before discount with what the discount costs, and the deposit collected with how much of the material cost it covers) and a section table sorted weakest first with any section under the target in red. The material and labour box and the explaining paragraph were removed on 4 October at Sritesh's request, and shares are shown with the % sign. The live totals line shows profit too. Margin means profit over sale, markup means profit over cost, contingency counts as sale. Nothing from this panel goes on the printed quotation, the PDF or the client page. Issued quotations record cost, profit and margin, and the register shows the margin. The sample costs are fictional, about three quarters of the rates, with the Bomba fee at cost so one section shows under target.
Added 30 September. A Print or save as PDF button prints only the quotation, on white, A4. With the local server running, Issue and file also saves a PDF copy on disk (see 7.3). An Issued quotations list under the document shows number, project, date, total, status and the PDF file name, with buttons to mark a quotation accepted or declined.

Tax logic. Service tax is applied to the labour and services subtotal (plus the labour share of contingency), not to materials. This follows Service Tax Policy 7/2025 which brought construction work services into scope at 6 percent from 1 July 2025, with the material portion outside scope when itemised separately. Sources, Ministry of Finance press release on the 1 July 2025 expansion, and KTP's 28 October 2025 summary of Policy 7/2025. Registration threshold and any exemptions for specific building types were not verified. Get SEMBA's finance or tax agent to confirm the rate and treatment before a real quotation goes out. The rate is a field, not a constant, for this reason.

### 4.7 New client (added 29 September)
Form (company, brand, PIC, phone, email, type, area, venue, target opening, source, salesperson, PM). Live preview of the client code and folder tree. Submit creates the project in Brief phase with a default plan, posts the first thread message as the salesperson, shows Windows and Mac commands that create the folder set, and offers Copy. Opened as a file the folders are not created, the note on the screen says so. Run from the local server (section 7.1) the same button creates the folders and the project sheet on disk, and the screen lists what was created in place of the commands.

Standard folder set, one per client, under `Clients/<SMB-YYYY-NNN> <Brand>/`.
01 Brief and site survey, 02 Design, 03 Quotation and BOQ, 04 Submissions (mall, Bomba, authority), 05 Contract and variations, 06 Site (photos, daily logs), 07 Claims and invoices, 08 Handover and DLP, plus a `<code> <brand> project sheet.md`.

### 4.8 Assistant
Rebuilt 1 October as a chat, at Sritesh's request, laid out like a chat app. A project list on the left in two groups, Active (before snagging) and Completed (snagging onward), with All projects at the top. A chat on the right, questions in navy on the right, answers on the left, suggested questions as chips, and a box to type in. Each project keeps its own chat while the page is open, nothing is saved. With a project chosen, a question is answered about that project (status, overdue, approvals, snags, site check-ins, money, dates, team, thread, the weekly client update, or what slips with a 5 working day delay). With All projects chosen, the portfolio questions answer. The delay is fixed at 5 working days, the field for it was removed.
Before that, on 30 September, it was four task buttons and an Ask box. Every answer is written by rules that read the live data, sample projects plus saved changes, at the moment the button is pressed. A project picker and a delay field feed the first two tasks. The Ask box answers a fixed set of questions (overdue, approvals, site today, quiet clients, money, opening dates, or any project by name) and lists them when it does not understand. Every answer carries the line "Written by rules from the live data, not by a model" and says what it was built from. No model is called, nothing leaves the laptop. The note under it ties the tab to the course. Do not wire a live model in without a stated data boundary and a cost owner.

## 5. Design system

Colours were first sampled from SEMBA's public website on 23 September 2026. On 30 September Sritesh supplied two brand images (a grey and navy block, and the SEMBA wordmark on taupe) and the theme was reset to match them exactly.
Brand colours. Grey `#C9CBCA` (page ground, rail text). Navy `#172E58` (rail, headings, text, actions, current phase, construction bars). Taupe `#B5A08D` (finished phases, submission bars, sales avatars) with a darker taupe `#7D6A57` for text and the today line. Off white `#EFEFEF` for text on navy. Bright blue is gone, every action is navy. Two extra blues stay for the timeline only, `#8A9BBE` design and `#4F6591` snagging, so the phases can be told apart. Semantic colours stay, green `#1E9E5A`, amber `#E39B0A`, red `#D93A3A`. Panels white, line `#D9DBDA`.
Logo. The SEMBA wordmark is redrawn as a vector, traced from the brand image. Rounded S and B, an E and an A with a floating middle bar, and an M made of two overlapping peaks. It lives once in `index.html` as `<symbol id="semba-logo">` and is used on the rail, the quotation letterhead and the client page. The server copies the symbol into the client page and the PDF. It takes its colour from the text colour around it.
Type. EB Garamond 500 and 600 for project names and page titles (SEMBA's own display face). Manrope for everything else. Tabular numerals on every number.
Dark theme is defined through the same tokens, on a near navy ground with lighter navy for actions so they show on dark panels. Since 30 September it no longer follows the computer's light or dark setting, because on a dark mode laptop the brand colours never showed. Everyone sees the brand theme. Dark is opt in, by setting `data-theme="dark"` on the `html` element. Keep it working when you add anything.
Supporting tokens added 29 September so that no component holds a literal colour. `--design` (design bars), `--done` (finished phases, lighter in dark), `--warnink` (amber text), `--onfill` (text on a filled colour), `--railhover` and `--railon` (rail states).
Layout. 232px navy rail, content area, single column under 900px. Every list row uses a 4px status stripe. Pills carry status. One shadow, one radius, no gradients.

## 6. Date engine

`BASE` is 23 September 2026, the day the sample data was written. `TODAY` is the real date. Every sample date is shifted by the difference at boot, so "opens in 37 days" and "21 days overdue" stay true on any day the tool is opened. Copy inside the sample data uses tokens `{d:N}` (26 Sep), `{dm:N}` (26 September), `{dl:N}` (Friday 26 September), `{w:N}` (Friday), where N is days from today. The `T()` function expands them.
When real data replaces the sample, delete the shifting and keep `TODAY`.

## 7. What Claude Code builds next

In priority order. Each item names why it comes before the next.

### 7.1 Local runtime with folder creation (feature 2, the part a browser cannot do)
A browser page cannot create folders on a computer. Build a small local server so the New client screen creates the folder set for real.
Recommended, Node 20 with Express, serving `index.html` from `localhost:3000`, one endpoint `POST /api/clients` that validates the payload, creates `Clients/<code> <brand>/` and the eight subfolders under a configured root, writes the project sheet, and returns the created paths. Config in `sitebook.config.json` with `clientsRoot` (defaults to a `Clients` folder beside the app). Refuse paths that escape the root. Sanitise names the same way `safeName()` does in the page.
Alternative, Electron. Pros, one installer, file dialogs, no terminal. Cons, 150MB app for a 700 line page, slower to iterate, harder for a non-developer to patch. Go Node first, wrap in Electron only if SEMBA asks for an installer.
Alternative, Python with FastAPI. Pros, Sritesh's automation stack is Python. Cons, the front end is already JavaScript and one language keeps the repo simple. Use Python only if the invoice bot codebase is going to be reused.
Front end change. When `fetch('/api/clients')` succeeds, hide the command block and show the created paths. When it fails (page opened as a file, or from the artifact link), fall back to the current behaviour.

Built 29 September 2026, in `server.js`. What differs from the recommendation above.
1. No Express. The server uses only what ships with Node, so there is nothing to install. Run `node server.js`, or double click `start.bat` on Windows. Reason, the prototype lives on one laptop and a no install start suits a demo. Revisit if the real build goes ahead.
2. It listens on this computer only (127.0.0.1) and refuses requests that do not come from its own page. It serves `index.html` and nothing else from the folder.
3. `GET /api/health` tells the page the server is there, where the clients folder is, and the next free client number read from the folders on disk. So the client code no longer resets on reload when the server is running.
4. A client code that already has a folder is refused. The page moves to the next free code and asks the user to create again.
5. Folder names are capped at 60 characters and lose trailing dots and spaces, to stay inside Windows path limits. `safeName()` in the page and in `server.js` are the same rule and must change together, as must `FOLDERS`.

### 7.2 Persistence
Everything is in memory. Reloading loses new clients, check-ins, posts and quotations. Store state as JSON on disk through the same server (`data/state.json`), read on boot, written on every change. Pros, zero setup, human readable, easy to back up. Cons, no concurrency, two people editing at once will overwrite each other. Acceptable for a single office pilot. Move to SQLite when a second concurrent user appears.

Built 29 September 2026, in `server.js` (`GET` and `PUT /api/state`) and the saved changes block near the end of `index.html`.
1. What is saved. New clients, thread posts, site check-ins, approvals marked done, snags marked fixed, and issued quotations (header, lines and total).
2. What is not saved. The sample data, which stays in `index.html` and keeps shifting with the date engine. Saved records carry real dates and are laid over the sample at boot. A quotation that is drafted but not issued is not saved.
3. Where. `data/state.json`, written in a readable layout. The save before the latest one is kept as `data/state.prev.json`, one step of undo. The `data` folder is ignored by git.
4. Two windows. Every save carries a revision number. A window holding an older revision is refused, shows "Not saved", and asks for a reload. Nothing is overwritten silently.
5. Damaged file. If `data/state.json` cannot be read, the server refuses to load or save and never overwrites it. The page runs on sample data and shows "Not saved".
6. Earlier days. A check-in saved on an earlier day shows in that project's Site log with its date. It does not count in Today or the Site team screen.
7. Clear saved changes. A button on Today, two clicks to confirm, empties the saved data and reloads. Folders on disk are not touched. Meant for resetting before a demo.
8. Known limit. Saved records point at projects by id. If a sample project's id is changed in `index.html`, its saved posts and check-ins stop showing.

### 7.3 Quotation export
`window.print()` is blocked in the artifact viewer but works from `localhost`. Add a print stylesheet that hides the rail, the header form and the line editor, and prints only `#qPaper` on A4 with page breaks avoided inside section groups. Save a PDF copy into `03 Quotation and BOQ` of the client folder through the server. Then add a quotation register (number, project, date, total, status) so the number sequence survives reloads.

Built 30 September 2026. How it works.
1. Print. A print stylesheet in `index.html` hides everything but the quotation and forces the light colours. Each section of the table is its own group, so a section is not split across pages.
2. PDF on disk. The server has no add-ons, so it uses the Chrome or Edge already on the computer to print the page with no window showing. `POST /api/quotes/pdf` takes the quotation's HTML, wraps it in the page's own stylesheet, and prints it to A4. Chrome is tried first, then Edge. A different browser can be set with `"browser"` in `sitebook.config.json`. If neither is found the tool says so and the Print button still works.
3. Where the file goes. `Clients/<code> <brand>/03 Quotation and BOQ/<number> <brand>.pdf` when the client has a folder. Sample projects have no folder, so their PDFs go to `Clients/Quotations/`. A name that already exists gets (2), (3) and so on.
4. Register. Issued quotations are saved with the other changes (7.2), so the number sequence, the totals and the PDF paths survive a reload. Status starts at Issued and can be set to Accepted or Declined.
5. Not done. Marking a quotation accepted changes nothing else yet. The PDF is made after Issue and file, so a quotation printed before issuing is not on disk.

### 7.4 Client view
A read-only page per project, reached by a link with a token, showing Updates, Approvals waiting on the client, milestones and photos. No money, no internal flags, no site notes. This is the feature SEMBA asked for in their own words ("one place for client, PM and salesperson"). It needs a decision on hosting because a client will not open `localhost`. Options, a tunnel (quick, insecure, demo only), a small VPS (real, needs Lemon Sky to run it, which is a solutions service conversation), or email digests generated from the tool (no hosting, no live view). Do not build this until the hosting question is answered.

Built 30 September 2026 for the local prototype only, on Sritesh's decision that hosting is not a question yet. The page runs from the same local server and is opened on the same laptop to show SEMBA the idea.
1. The link. Share client view on a project makes a random 16 character token, saves it with the other changes (`shares` in the saved data), and copies `http://localhost:3000/client/<token>`. The same project always gets the same link.
2. What the client sees. `client.html`, served at `/client/<token>` with the tool's own stylesheet. Project name, kind, venue, phase stepper with planned dates, Waiting on you (open approvals that name the client), milestones (Done, Due, Overdue), the Updates thread, site photos, and who to contact. Nothing else.
3. How it stays current. The tool builds a client safe copy of the project (`clientView()` in `index.html`) and sends it to `PUT /api/client/<token>` after every save and at boot. The server keeps it in `data/clientviews/<token>.json`. The client page reads `GET /api/client/<token>` every 15 seconds and redraws when something changed. Money, risk lines, site notes and flags are never in that copy, so they cannot leak even if the page were hosted later.
4. Read only. The client cannot post or approve from the page yet. The page says who to message instead.
5. Not done. Turning a link off. Client replies from the page. Hosting, still a decision for later.

### 7.5 Photos on check-ins
Replace the photo count with real uploads through the server into `06 Site` of the client folder, named `YYYY-MM-DD HHMM <coordinator> <n>.jpg`. Show thumbnails in the log.

Built 30 September 2026.
1. The form. A Photos field on the check-in form, off until the local server is found. Takes up to 8 pictures from the camera or gallery.
2. Size. Each photo is shrunk in the browser to 1600 pixels on the long side and saved as JPEG at 85 percent, so a phone photo of several MB becomes a few hundred KB. Rotation from the phone is kept.
3. Where. `POST /api/photos`, one photo per request as raw bytes. Saved into the client's `06 Site (photos, daily logs)` folder, or `Clients/Site photos/<project>/` for a sample project. Named with the date, time to the minute, coordinator and a number. JPEG, PNG and WebP are accepted, 15 MB limit.
4. Showing them. `GET /api/photo?f=<path inside Clients>` serves a photo. Paths outside the clients folder are refused. Thumbnails appear in the site log and on the project's Site log tab, and open full size in a new tab. The client page shows the same photos.
5. Saved with the check-in. The file paths are kept in the check-in record, so the thumbnails come back after a reload.

### 7.6 Assistant, live
Only after 7.2. Replace the canned outputs with calls to a model, passing the project JSON as context, with the same four prompts as system templates. Needs an API key owner, a monthly cost cap, and a line in the UI saying what data leaves the machine. Keep "Sample output" labels until this is done.

Decision on 30 September 2026. No model for the prototype, because there is no API key and this laptop (8 GB, no graphics card, no model runtime installed) would run a local model slowly. Built instead, rules over the live data, in `index.html` under "assistant, rules over the live data". The four pre-written samples are gone, replaced by generators that read the projects, approvals and site log as they are now, so the answers change as the data changes. The "Sample output" label is replaced by "Written by rules from the live data, not by a model", which is the honest label for what runs. Rules invent nothing, in particular no cost figures. When a model is wired in later, it takes over the same four tasks and the Ask box, and the label changes again.

### 7.7 Not planned
Integrations with Google or Microsoft (suite unknown). WhatsApp (Meta business API cost and approval). Accounting system export (SEMBA's system unknown). Mobile app (the page already works at phone width, run it from the server on the office network first).

## 8. Constraints and rules for anyone editing

1. Writing rules in all copy. No dashes of any kind, no colons in running text. Commas, full stops, parentheses and numbered lists instead. Short sentences.
2. Nothing in the UI may claim a capability that is not built. Sample labels stay until real.
3. Keep the tokens and the dark theme. Add colours as tokens on `:root`, never as literals inside components.
4. Keep sample tenants fictional. Real SEMBA project names from their website (9090, Sunmoulin, SENYA) do not go into demo data.
5. Every number that reaches a client (quotation totals, tax) is computed in one function and shown from that function, never typed twice. Profit, margin and the section figures live in the same function.
6. Confirm the service tax treatment with SEMBA's finance before a real quotation is issued.

## 9. State of the build on 29 September 2026

Built and working in `server.js`. Local server with folder creation on disk (7.1), saving to `data/state.json` (7.2), quotation PDFs through Chrome or Edge (7.3), the client page at `/client/<token>` (7.4) and site photos in the client folder (7.5).

Built and working in `index.html`. Today, Projects with detail, Timeline, Site team with check-in form, Approvals with chase and done, Quotation with template, live totals, generate, copy and issue, New client with code, folder preview, commands and project creation, Assistant with four samples. Live date engine. Dark theme. Phone layout.

Not built. A live model behind the assistant (7.6, rules run instead). Client replies from the client page. Hosting for the client page.

Known rough edges. Weekday words in sample copy move with the date engine and are not always a Friday. The Gantt shows the current phase's red outline only, not earlier late phases. Opened without the server nothing is saved, so the quotation number, the client code and anything added reset on reload. Marking an approval done does not clear the matching risk line or status on the project. The header form on the quotation screen is 4 columns and drops to 2 under 900px.

Open questions that block work, all still unanswered by SEMBA. Office suite. Whether Tokyo HQ mandates a system. Sales headcount. Where the shared drive lives (local server, NAS, Google Drive, OneDrive), which decides where 7.1 writes.

## 10. Sources used for the domain model

Archdesk, Commercial fit-out 2026 guide, phases, delay causes, variation and claim pain points. https://archdesk.com/blog/commercial-fit-out-2026-guide
Keith Ho Design, Retail design and build Malaysia, mall submission windows, Bomba, DBKL, BOQ, Malaysian timelines. https://www.keithhodesign.com/latestnews/nid/187713/
JLL, construction and fit-out handover guide. https://www.jll.com/en-us/guides/your-guide-to-a-successful-construction-and-fit-out-handover
SEMBA Malaysia service page, their own stage list. https://www.semba1008.co.jp/en/malaysia/service/
Ministry of Finance Malaysia, 1 July 2025 SST expansion press release. https://www.mof.gov.my/portal/en/news/press-release/targeted-revision-of-sales-tax-rate-and-expansion-of-service-tax-scope-effective-1-july-2025
KTP, Service tax update 2025 on construction industry, Policy 7/2025. https://www.ktp.com.my/blog/service-tax-update-2025-on-construction-industry/28oct2025
