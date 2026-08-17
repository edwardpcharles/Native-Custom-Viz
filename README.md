# Native Custom Viz

Open-source Power BI custom visuals built with the official Power BI Visuals SDK.

## Visuals

### [Fancy Line Graph Slicer](Fancy%20Line%20Graph%20Slicer)

An interactive line graph that combines trend analysis with two draggable range handles. The selected interval drives Start, End, Change, and Selected Total metrics and can cross-select other visuals on the report page.

## Repository Layout

Each visual is self-contained in its own folder with the source, manifest, capabilities, styles, icon, dependency lockfile, and build configuration needed to compile it.

Generated packages, temporary build files, editor settings, certificates, and machine-specific files are intentionally excluded.

## Requirements

- Node.js 20.19 or later
- npm
- Power BI Visuals CLI (`powerbi-visuals-tools` 7.2.1), installed locally by `npm install`
- Power BI Desktop for importing and testing the packaged visual

## Build

```powershell
cd "Fancy Line Graph Slicer"
npm ci
npm run package
```

The compiled `.pbiviz` file is written to the visual's `dist/` directory.

## Development Workflow

Always run commands from the Git-tracked visual folder:

```powershell
cd "Native-Custom-Viz\Fancy Line Graph Slicer"
npm ci
```

### Live Debugging in Power BI Service

1. Start the local development server and keep the terminal open:

	```powershell
	npm run start
	```

2. Confirm the server reports `https://localhost:8080` and compiles successfully.
3. In a browser, open `https://localhost:8080/assets/status`. Accept the local development certificate warning if prompted.
4. Enable **Power BI Developer mode** in the Power BI Service developer settings.
5. Open a report in Edit mode and add **Developer Visual** from the Visualizations pane.
6. Select **Toggle Auto Reload** on the developer visual toolbar to load saved code changes automatically.

The Developer Visual is a Service-only live development host. It loads `visual.js` and `visual.css` from the local `pbiviz start` server.

### Power BI Desktop and Distribution

Create an importable package:

```powershell
npm run package
```

Import the resulting `dist/*.pbiviz` file into Power BI Desktop or Power BI Service. Desktop does not connect to `pbiviz start`. Its **Develop a visual** report setting is primarily needed when a local development package must override a published/AppSource visual with the same GUID.

For a release, keep the existing GUID and increment both version fields in `pbiviz.json` before packaging.

## Troubleshooting

### `pbiviz.json not found`

The command was run from the wrong directory. Return to the visual project root:

```powershell
cd "Native-Custom-Viz\Fancy Line Graph Slicer"
```

### Developer Visual Cannot Contact the Server

Verify the process and required assets:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8080
curl.exe -I https://localhost:8080/assets/status
curl.exe -I https://localhost:8080/assets/visual.js
curl.exe -I https://localhost:8080/assets/visual.css
```

All three asset requests should return `HTTP/1.1 200 OK`. If certificate validation fails:

```powershell
npx pbiviz install-cert
```

Complete the Windows certificate import for the current user, restart the browser, restart `npm run start`, and retry the asset checks. The generated certificate and passphrase are local development credentials.

### Check the Tool Version

Use the repository-pinned CLI rather than a global installation:

```powershell
npx pbiviz --version
```

The expected version is declared in `Fancy Line Graph Slicer/package.json`.

## Privacy and Repository Safety

- Never commit or share private keys, certificates, PFX passphrases, access tokens, `.env` files, local machine paths, or personal account details.
- Keep generated certificates in the user-level `pbiviz-certs` folder, outside this repository.
- Do not paste certificate passphrases into issues, documentation, commits, or screenshots.
- Before committing, run `git status --short` and confirm only intended source or documentation files are present.
- Build output, dependencies, certificates, editor settings, and secret files are excluded by `.gitignore`.

## License

This repository is licensed under the MIT License. See [LICENSE](LICENSE).
