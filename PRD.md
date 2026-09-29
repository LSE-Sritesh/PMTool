# Sitebook, product requirements

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

### 4.2 Projects
Card grid with filters (all, at risk, on site, design and submission, handed over). Click opens the detail. Detail has the phase stepper with planned dates, a risk banner, Milestones, Money (contract sum, committed, claimed, approved variations, uncommitted, with a bar), Team, then tabs. Updates is the single thread where PM, sales and client post, with a compose box that lets the demo post as any of the three. Variations is a priced table with a total. Snags can be marked fixed. Site log filters check-ins for this project. Approvals filters the queue for this project.
"Share client view" is a toast only. The client view itself is not built (see section 7).

### 4.3 Timeline
Sixteen week Gantt starting the Monday four weeks before today. One row per project, a bar per phase, a blue line for the current week, month boundaries marked, a red outline on a phase that has run past its planned end while still current. Clicking a project name opens its detail.

### 4.4 Site team
Who is where today (two coordinators, their check-ins and planned stops). A check-in form (coordinator, project, note, flag). Saving adds to the log, refreshes Today, and shows a toast. Photos are placeholders in the prototype.

### 4.5 Approvals
Queue sorted by days waiting. Filters for open, waiting on SEMBA, waiting on others, done. Chase drafts a toast. Done marks the item and refreshes Today.

### 4.6 Quotation (added 29 September)
Standard template for every job. Header (project picker that pre-fills client, attention, site and area, prepared by, validity, construction period, contingency, discount, service tax rate, deposit). Line items table with 14 standard sections and 19 template lines, editable inline, add and remove lines. Live totals. Generate renders the quotation document with SEMBA letterhead (address and phone from the public website), numbered lines grouped by section with section totals, material and labour columns, totals block, six standard terms, and two signature blocks. Copy as text works. Issue and file writes the total into the project's contract sum, posts a line in the project thread and advances the quotation number.

Tax logic. Service tax is applied to the labour and services subtotal (plus the labour share of contingency), not to materials. This follows Service Tax Policy 7/2025 which brought construction work services into scope at 6 percent from 1 July 2025, with the material portion outside scope when itemised separately. Sources, Ministry of Finance press release on the 1 July 2025 expansion, and KTP's 28 October 2025 summary of Policy 7/2025. Registration threshold and any exemptions for specific building types were not verified. Get SEMBA's finance or tax agent to confirm the rate and treatment before a real quotation goes out. The rate is a field, not a constant, for this reason.

### 4.7 New client (added 29 September)
Form (company, brand, PIC, phone, email, type, area, venue, target opening, source, salesperson, PM). Live preview of the client code and folder tree. Submit creates the project in Brief phase with a default plan, posts the first thread message as the salesperson, shows Windows and Mac commands that create the folder set, and offers Copy. In the browser prototype the folders are not created, the note on the screen says so. See section 7 for the local implementation.

Standard folder set, one per client, under `Clients/<SMB-YYYY-NNN> <Brand>/`.
01 Brief and site survey, 02 Design, 03 Quotation and BOQ, 04 Submissions (mall, Bomba, authority), 05 Contract and variations, 06 Site (photos, daily logs), 07 Claims and invoices, 08 Handover and DLP, plus a `<code> <brand> project sheet.md`.

### 4.8 Assistant
Four pre-written outputs (weekly client update, delay impact chain, site summary, sales follow-up gaps) selected by prompt buttons, each labelled "Sample output". No model is called. The note under it ties the tab to the course. Do not wire a live model in without a stated data boundary and a cost owner.

## 5. Design system

Colours sampled from SEMBA's public website on 23 September 2026 then brightened at Sritesh's request.
Navy `#172E58` (rail, headings, construction bars). Bronze `#B29D72` (brand mark, submission bars, sales avatars). Bright blue `#2F80ED` (actions, current phase, today line). Semantic, green `#1E9E5A`, amber `#E39B0A`, red `#D93A3A`. Ground `#F5F6F9`, panels white, line `#E1E4EC`, ink `#172033`.
Type. EB Garamond 500 and 600 for project names and page titles (SEMBA's own display face). Manrope for everything else. Tabular numerals on every number.
Dark theme is defined through the same tokens. Keep it working when you add anything.
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

### 7.2 Persistence
Everything is in memory. Reloading loses new clients, check-ins, posts and quotations. Store state as JSON on disk through the same server (`data/state.json`), read on boot, written on every change. Pros, zero setup, human readable, easy to back up. Cons, no concurrency, two people editing at once will overwrite each other. Acceptable for a single office pilot. Move to SQLite when a second concurrent user appears.

### 7.3 Quotation export
`window.print()` is blocked in the artifact viewer but works from `localhost`. Add a print stylesheet that hides the rail, the header form and the line editor, and prints only `#qPaper` on A4 with page breaks avoided inside section groups. Save a PDF copy into `03 Quotation and BOQ` of the client folder through the server. Then add a quotation register (number, project, date, total, status) so the number sequence survives reloads.

### 7.4 Client view
A read-only page per project, reached by a link with a token, showing Updates, Approvals waiting on the client, milestones and photos. No money, no internal flags, no site notes. This is the feature SEMBA asked for in their own words ("one place for client, PM and salesperson"). It needs a decision on hosting because a client will not open `localhost`. Options, a tunnel (quick, insecure, demo only), a small VPS (real, needs Lemon Sky to run it, which is a solutions service conversation), or email digests generated from the tool (no hosting, no live view). Do not build this until the hosting question is answered.

### 7.5 Photos on check-ins
Replace the photo count with real uploads through the server into `06 Site` of the client folder, named `YYYY-MM-DD HHMM <coordinator> <n>.jpg`. Show thumbnails in the log.

### 7.6 Assistant, live
Only after 7.2. Replace the canned outputs with calls to a model, passing the project JSON as context, with the same four prompts as system templates. Needs an API key owner, a monthly cost cap, and a line in the UI saying what data leaves the machine. Keep "Sample output" labels until this is done.

### 7.7 Not planned
Integrations with Google or Microsoft (suite unknown). WhatsApp (Meta business API cost and approval). Accounting system export (SEMBA's system unknown). Mobile app (the page already works at phone width, run it from the server on the office network first).

## 8. Constraints and rules for anyone editing

1. Writing rules in all copy. No dashes of any kind, no colons in running text. Commas, full stops, parentheses and numbered lists instead. Short sentences.
2. Nothing in the UI may claim a capability that is not built. Sample labels stay until real.
3. Keep the tokens and the dark theme. Add colours as tokens on `:root`, never as literals inside components.
4. Keep sample tenants fictional. Real SEMBA project names from their website (9090, Sunmoulin, SENYA) do not go into demo data.
5. Every number that reaches a client (quotation totals, tax) is computed in one function and shown from that function, never typed twice.
6. Confirm the service tax treatment with SEMBA's finance before a real quotation is issued.

## 9. State of the build on 29 September 2026

Built and working in `index.html`. Today, Projects with detail, Timeline, Site team with check-in form, Approvals with chase and done, Quotation with template, live totals, generate, copy and issue, New client with code, folder preview, commands and project creation, Assistant with four samples. Live date engine. Dark theme. Phone layout.

Not built. Folder creation on disk (7.1), persistence (7.2), print and PDF (7.3), client view (7.4), photo upload (7.5), live model (7.6).

Known rough edges. Weekday words in sample copy move with the date engine and are not always a Friday. The Gantt shows the current phase's red outline only, not earlier late phases. Quotation number and client code sequences reset on reload. The header form on the quotation screen is 4 columns and drops to 2 under 900px.

Open questions that block work, all still unanswered by SEMBA. Office suite. Whether Tokyo HQ mandates a system. Sales headcount. Where the shared drive lives (local server, NAS, Google Drive, OneDrive), which decides where 7.1 writes.

## 10. Sources used for the domain model

Archdesk, Commercial fit-out 2026 guide, phases, delay causes, variation and claim pain points. https://archdesk.com/blog/commercial-fit-out-2026-guide
Keith Ho Design, Retail design and build Malaysia, mall submission windows, Bomba, DBKL, BOQ, Malaysian timelines. https://www.keithhodesign.com/latestnews/nid/187713/
JLL, construction and fit-out handover guide. https://www.jll.com/en-us/guides/your-guide-to-a-successful-construction-and-fit-out-handover
SEMBA Malaysia service page, their own stage list. https://www.semba1008.co.jp/en/malaysia/service/
Ministry of Finance Malaysia, 1 July 2025 SST expansion press release. https://www.mof.gov.my/portal/en/news/press-release/targeted-revision-of-sales-tax-rate-and-expansion-of-service-tax-scope-effective-1-july-2025
KTP, Service tax update 2025 on construction industry, Policy 7/2025. https://www.ktp.com.my/blog/service-tax-update-2025-on-construction-industry/28oct2025
