# Project Management Tool, working notes for Claude Code

The tool was called Sitebook until 29 September 2026. File names and settings still use the old word (`sitebook.config.json`, `SITEBOOK_` settings). Use the new name in anything a person reads.

Read `PRD.md` first. It holds the domain model, every screen, the design tokens, the date engine and the build order. This file is the short version plus the rules that are easy to break.

## What this is
A single-file project management prototype for SEMBA Malaysia, a fit-out firm in KL. `index.html` is the whole app, no build step, no dependencies beyond two Google Fonts. Open it in a browser and it runs on sample data. It was published as a Claude artifact for a client demo, and is now being turned into a local app.

## Start here
1. Run `node server.js` and open `http://localhost:3000` (or open `index.html` as a file) and click through all eight tabs so you know what exists.
2. PRD 7.1, 7.2 and 7.3 are built. `server.js` creates client folders on disk, saves what the user adds to `data/state.json`, and prints quotations to PDF through the Chrome or Edge already installed. No dependencies. Next is 7.4, the client view, which is blocked until the hosting question in the PRD is answered. 7.5, photos on check-ins, can go ahead.
3. Keep `index.html` working as a standalone file. The server adds capability, it must not become a requirement.

## Layout of index.html
Order inside the file. `<title>` and `<style>` (tokens on `:root`, dark theme blocks, components). Markup, one `<section class="view">` per tab. `<script>` with data (`PHASES`, `TEAM`, `P` projects, `APPR`, `LOG`, `PROMPTS`, `QTEMPLATE`, `FOLDERS`), helpers, then one render function per screen, then the date engine, then boot at the bottom. The boot line ends with `serverCheck()`, which looks for the local server and switches the New client screen to real folder creation when it finds it.

## Rules
1. Copy has no dashes and no colons in running text. Use commas, full stops, parentheses, numbered lists.
2. Do not claim a feature that is not built. "Sample output" and "Concept prototype" labels stay until the thing is real.
3. Colours are tokens on `:root`, redefined in the two dark blocks. Never a literal colour inside a component.
4. Sample tenants are fictional. Do not put SEMBA's real project names in demo data.
5. Money is computed once. `qTotals()` is the only place quotation maths lives.
6. The date engine shifts all sample dates to today. Remove it only when real data replaces the sample, and keep `TODAY`.
7. Service tax on quotations is applied to labour only, per Service Tax Policy 7/2025. Rate stays a field. SEMBA's finance confirms before a real quote goes out.
8. The owner edits files between sessions. Re-read before editing, change in place, never restore something he removed. Flag it instead.
9. `FOLDERS` and `safeName()` exist in both `index.html` and `server.js`. Change both together.
10. Anything from data or a form goes through `esc()` before it reaches `innerHTML`.
11. `Clients/` and `data/` are ignored by git because they can hold real client details. Keep it that way.
12. Only what the user adds is saved, never the sample data. The lists are `STATE` in `index.html` and `STATE_KEYS` in `server.js`. A new kind of record goes in both, plus `applyState()`.
13. Anything that changes data calls `keep()` so it is saved. Screens about today read `todayLog()`, not `LOG`, because `LOG` also holds saved check-ins from earlier days.

## Owner
Sritesh Naidu, AI Lead, Lemon Sky Edge. He is the trainer selling SEMBA an AI course, this tool is the demo and the seed of a solutions engagement. When in doubt about scope, the question is "does this help him show capability without promising what Lemon Sky has not agreed to build".
