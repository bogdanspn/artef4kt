# ARTEF4KT
*Advanced Ferrofluid Interactive Music Visualizer*

[![Built with Three.js](https://img.shields.io/badge/Built%20with-Three.js-000000?style=flat&logo=three.js)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-orange?style=flat)]([#](https://developer.mozilla.org/en-US/docs/Web/JavaScript))

**Technical Architecture**

### **GPU Shader System Architecture**
- **Custom GLSL Shader Pipeline**: High-performance vertex and fragment shaders with audio-reactive capabilities
- **Audio Texture System**: Real-time audio data transmission to GPU via floating-point textures
- **Multi-Material Shader Support**: Unified shader system for ferrofluid blob, floating particles, and orbital elements
- **Performance Adaptive Rendering**: Dynamic shader quality adjustment based on system performance metrics
- **Fallback Material System**: Automatic fallback to standard Three.js materials for compatibility

### **Performance Optimization & Scalability**oper.mozilla.org/en-US/docs/Web/API/Web_Audio_API
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow?style=flat&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A state-of-the-art 3D music visualizer that simulates complex ferrofluid behavior with advanced particle systems, shockwave effects, and cinematic post-processing. Experience music through an immersive liquid metal environment that responds dynamically to every beat, frequency, and musical nuance.


## Core Features

### **Advanced Audio-Reactive Visualization**
- **Multi-Band Real-time Audio Analysis**: Sophisticated FFT processing with precise frequency separation (Bass: 20-250Hz, Mids: 250-4000Hz, Highs: 4000-20000Hz)
- **Intelligent BPM Detection**: Advanced beat detection algorithms with visual BPM display and tempo-based effects
- **Dynamic Ferrofluid Deformation**: Primary sphere morphs organically with varying spike intensity based on audio amplitude
- **Frequency-Specific Visual Responses**: Each frequency range triggers unique particle behaviors and lighting effects

### **Particle Systems & Effects**

#### **Shockwave System**
- **Audio-Triggered Shockwaves**: Dynamic shockwave generation based on beat detection and audio peaks
- **Configurable Parameters**: Adjustable shockwave count (1-10), speed, size, and opacity settings
- **Visual Impact**: Expanding ring effects that ripple through the 3D environment
- **Performance Optimized**: Efficient lifecycle management with automatic cleanup

#### **Orbital Blob System**
- **Floating Particle Network**: Up to 50 independent orbital blobs with unique trajectories
- **Audio-Responsive Behavior**: Blob size, movement speed, and opacity react to different frequency bands
- **Organic Movement Patterns**: Smooth orbital paths with varying speeds and distances
- **Dynamic Scaling**: Automatic blob count adjustment based on system performance

#### **Grid Cell Matrix**
- **3D Cellular Grid**: Dynamic grid system with customizable density and appearance
- **Interactive Cells**: Individual grid cells respond to audio with size and color variations
- **Configurable Layout**: Adjustable grid dimensions, spacing, and visual properties
- **Performance Adaptive**: Intelligent LOD system for optimal frame rates

### **Ferrofluid Physics Simulation**
- **High-Detail Geometry**: 3D sphere with 128x128 vertex resolution for ultra-smooth liquid metal effects
- **Multi-Layer Deformation**: Primary surface with secondary detail layers for complex organic shapes
- **Dynamic Blob Centers**: Audio-driven spike generation with varying thickness, height, and distribution
- **Realistic Surface Flow**: Liquid movement simulation with momentum and inertia effects

### **Advanced Visual Effects & Post-Processing**

#### **Custom GPU Shader System**
- **Hardware-Accelerated Rendering**: Custom GLSL shaders for optimal performance with direct GPU computation
- **Audio-Reactive Deformation**: Real-time vertex manipulation based on frequency analysis with multi-layer audio textures
- **Advanced Material System**: Custom PBR shader materials with metallic ferrofluid properties and subsurface scattering
- **Performance Adaptive Shaders**: Dynamic quality adjustment and shader optimization based on system capabilities
- **Multi-Object Shader Support**: Unified shader system for main ferrofluid, floating blobs, and orbital particles

#### **Filmic Noise Overlay**
- **Cinematic Film Grain**: Dynamic TV-like noise pattern with SVG-based texture generation
- **Animated Grain Movement**: Multiple moving layers for realistic film aesthetic
- **Configurable Intensity**: Adjustable opacity and blend modes for subtle or dramatic effects
- **Performance Optimized**: GPU-accelerated CSS filters with minimal performance impact

#### **Lighting & Materials**
- **PBR Material System**: Physically-based rendering with metallic ferrofluid appearance and environment reflections
- **Multi-Source Dynamic Lighting**: Three frequency-reactive colored lights with customizable intensities
- **Advanced Shadow System**: Real-time shadow mapping with transparency controls and color customization
- **Environment Mapping**: Spherical environment with size, opacity, and color controls

### **Color Harmonization System**
- **Intelligent Color Palette Generation**: Advanced color theory algorithms for harmonious palettes
- **Automatic Color Relationships**: Complementary, analogous, and triadic color scheme generation
- **Real-time Color Adaptation**: Dynamic color adjustments based on audio characteristics
- **User Color Randomization**: One-click randomization with harmonized color relationships

### **Enhanced Interactive Controls**
- **Advanced Mouse Camera Control**: 
  - Left-click + drag: Smooth orbital camera movement around the scene
  - Right-click + drag: Precise camera panning with momentum
  - Mouse wheel: Smooth zoom with configurable sensitivity
  - Double-click: Intelligent camera reset to optimal viewing position
- **Adaptive Camera Intelligence**: 
  - Grid-size responsive camera positioning that automatically adjusts distance based on scene scale
  - Smart scaling prevents camera from getting too close at small grid sizes (10-15) and too far at large grid sizes (30-40)
  - Music-responsive camera positioning with manual override capabilities and contextual movement patterns
  - Intelligent distance calculation with non-linear scaling for optimal viewing at all grid configurations
- **Touch-Optimized Mobile Controls**: Full touch support for tablets and mobile devices
- **Keyboard Shortcuts**: Debug toggle (Ctrl+D), console clear (Ctrl+R), UI panel toggle (Tab/Escape)

### **Professional User Interface**
- **Sliding Control Panel**: Elegant right-side panel with smooth animations and backdrop blur effects
- **Responsive Design**: Fully responsive layout optimized for desktop, tablet, and mobile devices
- **Hover-Triggered Access**: Intuitive hover area for panel access with visual feedback
- **Touch-Friendly Controls**: Mobile-optimized buttons and touch targets for all devices
- **Real-time Parameter Feedback**: Live value updates and visual feedback for all controls

### **Comprehensive Performance Monitoring**
- **Real-time Performance Metrics**: Live FPS monitoring, frame time analysis, and performance quality indicators
- **System Resource Tracking**: Memory usage, GPU utilization, and render call optimization
- **Advanced Collision Detection**: Spatial partitioning grid system with intelligent collision optimization
- **Performance Adaptive Features**: Automatic quality adjustment based on system capabilities with multi-tier LOD systems
- **Debug Console System**: Advanced debug information with animated text decoding effects
- **Optimization Indicators**: Visual indicators for performance bottlenecks and optimization suggestions

### **Advanced Audio Features**
- **Multi-format Audio Support**: MP3, WAV, OGG, AAC, and other common audio formats with fallback support
- **Multi-Channel Frequency Analysis**: Real-time frequency spectrum analysis with both horizontal and vertical visualizers
- **Advanced Beat Detection**: Peak analysis algorithms with threshold adaptation and tempo tracking
- **Comprehensive Track Information**: Real-time display of track name, BPM, elapsed time, remaining time, and dominant frequency analysis
- **Audio Sensitivity Controls**: Fine-tuned sensitivity and smoothing parameters with real-time adjustment
- **Audio Visualization Components**: Dedicated frequency analyzer displays with customizable appearance

### **Comprehensive Settings & Preset System**
- **Extensive Preset Library**: 23+ professionally crafted presets including Default, Dark Mode, Neon Vibes, Minimal, High Contrast, Deep Space, Soviet Red, Purple Haze, Baby Barf, and more
- **Dynamic Preset Discovery**: Automatic detection and loading of user-created custom presets
- **Advanced Import/Export**: Complete settings serialization with JSON format support
- **Preset Management Tools**: Refresh functionality, preset validation, and error handling
- **Persistent Configuration**: Automatic settings preservation across browser sessions with localStorage integration

### **Developer & Debug Features**
- **Comprehensive Debug Console**: Multi-layered debug information with animated text effects and real-time system monitoring
- **Performance Profiling**: Detailed frame timing, render statistics, and bottleneck identification
- **Status Message System**: Real-time system status, audio information, and error reporting
- **Development Tools**: Keyboard shortcuts, console management, and debugging aids
- **Error Handling**: Robust error management with graceful degradation and user feedback

## **Technologies Used**

### **Core Technologies**
- **[Three.js](https://threejs.org/)** - Advanced 3D graphics rendering, scene management, and particle systems
- **[Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)** - Real-time audio analysis, processing, and frequency domain manipulation
- **JavaScript ES6+** - Modern JavaScript with classes, modules, async/await, and advanced language features
- **HTML5 Canvas & WebGL** - Hardware-accelerated 3D rendering with GPU optimization

### **3D Graphics & Rendering**
- **WebGL 2.0** - Low-level graphics API for maximum performance and visual fidelity
- **Custom GPU Shader Pipeline** - High-performance GLSL shaders with audio-reactive vertex manipulation
- **Advanced PBR Materials** - Physically-based rendering with metallic workflows and environment mapping
- **Multi-Layer Shadow Systems** - Dynamic shadow mapping with transparency, color controls, and optimization
- **Real-time Geometry Manipulation** - Vertex-level deformation for organic liquid effects with GPU acceleration
- **Particle System Architecture** - Efficient particle lifecycle management with LOD optimization and spatial partitioning

### **Audio Processing & Analysis**
- **FFT Analysis Engine** - Fast Fourier Transform processing with 512-2048 frequency bins
- **Multi-threaded AudioContext** - Low-latency audio processing pipeline with Web Workers support
- **Advanced Beat Detection** - Peak analysis algorithms with adaptive threshold and tempo tracking
- **Multi-band Frequency Filtering** - Precise frequency separation with customizable band ranges
- **Real-time Spectrum Analysis** - Continuous frequency domain analysis with smoothing algorithms

### **User Interface & Experience**
- **Modern CSS3** - Advanced styling with backdrop-filter blur, CSS Grid, Flexbox, and custom properties
- **Responsive Design System** - Mobile-first approach with touch optimization and adaptive layouts
- **Custom Control Components** - Styled range sliders, color pickers, file inputs, and interactive elements
- **Animation Framework** - Smooth transitions and micro-interactions with hardware acceleration
- **Touch & Gesture Support** - Full mobile compatibility with touch events and gesture recognition

### **Performance & Optimization**
- **Frame-rate Independent Animation** - Delta-time based animations for consistent performance across devices
- **Advanced Collision Detection** - Spatial partitioning grid system with intelligent collision optimization and caching
- **LOD (Level of Detail) Systems** - Automatic quality adjustment based on system capabilities
- **Memory Management** - Efficient object pooling, garbage collection optimization, and resource cleanup
- **GPU Acceleration** - Hardware-accelerated computations and custom shader rendering pipeline optimization
- **Adaptive Quality Control** - Dynamic performance monitoring with automatic quality adjustment and multi-tier optimization

### **Data Management & Storage**
- **JSON Configuration System** - Comprehensive settings serialization with validation and error handling
- **LocalStorage Integration** - Persistent user preferences and session data management
- **File API Implementation** - Audio file loading, settings import/export, and drag-drop support
- **Dynamic Module Loading** - Efficient code splitting and lazy loading for optimal performance

##  **Getting Started**

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
- Modern web browser with WebGL 2.0 support (Chrome 91+, Firefox 90+, Safari 14+, Edge 91+)
- JavaScript enabled with modern ES6+ support
- Audio playback capabilities with Web Audio API support
- Minimum 4GB RAM recommended for optimal performance with all effects enabled
- Dedicated graphics card recommended for maximum visual quality

### **Quick Start**
1. Open `index.html` in your web browser
2. Click the "File" button to load an audio file or use the included sample tracks
3. Press "PLAY" to start the visualization
4. Hover over the right edge of the screen to access the comprehensive control panel
5. Experiment with different settings, presets, and effects
6. Use mouse controls to navigate the 3D environment
7. Try different preset configurations for varied visual experiences

## **Usage Guide**

### **Loading Audio**
- Click the "File" button in the control panel
- Select any supported audio file (MP3, WAV, OGG, AAC)
- Alternatively, drag and drop audio files directly onto the visualizer
- Use the included sample tracks in the `mp3/` directory for immediate testing

### **Camera Controls**
- **Orbit**: Left-click and drag to rotate around the ferrofluid with smooth momentum
- **Pan**: Right-click and drag to move the camera view with precision control
- **Zoom**: Use mouse wheel to zoom in/out with configurable sensitivity
- **Reset**: Double-click anywhere to return to the optimal viewing position
- **Adaptive Distance**: Camera automatically adjusts optimal viewing distance based on grid size settings
  - Small grids (10-15): Camera maintains closer proximity to prevent over-zooming
  - Large grids (30-40): Camera scales distance appropriately while preventing excessive retreat
  - Non-linear scaling ensures consistent visual experience across all grid configurations
- **Touch Controls**: Full touch support for mobile devices with gesture recognition

### **Advanced Customization**
- **Audio Sensitivity**: Fine-tune how responsive the visualization is to different audio characteristics
- **Smoothing Controls**: Adjust the smoothness and responsiveness of audio analysis
- **Color Harmonization**: Use the color harmonizer for automatically balanced color schemes
- **Particle Systems**: Configure shockwave count, orbital blob density, and grid cell parameters
- **Grid Size Optimization**: Adjust grid density (10-40) with automatic camera scaling for optimal viewing
  - Small grids (10-15): Enhanced close-up viewing with camera positioned for detail observation
  - Large grids (30-40): Scaled camera distance maintains scene proportion and prevents visual dead space
  - Real-time camera parameter adjustment when changing grid size settings
- **Visual Effects**: Control filmic noise intensity, shadow properties, and lighting characteristics
- **Performance Tuning**: Adjust quality settings based on your system capabilities

### **Preset Management**
- **Load Presets**: Select from 23+ built-in presets or custom user presets
- **Create Custom Presets**: Adjust settings to preference and export as JSON files
- **Import Settings**: Load settings from JSON files shared by other users
- **Refresh Presets**: Update the preset list to include newly added custom presets
- **Preset Categories**: Choose from cinematic, minimal, high-energy, or artistic preset categories

### **GPU Shader System Controls**
- **Shader System Toggle**: Enable/disable custom GPU shader pipeline for optimal performance or compatibility
- **Audio Responsiveness**: Control how intensely shaders react to audio frequency data
- **Deformation Strength**: Adjust the intensity of audio-driven vertex manipulation
- **Material Properties**: Configure metalness, roughness, and subsurface scattering effects
- **Performance Monitoring**: Real-time shader performance metrics with automatic optimization
- **Fallback System**: Automatic detection and fallback to standard materials when needed

## **Project Structure**

```
artef4kt/
├── index.html                      # Main HTML file with optimized structure
├── script.js                       # Core visualizer logic (6700+ lines)
├── style.css                       # Advanced styling and responsive design
├── three.min.js                    # Three.js library
├── color-harmonizer.js             # Color theory and palette generation
├── orbital-blobs.js                # Floating particle system management
├── shockwave-system.js             # Dynamic shockwave effects
├── grid-cells.js                   # 3D grid cell matrix system
├── performance-monitor.js          # Real-time performance tracking
├── gpu-particle-shaders.js         # Custom GPU shader system for enhanced performance
├── README.md                       # Comprehensive project documentation
├── update-mp3-index.ps1            # Audio file index generator
├── update-settings-index.ps1       # Preset management script
├── images/                         # Logo, icon, and graphic assets
│   ├── artefakt-logo.svg           # Main project logo
│   ├── br.svg                      # Artist logo (clickable)
│   ├── pixel-crusher.svg           # Label logo (clickable)
│   ├── favicon.svg                 # Browser favicon
│   ├── shareimage.png              # Social media preview image
│   ├── shareimage.svg              # Vector social media image
│   └── shareimager-color.ai        # Adobe Illustrator source file
├── mp3/                            # Sample audio tracks
│   ├── index.json                  # Audio track metadata
│   ├── bogdan-rosu-yfflon.mp3      # Featured electronic track
│   ├── bogdan-rosu-eargasm.mp3     # High-energy electronic
│   ├── chantal-lemon.mp3           # Ambient electronic
│   ├── dominique-pimp2k.mp3        # Sample electronic track
│   ├── dust-underslide.mp3         # Ambient atmospheric track
│   └── px-play-mobile-theme-br-edit.mp3  # Mobile theme track
└── settings/                       # Comprehensive preset library
    ├── index.json                  # Preset discovery index
    ├── default.json                # Default configuration
    ├── dark-mode.json              # Dark theme preset
    ├── neon-vibes.json             # High-energy neon preset
    ├── minimal.json                # Clean minimal preset
    ├── high-contrast.json          # Bold contrast preset
    ├── deep-space-shockwaves.json  # Cinematic space theme
    ├── purple-shockwaves.json      # Purple theme with shockwaves
    ├── soviet-red.json             # Retro communist aesthetic
    ├── purple-haze.json            # Psychedelic purple theme
    ├── blue-saphir.json            # Elegant blue theme
    ├── blue-balast.json            # Blue ballast theme
    ├── wasp.json                   # High-energy yellow theme
    ├── baby-barf.json              # Unique artistic color palette
    ├── arangiatta-lilla.json       # Orange-purple theme
    ├── bricks.json                 # Brick-inspired theme
    ├── green-tinge.json            # Green-tinted theme
    ├── lime-haze.json              # Lime green theme
    ├── old-and-retro-green.json    # Vintage green theme
    ├── red-tinge.json              # Red-tinted theme
    ├── sketchy.json                # Artistic sketchy theme
    ├── teals.json                  # Teal color theme
    ├── yellow-red.json             # Yellow-red gradient theme
    └── [additional custom presets]
```

## **Advanced Customization**

### **Creating Custom Presets**
1. Adjust all visual and audio parameters to your desired configuration
2. Fine-tune particle systems, colors, and effects to your preference
3. Click "Export" to save your configuration as a JSON file
4. Place the exported file in the `settings/` directory
5. Run `update-settings-index.ps1` to regenerate the preset index
6. Click the refresh button (⟲) in the preset selector to load your new preset

### **Color Scheme Development**
The visualizer supports comprehensive color customization with intelligent harmonization:
- **Grid Color**: Affects grid appearance, UI accents, track information, and visual consistency
- **Bass Light**: Color for low-frequency reactive lighting (20-250Hz response)
- **Mid Light**: Color for mid-frequency reactive lighting (250-4000Hz response)  
- **High Light**: Color for high-frequency reactive lighting (4000-20000Hz response)
- **Background Color**: Primary scene background with gradient support
- **Environment Sphere**: Background sphere color, opacity, and size controls
- **Color Harmonizer**: Automatic generation of complementary, analogous, and triadic color relationships

### **Particle System Configuration**
- **Shockwave System**: Configure count (1-10), expansion speed, size scaling, and visual opacity
- **Orbital Blobs**: Adjust maximum count (10-50), size range, orbital speed, and audio responsiveness
- **Grid Cells**: Customize grid density, cell size, spacing, and color responsiveness
- **Ferrofluid Surface**: Control deformation intensity, spike count, and organic movement characteristics

### **Performance Optimization Settings**
- **Quality Presets**: Choose from Ultra, High, Medium, Low, or Custom quality configurations
- **GPU Shader Controls**: Enable/disable custom shader system for maximum performance or compatibility
- **Collision Detection Optimization**: Spatial partitioning grid with configurable quality levels and frame skipping
- **Particle Limits**: Set maximum particle counts based on system capabilities
- **Shadow Quality**: Adjust shadow resolution and transparency for performance balance
- **LOD System**: Configure distance-based level of detail for complex particle systems
- **Frame Rate Targets**: Set target FPS with automatic quality adjustment

## **Technical Architecture**

### **Performance Optimization & Scalability**
- **Frame-rate Independent Animation System**: Delta-time based animations ensuring consistent visual behavior across all device capabilities
- **Advanced Collision Detection**: Spatial partitioning grid system with intelligent broad-phase culling and temporal coherence optimization
- **Efficient Vertex Manipulation**: Optimized typed array operations for real-time geometry deformation with GPU acceleration
- **Multi-tier LOD System**: Automatic level-of-detail adjustment for particles, shadows, and effects based on performance metrics
- **Adaptive Camera System**: Intelligent camera scaling with grid-size responsive distance calculations
  - Performance-optimized distance computation with non-linear scaling algorithms
  - Automatic camera parameter updates with minimal computational overhead
  - Scene-aware positioning that maintains optimal viewing ratios across all grid configurations
- **GPU-Accelerated Rendering**: WebGL optimization with efficient shader compilation, uniform management, and custom rendering pipeline
- **Memory Management**: Comprehensive object pooling, garbage collection optimization, and resource lifecycle management
- **Adaptive Quality Control**: Real-time performance monitoring with automatic quality adjustment and user feedback

### **Audio Processing Architecture**
1. **Audio Input Layer**: Multi-format audio file support with HTML5 Audio API and MediaElement integration
2. **Analysis Pipeline**: Real-time FFT analysis with configurable frequency bins (512-2048) and window functions
3. **Frequency Domain Processing**: Advanced frequency band separation with customizable crossover points and slopes
4. **Beat Detection Engine**: Multi-algorithm peak detection with adaptive threshold and tempo tracking capabilities
5. **Data Smoothing**: Configurable smoothing algorithms to reduce audio noise and enhance visual stability
6. **Visual Parameter Mapping**: Sophisticated mapping from audio features to visual parameters with customizable response curves

### **3D Rendering Pipeline**
1. **Scene Graph Management**: Hierarchical scene organization with efficient culling and LOD management
2. **Geometry Processing**: High-detail mesh generation (128x128 vertices) with real-time vertex deformation
3. **Adaptive Camera System**: Intelligent camera positioning with grid-size responsive scaling algorithms
   - Dynamic distance calculation based on scene scale (grid size 10-40)
   - Non-linear scaling prevents visual dead space at large grid sizes
   - Optimized viewing ranges: close proximity for small grids, scaled distance for large grids
   - Automatic camera parameter adjustment with smooth transitions
4. **Material System**: Advanced PBR shading with metallic workflows, roughness mapping, and environment reflections
5. **Lighting Architecture**: Multi-source dynamic lighting with frequency-reactive color and intensity modulation
6. **Shadow Mapping**: Real-time shadow generation with customizable quality, transparency, and color controls
7. **Post-Processing Effects**: Filmic noise overlay, color grading, and visual enhancement filters

### **Modular System Architecture**
- **Core Visualizer Engine**: Main application logic with scene management and audio integration
- **GPU Shader System**: Custom GLSL shader pipeline with audio-reactive vertex manipulation and performance optimization
- **Particle System Modules**: Independent systems for shockwaves, orbital blobs, and grid cells with spatial optimization
- **Color Management**: Dedicated color harmonization and palette generation system
- **Performance Monitor**: Real-time system monitoring with optimization recommendations and collision detection analytics
- **Settings Management**: Comprehensive configuration system with validation and error handling
- **UI Controller**: Responsive interface management with touch optimization and accessibility features

##  **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  **Acknowledgments**

- **Three.js Community** - For the amazing 3D graphics library
- **Web Audio API** - For enabling real-time audio analysis
- **JetBrains** - For the excellent monospace font
- **Ferrofluid Physics** - Inspired by real ferrofluid behavior and properties

## **Support**

-  **Bug Reports**: Open an issue on GitHub
-  **Feature Requests**: Submit a feature request issue
-  **Documentation**: Check the `/settings/README.md` for settings system details
-  **Questions**: Start a discussion on GitHub

---

**Experience the future of music visualization with ARTEF4KT** 

*Created with passion for immersive audio-visual experiences*
