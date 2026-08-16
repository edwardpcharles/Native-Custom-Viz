"use strict";

import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class ColorSettings extends FormattingSettingsCard {
    backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background",
        value: { value: "" }
    });

    autoLineColor = new formattingSettings.ToggleSwitch({
        name: "autoLineColor",
        displayName: "Auto contrast line",
        value: true
    });

    lineColor = new formattingSettings.ColorPicker({
        name: "lineColor",
        displayName: "Line",
        value: { value: "" }
    });

    name: string = "colors";
    displayName: string = "Colors";
    slices: Array<FormattingSettingsSlice> = [this.backgroundColor, this.autoLineColor, this.lineColor];

    public onPreProcess(): void {
        this.lineColor.visible = !this.autoLineColor.value;
    }
}

class TextSizeSettings extends FormattingSettingsCard {
    titleSize = new formattingSettings.NumUpDown({
        name: "titleSize",
        displayName: "Metric labels",
        value: 16
    });

    valueSize = new formattingSettings.NumUpDown({
        name: "valueSize",
        displayName: "Metric values",
        value: 23
    });

    sublabelSize = new formattingSettings.NumUpDown({
        name: "sublabelSize",
        displayName: "Metric sublabels",
        value: 14
    });

    axisSize = new formattingSettings.NumUpDown({
        name: "axisSize",
        displayName: "Axis labels",
        value: 14
    });

    name: string = "textSizes";
    displayName: string = "Text sizes";
    slices: Array<FormattingSettingsSlice> = [this.titleSize, this.valueSize, this.sublabelSize, this.axisSize];
}

class LabelValueSettings extends FormattingSettingsCard {
    titleText = new formattingSettings.TextInput({
        name: "titleText",
        displayName: "Primary label",
        value: "Revenue",
        placeholder: "Revenue",
        instanceKind: powerbi.VisualEnumerationInstanceKinds.ConstantOrRule
    });

    selectedTotalText = new formattingSettings.TextInput({
        name: "selectedTotalText",
        displayName: "Selected total label",
        value: "Selected Total",
        placeholder: "Selected Total"
    });

    primarySublabelText = new formattingSettings.TextInput({
        name: "primarySublabelText",
        displayName: "Primary sublabel",
        value: "Latest value",
        placeholder: "Latest value"
    });

    startText = new formattingSettings.TextInput({
        name: "startText",
        displayName: "Start label",
        value: "Start",
        placeholder: "Start"
    });

    endText = new formattingSettings.TextInput({
        name: "endText",
        displayName: "End label",
        value: "End",
        placeholder: "End"
    });

    changeText = new formattingSettings.TextInput({
        name: "changeText",
        displayName: "Change label",
        value: "Change",
        placeholder: "Change"
    });

    labelOverflow = new formattingSettings.ItemDropdown({
        name: "labelOverflow",
        displayName: "Label overflow",
        items: [
            { displayName: "Ellipsis", value: "ellipsis" },
            { displayName: "Wrap", value: "wrap" }
        ],
        value: { displayName: "Ellipsis", value: "ellipsis" }
    });

    showValuePrefix = new formattingSettings.ToggleSwitch({
        name: "showValuePrefix",
        displayName: "Show value prefix",
        value: true
    });

    valuePrefix = new formattingSettings.TextInput({
        name: "valuePrefix",
        displayName: "Value prefix",
        value: "$",
        placeholder: "$"
    });

    currentValueDays = new formattingSettings.NumUpDown({
        name: "currentValueDays",
        displayName: "Current value days",
        description: "1 uses the latest value. Higher values sum the last N available days.",
        value: 1
    });

    name: string = "labelsValues";
    displayName: string = "Labels & values";
    slices: Array<FormattingSettingsSlice> = [
        this.titleText,
        this.selectedTotalText,
        this.primarySublabelText,
        this.startText,
        this.endText,
        this.changeText,
        this.labelOverflow,
        this.showValuePrefix,
        this.valuePrefix,
        this.currentValueDays
    ];

    public onPreProcess(): void {
        this.valuePrefix.visible = this.showValuePrefix.value;
    }
}

class ChartSettings extends FormattingSettingsCard {

    handleSize = new formattingSettings.NumUpDown({
        name: "handleSize",
        displayName: "Drag handles",
        value: 14
    });

    lineWidth = new formattingSettings.NumUpDown({
        name: "lineWidth",
        displayName: "Line thickness",
        value: 2.2
    });

    cornerRadius = new formattingSettings.NumUpDown({
        name: "cornerRadius",
        displayName: "Corner radius",
        value: 22
    });

    showBorder = new formattingSettings.ToggleSwitch({
        name: "showBorder",
        displayName: "Show border",
        value: false
    });

    borderColor = new formattingSettings.ColorPicker({
        name: "borderColor",
        displayName: "Border color",
        value: { value: "" }
    });

    borderWidth = new formattingSettings.NumUpDown({
        name: "borderWidth",
        displayName: "Border width",
        value: 1
    });

    name: string = "chart";
    displayName: string = "Chart";
    slices: Array<FormattingSettingsSlice> = [
        this.handleSize,
        this.lineWidth,
        this.cornerRadius,
        this.showBorder,
        this.borderColor,
        this.borderWidth
    ];
}

class AxisSettings extends FormattingSettingsCard {
    numberFormat = new formattingSettings.ItemDropdown({
        name: "numberFormat",
        displayName: "Number format",
        items: [
            { displayName: "Auto", value: "auto" },
            { displayName: "Full number", value: "full" },
            { displayName: "Thousands (K)", value: "thousands" },
            { displayName: "Millions (M)", value: "millions" }
        ],
        value: { displayName: "Auto", value: "auto" }
    });

    dateFormat = new formattingSettings.ItemDropdown({
        name: "dateFormat",
        displayName: "Date format",
        items: [
            { displayName: "Jan 5, 24", value: "short" },
            { displayName: "Jan 5", value: "monthDay" },
            { displayName: "1/5/24", value: "numeric" },
            { displayName: "Jan 5, 2024", value: "long" },
            { displayName: "Jan 2024", value: "monthYear" },
            { displayName: "2024-01-05", value: "iso" }
        ],
        value: { displayName: "Jan 5, 24", value: "short" }
    });

    name: string = "axes";
    displayName: string = "Axes";
    slices: Array<FormattingSettingsSlice> = [this.numberFormat, this.dateFormat];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    colors = new ColorSettings();
    textSizes = new TextSizeSettings();
    labelsValues = new LabelValueSettings();
    axes = new AxisSettings();
    chart = new ChartSettings();

    cards = [this.colors, this.textSizes, this.labelsValues, this.axes, this.chart];
}
