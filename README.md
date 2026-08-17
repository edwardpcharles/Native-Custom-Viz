# Native Custom Viz

Open-source Power BI custom visuals built with the official Power BI Visuals SDK.

## Visuals

### [Fancy Line Graph Slicer](Fancy%20Line%20Graph%20Slicer)

An interactive line graph that combines trend analysis with two draggable range handles. The selected interval drives Start, End, Change, and Selected Total metrics and can cross-select other visuals on the report page.

## Repository Layout

Each visual is self-contained in its own folder with the source, manifest, capabilities, styles, icon, dependency declarations, and build configuration needed to compile it.

Generated packages, temporary build files, editor settings, certificates, and machine-specific files are intentionally excluded.

## Start on a New Computer

The repository does not assume any tools, packages, certificates, or Power BI files are already installed.

### Prerequisites

Install:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 20.19 or later; npm is included with Node.js
- A modern browser and a Power BI Pro or Premium Per User account for live Service debugging
- Power BI Desktop on Windows only if testing packaged visuals in Desktop

Do not install `pbiviz` globally. `npm install` gets the current Power BI Visuals CLI and development tools for this project.

### Get the Source and Install Dependencies

Read access to the public repository is sufficient to build and test locally:

```shell
git clone https://github.com/edwardpcharles/Native-Custom-Viz.git
cd Native-Custom-Viz
cd "Fancy Line Graph Slicer"
npm install
```

Dependencies use compatible version ranges, while development tools follow their current npm `latest` releases. TypeScript is limited to the Power BI toolchain's supported major version rather than an exact release. The visual's `.npmrc` prevents lockfile generation. Run `npm install` after cloning and whenever `package.json` changes. A contributor needs a fork or separate write permission only to push changes; builds do not require repository write access.

## Commands

Run these from `Native-Custom-Viz/Fancy Line Graph Slicer`:

| Command | Purpose |
| --- | --- |
| `npm install` | Install current compatible dependencies and development tools |
| `npm run lint` | Check the authored source |
| `npm run start` | Start the local server for live debugging in Power BI Service |
| `npm run package` | Validate and create a distributable `.pbiviz` in `dist/` |

The npm scripts automatically use the project-local CLI. No global npm packages are required. Because dependencies are not locked, review and test changes after every fresh install or dependency update.

### Live Debugging in Power BI Service

1. From the visual folder, start the local development server and keep the terminal open:

	```powershell
	npm run start
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
npm run package
```

Import the resulting `dist/*.pbiviz` file into Power BI Desktop or Power BI Service. Desktop does not connect to `pbiviz start`. Its **Develop a visual** report setting is primarily needed when a local development package must override a published/AppSource visual with the same GUID.

For a release, keep the existing GUID and increment both version fields in `pbiviz.json` before packaging.

## Troubleshooting

### `pbiviz.json not found`

The command was run from the wrong directory. From the cloned repository root, enter the visual project:

```shell
cd "Fancy Line Graph Slicer"
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
npm run pbiviz -- install-cert
```

Complete the operating system's certificate import for the current user, restart the browser, restart `npm run start`, and retry the asset checks. Never share the generated passphrase. If the browser still rejects localhost, follow the current [Microsoft certificate troubleshooting guidance](https://learn.microsoft.com/power-bi/developer/visuals/develop-circle-card#troubleshooting).

### Check the Installed Tool Version

Check the project-local CLI selected by the latest install:

```shell
npm run pbiviz -- --version
```

The command reports the version currently resolved from npm.

## Privacy and Repository Safety

- Never commit or share private keys, certificates, PFX passphrases, access tokens, `.env` files, local machine paths, or personal account details.
- Keep generated certificates in the user-level `pbiviz-certs` folder, outside this repository.
- Do not paste certificate passphrases into issues, documentation, commits, or screenshots.
- An agent with read-only remote access should keep changes local or work in a fork; it should not attempt to push to the upstream repository.
- Before committing in a writable clone, run `git status --short` and confirm only intended source or documentation files are present.
- Build output, dependencies, certificates, editor settings, and secret files are excluded by `.gitignore`.

## License

This repository is licensed under the MIT License. See [LICENSE](LICENSE).
