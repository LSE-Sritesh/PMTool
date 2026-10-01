# Project Management Tool

Project management prototype for SEMBA Malaysia. Single file, no build. Called Sitebook until 29 September 2026.

1. Open `index.html` in a browser and it runs on sample data. Nothing is saved in this mode.
2. To create client folders and save your changes, double click `start.bat`, or run `node server.js` and open `http://localhost:3000`. Needs Node 20 or newer, nothing to install.
3. Read `PRD.md` for what is built and what comes next.
4. Read `CLAUDE.md` before editing with Claude Code.

Client folders are written to `Clients` beside the app. Change `clientsRoot` in `sitebook.config.json` to point somewhere else.

Client page. On a project, press Share client view. You get a link like `http://localhost:3000/client/abc123`. Open it in another tab to show what the client would see. Updates, milestones, what is waiting on them, and site photos. No money, nothing internal. It refreshes on its own.

Photos. The check-in form takes photos when the server is running. They are shrunk and saved in the client's `06 Site` folder, and shown in the log and on the client page.

Assistant. Pick a project on the left and ask about it in the chat. Answers are written by rules that read the live data. No AI model, no key, nothing leaves the laptop. Every answer says so.

Quotations. Press Issue and file to project and a PDF is saved in the client's `03 Quotation and BOQ` folder (or in `Clients/Quotations` for a sample project). This uses the Chrome or Edge already on the computer. Print or save as PDF works without the server.

Changes are saved to `data/state.json`. The sample projects are not saved, they stay in `index.html`. To reset before a demo, use Clear saved changes on the Today screen. Folders on disk are not touched by that.
