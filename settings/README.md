# ARTEF4KT - Ferrofluid Inspired Visualizer Settings System

## Overview
The settings system allows you to save, load, import, and export all UI control panel settings for the ferrofluid visualizer.

## Features

### Built-in Presets
The visualizer comes with 5 built-in presets:
- **Default** - Standard balanced settings
- **Dark Mode** - Dark theme with enhanced bass and purple/cyan lighting
- **Neon Vibes** - High energy settings with bright neon colors
- **Minimal** - Clean, subtle appearance with white lighting
- **High Contrast** - Bold settings with maximum visual impact

### Settings Controls
Located in the control panel, the settings section includes:

1. **Dropdown Selector** - Choose from available presets
2. **Load Button** - Apply the selected preset
3. **Refresh Button (⟲)** - Reload the preset list
4. **Import Button** - Load settings from a JSON file
5. **Export Button** - Save current settings to a JSON file

### What Gets Saved
The settings system captures all UI controls:

**Audio Controls:**
- Sensitivity
- Smoothing
- EQ settings (Bass, Mid, High)

**Visual Controls:**
- Grid visibility, size, opacity, and color
- Shadow transparency and color
- Shadow color linking

**Colors:**
- Background color
- Light colors (Bass, Mid, High frequency)
- Environment sphere color

**Environment:**
- Environment sphere size and visibility
- Debug mode state

### Usage

**Loading a Preset:**
1. Select a preset from the dropdown
2. Click "Load" to apply all settings

**Exporting Settings:**
1. Adjust all controls to your desired settings
2. Click "Export" to save as a JSON file
3. File will be downloaded with timestamp

**Importing Settings:**
1. Click "Import" to open file picker
2. Select a previously exported JSON settings file
3. Settings will be applied immediately

### File Format
Settings are saved as JSON files with this structure:
```json
{
  "sensitivity": 1.0,
  "smoothing": 0.8,
  "gridVisible": true,
  "backgroundColor": 1118481,
  "settingsVersion": "1.0",
  "exportDate": "2025-06-01T12:00:00.000Z"
}
```

### Settings Folder
Built-in presets are stored in the `settings/` folder:
- `default.json`
- `dark-mode.json` 
- `neon-vibes.json`
- `minimal.json`
- `high-contrast.json`

## Technical Details
- Settings are applied using the `applyUISettings()` method
- Current settings are captured with `getUISettings()`
- Built-in presets are loaded from `getBuiltInPresets()`
- Import/export uses standard JSON format
- All UI elements are updated when settings are applied
