# Project Management Tool

Project management prototype for SEMBA Malaysia. Single file, no build. Called Sitebook until 29 September 2026.

1. Open `index.html` in a browser and it runs on sample data. Nothing is saved in this mode.
2. To create client folders and save your changes, double click `start.bat`, or run `node server.js` and open `http://localhost:3000`. Needs Node 20 or newer, nothing to install.
3. Read `PRD.md` for what is built and what comes next.
4. Read `CLAUDE.md` before editing with Claude Code.

Client folders are written to `Clients` beside the app. Change `clientsRoot` in `sitebook.config.json` to point somewhere else.

Changes are saved to `data/state.json`. The sample projects are not saved, they stay in `index.html`. To reset before a demo, use Clear saved changes on the Today screen. Folders on disk are not touched by that.
