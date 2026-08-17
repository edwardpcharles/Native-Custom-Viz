# Native Custom Viz

Open-source Power BI custom visuals built with the official Power BI Visuals SDK.

## Agent Quick Start

This repository can contain multiple Power BI visual projects. An AI agent should discover visual roots by locating directories that contain both `pbiviz.json` and `package.json`, then select the project named by the task. If more than one project is plausible, ask which visual to change.

From the repository root:

```shell
git status --short
node --version
npm --version
npm install --global powerbi-visuals-tools@latest
pbiviz --version
cd "<visual-folder>"
npm install
npm run lint
pbiviz package
```

Replace `<visual-folder>` with the selected directory name. If `node` or `npm` is unavailable, stop and follow [Microsoft's Power BI visual environment setup](https://learn.microsoft.com/power-bi/developer/visuals/environment-setup) before continuing. The global CLI is shared across visual projects; each project keeps its runtime and lint dependencies local.

### Agent Operating Contract

- Read the selected visual's `README.md`, `package.json`, `pbiviz.json`, and nearest source files before editing.
- Treat `src/visual.ts`, `src/settings.ts`, `style/visual.less`, `capabilities.json`, and `pbiviz.json` as the authored visual surface.
- Keep matching format property names synchronized between `src/settings.ts` and `capabilities.json`.
- Do not edit or commit `node_modules/`, `.tmp/`, webpack statistics, certificates, keys, passphrases, environment files, or machine-specific settings. A requested release may commit the generated `dist/*.pbiviz` artifact after a successful package build.
- Dependencies intentionally float within the ranges in `package.json`; `.npmrc` disables lockfile generation.
- Run `npm run lint` after source edits and `pbiviz package` before considering a change complete.
- Keep the existing visual GUID for updates. Increment both version fields in `pbiviz.json` only when preparing a new distributable release.
- With read-only upstream access, keep changes local or produce a patch. Do not attempt to push, alter remotes, or expose credentials.

### Agent Definition of Done

1. The requested behavior or documentation is implemented in the smallest relevant surface.
2. `npm run lint` passes.
3. `pbiviz package` succeeds and creates `dist/*.pbiviz` when code, capabilities, styles, or package metadata changed.
4. `git diff --check` passes and `git status --short` contains only intended files.
5. No secrets, local absolute paths, generated files, or unrelated changes are included.

## Visuals

### [Fancy Line Graph Slicer](Fancy%20Line%20Graph%20Slicer)

An interactive line graph that combines trend analysis with two draggable range handles. The selected interval drives Start, End, Change, and Selected Total metrics and can cross-select other visuals on the report page.

## Repository Layout

Each visual is self-contained in its own folder with the source, manifest, capabilities, styles, icon, dependency declarations, and build configuration needed to compile it.

Temporary build files, editor settings, certificates, and machine-specific files are intentionally excluded. Importable `dist/*.pbiviz` release artifacts can be tracked for direct distribution.

## Start on a New Computer

The repository does not assume any tools, packages, certificates, or Power BI files are already installed.

### Prerequisites

Install:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 20.19 or later; npm is included with Node.js
- Power BI Visuals CLI, installed globally with `npm install --global powerbi-visuals-tools@latest`
- A modern browser and a Power BI Pro or Premium Per User account for live Service debugging
- Power BI Desktop on Windows only if testing packaged visuals in Desktop

The global `pbiviz` command follows Microsoft's standard environment setup and can build every visual project in this repository.

### Get the Source and Install Dependencies

Read access to the public repository is sufficient to build and test locally:

```shell
git clone https://github.com/edwardpcharles/Native-Custom-Viz.git
cd Native-Custom-Viz
cd "<visual-folder>"
npm install
```

Dependencies use compatible version ranges, while development tools follow their current npm `latest` releases. TypeScript is limited to the Power BI toolchain's supported major version rather than an exact release. The visual's `.npmrc` prevents lockfile generation. Run `npm install` after cloning and whenever `package.json` changes. A contributor needs a fork or separate write permission only to push changes; builds do not require repository write access.

## Commands

Run these from the selected visual folder:

| Command | Purpose |
| --- | --- |
| `npm install` | Install current compatible dependencies and development tools |
| `npm run lint` | Check the authored source |
| `pbiviz start` | Start the local server for live debugging in Power BI Service |
| `pbiviz package` | Validate and create a distributable `.pbiviz` in `dist/` |

The `pbiviz` command comes from the global Power BI Visuals CLI. Because project dependencies are not locked, review and test changes after every fresh install or dependency update.

### Live Debugging in Power BI Service

1. From the visual folder, start the local development server and keep the terminal open:

	```powershell
	pbiviz start
	```

2. Confirm the server reports `https://localhost:8080` and compiles successfully.
3. In a browser, open `https://localhost:8080/assets/status`. The first run can require installing or trusting a local development certificate.
4. Enable **Power BI Developer mode** in the Power BI Service developer settings.
5. Open a report in Edit mode and add **Developer Visual** from the Visualizations pane.
6. Select **Toggle Auto Reload** on the developer visual toolbar to load saved code changes automatically.

The Developer Visual is a Service-only live development host. It loads `visual.js` and `visual.css` from the local `pbiviz start` server.

### Power BI Desktop and Distribution

Create an importable package from the visual folder:

```powershell
pbiviz package
```

Import the resulting `dist/*.pbiviz` file into Power BI Desktop or Power BI Service. Desktop does not connect to `pbiviz start`. Its **Develop a visual** report setting is primarily needed when a local development package must override a published/AppSource visual with the same GUID.

For a release, keep the existing GUID and increment both version fields in `pbiviz.json` before packaging.

## Troubleshooting

### `pbiviz.json not found`

The command was run from the wrong directory. From the cloned repository root, enter the visual project:

```shell
cd "<visual-folder>"
```

### Developer Visual Cannot Contact the Server

Verify the process and required assets:

```shell
curl -I https://localhost:8080/assets/status
curl -I https://localhost:8080/assets/visual.js
curl -I https://localhost:8080/assets/visual.css
```

All three asset requests should return `HTTP/1.1 200 OK`. If certificate validation fails:

```shell
pbiviz install-cert
```

Complete the operating system's certificate import for the current user, restart the browser, restart `pbiviz start`, and retry the asset checks. Never share the generated passphrase. If the browser still rejects localhost, follow the current [Microsoft certificate troubleshooting guidance](https://learn.microsoft.com/power-bi/developer/visuals/develop-circle-card#troubleshooting).

### Check the Installed Tool Version

Check the globally installed CLI:

```shell
pbiviz --version
```

Update it when needed with `npm install --global powerbi-visuals-tools@latest`.

## Microsoft Learn References

- [Set up a Power BI visual development environment](https://learn.microsoft.com/power-bi/developer/visuals/environment-setup)
- [Develop a visual and test it with the Developer Visual](https://learn.microsoft.com/power-bi/developer/visuals/develop-circle-card)
- [Understand the Power BI visual project structure](https://learn.microsoft.com/power-bi/developer/visuals/visual-project-structure)
- [Power BI Visual API](https://learn.microsoft.com/power-bi/developer/visuals/visual-api)
- [Capabilities and properties](https://learn.microsoft.com/power-bi/developer/visuals/capabilities)
- [Data view mappings](https://learn.microsoft.com/power-bi/developer/visuals/dataview-mappings)
- [Formatting model API](https://learn.microsoft.com/power-bi/developer/visuals/format-pane-general)
- [Selection API and cross-filtering](https://learn.microsoft.com/power-bi/developer/visuals/selection-api)
- [Package a Power BI visual](https://learn.microsoft.com/power-bi/developer/visuals/package-visual)
- [Import a visual from a file or AppSource](https://learn.microsoft.com/power-bi/developer/visuals/import-visual)

This repository follows Microsoft Learn's global `pbiviz` installation model.

## Privacy and Repository Safety

- Never commit or share private keys, certificates, PFX passphrases, access tokens, `.env` files, local machine paths, or personal account details.
- Keep generated certificates in the user-level `pbiviz-certs` folder, outside this repository.
- Do not paste certificate passphrases into issues, documentation, commits, or screenshots.
- An agent with read-only remote access should keep changes local or work in a fork; it should not attempt to push to the upstream repository.
- Before committing in a writable clone, run `git status --short` and confirm only intended source or documentation files are present.
- Build output, dependencies, certificates, editor settings, and secret files are excluded by `.gitignore`.

## License

This repository is licensed under the MIT License. See [LICENSE](LICENSE).
