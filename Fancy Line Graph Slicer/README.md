# Fancy Line Graph Slicer

A responsive Power BI custom visual for exploring a time-series measure with two draggable comparison handles.

## Agent Entry Point

An agent opened directly in this folder can bootstrap and validate the project with:

```shell
node --version
npm --version
npm install --global powerbi-visuals-tools@latest
pbiviz --version
npm install
npm run lint
pbiviz package
```

Use `pbiviz start` only for live testing with the Developer Visual in Power BI Service. Read the repository-level [Agent Quick Start](../README.md#agent-quick-start) for operating boundaries, clean-machine prerequisites, certificate troubleshooting, privacy rules, and Microsoft Learn references.

For most changes:

- Rendering, data handling, and interaction logic: `src/visual.ts`
- Format pane definitions: `src/settings.ts` and matching properties in `capabilities.json`
- Layout and appearance: `style/visual.less`
- Visual identity and release version: `pbiviz.json`

Do not edit generated output. Finish source changes with `npm run lint`, `pbiviz package`, and `git diff --check`.

## Features

- Responsive line and area chart
- Draggable Start and End handles
- Native Power BI cross-selection for the selected interval
- Start, End, percentage Change, Selected Total, and current-value metrics
- Positive and negative values with a zero baseline
- Responsive x-axis and balanced y-axis labels
- Configurable colors, labels, typography, number formats, date formats, line styling, handles, corner radius, and border
- Persistent handle positions across resizing, zooming, and formatting updates

## Data Roles

| Role | Type | Description |
| --- | --- | --- |
| Category Data | Grouping | Ordered category, normally a date |
| Measure Data | Measure | Numeric value plotted on the line graph |

## Build and Development

For clean-machine prerequisites, cloning, certificate setup, Power BI Service live debugging, Desktop testing, and troubleshooting, follow the repository-level [development workflow](../README.md#start-on-a-new-computer).

From this folder, the complete command set is:

```shell
npm install
npm run lint
pbiviz start
pbiviz package
```

- Run `npm install` after cloning or when `package.json` changes. Dependencies are intentionally not lockfile-pinned, and `.npmrc` disables lockfile generation.
- TypeScript can update within major version 5, which is the range supported by the current Power BI Visuals CLI.
- Install or update the global CLI with `npm install --global powerbi-visuals-tools@latest`.
- Use `pbiviz start` for live debugging with the Developer Visual in Power BI Service.
- Use `pbiviz package` to create an importable `dist/*.pbiviz` for Power BI Desktop, Power BI Service, or distribution.

## Source Layout

```text
Fancy Line Graph Slicer/
|-- assets/
|   `-- icon.png
|-- src/
|   |-- settings.ts
|   `-- visual.ts
|-- style/
|   `-- visual.less
|-- capabilities.json
|-- eslint.config.mjs
|-- .npmrc
|-- package.json
|-- pbiviz.json
`-- tsconfig.json
```

- `src/visual.ts` implements rendering, interaction, selection, formatting application, and responsive behavior.
- `src/settings.ts` defines the Power BI format-pane cards and controls.
- `style/visual.less` defines layout, chart styling, responsive states, and the directional comparison treatment.
- `capabilities.json` declares data roles, mappings, formatting properties, and selection support.
- `pbiviz.json` contains the visual identity, API version, source references, and package metadata.
- `package.json`, `tsconfig.json`, and `eslint.config.mjs` define the update-friendly toolchain.

## Architecture

```mermaid
flowchart LR
    PBI[Power BI data view] --> VIS[src/visual.ts]
    CAP[capabilities.json] --> PBI
    SET[src/settings.ts] --> VIS
    LESS[style/visual.less] --> VIS
    VIS --> SEL[Power BI selection manager]
    VIS --> UI[Metrics and SVG chart]
```

Power BI supplies a categorical data view. The visual converts valid category/measure pairs into chart points, restores the selected range by stable category keys, applies format-pane settings, renders the metric strip and SVG chart, and reports range selections through the native selection manager.

## Packaging Notes

- Keep property names synchronized between `src/settings.ts` and `capabilities.json`.
- Increment both version fields in `pbiviz.json` for distributable releases.
- Do not commit `dist/`, `.tmp/`, `node_modules/`, certificates, or local editor settings.

## License

MIT. See the repository-level [LICENSE](../LICENSE).
