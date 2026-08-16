/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewValueColumn = powerbi.DataViewValueColumn;

import { VisualFormattingSettingsModel } from "./settings";

interface ChartDataPoint {
    key: string;
    label: string;
    value: number;
    selectionId?: ISelectionId;
}

export class Visual implements IVisual {
    private static instanceCount = 0;

    private events: IVisualEventService;
    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private target: HTMLElement;

    private root: HTMLElement;
    private statRowNode: HTMLElement;
    private valueNode: HTMLElement;
    private valueContextNode: HTMLElement;
    private titleNode: HTMLElement;
    private emptyStateNode: HTMLElement;
    private yLabelsNode: HTMLElement;
    private xLabelsNode: HTMLElement;
    private chartArea: HTMLElement;
    private chartSvg: SVGSVGElement;
    private areaPath: SVGPathElement;
    private startHatchAreaPath: SVGPathElement;
    private endHatchAreaPath: SVGPathElement;
    private zeroLine: SVGLineElement;
    private linePath: SVGPathElement;
    private selectionRect: SVGRectElement;
    private startMarkerLine: SVGLineElement;
    private endMarkerLine: SVGLineElement;
    private startHandle: SVGCircleElement;
    private endHandle: SVGCircleElement;
    private calloutNode: HTMLElement;
    private calloutChangeLabelNode: HTMLElement;
    private calloutChangeContextNode: HTMLElement;
    private calloutChangeNode: HTMLElement;
    private calloutFromDateNode: HTMLElement;
    private calloutFromValueNode: HTMLElement;
    private calloutFromContextNode: HTMLElement;
    private calloutToDateNode: HTMLElement;
    private calloutToValueNode: HTMLElement;
    private calloutToContextNode: HTMLElement;
    private selectedTotalLabelNode: HTMLElement;
    private selectedTotalValueNode: HTMLElement;
    private selectedTotalContextNode: HTMLElement;

    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private visibleDataPoints: ChartDataPoint[] = [];
    private rangeStartIndex = 0;
    private rangeEndIndex = 0;
    private rangeStartKey: string | undefined;
    private rangeEndKey: string | undefined;
    private activeHandle: "start" | "end" | undefined;
    private chartWidth = 0;
    private chartPadLeft = 8;
    private chartInnerWidth = 0;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.host = options.host;
        this.selectionManager = options.host.createSelectionManager();
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;

        this.root = document.createElement("div");
        this.root.className = "rdv-root";

        const header = document.createElement("div");
        header.className = "rdv-header rdv-metric";

        this.titleNode = document.createElement("div");
        this.titleNode.className = "rdv-title";
        this.titleNode.textContent = "Revenue";

        header.appendChild(this.titleNode);

        this.statRowNode = document.createElement("div");
        this.statRowNode.className = "rdv-stat-row";

        this.valueNode = document.createElement("div");
        this.valueNode.className = "rdv-value";

        this.valueContextNode = document.createElement("span");
        this.valueContextNode.className = "rdv-callout-context";
        this.valueContextNode.textContent = "Latest value";

        header.appendChild(this.valueNode);
        header.appendChild(this.valueContextNode);
        this.statRowNode.appendChild(header);

        const chartWrap = document.createElement("div");
        chartWrap.className = "rdv-chart-wrap";

        this.yLabelsNode = document.createElement("div");
        this.yLabelsNode.className = "rdv-y-labels";

        this.chartArea = document.createElement("div");
        this.chartArea.className = "rdv-chart-area";

        this.chartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.chartSvg.classList.add("rdv-chart");
        this.chartSvg.setAttribute("preserveAspectRatio", "none");

        const hatchPatternId = `rdv-hatch-${++Visual.instanceCount}`;
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const hatchPattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        hatchPattern.setAttribute("id", hatchPatternId);
        hatchPattern.setAttribute("patternUnits", "userSpaceOnUse");
        hatchPattern.setAttribute("width", "7");
        hatchPattern.setAttribute("height", "7");
        hatchPattern.setAttribute("patternTransform", "rotate(45)");

        const hatchLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hatchLine.setAttribute("x1", "0");
        hatchLine.setAttribute("y1", "0");
        hatchLine.setAttribute("x2", "0");
        hatchLine.setAttribute("y2", "7");
        hatchLine.setAttribute("class", "rdv-hatch-line");
        hatchPattern.appendChild(hatchLine);
        defs.appendChild(hatchPattern);

        this.areaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.areaPath.setAttribute("class", "rdv-area");

        this.startHatchAreaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.startHatchAreaPath.setAttribute("class", "rdv-hatch-area");
        this.startHatchAreaPath.setAttribute("fill", `url(#${hatchPatternId})`);

        this.endHatchAreaPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.endHatchAreaPath.setAttribute("class", "rdv-hatch-area");
        this.endHatchAreaPath.setAttribute("fill", `url(#${hatchPatternId})`);

        this.zeroLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this.zeroLine.setAttribute("class", "rdv-zero-line");

        this.linePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.linePath.setAttribute("class", "rdv-line");

        this.selectionRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.selectionRect.setAttribute("class", "rdv-selection");

        this.startMarkerLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this.startMarkerLine.setAttribute("class", "rdv-marker-line");
        this.endMarkerLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this.endMarkerLine.setAttribute("class", "rdv-marker-line");

        this.startHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.startHandle.setAttribute("class", "rdv-range-handle");
        this.startHandle.setAttribute("r", "7");
        this.startHandle.setAttribute("tabindex", "0");
        this.startHandle.setAttribute("aria-label", "Comparison start");
        this.endHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.endHandle.setAttribute("class", "rdv-range-handle");
        this.endHandle.setAttribute("r", "7");
        this.endHandle.setAttribute("tabindex", "0");
        this.endHandle.setAttribute("aria-label", "Comparison end");

        this.chartSvg.appendChild(defs);
        this.chartSvg.appendChild(this.areaPath);
        this.chartSvg.appendChild(this.startHatchAreaPath);
        this.chartSvg.appendChild(this.endHatchAreaPath);
        this.chartSvg.appendChild(this.selectionRect);
        this.chartSvg.appendChild(this.zeroLine);
        this.chartSvg.appendChild(this.linePath);
        this.chartSvg.appendChild(this.startMarkerLine);
        this.chartSvg.appendChild(this.endMarkerLine);
        this.chartSvg.appendChild(this.startHandle);
        this.chartSvg.appendChild(this.endHandle);

        this.startHandle.addEventListener("pointerdown", (event) => this.beginDrag("start", event));
        this.endHandle.addEventListener("pointerdown", (event) => this.beginDrag("end", event));
        this.chartSvg.addEventListener("pointermove", (event) => this.dragHandle(event));
        this.chartSvg.addEventListener("pointerup", () => this.endDrag());
        this.chartSvg.addEventListener("pointercancel", () => this.endDrag());
        this.chartSvg.addEventListener("click", (event) => this.moveNearestHandle(event));

        this.calloutNode = document.createElement("div");
        this.calloutNode.className = "rdv-callout";

        const firstRow = document.createElement("div");
        firstRow.className = "rdv-callout-row rdv-metric";
        this.calloutFromDateNode = document.createElement("span");
        this.calloutFromDateNode.className = "rdv-callout-date";
        this.calloutFromDateNode.textContent = "Start";
        this.calloutFromValueNode = document.createElement("span");
        this.calloutFromValueNode.className = "rdv-callout-value";
        this.calloutFromContextNode = document.createElement("span");
        this.calloutFromContextNode.className = "rdv-callout-context";
        firstRow.appendChild(this.calloutFromDateNode);
        firstRow.appendChild(this.calloutFromValueNode);
        firstRow.appendChild(this.calloutFromContextNode);

        this.calloutChangeNode = document.createElement("div");
        this.calloutChangeNode.className = "rdv-callout-change rdv-metric";
        this.calloutChangeLabelNode = document.createElement("span");
        this.calloutChangeLabelNode.className = "rdv-callout-change-label";
        this.calloutChangeLabelNode.textContent = "Change";
        this.calloutChangeNode.appendChild(this.calloutChangeLabelNode);

        const calloutChangeValue = document.createElement("strong");
        this.calloutChangeNode.appendChild(calloutChangeValue);

        this.calloutChangeContextNode = document.createElement("span");
        this.calloutChangeContextNode.className = "rdv-callout-context";
        this.calloutChangeContextNode.textContent = "Start to end";
        this.calloutChangeNode.appendChild(this.calloutChangeContextNode);

        const secondRow = document.createElement("div");
        secondRow.className = "rdv-callout-row rdv-metric";
        this.calloutToDateNode = document.createElement("span");
        this.calloutToDateNode.className = "rdv-callout-date";
        this.calloutToDateNode.textContent = "End";
        this.calloutToValueNode = document.createElement("span");
        this.calloutToValueNode.className = "rdv-callout-value";
        this.calloutToContextNode = document.createElement("span");
        this.calloutToContextNode.className = "rdv-callout-context";
        secondRow.appendChild(this.calloutToDateNode);
        secondRow.appendChild(this.calloutToValueNode);
        secondRow.appendChild(this.calloutToContextNode);

        const totalRow = document.createElement("div");
        totalRow.className = "rdv-callout-row rdv-stat-total rdv-metric";
        this.selectedTotalLabelNode = document.createElement("span");
        this.selectedTotalLabelNode.className = "rdv-callout-date";
        this.selectedTotalLabelNode.textContent = "Selected Total";
        this.selectedTotalValueNode = document.createElement("span");
        this.selectedTotalValueNode.className = "rdv-callout-value";
        this.selectedTotalContextNode = document.createElement("span");
        this.selectedTotalContextNode.className = "rdv-callout-context";
        this.selectedTotalContextNode.textContent = "0 days";
        totalRow.appendChild(this.selectedTotalLabelNode);
        totalRow.appendChild(this.selectedTotalValueNode);
        totalRow.appendChild(this.selectedTotalContextNode);

        this.calloutNode.appendChild(firstRow);
        this.calloutNode.appendChild(secondRow);
        this.calloutNode.appendChild(this.calloutChangeNode);
        this.statRowNode.appendChild(totalRow);
        this.statRowNode.appendChild(this.calloutNode);

        this.chartArea.appendChild(this.chartSvg);

        this.xLabelsNode = document.createElement("div");
        this.xLabelsNode.className = "rdv-x-labels";

        chartWrap.appendChild(this.yLabelsNode);
        chartWrap.appendChild(this.chartArea);

        this.root.appendChild(this.statRowNode);
        this.root.appendChild(chartWrap);
        this.root.appendChild(this.xLabelsNode);

        this.emptyStateNode = document.createElement("div");
        this.emptyStateNode.className = "rdv-empty-state";
        this.emptyStateNode.textContent = "Add a date and a measure to view the trend.";
        this.root.appendChild(this.emptyStateNode);

        this.target.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);

        try {
            const dataView = options.dataViews && options.dataViews.length > 0 ? options.dataViews[0] : undefined;
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, dataView);

            this.applyFormatting();
            this.renderData(dataView, options.viewport.width, options.viewport.height);

            this.events.renderingFinished(options);
        }
        catch (error) {
            this.events.renderingFailed(options, String(error));
        }
    }

    private applyFormatting(): void {
        const colors = this.formattingSettings.colors;
        const sizes = this.formattingSettings.textSizes;
        const labels = this.formattingSettings.labelsValues;
        const axes = this.formattingSettings.axes;
        const chart = this.formattingSettings.chart;
        const titleText = labels.titleText.value?.trim() || "Revenue";
        const bgColor = colors.backgroundColor.value.value || "#3f4f44";
        const foreground = this.getContrastingForeground(bgColor);
        const darkBackground = foreground === "#ffffff";
        const accentColor = colors.autoLineColor.value
            ? foreground
            : colors.lineColor.value.value || "#ffd24a";

        this.titleNode.textContent = titleText;
        const selectedTotalLabel = labels.selectedTotalText.value?.trim();
        this.selectedTotalLabelNode.textContent = !selectedTotalLabel || selectedTotalLabel === "Selected total"
            ? "Selected Total"
            : selectedTotalLabel;
        const startLabel = labels.startText.value?.trim() || "Start";
        const endLabel = labels.endText.value?.trim() || "End";
        this.calloutFromDateNode.textContent = startLabel;
        this.calloutToDateNode.textContent = endLabel;
        this.calloutChangeLabelNode.textContent = labels.changeText.value?.trim() || "Change";
        this.calloutChangeContextNode.textContent = `${startLabel} to ${endLabel}`;
        this.root.classList.toggle("wrap-labels", labels.labelOverflow.value.value === "wrap");

        this.root.style.setProperty("--rdv-bg", bgColor);
        this.root.style.setProperty("--rdv-accent", accentColor);
        this.root.style.setProperty("--rdv-foreground", foreground);
        this.root.style.setProperty("--rdv-muted", darkBackground ? "rgba(255, 255, 255, 0.82)" : "rgba(20, 31, 25, 0.76)");
        this.root.style.setProperty("--rdv-soft-fill", darkBackground ? "rgba(255, 255, 255, 0.10)" : "rgba(20, 31, 25, 0.09)");
        this.root.style.setProperty("--rdv-hatch", darkBackground ? "rgba(255, 255, 255, 0.58)" : "rgba(20, 31, 25, 0.48)");
        this.root.style.setProperty("--rdv-marker", darkBackground ? "rgba(255, 255, 255, 0.64)" : "rgba(20, 31, 25, 0.55)");
        this.root.style.setProperty("--rdv-title-size", `${Math.max(1, sizes.titleSize.value)}px`);
        this.root.style.setProperty("--rdv-value-size", `${Math.max(1, sizes.valueSize.value)}px`);
        const configuredSublabelSize = sizes.sublabelSize.value;
        const sublabelSize = configuredSublabelSize === 6 || configuredSublabelSize === 7 || configuredSublabelSize === 9
            ? 5
            : configuredSublabelSize;
        this.root.style.setProperty("--rdv-sublabel-size", `${Math.max(1, sublabelSize)}px`);
        this.root.style.setProperty("--rdv-axis-size", `${Math.max(1, sizes.axisSize.value)}px`);
        this.root.style.setProperty(
            "--rdv-y-axis-width",
            axes.numberFormat.value.value === "full" ? "clamp(56px, 14cqw, 96px)" : "clamp(31px, 8cqw, 48px)"
        );
        this.root.style.setProperty("--rdv-line-width", `${Math.max(0.5, chart.lineWidth.value)}px`);
        this.root.style.setProperty("--rdv-corner-radius", `${Math.max(0, chart.cornerRadius.value)}px`);
        this.root.style.setProperty("--rdv-border-color", chart.borderColor.value.value || foreground);
        this.root.style.setProperty(
            "--rdv-border-width",
            chart.showBorder.value ? `${Math.min(12, Math.max(0.5, chart.borderWidth.value))}px` : "0px"
        );

        const handleRadius = Math.max(2, chart.handleSize.value / 2);
        this.startHandle.setAttribute("r", handleRadius.toString());
        this.endHandle.setAttribute("r", handleRadius.toString());
    }

    private getContrastingForeground(color: string): "#ffffff" | "#142019" {
        const normalized = color.trim();
        const hexMatch = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
        let red = 63;
        let green = 79;
        let blue = 68;

        if (hexMatch) {
            const hex = hexMatch[1].length === 3
                ? hexMatch[1].split("").map((part) => part + part).join("")
                : hexMatch[1];
            red = parseInt(hex.slice(0, 2), 16);
            green = parseInt(hex.slice(2, 4), 16);
            blue = parseInt(hex.slice(4, 6), 16);
        } else {
            const rgbMatch = normalized.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
            if (rgbMatch) {
                red = Number(rgbMatch[1]);
                green = Number(rgbMatch[2]);
                blue = Number(rgbMatch[3]);
            }
        }

        const channels = [red, green, blue].map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
        });
        const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
        return luminance > 0.36 ? "#142019" : "#ffffff";
    }

    private renderData(dataView: DataView | undefined, viewportWidth: number, viewportHeight: number): void {
        this.root.classList.toggle("compact", viewportWidth < 470 || viewportHeight < 260);
        this.root.classList.toggle("tiny", viewportWidth < 330 || viewportHeight < 190);

        const dataPoints = this.getDataPoints(dataView);
        const hasData = dataPoints.length >= 2;
        this.root.classList.toggle("empty", !hasData);

        if (!hasData) {
            this.visibleDataPoints = [];
            this.valueNode.textContent = "";
            this.yLabelsNode.replaceChildren();
            this.xLabelsNode.replaceChildren();
            this.linePath.removeAttribute("d");
            this.areaPath.removeAttribute("d");
            this.startHatchAreaPath.removeAttribute("d");
            this.endHatchAreaPath.removeAttribute("d");
            this.zeroLine.removeAttribute("x1");
            this.zeroLine.removeAttribute("x2");
            this.zeroLine.removeAttribute("y1");
            this.zeroLine.removeAttribute("y2");
            return;
        }

        this.visibleDataPoints = dataPoints;
        this.restoreRange();
        const labels = this.formattingSettings.labelsValues;
        const prefix = labels.showValuePrefix.value ? labels.valuePrefix.value || "$" : "";
        const currentValueDays = Math.max(1, Math.round(labels.currentValueDays.value));
        const primarySublabel = labels.primarySublabelText.value?.trim();
        this.valueContextNode.textContent = !primarySublabel || primarySublabel === "Latest value"
            ? currentValueDays === 1 ? "Latest value" : `Last ${currentValueDays} days`
            : primarySublabel;
        const currentValue = dataPoints
            .slice(-currentValueDays)
            .reduce((total, point) => total + point.value, 0);

        this.valueNode.textContent = `${prefix}${this.formatNumber(currentValue)}`;

        this.renderYAxis(dataPoints, prefix, viewportHeight);
        this.renderXAxis(dataPoints, viewportWidth);
        this.renderChart(dataPoints, prefix);
    }

    private renderYAxis(dataPoints: ChartDataPoint[], prefix: string, viewportHeight: number): void {
        const { minValue, maxValue } = this.getYDomain(dataPoints);
        const axisFontSize = Math.max(1, this.formattingSettings.textSizes.axisSize.value);
        const availableHeight = this.chartArea.clientHeight || Math.max(0, viewportHeight - 100);
        const minimumTickHeight = Math.max(16, axisFontSize * 2);
        const targetTickCount = Math.max(3, Math.min(8, dataPoints.length, Math.floor(availableHeight / minimumTickHeight)));
        const tickStep = this.getNiceTickStep(maxValue - minValue, targetTickCount);
        const topTick = Math.floor(maxValue / tickStep) * tickStep;
        const bottomTick = Math.ceil(minValue / tickStep) * tickStep;
        const tickValues: number[] = [];
        for (let value = topTick; value >= bottomTick - tickStep * 0.001; value -= tickStep) {
            tickValues.push(Math.abs(value) < tickStep * 0.001 ? 0 : value);
        }

        this.yLabelsNode.replaceChildren();
        const innerHeight = Math.max(0, availableHeight - 36);
        tickValues.forEach((value) => {
            const label = document.createElement("span");
            label.textContent = `${prefix}${this.formatAxis(value)}`;
            const ratio = maxValue === minValue ? 0.5 : (maxValue - value) / (maxValue - minValue);
            label.style.top = `${12 + ratio * innerHeight}px`;
            this.yLabelsNode.appendChild(label);
        });
    }

    private renderXAxis(dataPoints: ChartDataPoint[], viewportWidth: number): void {
        this.xLabelsNode.replaceChildren();

        const axisFontSize = Math.max(1, this.formattingSettings.textSizes.axisSize.value);
        const availableWidth = this.chartArea.clientWidth || Math.max(0, viewportWidth - 70);
        const minimumTickWidth = Math.max(48, axisFontSize * 6.5);
        const tickCount = Math.max(2, Math.min(12, dataPoints.length, Math.floor(availableWidth / minimumTickWidth)));
        this.xLabelsNode.style.gridTemplateColumns = `repeat(${tickCount}, minmax(0, 1fr))`;

        for (let i = 0; i < tickCount; i++) {
            const index = Math.round((i / (tickCount - 1)) * (dataPoints.length - 1));
            const label = document.createElement("span");
            label.textContent = dataPoints[index].label;
            this.xLabelsNode.appendChild(label);
        }
    }

    private renderChart(dataPoints: ChartDataPoint[], prefix: string): void {
        const width = Math.max(this.chartArea.clientWidth, 120);
        const height = Math.max(this.chartArea.clientHeight, 80);

        const padTop = 12;
        const padRight = 12;
        const padBottom = 24;
        const padLeft = 8;

        const innerWidth = width - padLeft - padRight;
        const innerHeight = height - padTop - padBottom;

        this.chartWidth = width;
        this.chartPadLeft = padLeft;
        this.chartInnerWidth = innerWidth;

        this.chartSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);

        const { minValue, maxValue } = this.getYDomain(dataPoints);
        const range = maxValue - minValue;

        const x = (index: number): number => {
            if (dataPoints.length <= 1) {
                return padLeft;
            }
            return padLeft + (index / (dataPoints.length - 1)) * innerWidth;
        };

        const y = (value: number): number => {
            if (range === 0) {
                return padTop + innerHeight / 2;
            }
            return padTop + (1 - (value - minValue) / range) * innerHeight;
        };

        const lineD = dataPoints
            .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(d.value).toFixed(2)}`)
            .join(" ");

        const firstX = x(0);
        const lastX = x(dataPoints.length - 1);
        const zeroY = y(0);
        const areaD = `${lineD} L ${lastX.toFixed(2)} ${zeroY.toFixed(2)} L ${firstX.toFixed(2)} ${zeroY.toFixed(2)} Z`;

        this.linePath.setAttribute("d", lineD);
        this.areaPath.setAttribute("d", areaD);
        this.zeroLine.setAttribute("x1", padLeft.toString());
        this.zeroLine.setAttribute("x2", (padLeft + innerWidth).toString());
        this.zeroLine.setAttribute("y1", zeroY.toFixed(2));
        this.zeroLine.setAttribute("y2", zeroY.toFixed(2));

        this.updateRangeVisuals(dataPoints, prefix, x, y, padTop, innerHeight);
    }

    private getYDomain(dataPoints: ChartDataPoint[]): { minValue: number; maxValue: number } {
        const values = dataPoints.map((point) => point.value);
        const domainMin = Math.min(0, ...values);
        const domainMax = Math.max(0, ...values);
        const span = domainMax - domainMin;
        const padding = span > 0 ? span * 0.08 : Math.max(1, Math.abs(domainMax) * 0.08);

        return {
            minValue: domainMin - padding,
            maxValue: domainMax + padding
        };
    }

    private getNiceTickStep(range: number, targetTickCount: number): number {
        const roughStep = range / Math.max(1, targetTickCount - 1);
        const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(roughStep, Number.EPSILON))));
        const normalizedStep = roughStep / magnitude;
        const niceMultiplier = normalizedStep <= 1
            ? 1
            : normalizedStep <= 2
                ? 2
                : normalizedStep <= 2.5
                    ? 2.5
                    : normalizedStep <= 5
                        ? 5
                        : 10;

        return niceMultiplier * magnitude;
    }

    private resetRange(): void {
        const lastIndex = Math.max(0, this.visibleDataPoints.length - 1);
        this.rangeStartIndex = Math.min(lastIndex, Math.round(lastIndex * 0.35));
        this.rangeEndIndex = Math.min(lastIndex, Math.round(lastIndex * 0.72));
        if (this.rangeEndIndex <= this.rangeStartIndex && lastIndex > 0) {
            this.rangeStartIndex = 0;
            this.rangeEndIndex = lastIndex;
        }
        this.rememberRange();
    }

    private restoreRange(): void {
        if (!this.rangeStartKey || !this.rangeEndKey) {
            this.resetRange();
            return;
        }

        const lastIndex = this.visibleDataPoints.length - 1;
        const restoredStartIndex = this.visibleDataPoints.findIndex((point) => point.key === this.rangeStartKey);
        const restoredEndIndex = this.visibleDataPoints.findIndex((point) => point.key === this.rangeEndKey);
        this.rangeStartIndex = restoredStartIndex >= 0
            ? restoredStartIndex
            : Math.min(this.rangeStartIndex, Math.max(0, lastIndex - 1));
        this.rangeEndIndex = restoredEndIndex >= 0
            ? restoredEndIndex
            : Math.min(Math.max(this.rangeEndIndex, 1), lastIndex);

        if (this.rangeEndIndex <= this.rangeStartIndex) {
            this.rangeStartIndex = Math.max(0, Math.min(this.rangeStartIndex, lastIndex - 1));
            this.rangeEndIndex = Math.min(lastIndex, this.rangeStartIndex + 1);
        }
        this.rememberRange();
    }

    private rememberRange(): void {
        this.rangeStartKey = this.visibleDataPoints[this.rangeStartIndex]?.key;
        this.rangeEndKey = this.visibleDataPoints[this.rangeEndIndex]?.key;
    }

    private beginDrag(handle: "start" | "end", event: PointerEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.activeHandle = handle;
        this.chartSvg.setPointerCapture(event.pointerId);
        this.setHandleFromPointer(event);
    }

    private dragHandle(event: PointerEvent): void {
        if (!this.activeHandle) {
            return;
        }
        event.preventDefault();
        this.setHandleFromPointer(event);
    }

    private endDrag(): void {
        if (this.activeHandle) {
            this.applyRangeSelection();
        }
        this.activeHandle = undefined;
    }

    private moveNearestHandle(event: MouseEvent): void {
        if (this.activeHandle || this.visibleDataPoints.length < 2) {
            return;
        }
        const index = this.indexFromClientX(event.clientX);
        this.activeHandle = Math.abs(index - this.rangeStartIndex) <= Math.abs(index - this.rangeEndIndex) ? "start" : "end";
        this.setRangeIndex(index);
        this.activeHandle = undefined;
        this.applyRangeSelection();
    }

    private setHandleFromPointer(event: PointerEvent): void {
        this.setRangeIndex(this.indexFromClientX(event.clientX));
    }

    private indexFromClientX(clientX: number): number {
        const rect = this.chartSvg.getBoundingClientRect();
        const svgX = rect.width === 0 ? 0 : ((clientX - rect.left) / rect.width) * this.chartWidth;
        const ratio = this.chartInnerWidth === 0 ? 0 : (svgX - this.chartPadLeft) / this.chartInnerWidth;
        return Math.max(0, Math.min(this.visibleDataPoints.length - 1, Math.round(ratio * (this.visibleDataPoints.length - 1))));
    }

    private setRangeIndex(index: number): void {
        if (this.activeHandle === "start") {
            this.rangeStartIndex = Math.min(index, this.rangeEndIndex - 1);
        } else {
            this.rangeEndIndex = Math.max(index, this.rangeStartIndex + 1);
        }
        this.rememberRange();
        const labels = this.formattingSettings.labelsValues;
        const prefix = labels.showValuePrefix.value ? labels.valuePrefix.value || "$" : "";
        this.renderChart(this.visibleDataPoints, prefix);
    }

    private updateRangeVisuals(
        dataPoints: ChartDataPoint[],
        prefix: string,
        x: (index: number) => number,
        y: (value: number) => number,
        padTop: number,
        innerHeight: number
    ): void {
        const start = dataPoints[this.rangeStartIndex];
        const end = dataPoints[this.rangeEndIndex];
        const startX = x(this.rangeStartIndex);
        const endX = x(this.rangeEndIndex);
        const bottom = padTop + innerHeight;

        const startHatchLine = dataPoints
            .slice(0, this.rangeStartIndex + 1)
            .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(point.value).toFixed(2)}`)
            .join(" ");
        const startHatchPath = `${startHatchLine} L ${startX.toFixed(2)} ${bottom.toFixed(2)} L ${x(0).toFixed(2)} ${bottom.toFixed(2)} Z`;
        this.startHatchAreaPath.setAttribute("d", startHatchPath);

        const endHatchLine = dataPoints
            .slice(this.rangeEndIndex)
            .map((point, offset) => {
                const index = this.rangeEndIndex + offset;
                return `${offset === 0 ? "M" : "L"} ${x(index).toFixed(2)} ${y(point.value).toFixed(2)}`;
            })
            .join(" ");
        const lastX = x(dataPoints.length - 1);
        const endHatchPath = `${endHatchLine} L ${lastX.toFixed(2)} ${bottom.toFixed(2)} L ${endX.toFixed(2)} ${bottom.toFixed(2)} Z`;
        this.endHatchAreaPath.setAttribute("d", endHatchPath);

        this.selectionRect.setAttribute("x", startX.toFixed(2));
        this.selectionRect.setAttribute("y", padTop.toString());
        this.selectionRect.setAttribute("width", Math.max(0, endX - startX).toFixed(2));
        this.selectionRect.setAttribute("height", innerHeight.toString());

        [[this.startMarkerLine, startX], [this.endMarkerLine, endX]].forEach(([node, markerX]) => {
            const line = node as SVGLineElement;
            const position = markerX as number;
            line.setAttribute("x1", position.toFixed(2));
            line.setAttribute("x2", position.toFixed(2));
            line.setAttribute("y1", padTop.toString());
            line.setAttribute("y2", bottom.toString());
        });

        this.startHandle.setAttribute("cx", startX.toFixed(2));
        this.startHandle.setAttribute("cy", y(start.value).toFixed(2));
        this.endHandle.setAttribute("cx", endX.toFixed(2));
        this.endHandle.setAttribute("cy", y(end.value).toFixed(2));

        const changePct = start.value === 0 ? 0 : ((end.value - start.value) / Math.abs(start.value)) * 100;
        const selectedTotal = dataPoints
            .slice(this.rangeStartIndex, this.rangeEndIndex + 1)
            .reduce((total, point) => total + point.value, 0);
        const selectedDays = this.rangeEndIndex - this.rangeStartIndex + 1;
        this.calloutFromContextNode.textContent = start.label;
        this.calloutFromValueNode.textContent = `${prefix}${this.formatNumber(start.value)}`;
        this.calloutToContextNode.textContent = end.label;
        this.calloutToValueNode.textContent = `${prefix}${this.formatNumber(end.value)}`;
        const changeValueNode = this.calloutChangeNode.querySelector("strong") as HTMLElement;
        changeValueNode.textContent = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
        this.selectedTotalValueNode.textContent = `${prefix}${this.formatNumber(selectedTotal)}`;
        this.selectedTotalContextNode.textContent = `${selectedDays} ${selectedDays === 1 ? "day" : "days"}`;
        this.fitTopMetricSizes();
    }

    private fitTopMetricSizes(): void {
        const sizes = this.formattingSettings.textSizes;
        const requestedValueSize = Math.max(1, sizes.valueSize.value);
        const requestedLabelSize = Math.max(1, sizes.titleSize.value);
        this.root.style.setProperty("--rdv-value-size", `${requestedValueSize}px`);
        this.root.style.setProperty("--rdv-title-size", `${requestedLabelSize}px`);

        const valueNodes = [
            this.valueNode,
            this.selectedTotalValueNode,
            this.calloutFromValueNode,
            this.calloutChangeNode.querySelector("strong") as HTMLElement,
            this.calloutToValueNode
        ];
        const labelNodes = [
            this.titleNode,
            this.selectedTotalLabelNode,
            this.calloutFromDateNode,
            this.calloutToDateNode,
            this.calloutChangeLabelNode
        ];

        const getFitRatio = (nodes: HTMLElement[]): number => nodes.reduce((fitRatio, node) => {
            const parent = node.parentElement;
            if (!parent) {
                return fitRatio;
            }

            const parentStyle = getComputedStyle(parent);
            const horizontalPadding = parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight);
            const availableWidth = Math.max(1, parent.clientWidth - horizontalPadding);
            return Math.min(fitRatio, availableWidth / Math.max(1, node.scrollWidth));
        }, 1);

        const fittedValueSize = Math.max(8, Math.min(requestedValueSize, Math.floor(requestedValueSize * getFitRatio(valueNodes))));
        const fittedLabelSize = Math.max(8, Math.min(requestedLabelSize, Math.floor(requestedLabelSize * getFitRatio(labelNodes))));
        this.root.style.setProperty("--rdv-value-size", `${fittedValueSize}px`);
        this.root.style.setProperty("--rdv-title-size", `${fittedLabelSize}px`);
    }

    private getDataPoints(dataView?: DataView): ChartDataPoint[] {
        if (!dataView || !dataView.categorical) {
            return [];
        }

        const categorical = dataView.categorical;
        const categories: DataViewCategoryColumn | undefined = categorical.categories && categorical.categories[0];
        const measure: DataViewValueColumn | undefined = categorical.values && categorical.values[0];

        if (!measure || !measure.values || measure.values.length === 0) {
            return [];
        }

        const points: ChartDataPoint[] = [];
        for (let i = 0; i < measure.values.length; i++) {
            const rawValue = Number(measure.values[i]);
            if (!Number.isFinite(rawValue)) {
                continue;
            }

            const rawCategory = categories && categories.values && i < categories.values.length ? categories.values[i] : i + 1;
            points.push({
                key: rawCategory instanceof Date
                    ? `date:${rawCategory.getTime()}`
                    : `${typeof rawCategory}:${String(rawCategory)}`,
                label: this.formatCategoryLabel(rawCategory),
                value: rawValue,
                selectionId: categories
                    ? this.host.createSelectionIdBuilder().withCategory(categories, i).createSelectionId()
                    : undefined
            });
        }

        return points;
    }

    private applyRangeSelection(): void {
        const selectionIds = this.visibleDataPoints
            .slice(this.rangeStartIndex, this.rangeEndIndex + 1)
            .map((point) => point.selectionId)
            .filter((selectionId): selectionId is ISelectionId => selectionId !== undefined);

        if (selectionIds.length > 0) {
            this.selectionManager.select(selectionIds, false);
        }
    }

    private formatCategoryLabel(value: powerbi.PrimitiveValue): string {
        const parsed = value instanceof Date ? value : new Date(String(value));
        if (!Number.isNaN(parsed.getTime())) {
            const format = this.formattingSettings.axes.dateFormat.value.value;
            if (format === "iso") {
                const year = parsed.getFullYear();
                const month = String(parsed.getMonth() + 1).padStart(2, "0");
                const day = String(parsed.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
            }

            const options: Intl.DateTimeFormatOptions = format === "monthDay"
                ? { month: "short", day: "numeric" }
                : format === "numeric"
                    ? { month: "numeric", day: "numeric", year: "2-digit" }
                    : format === "long"
                        ? { month: "short", day: "numeric", year: "numeric" }
                        : format === "monthYear"
                            ? { month: "short", year: "numeric" }
                            : { month: "short", day: "numeric", year: "2-digit" };
            return parsed.toLocaleDateString(undefined, options);
        }

        return String(value);
    }

    private formatNumber(value: number): string {
        return new Intl.NumberFormat(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    private formatAxis(value: number): string {
        const format = this.formattingSettings.axes.numberFormat.value.value;
        if (format === "full") {
            return this.formatNumber(value);
        }
        if (format === "thousands") {
            return `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`;
        }
        if (format === "millions") {
            return `${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
        }
        if (Math.abs(value) >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (Math.abs(value) >= 1000) {
            return `${Math.round(value / 1000)}K`;
        }
        return value.toFixed(0);
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
    * This method is called once every time we open properties pane or when the user edit any format property.
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}