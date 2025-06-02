# ARTEF4KT
*Ferrofluid Inspired Interactive Music Visualizer*

[![Built with Three.js](https://img.shields.io/badge/Built%20with-Three.js-000000?style=flat&logo=three.js)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-orange?style=flat)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow?style=flat&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A cutting-edge 3D music visualizer that simulates ferrofluid behavior, creating mesmerizing liquid metal effects that respond dynamically to audio input. Experience music like never before with organic deformations, floating particle systems, and intelligent camera movement.

![ARTEF4KT Demo](https://via.placeholder.com/800x400/000000/FFFFFF?text=ARTEF4KT+Ferrofluid+Visualizer)

## ✨ Features

### 🎵 **Audio-Reactive Visualization**
- **Real-time Audio Analysis**: Advanced FFT processing with frequency band separation (Bass: 20-250Hz, Mids: 250-4000Hz, Highs: 4000-20000Hz)
- **BPM Detection**: Intelligent beat detection and tempo analysis with visual BPM display
- **Dynamic Deformation**: Ferrofluid surface morphs organically based on music intensity
- **Frequency-Specific Effects**: Different frequency ranges trigger unique visual responses

### 🌊 **Ferrofluid Physics Simulation**
- **Organic Surface Deformation**: 3D sphere with 128x128 geometry detail for smooth liquid metal effects
- **Dynamic Blob Centers**: Audio-driven spike generation with varying thickness and intensity
- **Floating Particle System**: Up to 25 independent floating blobs with unique behaviors
- **Liquid Movement**: Flowing surface effects with realistic ferrofluid-inspired physics

### 🎨 **Visual Effects & Lighting**
- **PBR Materials**: Physically-based rendering with metallic, reflective ferrofluid appearance
- **Dynamic Lighting**: Three frequency-reactive colored lights (Bass/Red, Mid/Green, High/Blue)
- **Customizable Colors**: Full color control for grid, lights, environment, and background
- **Shadow Rendering**: Realistic shadow casting with transparency controls
- **Environment Sphere**: Customizable background environment with size and visibility controls

### 🎮 **Interactive Controls**
- **Mouse Camera Control**: 
  - Left-click + drag: Orbit camera around the scene
  - Right-click + drag: Pan camera view
  - Mouse wheel: Zoom in/out
  - Double-click: Reset camera to optimal position
- **Automatic Camera Movement**: Intelligent music-responsive camera positioning with manual override
- **Grid Visualization**: Customizable 3D grid with opacity, size, and color controls
- **Real-time Parameter Adjustment**: All visual parameters adjustable via elegant control panel

### 📊 **Advanced Audio Features**
- **Multi-format Support**: MP3, WAV, OGG, and other common audio formats
- **Frequency Analyzer**: Real-time frequency band visualization with horizontal and vertical displays
- **Track Information**: Display track name, BPM, time, and dominant frequency
- **Sensitivity Controls**: Adjustable audio sensitivity and smoothing parameters

### ⚙️ **Settings & Presets System**
- **Built-in Presets**: 5 professionally crafted presets (Default, Dark Mode, Neon Vibes, Minimal, High Contrast)
- **Dynamic Preset Discovery**: Automatically detects user-created custom presets
- **Import/Export**: Save and share custom configurations as JSON files
- **Persistent Settings**: Settings automatically preserved between sessions

### 🐛 **Debug & Development Features**
- **Advanced Debug Console**: Real-time performance monitoring with animated text decoding effects
- **Status Messages**: System status and audio information display
- **Performance Optimization**: Efficient rendering with frame-rate independent animations
- **Developer Tools**: Keyboard shortcuts (Ctrl+D: Toggle debug animation, Ctrl+R: Clear console)

## 🛠️ **Technologies Used**

### **Core Technologies**
- **[Three.js](https://threejs.org/)** - 3D graphics rendering and scene management
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** - Real-time audio analysis and processing
- **JavaScript ES6+** - Modern JavaScript with classes, modules, and async/await
- **HTML5 Canvas** - Hardware-accelerated WebGL rendering

### **3D Graphics & Rendering**
- **WebGL** - Low-level 3D graphics API for optimal performance
- **PBR Materials** - Physically-based rendering for realistic material appearance
- **Shadow Mapping** - Dynamic shadow rendering with transparency controls
- **Geometry Manipulation** - Real-time vertex deformation for organic effects

### **Audio Processing**
- **FFT Analysis** - Fast Fourier Transform for frequency domain analysis
- **AudioContext** - Low-latency audio processing pipeline
- **Beat Detection** - Peak analysis algorithms for BPM calculation
- **Frequency Filtering** - Band-pass filtering for precise frequency separation

### **User Interface**
- **CSS3** - Modern styling with backdrop-filter blur effects and transitions
- **CSS Grid & Flexbox** - Responsive layout system
- **Google Fonts** - JetBrains Mono for consistent typography
- **Custom Controls** - Styled range sliders, color pickers, and file inputs

### **Data Management**
- **JSON** - Settings serialization and preset management
- **Local Storage** - Persistent configuration storage
- **File API** - Audio file loading and settings import/export

## 🚀 **Getting Started**

### **Installation**
```bash
# Clone the repository
git clone https://github.com/yourusername/artef4kt.git

# Navigate to project directory
cd artef4kt

# Open in browser (no build process required)
# Simply open index.html in a modern web browser
```

### **Requirements**
- Modern web browser with WebGL support (Chrome 91+, Firefox 90+, Safari 14+, Edge 91+)
- JavaScript enabled
- Audio playback capabilities
- Minimum 2GB RAM recommended for optimal performance

### **Quick Start**
1. Open `index.html` in your web browser
2. Click the "File" button to load an audio file
3. Press "PLAY" to start the visualization
4. Hover over the right edge to access the control panel
5. Experiment with different settings and presets

## 🎛️ **Usage Guide**

### **Loading Audio**
- Click the "File" button in the control panel
- Select any audio file (MP3, WAV, OGG supported)
- Use the play/stop controls to manage playback

### **Camera Controls**
- **Orbit**: Left-click and drag to rotate around the ferrofluid
- **Pan**: Right-click and drag to move the view
- **Zoom**: Use mouse wheel to zoom in/out
- **Reset**: Double-click to return to optimal viewing position

### **Customization**
- **Sensitivity**: Adjust how responsive the visualization is to audio
- **Smoothing**: Control the smoothness of audio analysis
- **Colors**: Customize grid, lighting, and environment colors
- **Grid**: Toggle visibility and adjust size/opacity
- **Environment**: Control background sphere appearance

### **Presets**
- **Load**: Select a preset from the dropdown and click "Load"
- **Export**: Save current settings with "Export"
- **Import**: Load settings from a JSON file with "Import"
- **Refresh**: Update preset list to include new custom presets

## 📁 **Project Structure**

```
artef4kt/
├── index.html              # Main HTML file
├── script.js               # Core visualizer logic (~3500 lines)
├── style.css               # Styling and layout
├── update-settings-index.ps1 # Preset management script
├── images/                 # Logo and icon assets
│   ├── br.svg
│   └── pixel-crusher.svg
├── mp3/                    # Sample audio files
│   └── bogdan-rosu-yfflon.mp3
└── settings/               # Preset configurations
    ├── index.json          # Preset discovery index
    ├── default.json        # Default preset
    ├── dark-mode.json      # Dark theme preset
    ├── neon-vibes.json     # High energy preset
    ├── minimal.json        # Clean minimal preset
    ├── high-contrast.json  # Bold contrast preset
    └── README.md           # Settings system documentation
```

## 🎨 **Customization**

### **Creating Custom Presets**
1. Adjust all settings to your preference in the control panel
2. Click "Export" to save as a JSON file
3. Place the file in the `settings/` directory
4. Run `update-settings-index.ps1` to update the preset index
5. Click the refresh button (⟲) in the preset selector

### **Color Schemes**
The visualizer supports full color customization:
- **Grid Color**: Affects grid, UI accents, and track information
- **Bass Light**: Color for low-frequency reactive lighting
- **Mid Light**: Color for mid-frequency reactive lighting  
- **High Light**: Color for high-frequency reactive lighting
- **Background**: Scene background color
- **Environment**: Background sphere color and opacity

### **Advanced Settings**
- **Shadow Transparency**: Control shadow darkness (0-1)
- **Shadow Color**: Independent shadow coloring
- **Link Shadow Color**: Sync shadow color with grid color
- **Environment Size**: Background sphere scale
- **Debug Encoding**: Toggle animated debug console effects

## 🔧 **Technical Details**

### **Performance Optimization**
- Frame-rate independent animations using deltaTime
- Efficient vertex manipulation with typed arrays
- LOD system for floating blobs based on size
- Optimized shadow rendering with selective updates
- Memory management for floating particle lifecycle

### **Audio Processing Pipeline**
1. **Input**: Audio file loaded via HTML5 Audio API
2. **Analysis**: Real-time FFT analysis with 512 frequency bins
3. **Filtering**: Frequency bands separated for bass, mid, high
4. **Processing**: Beat detection and BPM calculation
5. **Output**: Visual parameter modulation based on audio features

### **3D Rendering Pipeline**
1. **Geometry**: High-detail sphere mesh (128x128 vertices)
2. **Deformation**: Vertex positions modified based on audio analysis
3. **Materials**: PBR shading with metallic ferrofluid appearance
4. **Lighting**: Dynamic colored lights responding to frequency bands
5. **Post-processing**: Shadow mapping and environment reflections

## 🤝 **Contributing**

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Setup**
- No build process required - pure vanilla JavaScript
- Use a local server for development to avoid CORS issues with audio files
- Test across multiple browsers for compatibility

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Three.js Community** - For the amazing 3D graphics library
- **Web Audio API** - For enabling real-time audio analysis
- **JetBrains** - For the excellent monospace font
- **Ferrofluid Physics** - Inspired by real ferrofluid behavior and properties

## 📞 **Support**

- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Submit a feature request issue
- 📖 **Documentation**: Check the `/settings/README.md` for settings system details
- 💬 **Questions**: Start a discussion on GitHub

---

**Experience the future of music visualization with ARTEF4KT** 🎵✨

*Created with passion for immersive audio-visual experiences*
