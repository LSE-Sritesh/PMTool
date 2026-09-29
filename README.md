# Sitebook

Project management prototype for SEMBA Malaysia. Single file, no build.

1. Open `index.html` in a browser and it runs on sample data.
2. To create client folders for real, double click `start.bat`, or run `node server.js` and open `http://localhost:3000`. Needs Node 20 or newer, nothing to install.
3. Read `PRD.md` for what is built and what comes next.
4. Read `CLAUDE.md` before editing with Claude Code.

Client folders are written to `Clients` beside the app. Change `clientsRoot` in `sitebook.config.json` to point somewhere else.

Persistence is not built yet (PRD section 7.2). Projects added in the page are lost on reload, the folders stay on disk.
