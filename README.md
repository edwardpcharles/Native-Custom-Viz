# Native Custom Viz

Open-source Power BI custom visuals built with the official Power BI Visuals SDK.

## Visuals

### [Fancy Line Graph Slicer](Fancy%20Line%20Graph%20Slicer)

An interactive line graph that combines trend analysis with two draggable range handles. The selected interval drives Start, End, Change, and Selected Total metrics and can cross-select other visuals on the report page.

## Repository Layout

Each visual is self-contained in its own folder with the source, manifest, capabilities, styles, icon, dependency lockfile, and build configuration needed to compile it.

Generated packages, temporary build files, editor settings, certificates, and machine-specific files are intentionally excluded.

## Requirements

- Node.js 18 or later
- npm
- Power BI Visuals CLI (`powerbi-visuals-tools`), installed locally by `npm install`
- Power BI Desktop for importing and testing the packaged visual

## Build

```powershell
cd "Fancy Line Graph Slicer"
npm install
npx pbiviz package
```

The compiled `.pbiviz` file is written to the visual's `dist/` directory. `npm run package` is an equivalent project alias after dependencies are installed.

## License

This repository is licensed under the MIT License. See [LICENSE](LICENSE).
