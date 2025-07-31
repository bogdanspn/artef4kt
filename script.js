// Loading Screen Management
class LoadingManager {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingText = document.getElementById('loading-text');
        this.loadingPercentage = document.getElementById('loading-percentage');
        this.loadingProgressBar = document.getElementById('loading-progress-bar');
        
        this.progress = 5; // Start at 5% instead of 0%
        this.targetProgress = 5; // Start at 5% instead of 0%
        this.loadingSteps = [
            { progress: 10, text: 'LOADING ARTEF4KT CORE...' },
            { progress: 25, text: 'INITIALIZING THREE.JS...' },
            { progress: 40, text: 'SETTING UP AUDIO CONTEXT...' },
            { progress: 55, text: 'CREATING FERROFLUID SYSTEM...' },
            { progress: 70, text: 'LOADING SHADERS...' },
            { progress: 85, text: 'INITIALIZING PARTICLE SYSTEMS...' },
            { progress: 95, text: 'FINALIZING SETUP...' },
            { progress: 100, text: 'ARTEF4KT READY' }
        ];
        this.currentStepIndex = 0;
        
        // Set initial display values
        this.loadingText.textContent = 'INITIALIZING ARTEF4KT...';
        this.loadingPercentage.textContent = '5%';
        if (this.loadingProgressBar) {
            this.loadingProgressBar.style.width = '5%';
        }
        
        this.animateProgress();
    }
    
    updateProgress(targetProgress, customText = null) {
        this.targetProgress = Math.min(100, Math.max(0, targetProgress));
        
        // Update text based on progress steps
        if (!customText) {
            for (let i = this.currentStepIndex; i < this.loadingSteps.length; i++) {
                if (this.targetProgress >= this.loadingSteps[i].progress) {
                    this.loadingText.textContent = this.loadingSteps[i].text;
                    this.currentStepIndex = i;
                }
            }
        } else {
            this.loadingText.textContent = customText;
        }
    }
    
    animateProgress() {
        // Smooth progress animation
        const progressDiff = this.targetProgress - this.progress;
        if (Math.abs(progressDiff) > 0.1) {
            this.progress += progressDiff * 0.1;
        } else {
            this.progress = this.targetProgress;
        }
        
        // Update percentage display
        this.loadingPercentage.textContent = Math.round(this.progress) + '%';
        
        // Update horizontal progress bar
        if (this.loadingProgressBar) {
            this.loadingProgressBar.style.width = this.progress + '%';
        }
        
        requestAnimationFrame(() => this.animateProgress());
    }
    
    hide() {
        this.updateProgress(100);
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, 500);
        }, 1000); // Show 100% for a moment
    }
}

// Initialize loading manager
window.loadingManager = new LoadingManager();

class FerrofluidVisualizer {
    constructor() {
        // Update loading progress
        window.loadingManager.updateProgress(10);
        
        this.canvas = document.getElementById('visualizer');
        
        if (!this.canvas) {
            console.error('❌ Canvas not found! Check id="visualizer"');
            return;
        }
        
        console.log('✅ Canvas found:', this.canvas);
        
        // Electron environment detection and setup
        this.isElectron = typeof require !== 'undefined';
        this.electronPath = null;
        this.electronApp = null;
        
        if (this.isElectron) {
            try {
                this.electronPath = require('path');
                // Try to get the app instance (different ways depending on Electron version)
                try {
                    this.electronApp = require('electron').remote?.app || require('@electron/remote')?.app;
                } catch (e) {
                    console.log('Remote module not available, using process path');
                }
                console.log('✅ Electron environment detected');
            } catch (e) {
                console.log('Electron modules not available, fallback to web mode');
                this.isElectron = false;
            }
        }
        
        this.audioContext = null;
        this.audioSource = null;
        this.analyser = null;        
        this.audioElement = null;
        this.isPlaying = false;
        this.isLooping = false;
        this.animationId = null;
        
        // Audio input source management
        this.audioInputSource = 'file'; // 'file', 'input'
        this.microphoneStream = null;
        this.lineStream = null;
        this.currentInputSource = null;
        
        // Audio source state tracking
        this.activeAudioSource = null; // 'file', 'input', or null
        this.fileAudioActive = false;
        this.inputAudioActive = false;
        
        // Audio monitoring for input devices
        this.audioMonitoringEnabled = false;
        this.monitorVolume = 0.6;
        this.monitorGainNode = null;
        
        // Ultra-fast audio polling flag
        this.ultraFastValuesActive = false;
        
        // Collision detection optimization system
        this.collisionOptimization = {
            // Spatial partitioning grid for efficient collision detection
            spatialGrid: new Map(),
            gridSize: 4.0, // Size of each grid cell
            lastGridUpdate: 0,
            gridUpdateInterval: 100, // Update grid every 100ms
            
            // Performance-based collision throttling
            collisionFrameSkip: 0,
            maxCollisionFrameSkip: 3, // Skip collision detection for up to 3 frames
            currentSkipCount: 0,
            
            // Collision quality levels based on performance
            qualityLevels: {
                high: {
                    blobToBlob: true,
                    blobToFerrofluid: true,
                    frameSkip: 0,
                    maxDistance: Infinity,
                    updateFrequency: 1.0
                },
                medium: {
                    blobToBlob: true,
                    blobToFerrofluid: true,
                    frameSkip: 1,
                    maxDistance: 15.0,
                    updateFrequency: 0.7
                },
                low: {
                    blobToBlob: true, 
                    blobToFerrofluid: true,
                    frameSkip: 2,
                    maxDistance: 10.0,
                    updateFrequency: 0.5
                }
            },
            
            // Current settings
            currentQuality: 'high',
            lastPerformanceCheck: 0,
            performanceCheckInterval: 1000, // Check every second
            
            // Collision caching
            collisionCache: new Map(),
            cacheTimeout: 200, // Cache results for 200ms
              // Statistics
            stats: {
                totalChecks: 0,
                spatialOptimizations: 0,
                cacheHits: 0,
                frameSkips: 0,
                broadPhaseCulled: 0,
                temporalCoherenceSkips: 0,
                cacheCleanups: 0
            },
            
            // Cache management
            lastCacheCleanup: 0
        };

          // ASCII emoji collection for spawning logs
        this.spawnEmojis = [
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '///////////////////¯\\_(ツ)_/¯////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////',
            '//////////////////////////////////////////////////////'
        ];
        
        // Audio analysis
        this.bufferLength = 512;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.frequencyData = new Float32Array(this.bufferLength);
          // Visualization parameters
        this.sensitivity = 1.0;
        this.smoothing = 0.8;
        this.bassIntensity = 0;
        this.midIntensity = 0;
        this.highIntensity = 0;        // Grid parameters
        this.gridVisible = true;
        this.gridSize = 15;
        this.gridOpacity = 0.3;        
        this.gridColor = 0xbbbbbb;
        this.shadowTransparency = 0.4; // 0 = fully transparent, 1 = fully opaque (no transparency)
        this.shadowColor = 0x333333; // Default shadow color set to a dark grey
        this.linkShadowColor = false; // Whether shadow color should sync with grid color

        // Background color
        this.backgroundColor = 0x888888;        // Environment sphere color
        this.envSphereColor = 0x999999;
        this.envSphereSize = 115;        
        this.envVisibility = 1.0;
          // Onscreen info opacity control for all UI elements
        this.uiOpacity = 1.0; // Default to full opacity
        
        // Settings loading flag to prevent initializeUIValues from overwriting loaded settings
        this.settingsLoaded = false;
        
        // Light colors for music reactivity
        this.lightBassColor = 0xff3366;  // Red
        this.lightMidColor = 0x33ff66;   // Green
        this.lightHighColor = 0x3366ff;  // Blue
          // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.ferrofluid = null;
        
        // Grid cell animation for music reactivity
        this.gridCellAnimator = null;
        this.lightGroup = null;        // Floating blob system
        this.floatingBlobs = [];
        this.maxFloatingBlobs = 12;
        this.blobSpawnThreshold = 0.5; // Much higher threshold - only spawn during intense music activity
        this.lastSpawnTime = 0;
        this.spawnCooldown = 400; // Longer cooldown to prevent over-spawning at music start         
        //  BPM Detection - Enhanced system
        this.bpmDetector = {
            peaks: [],
            bpm: 0,
            lastBeatTime: 0,
            beatThreshold: 0.2,
            minBpm: 60,
            maxBpm: 200,
            analysisWindow: 15000, // 15 seconds for better accuracy
            // Enhanced detection parameters
            energyHistory: [],
            energyHistorySize: 43, // ~1 second at 60fps for energy smoothing
            spectralFluxHistory: [],
            adaptiveThreshold: 0.2,
            thresholdMultiplier: 1.5,
            minimumBeatInterval: 250, // Minimum 250ms between beats (240 BPM max)
            confidenceWindow: [],
            confidenceWindowSize: 8, // Track confidence over last 8 beats
            minConfidence: 0.6
        };

        // Idle Anomaly System
        this.anomalySystem = {
            isActive: false, // Start active to ensure initial ripples
            lastTriggerTime: 0,
            nextTriggerTime: 0,
            duration: 0,
            intensity: 0.3, // Start with some initial intensity
            windingDown: false, // New state for gradual wind-down
            windDownStartTime: 0,
            windDownDuration: 3000, // 3 seconds for gentle wind-down
            peakIntensity: 0, // Store peak intensity for wind-down calculation
            minInterval: 8000,  // Minimum 8 seconds between anomalies
            maxInterval: 25000, // Maximum 25 seconds between anomalies
            minDuration: 2000,  // Minimum 2 seconds anomaly duration
            maxDuration: 6000,  // Maximum 6 seconds anomaly duration
            messages: [
                "ARTEFACT ANOMALY DETECTED",
                "ARTEFACT FLUX DETECTED",
                "ARTEFACT FERROFLUID INSTABILITY",
                "UNKNOWN SIGNAL DETECTED", 
                "ARTEFACT MAGNETIC FIELD DISTURBANCE",
                "QUANTUM INTERFERENCE",
                "ARTEFACT TEMPORAL DISPLACEMENT",
                "ARTEFACT ENERGY SURGE DETECTED"
            ],
            spawnBlobCount: 0,
            maxSpawnBlobs: 12
        };        // Schedule the first anomaly
        this.scheduleNextAnomaly();        // Initialize mouse interaction object (needed for UI initialization)
        this.mouseInteraction = {
            enabled: true,
            forceStrength: 0.5,
            forceRadius: 0.2,
            pushForce: 2.0,
            intersectedBlob: null,
            mainBlobIntersection: null,
            mouseWorldPosition: new THREE.Vector3(),
            lastMouseUpdate: 0,            // Ripple wave system - enhanced for more forceful, slower liquid-like behavior
            waves: [],
            maxWaves: 3,
            waveAmplitude: 0.4,      // Increased from 0.8 - more forceful ripples
            waveFrequency: 2.0,      // Further decreased from 2.5 - even wider wave crests for slower liquid motion
            waveDecay: 0.8,          // Further decreased from 1.2 - much slower fade for persistent liquid waves
            waveSpeed: 2.5           // Further decreased from 4.0 - much slower propagation like thick honey
        };
        
        // Initialize skip flag for performance optimization
        this.skipFloatingBlobUpdate = false;
        this.loadDefaultAudio(); // Automatically load the default audio file
        this.updateStatusMessage(); // Initialize status message
        this.setupEventListeners(); // This calls initMouseControls() which sets up this.mouseInteraction
        this.initializeUIValues(); // Initialize UI values after mouse controls are set up

        // Initialize track progress bar
        this.initializeTrackProgressBar();
        
        // Initialize settings dropdown with built-in presets
        this.refreshSettingsDropdown();
        
        // Initialize Three.js and scene
        this.init();
        
        this.animate();
    }

    // Electron-aware file path resolution
    resolveFilePath(relativePath) {
        if (this.isElectron && this.electronPath) {
            // In Electron, resolve paths relative to the app directory
            const appPath = this.electronApp ? this.electronApp.getAppPath() : process.cwd();
            return this.electronPath.join(appPath, relativePath);
        } else {
            // In browser, use relative paths as-is
            return relativePath;
        }
    }

    // Check if file exists (only works in Electron)
    checkFileExists(filePath) {
        if (this.isElectron) {
            try {
                const fs = require('fs');
                return fs.existsSync(filePath);
            } catch (e) {
                console.warn('Could not check file existence:', e);
                return true; // Assume file exists if we can't check
            }
        } else {
            // In browser, we can't check file existence beforehand
            // Just return true and let the fetch request handle errors
            return true;
        }
    }

    // Helper method to get random spawn emoji
    getRandomSpawnEmoji() {
        return this.spawnEmojis[Math.floor(Math.random() * this.spawnEmojis.length)];
    }    init() {
        // Update loading progress
        window.loadingManager.updateProgress(25);
        
        this.setupThreeJS();
        
        // Update loading progress
        window.loadingManager.updateProgress(40);
        
        this.createFerrofluid();
        this.createLighting();
        this.updateShadowColors(); // Initialize shadow colors after lighting is created
        this.createEnvironment();
        this.updateLightingFromBackground(); // Apply initial background color influence        
        
        // Update loading progress
        window.loadingManager.updateProgress(55);
        
        // Initialize orbital blob system
        this.orbitalBlobSystem = new OrbitalBlobSystem(this);        

        // Initialize shockwave system
        this.shockwaveSystem = new ShockwaveSystem(this);

        // Update loading progress
        window.loadingManager.updateProgress(70);

        // Initialize blob shader system for enhanced performance (temporarily disabled for debugging)
        try {
            // this.gpuParticleSystem = new BlobShaderSystem(this);
            console.log('Artefact Shader System disabled - using standard materials');
            this.gpuParticleSystem = null;
        } catch (error) {
            console.error('Failed to init Artefact Shader System:', error);
            this.gpuParticleSystem = null;
        }

        // Update loading progress
        window.loadingManager.updateProgress(85);

        // Initialize Filmic Tone System
        try {
            this.filmicToneSystem = new FilmicToneSystem(this.renderer, this.scene, this.camera);
            console.log('Filmic Tone System initialized successfully');
            console.log('Filmic composer available:', this.filmicToneSystem.composerAvailable);
            console.log('Filmic pass created:', !!this.filmicToneSystem.filmicPass);
            
            // Sync UI controls with default settings
            this.filmicToneSystem.syncUIControls();
            
            // Set up filmic controls event listeners now that the system is initialized
            this.setupFilmicControls();
        } catch (error) {
            console.error('Failed to initialize Filmic Tone System:', error);
            this.filmicToneSystem = null;
        }

        // Initialize performance monitor
        this.performanceMonitor = new PerformanceMonitor(this);
        console.log('PerfMonitor init OK');

        // Performance monitoring
        this.performanceStats = {
            frameCount: 0,
            lastTime: performance.now(),
            lastLogTime: performance.now(),
            fps: 0,
            gpuParticleCount: 0
        };
        
        // Clean up any existing duplicate performance indicators
        const existingPerfIndicator = document.getElementById('performance-indicator');
        if (existingPerfIndicator) {
            existingPerfIndicator.remove();
        }
        console.log('Object arrays:', {
            floatingBlobs: !!this.floatingBlobs,
            orbitalBlobSystem: !!this.orbitalBlobSystem,
            shockwaveSystem: !!this.shockwaveSystem,
            gridCellAnimator: !!this.gridCellAnimator
        });
        
        // Initialize frequency analyzer clone colors to match default grid color
        this.updateFrequencyAnalyzerCloneColors('#bbbbbb');        // Ensure SVG colors are set after images load with proper image loading detection
        this.initializeSvgColors();
        
        this.resize();
        
        // Update loading progress - almost complete
        window.loadingManager.updateProgress(95);
    }
    
    initializeSvgColors() {
        // Initialize inline SVG logo colors immediately
        const svgLogoPaths = document.querySelectorAll('.svg-logo-path');
        if (svgLogoPaths.length > 0) {
            // Set initial colors to match default grid color
            svgLogoPaths.forEach(path => {
                path.style.fill = '#bbbbbb';
            });
        } else {
            // If SVG logos not found yet, try again after a delay
            setTimeout(() => this.initializeSvgColors(), 100);
        }
    }

    initializeUIValues() {
        // Initialize environment control values
        const envSizeValue = document.getElementById('env-size-value');
        const envSizeInput = document.getElementById('env-size');
        const envVisibilityInput = document.getElementById('env-visibility');
        const envColorInput = document.getElementById('env-sphere-color');
        
        if (envSizeValue) {
            envSizeValue.textContent = this.envSphereSize;
        }
        
        if (envSizeInput) {
            envSizeInput.value = this.envSphereSize;
        }
        
        if (envVisibilityInput) {
            envVisibilityInput.checked = this.envVisibility > 0;
        }
          if (envColorInput) {
            // Set color picker to match the environment sphere color
            // Ensure envSphereColor is defined before using toString
            const envColor = this.envSphereColor || 0x999999;
            const envColorHex = '#' + envColor.toString(16).padStart(6, '0');
            envColorInput.value = envColorHex;
        }

        // Initialize light color control values
        const lightBassColorInput = document.getElementById('light-bass-color');
        const lightMidColorInput = document.getElementById('light-mid-color');
        const lightHighColorInput = document.getElementById('light-high-color');
        
        if (lightBassColorInput) {
            const bassColorHex = '#' + this.lightBassColor.toString(16).padStart(6, '0');
            lightBassColorInput.value = bassColorHex;
        }
        
        if (lightMidColorInput) {
            const midColorHex = '#' + this.lightMidColor.toString(16).padStart(6, '0');
            lightMidColorInput.value = midColorHex;
        }
          if (lightHighColorInput) {
            const highColorHex = '#' + this.lightHighColor.toString(16).padStart(6, '0');
            lightHighColorInput.value = highColorHex;
        }        // Initialize mouse interaction control values
        // (UI controls removed - mouse interaction is always enabled during idle mode)
        
        // Initialize UI opacity control values
        const uiOpacitySlider = document.getElementById('ui-opacity');
        const uiOpacityValue = document.getElementById('ui-opacity-value');
        
        if (uiOpacitySlider) {
            uiOpacitySlider.value = this.uiOpacity;
        }
          if (uiOpacityValue) {
            uiOpacityValue.textContent = this.uiOpacity.toFixed(1);
        }        // Apply initial UI opacity setting
        this.updateUIOpacity();
        
        // Initialize monitor volume slider to match default value
        const monitorVolumeSlider = document.getElementById('monitor-volume');
        const monitorVolumeValue = document.getElementById('monitor-volume-value');
        if (monitorVolumeSlider) {
            monitorVolumeSlider.value = this.monitorVolume;
        }
        if (monitorVolumeValue) {
            monitorVolumeValue.textContent = this.monitorVolume.toFixed(1);
        }
          // Initialize shockwave controls with default values only if not already set by loaded settings
        const shockwaveEnabledToggle = document.getElementById('shockwave-enabled');
        if (shockwaveEnabledToggle && !this.settingsLoaded) {
            shockwaveEnabledToggle.checked = false; // Default disabled
        }
          const shockwaveIntensitySlider = document.getElementById('shockwave-intensity');
        const shockwaveIntensityValue = document.getElementById('shockwave-intensity-value');
        if (shockwaveIntensitySlider) shockwaveIntensitySlider.value = 1.0;
        if (shockwaveIntensityValue) shockwaveIntensityValue.textContent = '1.0';
        
        const shockwaveLifetimeSlider = document.getElementById('shockwave-lifetime');
        const shockwaveLifetimeValue = document.getElementById('shockwave-lifetime-value');
        if (shockwaveLifetimeSlider) shockwaveLifetimeSlider.value = 3.0;
        if (shockwaveLifetimeValue) shockwaveLifetimeValue.textContent = '3.0';
        
        const shockwaveOpacitySlider = document.getElementById('shockwave-opacity');
        const shockwaveOpacityValue = document.getElementById('shockwave-opacity-value');
        if (shockwaveOpacitySlider) shockwaveOpacitySlider.value = 0.8;
        if (shockwaveOpacityValue) shockwaveOpacityValue.textContent = '0.8';
        console.log('UI values init OK');
    }

    setupThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.backgroundColor);
        this.scene.fog = new THREE.Fog(this.backgroundColor, 30, 100);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // Set initial camera position - use same distance as camera controls for consistency
        const initialDistance = this.getBaseDistance(); // Same as camera controls initialization
        this.camera.position.set(0, 5, initialDistance);
        this.camera.lookAt(0, 0, 0);
          // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }
      createFerrofluid() {
        // Create geometry with higher detail for smooth deformation
        const geometry = new THREE.SphereGeometry(3, 128, 128);
        
        // Store original positions for morphing
        this.originalPositions = geometry.attributes.position.array.slice();
        // Create target positions for smoother interpolation
        this.targetPositions = new Float32Array(this.originalPositions.length);
        this.currentPositions = new Float32Array(this.originalPositions.length);
        this.velocityPositions = new Float32Array(this.originalPositions.length);
        
        // Copy original positions to current positions initially
        for (let i = 0; i < this.originalPositions.length; i++) {
            this.currentPositions[i] = this.originalPositions[i];
        }
        
        // Initialize noise offsets for organic movement
        this.noiseOffsets = [];
        for (let i = 0; i < this.originalPositions.length / 3; i++) {
            this.noiseOffsets.push({
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                z: Math.random() * 1000,
                speed: 0.5 + Math.random() * 0.5
            });
        }

        // Create material with metallic, reflective properties
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x222222,
            metalness: 0.9,
            roughness: 0.1,
            reflectivity: 0.8,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2,
            envMapIntensity: 1.5
        });

        this.ferrofluid = new THREE.Mesh(geometry, material);
        this.ferrofluid.castShadow = true;
        this.ferrofluid.receiveShadow = true;
        this.ferrofluid.position.set(0, 0, 0);
        this.scene.add(this.ferrofluid);

        // Create inner black sphere to hide seams when the outer sphere deforms
        const innerGeometry = new THREE.SphereGeometry(2.5, 64, 64); // Much smaller to avoid showing through deformations
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Pure black
            side: THREE.BackSide // Only render the inside faces
        });
        
        this.ferrofluidInner = new THREE.Mesh(innerGeometry, innerMaterial);
        this.ferrofluidInner.position.set(0, 0, 0);
        this.scene.add(this.ferrofluidInner);

        // Store original inner core scale for adaptive sizing
        this.originalInnerCoreScale = 2.5;
        
        // Store original positions for inner core deformation
        this.innerCoreOriginalPositions = innerGeometry.attributes.position.array.slice();
        this.innerCoreCurrentPositions = new Float32Array(this.innerCoreOriginalPositions.length);
        
        // Initialize inner core current positions
        for (let i = 0; i < this.innerCoreOriginalPositions.length; i++) {
            this.innerCoreCurrentPositions[i] = this.innerCoreOriginalPositions[i];
        }

        // Animation properties
        this.baseRotation = { x: 0, y: 0, z: 0 };
        this.fluidTime = 0;
        this.morphIntensity = 0.3; // Base morphing intensity

        // Create floating blob material (solid like main ferrofluid)
        this.floatingBlobMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x333333,
            metalness: 0.85,
            roughness: 0.15,
            reflectivity: 0.7,
            clearcoat: 0.6,
            clearcoatRoughness: 0.3,
            envMapIntensity: 1.2,
            transparent: false,
            opacity: 1.0
        });
    }
      createLighting() {
        this.lightGroup = new THREE.Group();
          // Main directional light (brighter for better visibility, no shadows to avoid side shadow)
        const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
        mainLight.position.set(10, 15, 8);
        mainLight.castShadow = false; // Disabled to remove left-side shadow
        this.lightGroup.add(mainLight);
        
        // Secondary directional light for fill
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.8);
        fillLight.position.set(-8, 10, -5);
        this.lightGroup.add(fillLight);
        
        // Rim light for edge definition
        const rimLight = new THREE.DirectionalLight(0x4488ff, 1.2);
        rimLight.position.set(-15, 8, -10);
        this.lightGroup.add(rimLight);
        
        // Ambient light (slightly brighter)
        const ambientLight = new THREE.AmbientLight(0x334466, 0.4);
        this.lightGroup.add(ambientLight);
          // Dynamic colored lights for music reactivity
        this.colorLights = [];
        const lightColors = [this.lightBassColor, this.lightMidColor, this.lightHighColor];
        
        for (let i = 0; i < 3; i++) {
            const light = new THREE.PointLight(lightColors[i], 0, 25);
            light.position.set(
                Math.cos(i * Math.PI * 2 / 3) * 12,
                6,
                Math.sin(i * Math.PI * 2 / 3) * 12
            );
            this.colorLights.push(light);
            this.lightGroup.add(light);
        }        // Additional spotlight for dramatic effect with optimized shadows
        const spotlight = new THREE.SpotLight(0xffffff, 1.5, 35, Math.PI * 0.3, 0.3);
        spotlight.position.set(0, 20, 0);
        spotlight.target.position.set(0, 0, 0);
        spotlight.castShadow = true;
        
        // Optimize shadow settings for better quality at longer distance
        spotlight.shadow.mapSize.width = 2048;
        spotlight.shadow.mapSize.height = 2048;
        spotlight.shadow.camera.near = 1;
        spotlight.shadow.camera.far = 35;
        spotlight.shadow.camera.fov = 45;
        spotlight.shadow.bias = -0.0001;
        
        this.lightGroup.add(spotlight);
        this.lightGroup.add(spotlight.target);
        
        this.scene.add(this.lightGroup);
    }    createEnvironment() {
        // Simple environment geometry for background
        const envGeometry = new THREE.SphereGeometry(this.envSphereSize, 32, 32);
        this.envMaterial = new THREE.MeshBasicMaterial({
            color: this.envSphereColor,
            side: THREE.BackSide,
            opacity: this.envVisibility,
            transparent: this.envVisibility < 1.0,
            visible: this.envVisibility > 0
        });
        this.envSphere = new THREE.Mesh(envGeometry, this.envMaterial);
        this.scene.add(this.envSphere);

        // Create permanent floor plane for shadows (always visible, matches background)
        this.createPermanentFloor();
          // Create grid (this will handle the wireframe grid and wall shadow surfaces)
        this.createGrid();
        
        // Note: We'll initialize gridCellAnimator once we have the audio loaded and analyzer available
    }updateEnvironment() {
        // Remove the old environment sphere
        if (this.envSphere) {
            this.scene.remove(this.envSphere);
            this.envSphere.geometry.dispose();
            if (this.envMaterial) {
                this.envMaterial.dispose();
            }
        }
        
        // Create a new environment sphere with updated size and material
        const envGeometry = new THREE.SphereGeometry(this.envSphereSize, 32, 32);
        this.envMaterial = new THREE.MeshBasicMaterial({
            color: this.envSphereColor,
            side: THREE.BackSide,
            opacity: this.envVisibility,
            transparent: this.envVisibility < 1.0,
            visible: this.envVisibility > 0
        });
        this.envSphere = new THREE.Mesh(envGeometry, this.envMaterial);
        this.scene.add(this.envSphere);
        
        // Update fog parameters based on visibility
        if (this.scene.fog) {
            if (this.envVisibility === 0) {
                // Disable fog when environment is hidden
                this.scene.fog.near = 100;
                this.scene.fog.far = 100;
            } else {
                // Restore fog when environment is visible
                this.scene.fog.near = 30;
                this.scene.fog.far = 100;
            }
        }
        
        console.log(`Env: Size=${this.envSphereSize}, Vis=${this.envVisibility > 0 ? 'On' : 'Off'}`);
    }

    createColoredShadowMaterial() {
        // Use ShadowMaterial for proper shadow receiving
        // The color effect will be achieved through the spotlight color
        // Cap maximum opacity at 0.8 to prevent completely black shadows
        const maxShadowOpacity = 0.8;
        const minShadowOpacity = 0.01;
        const actualOpacity = this.shadowTransparency === 0 ? 0 : 
                            Math.max(minShadowOpacity, this.shadowTransparency * maxShadowOpacity);
        
        const material = new THREE.ShadowMaterial({
            transparent: true,
            opacity: actualOpacity, // Scale to realistic range (0 to 0.8)
            visible: this.shadowTransparency > 0 // Hide completely when slider is at 0
        });
        
        return material;
    }

    createPermanentFloor() {
        // Remove existing permanent floor if it exists
        if (this.permanentFloor) {
            this.scene.remove(this.permanentFloor);
        }
          // Create a large floor plane that matches the background color
        // This provides shadow receiving even when the grid is disabled
        const floorSize = this.gridSize * 3; // Make it larger than the grid to ensure coverage
        const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);        // Create colored shadow material instead of ShadowMaterial
        this.permanentFloorMaterial = this.createColoredShadowMaterial();
          this.permanentFloor = new THREE.Mesh(floorGeometry, this.permanentFloorMaterial);
        this.permanentFloor.rotation.x = -Math.PI / 2;
        this.permanentFloor.position.y = -10.005; // Slightly below the grid floor to avoid z-fighting
        this.permanentFloor.receiveShadow = true;
        
        // Show permanent floor only when grid is disabled to avoid double shadows
        this.permanentFloor.visible = !this.gridVisible;
        
        this.scene.add(this.permanentFloor);
    }

    createGrid() {
        // Remove existing grid if it exists
        if (this.gridGroup) {
            this.scene.remove(this.gridGroup);
        }
        
        this.gridGroup = new THREE.Group();
        
        // Create horizontal grid
        const gridGeometry = new THREE.PlaneGeometry(this.gridSize * 2, this.gridSize * 2, this.gridSize, this.gridSize);
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: this.gridColor,
            transparent: true,
            opacity: this.gridOpacity,
            wireframe: true        });        // Create unified colored shadow-receiving material
        const shadowMaterial = this.createColoredShadowMaterial();
        
        // Floor grid (wireframe)
        const floorGrid = new THREE.Mesh(gridGeometry, gridMaterial);
        floorGrid.rotation.x = -Math.PI / 2;
        floorGrid.position.y = -10;
        this.gridGroup.add(floorGrid);
          // Floor shadow plane (exactly at grid boundaries to prevent bleeding)
        const floorShadowGeometry = new THREE.PlaneGeometry(this.gridSize * 2, this.gridSize * 2);
        const floorShadowPlane = new THREE.Mesh(floorShadowGeometry, shadowMaterial.clone());
        floorShadowPlane.rotation.x = -Math.PI / 2;
        floorShadowPlane.position.y = -10.002; // Slightly more offset below wireframe
        floorShadowPlane.receiveShadow = true;
        this.gridGroup.add(floorShadowPlane);

        // Vertical grids (walls) with proper shadow receiving
        // Back wall
        const wallGrid1 = new THREE.Mesh(gridGeometry, gridMaterial.clone());
        wallGrid1.position.z = -this.gridSize;
        wallGrid1.position.y = this.gridSize - 10;
        this.gridGroup.add(wallGrid1);
          // Back wall shadow plane
        const backShadowPlane = new THREE.Mesh(gridGeometry, shadowMaterial.clone());
        backShadowPlane.position.z = -this.gridSize - 0.002; // Slightly more offset behind wireframe
        backShadowPlane.position.y = this.gridSize - 10;
        backShadowPlane.receiveShadow = true;
        this.gridGroup.add(backShadowPlane);

        // Left wall
        const wallGrid2 = new THREE.Mesh(gridGeometry, gridMaterial.clone());
        wallGrid2.rotation.y = Math.PI / 2;
        wallGrid2.position.x = -this.gridSize;
        wallGrid2.position.y = this.gridSize - 10;
        this.gridGroup.add(wallGrid2);
          // Left wall shadow plane
        const leftShadowPlane = new THREE.Mesh(gridGeometry, shadowMaterial.clone());
        leftShadowPlane.rotation.y = Math.PI / 2;
        leftShadowPlane.position.x = -this.gridSize - 0.002; // Slightly more offset behind wireframe
        leftShadowPlane.position.y = this.gridSize - 10;
        leftShadowPlane.receiveShadow = true;
        this.gridGroup.add(leftShadowPlane);

        // Right wall
        const wallGrid3 = new THREE.Mesh(gridGeometry, gridMaterial.clone());
        wallGrid3.rotation.y = -Math.PI / 2;
        wallGrid3.position.x = this.gridSize;
        wallGrid3.position.y = this.gridSize - 10;
        this.gridGroup.add(wallGrid3);
          // Right wall shadow plane
        const rightShadowPlane = new THREE.Mesh(gridGeometry, shadowMaterial.clone());
        rightShadowPlane.rotation.y = -Math.PI / 2;
        rightShadowPlane.position.x = this.gridSize + 0.002; // Slightly more offset behind wireframe
        rightShadowPlane.position.y = this.gridSize - 10;
        rightShadowPlane.receiveShadow = true;
        this.gridGroup.add(rightShadowPlane);

    // Front wall (where camera was initially positioned)
    const wallGrid4 = new THREE.Mesh(gridGeometry, gridMaterial.clone());
        wallGrid4.rotation.y = Math.PI;
        wallGrid4.position.z = this.gridSize;
        wallGrid4.position.y = this.gridSize - 10;
        this.gridGroup.add(wallGrid4);
          // Front wall shadow plane
        const frontShadowPlane = new THREE.Mesh(gridGeometry, shadowMaterial.clone());
        frontShadowPlane.rotation.y = Math.PI;
        frontShadowPlane.position.z = this.gridSize + 0.002; // Slightly more offset behind wireframe
        frontShadowPlane.position.y = this.gridSize - 10;
        frontShadowPlane.receiveShadow = true;
        this.gridGroup.add(frontShadowPlane);

        // Top lid
        const topGrid = new THREE.Mesh(gridGeometry, gridMaterial.clone());
        topGrid.rotation.x = Math.PI / 2;
        topGrid.position.y = this.gridSize * 2 - 10;
        this.gridGroup.add(topGrid);
        
        // Top shadow plane
        const topShadowPlane = new THREE.Mesh(gridGeometry, shadowMaterial.clone());
        topShadowPlane.rotation.x = Math.PI / 2;
        topShadowPlane.position.y = this.gridSize * 2 - 10 - 0.001; // Slightly below wireframe
        topShadowPlane.receiveShadow = true;
        this.gridGroup.add(topShadowPlane);        // ADD CORNER CONNECTORS for seamless shadow transitions
        this.createCornerConnectors(shadowMaterial);

        this.gridGroup.visible = this.gridVisible;
        this.scene.add(this.gridGroup);
    }

    createCornerConnectors(shadowMaterial) {
        // Create small connector planes at floor-wall intersections to prevent shadow bleeding
        const connectorSize = 0.5; // Small connector size
        const connectorGeometry = new THREE.PlaneGeometry(connectorSize, connectorSize);
        
        // Floor-to-wall connectors (along each edge of the floor)
        const positions = [
            // Back edge connectors
            { pos: [-this.gridSize, -10, -this.gridSize], rot: [0, 0, Math.PI/4] },
            { pos: [0, -10, -this.gridSize], rot: [0, 0, Math.PI/4] },
            { pos: [this.gridSize, -10, -this.gridSize], rot: [0, 0, Math.PI/4] },
            
            // Front edge connectors
            { pos: [-this.gridSize, -10, this.gridSize], rot: [0, 0, Math.PI/4] },
            { pos: [0, -10, this.gridSize], rot: [0, 0, Math.PI/4] },
            { pos: [this.gridSize, -10, this.gridSize], rot: [0, 0, Math.PI/4] },
            
            // Left edge connectors
            { pos: [-this.gridSize, -10, -this.gridSize/2], rot: [0, Math.PI/2, Math.PI/4] },
            { pos: [-this.gridSize, -10, 0], rot: [0, Math.PI/2, Math.PI/4] },
            { pos: [-this.gridSize, -10, this.gridSize/2], rot: [0, Math.PI/2, Math.PI/4] },
            
            // Right edge connectors
            { pos: [this.gridSize, -10, -this.gridSize/2], rot: [0, Math.PI/2, Math.PI/4] },
            { pos: [this.gridSize, -10, 0], rot: [0, Math.PI/2, Math.PI/4] },
            { pos: [this.gridSize, -10, this.gridSize/2], rot: [0, Math.PI/2, Math.PI/4] }
        ];

        positions.forEach(config => {
            const connector = new THREE.Mesh(connectorGeometry, shadowMaterial.clone());
            connector.position.set(...config.pos);
            connector.rotation.set(...config.rot);
            connector.receiveShadow = true;
            this.gridGroup.add(connector);
        });
    }    setupEventListeners() {
        // Custom file button
        document.getElementById('file-button').addEventListener('click', () => {
            document.getElementById('audio-file').click();
        });
        
        // File input
        document.getElementById('audio-file').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                // Update the filename display
                const fileNameDisplay = document.getElementById('file-name-display');
                if (fileNameDisplay) {
                    const fileName = e.target.files[0].name;
                    // Truncate filename if too long
                    const maxLength = 20;
                    const displayName = fileName.length > maxLength ? 
                        fileName.substring(0, maxLength) + '...' : fileName;
                    fileNameDisplay.textContent = displayName;
                }
                this.loadAudioFile(e.target.files[0]);
            }
        });
        
        // Play/Pause button
        document.getElementById('play-pause').addEventListener('click', () => {
            this.togglePlayPause();
        });
          // Stop button
        document.getElementById('stop').addEventListener('click', () => {
            this.stop();
        });

        // Loop button
        document.getElementById('loop').addEventListener('click', () => {
            this.toggleLoop();
        });
        
        // Audio input tabs
        document.querySelectorAll('.input-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.currentTarget.dataset.tab;
                this.switchAudioInputTab(tabType);
            });
        });
        
        // Audio input connect button
        document.getElementById('input-connect').addEventListener('click', () => {
            this.connectAudioInput();
        });
        
        // Enumerate audio devices when page loads
        this.enumerateAudioDevices().catch(console.error);
        
        // Re-enumerate devices when input tab becomes active
        document.querySelector('[data-tab="input"]').addEventListener('click', () => {
            setTimeout(() => this.enumerateAudioDevices().catch(console.error), 100);
        });
        
        // Audio monitoring controls
        document.getElementById('audio-monitoring').addEventListener('change', (e) => {
            this.audioMonitoringEnabled = e.target.checked;
            this.updateAudioMonitoring();
        });
        
        document.getElementById('monitor-volume').addEventListener('input', (e) => {
            this.monitorVolume = parseFloat(e.target.value);
            document.getElementById('monitor-volume-value').textContent = this.monitorVolume.toFixed(1);
            if (this.monitorGainNode) {
                this.monitorGainNode.gain.setValueAtTime(this.monitorVolume, this.audioContext.currentTime);
            }
        });
        
        // Sensitivity slider
        const sensitivitySlider = document.getElementById('sensitivity');
        sensitivitySlider.addEventListener('input', (e) => {
            this.sensitivity = parseFloat(e.target.value);
            document.getElementById('sensitivity-value').textContent = this.sensitivity.toFixed(2);
        });        // Smoothing slider
        const smoothingSlider = document.getElementById('smoothing');
        smoothingSlider.addEventListener('input', (e) => {
            this.smoothing = parseFloat(e.target.value);
            document.getElementById('smoothing-value').textContent = this.smoothing.toFixed(1);
            if (this.analyser) {
                // Clamp smoothingTimeConstant to valid range [0,1] for Web Audio API
                const clampedSmoothing = Math.max(0, Math.min(1, this.smoothing));
                this.analyser.smoothingTimeConstant = clampedSmoothing;
            }
        });// Grid controls
        document.getElementById('grid-toggle').addEventListener('change', (e) => {
            this.gridVisible = e.target.checked;
            if (this.gridGroup) {
                this.gridGroup.visible = this.gridVisible;
            }
            // Show permanent floor only when grid is disabled to avoid double shadows
            if (this.permanentFloor) {
                this.permanentFloor.visible = !this.gridVisible;
            }        });        
        // Debug Console visibility toggle control
        document.getElementById('debug-console-toggle').addEventListener('change', (e) => {
            const debugPanel = document.getElementById('debug-info-panel');
            if (debugPanel) {
                debugPanel.style.display = e.target.checked ? 'block' : 'none';
                
                // Show immediate feedback
                const toggleMessage = e.target.checked ? 
                    'Debug console: ON' : 
                    'Debug console: OFF';
                console.log(toggleMessage);
            }
        });

        // Debug Encoding toggle control
        document.getElementById('debug-encoding-toggle').addEventListener('change', (e) => {
            if (window.debugEncodingControls) {
                window.debugEncodingControls.setEnabled(e.target.checked);
                
                // Show immediate feedback
                const toggleMessage = e.target.checked ? 
                    'Decode animation: ON' : 
                    'Decode animation: OFF';
                console.log(toggleMessage);
            }
        });        // Mouse Interaction Controls
        // (UI controls removed - mouse interaction is always enabled during idle mode)

        document.getElementById('grid-size').addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value);
            document.getElementById('grid-size-value').textContent = this.gridSize;
            this.updateCameraScaling(); // Update camera scaling for new grid size
            this.createPermanentFloor(); // Update permanent floor size
            this.createGrid();
              // Update grid materials to match current UI state after recreation
            if (this.gridGroup) {
                this.gridGroup.children.forEach(mesh => {
                    if (mesh.material && mesh.material.type !== 'ShadowMaterial') {
                        if (mesh.material.color) { // Check if color property exists
                            mesh.material.color.setHex(this.gridColor);
                        }
                    }
                });
            }              // Always update shadow colors after grid recreation to preserve custom shadow color
            this.updateShadowColors();
            
            // Update shadow transparency to match current setting
            this.updateShadowTransparency();            // Update camera bounds when grid size changes
            if (this.cameraControls) {
                this.clampCameraTarget();
            }
            
            // Recreate grid cell animator with new size
            if (this.gridCellAnimator) {
                this.gridCellAnimator.dispose();
                this.gridCellAnimator = new GridCellAnimator(this.gridSize, this.scene, this.analyser, this.gridColor, this.backgroundColor);
            }
        });document.getElementById('grid-opacity').addEventListener('input', (e) => {
            this.gridOpacity = parseFloat(e.target.value);
            document.getElementById('grid-opacity-value').textContent = this.gridOpacity.toFixed(1);
            if (this.gridGroup) {
                this.gridGroup.children.forEach(mesh => {
                    // Only update opacity for wireframe grid materials, not shadow materials
                    if (mesh.material && mesh.material.type !== 'ShadowMaterial') {
                        mesh.material.opacity = this.gridOpacity;
                    }
                });
            }        });        // Shadow opacity control (0 = invisible, 1 = fully visible)
        document.getElementById('shadow-transparency').addEventListener('input', (e) => {
            this.shadowTransparency = parseFloat(e.target.value);
            document.getElementById('shadow-transparency-value').textContent = this.shadowTransparency.toFixed(1);
            this.updateShadowTransparency();
        });        // Background color control
        document.getElementById('background-color').addEventListener('input', (e) => {
            this.backgroundColor = parseInt(e.target.value.replace('#', ''), 16);
            this.scene.background.setHex(this.backgroundColor);
            
            // Note: Permanent floor uses ShadowMaterial (invisible) so no color update needed
            
            // Also update fog color to match background
            this.scene.fog.color.setHex(this.backgroundColor);
            // Subtle lighting influence from background color
            this.updateLightingFromBackground();
            
            // Update grid cell animator colors
            if (this.gridCellAnimator) {
                this.gridCellAnimator.updateColors(this.gridColor, this.backgroundColor);
            }
        });// Environment sphere color control
        document.getElementById('env-sphere-color').addEventListener('input', (e) => {
            this.envSphereColor = parseInt(e.target.value.replace('#', ''), 16);
            if (this.envMaterial) {
                this.envMaterial.color.setHex(this.envSphereColor);
            }
        });

        // Light color controls for frequency-based lighting
        document.getElementById('light-bass-color').addEventListener('input', (e) => {
            this.lightBassColor = parseInt(e.target.value.replace('#', ''), 16);
        });

        document.getElementById('light-mid-color').addEventListener('input', (e) => {
            this.lightMidColor = parseInt(e.target.value.replace('#', ''), 16);
        });

        document.getElementById('light-high-color').addEventListener('input', (e) => {
            this.lightHighColor = parseInt(e.target.value.replace('#', ''), 16);
        });// Environment size control
        document.getElementById('env-size').addEventListener('input', (e) => {
            this.envSphereSize = parseInt(e.target.value);
            document.getElementById('env-size-value').textContent = this.envSphereSize;
            this.updateEnvironment();
        });        // Environment visibility control (checkbox)
        document.getElementById('env-visibility').addEventListener('change', (e) => {
            this.envVisibility = e.target.checked ? 1.0 : 0.0;
            
            // Update the material directly if available
            if (this.envMaterial) {
                this.envMaterial.opacity = this.envVisibility;
                this.envMaterial.transparent = this.envVisibility < 1.0;
                this.envMaterial.visible = this.envVisibility > 0;
            }
            
            // Always refresh the environment to ensure proper rendering
            this.updateEnvironment();
        });        // UI opacity control
        document.getElementById('ui-opacity').addEventListener('input', (e) => {
            this.uiOpacity = parseFloat(e.target.value);
            document.getElementById('ui-opacity-value').textContent = this.uiOpacity.toFixed(1);
            this.updateUIOpacity();
        });

        // Grid color control
        document.getElementById('grid-color').addEventListener('input', (e) => {
            this.gridColor = parseInt(e.target.value.replace('#', ''), 16);
            const gridColorHex = e.target.value;

            if (this.linkShadowColor) {
                // When linked, grid color overrides shadow color and picker
                this.shadowColor = this.gridColor;
                document.getElementById('shadow-color').value = '#' + this.gridColor.toString(16).padStart(6, '0');
                // Only update shadow colors when linked
                this.updateShadowColors();
            }            if (this.gridGroup) {
                this.gridGroup.children.forEach(mesh => {
                    if (mesh.material && mesh.material.type !== 'ShadowMaterial') {
                        if (mesh.material.color) { // Check if color property exists
                            mesh.material.color.setHex(this.gridColor);
                        }
                    }
                });
            }
              // Update grid cell animator colors
            if (this.gridCellAnimator) {
                this.gridCellAnimator.updateColors(this.gridColor, this.backgroundColor);
            }            this.updateFrequencyAnalyzerCloneColors(gridColorHex);
            const trackBpm = document.getElementById('track-bpm');
            const trackNameVertical = document.getElementById('track-name-vertical');
            const trackTimeDisplay = document.getElementById('track-time-display');
            const trackFreqDisplay = document.getElementById('track-freq-display');
            const performanceFps = document.getElementById('performance-fps');
            const performanceQuality = document.getElementById('performance-quality');
            const performanceObjects = document.getElementById('performance-objects');
            if (trackBpm) trackBpm.style.color = gridColorHex;
            if (trackNameVertical) trackNameVertical.style.color = gridColorHex;
            if (trackTimeDisplay) trackTimeDisplay.style.color = gridColorHex;
            if (trackFreqDisplay) trackFreqDisplay.style.color = gridColorHex;
            if (performanceFps) performanceFps.style.color = gridColorHex;
            if (performanceQuality) performanceQuality.style.color = gridColorHex;
            if (performanceObjects) performanceObjects.style.color = gridColorHex;
        });        // Shadow color control
        document.getElementById('shadow-color').addEventListener('input', (e) => {
            this.shadowColor = parseInt(e.target.value.replace('#', ''), 16);
            // Always update shadow colors - the method will determine which color to use
            this.updateShadowColors();
        });

        // Link shadow color checkbox
        document.getElementById('link-shadow-color').addEventListener('input', (e) => {
            this.linkShadowColor = e.target.checked;
            const shadowColorInput = document.getElementById('shadow-color');
            
            if (this.linkShadowColor) {
                // Linking enabled:
                // 1. Sync shadow color with grid color
                this.shadowColor = this.gridColor;
                // 2. Update shadow color input to match grid color
                shadowColorInput.value = '#' + this.gridColor.toString(16).padStart(6, '0');
                // 3. Disable shadow color input
                shadowColorInput.disabled = true;
                // 4. Update all shadow material colors (via spotlight)
                this.updateShadowColors();
            } else {
                // Linking disabled:
                // 1. Enable shadow color input
                shadowColorInput.disabled = false;
                // 2. (Optional) Update shadows based on current shadow picker value,
                //    in case it was changed while disabled (though it shouldn't be possible)
                //    or if we want to ensure it reflects its own value immediately.
                // this.shadowColor = parseInt(shadowColorInput.value.replace('#', ''), 16);
                // this.updateShadowColors();
            }
        });

        // Window resize
        window.addEventListener('resize', () => this.resize());
        
        // Enhanced mouse camera controls
        this.initMouseControls();        // Spacebar for play/pause functionality
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayPause();
            }
        });        // Settings event listeners
        // Auto-load presets when selected from dropdown
        document.getElementById('settings-dropdown').addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            if (selectedValue) {
                this.loadSelectedSettings();
            }
        });

        document.getElementById('refresh-presets').addEventListener('click', (e) => {
            const button = e.target;
            button.classList.add('rotating');
            setTimeout(() => button.classList.remove('rotating'), 300);
            this.refreshSettingsDropdown();
        });

        document.getElementById('export-settings').addEventListener('click', () => {
            this.exportSettings();
        });

        document.getElementById('import-settings').addEventListener('click', () => {
            document.getElementById('settings-file-input').click();
        });        document.getElementById('settings-file-input').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleSettingsFileImport(e.target.files[0]);
            }
        });
          // Grid Cells Activity toggle
        const gridCellsActivityToggle = document.getElementById('grid-cells-activity-toggle');
        if (gridCellsActivityToggle) {
            this.gridCellsActivityEnabled = gridCellsActivityToggle.checked;
            gridCellsActivityToggle.addEventListener('change', (e) => {
                this.gridCellsActivityEnabled = e.target.checked;
            });
        }        // Populate and handle track selector
        this.populateTrackSelector();
        const trackSelectElement = document.getElementById('track-select');
        if (trackSelectElement) {
            trackSelectElement.addEventListener('change', async (e) => {
                const selectedTrack = e.target.value;
                if (selectedTrack) {
                    await this.loadAndPlayTrack(selectedTrack);
                }
            });        }        // Randomize colors button
        document.getElementById('randomize-colors').addEventListener('click', () => {
            this.randomizeColors();
        });        // Shockwave System Controls
        const shockwaveEnabledToggle = document.getElementById('shockwave-enabled');
        if (shockwaveEnabledToggle) {
            shockwaveEnabledToggle.addEventListener('change', (e) => {
                if (this.shockwaveSystem) {
                    this.shockwaveSystem.setEnabled(e.target.checked);
                }
            });        }
        
        const shockwaveIntensitySlider = document.getElementById('shockwave-intensity');
        if (shockwaveIntensitySlider) {
            shockwaveIntensitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('shockwave-intensity-value').textContent = value.toFixed(1);
                if (this.shockwaveSystem) {
                    this.shockwaveSystem.config.intensity = value;
                }
            });        }
        
        const shockwaveLifetimeSlider = document.getElementById('shockwave-lifetime');
        if (shockwaveLifetimeSlider) {
            shockwaveLifetimeSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('shockwave-lifetime-value').textContent = value.toFixed(1);
                if (this.shockwaveSystem) {
                    this.shockwaveSystem.config.lifetime = value;
                }
            });
        }
        
        const shockwaveOpacitySlider = document.getElementById('shockwave-opacity');
        if (shockwaveOpacitySlider) {
            shockwaveOpacitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('shockwave-opacity-value').textContent = value.toFixed(1);
                if (this.shockwaveSystem) {
                    this.shockwaveSystem.config.opacity = value;
                    // Update material opacities immediately
                    Object.values(this.shockwaveSystem.materials).forEach(material => {
                        material.opacity = value;
                    });
                }
            });
        }

        // Note: Filmic Tone System Event Listeners are set up in init() after the system is created
    }

    setupFilmicControls() {
        console.log('Setting up filmic controls...');
        console.log('Filmic system available:', !!this.filmicToneSystem);
        console.log('DOM ready state:', document.readyState);
        
        // Test if elements exist
        const filmicEnabledToggle = document.getElementById('filmic-enabled');
        const toneMappingSelect = document.getElementById('tone-mapping');
        const exposureSlider = document.getElementById('filmic-exposure');
        
        console.log('UI elements found:', {
            filmicEnabled: !!filmicEnabledToggle,
            toneMapping: !!toneMappingSelect,
            exposure: !!exposureSlider
        });
        
        // Filmic Enable Toggle
        if (filmicEnabledToggle && this.filmicToneSystem) {
            filmicEnabledToggle.addEventListener('change', (e) => {
                console.log('Filmic enabled changed:', e.target.checked);
                this.filmicToneSystem.settings.enabled = e.target.checked;
                this.filmicToneSystem.updateUniforms();
            });
            console.log('Filmic enable toggle event listener added');
        } else {
            console.warn('Failed to add filmic enable toggle:', {
                element: !!filmicEnabledToggle,
                system: !!this.filmicToneSystem
            });
        }

        // Tone Mapping Dropdown
        if (toneMappingSelect && this.filmicToneSystem) {
            toneMappingSelect.addEventListener('change', (e) => {
                console.log('Tone mapping changed:', e.target.value);
                this.filmicToneSystem.settings.toneMapping = e.target.value;
                this.filmicToneSystem.updateUniforms();
            });
            console.log('Tone mapping select event listener added');
        } else {
            console.warn('Failed to add tone mapping select:', {
                element: !!toneMappingSelect,
                system: !!this.filmicToneSystem
            });
        }

        // Exposure Slider
        if (exposureSlider && this.filmicToneSystem) {
            exposureSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const valueDisplay = document.getElementById('filmic-exposure-value');
                if (valueDisplay) {
                    valueDisplay.textContent = value.toFixed(1);
                }
                this.filmicToneSystem.settings.exposure = value;
                this.filmicToneSystem.updateUniforms();
            });
            console.log('Exposure slider event listener added');
        } else {
            console.warn('Failed to add exposure slider:', {
                element: !!exposureSlider,
                system: !!this.filmicToneSystem
            });
        }

        // Contrast Slider
        const contrastSlider = document.getElementById('filmic-contrast');
        if (contrastSlider && this.filmicToneSystem) {
            contrastSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const valueDisplay = document.getElementById('filmic-contrast-value');
                if (valueDisplay) {
                    valueDisplay.textContent = value.toFixed(1);
                }
                this.filmicToneSystem.settings.contrast = value;
                this.filmicToneSystem.updateUniforms();
            });
            console.log('Contrast slider event listener added');
        } else {
            console.warn('Failed to add contrast slider:', {
                element: !!contrastSlider,
                system: !!this.filmicToneSystem
            });
        }

        // Saturation Slider
        const saturationSlider = document.getElementById('filmic-saturation');
        if (saturationSlider && this.filmicToneSystem) {
            saturationSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const valueDisplay = document.getElementById('filmic-saturation-value');
                if (valueDisplay) {
                    valueDisplay.textContent = value.toFixed(1);
                }
                this.filmicToneSystem.settings.saturation = value;
                this.filmicToneSystem.updateUniforms();
            });
            console.log('Saturation slider event listener added');
        } else {
            console.warn('Failed to add saturation slider:', {
                element: !!saturationSlider,
                system: !!this.filmicToneSystem
            });
        }

        // Vibrance Slider
        const vibranceSlider = document.getElementById('filmic-vibrance');
        if (vibranceSlider && this.filmicToneSystem) {
            vibranceSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('filmic-vibrance-value').textContent = value.toFixed(1);
                this.filmicToneSystem.settings.vibrance = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Gamma Slider
        const gammaSlider = document.getElementById('filmic-gamma');
        if (gammaSlider && this.filmicToneSystem) {
            gammaSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('filmic-gamma-value').textContent = value.toFixed(1);
                this.filmicToneSystem.settings.gamma = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Film Grain Intensity Slider
        const filmGrainIntensitySlider = document.getElementById('film-grain-intensity');
        if (filmGrainIntensitySlider && this.filmicToneSystem) {
            filmGrainIntensitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('film-grain-intensity-value').textContent = value.toFixed(2);
                this.filmicToneSystem.settings.filmGrainIntensity = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Vignette Strength Slider
        const vignetteStrengthSlider = document.getElementById('vignette-strength');
        if (vignetteStrengthSlider && this.filmicToneSystem) {
            vignetteStrengthSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('vignette-strength-value').textContent = value.toFixed(2);
                this.filmicToneSystem.settings.vignetteStrength = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Chromatic Aberration Slider
        const chromaticAberrationSlider = document.getElementById('chromatic-aberration');
        if (chromaticAberrationSlider && this.filmicToneSystem) {
            chromaticAberrationSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('chromatic-aberration-value').textContent = value.toFixed(1);
                this.filmicToneSystem.settings.chromaticAberration = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Lens Distortion Slider
        const lensDistortionSlider = document.getElementById('lens-distortion');
        if (lensDistortionSlider && this.filmicToneSystem) {
            lensDistortionSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('lens-distortion-value').textContent = value.toFixed(2);
                this.filmicToneSystem.settings.lensDistortion = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Color Temperature Slider
        const colorTemperatureSlider = document.getElementById('color-temperature');
        if (colorTemperatureSlider && this.filmicToneSystem) {
            colorTemperatureSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('color-temperature-value').textContent = value;
                this.filmicToneSystem.settings.colorTemperature = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Color Tint Slider
        const colorTintSlider = document.getElementById('color-tint');
        if (colorTintSlider && this.filmicToneSystem) {
            colorTintSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('color-tint-value').textContent = value.toFixed(1);
                this.filmicToneSystem.settings.tint = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Advanced Cinematic Effects
        
        // Film Halation Slider
        const filmHalationSlider = document.getElementById('film-halation');
        if (filmHalationSlider && this.filmicToneSystem) {
            filmHalationSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('film-halation-value').textContent = value.toFixed(2);
                this.filmicToneSystem.settings.filmHalation = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Film Scratches Slider
        const filmScratchesSlider = document.getElementById('film-scratches');
        if (filmScratchesSlider && this.filmicToneSystem) {
            filmScratchesSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('film-scratches-value').textContent = value.toFixed(2);
                this.filmicToneSystem.settings.filmScratches = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Color Fringing Slider
        const colorFringingSlider = document.getElementById('color-fringing');
        if (colorFringingSlider && this.filmicToneSystem) {
            colorFringingSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('color-fringing-value').textContent = value.toFixed(2);
                this.filmicToneSystem.settings.colorFringing = value;
                this.filmicToneSystem.updateUniforms();
            });
        }

        // Scanlines Slider
        const scanlinesSlider = document.getElementById('scanlines');
        if (scanlinesSlider && this.filmicToneSystem) {
            scanlinesSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('scanlines-value').textContent = value.toFixed(2);
                this.filmicToneSystem.settings.scanlines = value;
                this.filmicToneSystem.updateUniforms();
            });
        }
    }// Randomize colors using harmonious color schemes
    randomizeColors() {
        if (!window.ColorHarmonizer) {
            console.error('ColorHarmonizer not found. Check color-harmonizer.js');
            return;
        }

        const harmonizer = new ColorHarmonizer();
        const colorScheme = harmonizer.generateRandomScheme();
        
        console.log('Color scheme:', colorScheme.name);

        // Convert hex colors to integers for Three.js
        this.gridColor = harmonizer.hexToRgbInt(colorScheme.grid);
        const gridColorInput = document.getElementById('grid-color');
        if (gridColorInput) {
            gridColorInput.value = colorScheme.grid;
        }

        // Apply shadow color (if not linked to grid)
        if (!this.linkShadowColor) {
            this.shadowColor = harmonizer.hexToRgbInt(colorScheme.shadow);
            const shadowColorInput = document.getElementById('shadow-color');
            if (shadowColorInput) {
                shadowColorInput.value = colorScheme.shadow;
            }
        } else {
            // If linked, shadow color will sync with grid color automatically
            this.shadowColor = this.gridColor;
        }

        // Apply background color
        this.backgroundColor = harmonizer.hexToRgbInt(colorScheme.background);
        const backgroundColorInput = document.getElementById('background-color');
        if (backgroundColorInput) {
            backgroundColorInput.value = colorScheme.background;
        }

        // Apply environment sphere color
        this.envSphereColor = harmonizer.hexToRgbInt(colorScheme.environment);
        const envColorInput = document.getElementById('env-sphere-color');
        if (envColorInput) {
            envColorInput.value = colorScheme.environment;
        }

        // Apply light colors (lights is an array of 3 hex colors)
        if (colorScheme.lights && colorScheme.lights.length >= 3) {
            this.lightBassColor = harmonizer.hexToRgbInt(colorScheme.lights[0]);
            this.lightMidColor = harmonizer.hexToRgbInt(colorScheme.lights[1]);
            this.lightHighColor = harmonizer.hexToRgbInt(colorScheme.lights[2]);

            const bassColorInput = document.getElementById('light-bass-color');
            const midColorInput = document.getElementById('light-mid-color');
            const highColorInput = document.getElementById('light-high-color');

            if (bassColorInput) {
                bassColorInput.value = colorScheme.lights[0];
            }
            if (midColorInput) {
                midColorInput.value = colorScheme.lights[1];
            }
            if (highColorInput) {
                highColorInput.value = colorScheme.lights[2];
            }
        }

        // Update the visualizer with new colors
        this.updateVisualizerColors();
    }    // Update all visualizer components with current colors
    updateVisualizerColors() {
        // Update scene background
        if (this.scene) {
            this.scene.background.setHex(this.backgroundColor);
            if (this.scene.fog) {
                this.scene.fog.color.setHex(this.backgroundColor);
            }
        }

        // Update grid colors
        if (this.gridGroup) {
            this.gridGroup.children.forEach(mesh => {
                if (mesh.material && mesh.material.type !== 'ShadowMaterial') {
                    if (mesh.material.color) {
                        mesh.material.color.setHex(this.gridColor);
                    }
                }
            });
        }

        // Update environment sphere
        if (this.envMaterial) {
            this.envMaterial.color.setHex(this.envSphereColor);
        }

        // Update lighting
        this.updateLightingFromBackground();

        // Update shadow colors
        this.updateShadowColors();

        // Update grid cell animator colors
        if (this.gridCellAnimator) {
            this.gridCellAnimator.updateColors(this.gridColor, this.backgroundColor);
        }

        // Update frequency analyzer colors
        const gridColorHex = '#' + this.gridColor.toString(16).padStart(6, '0');
        this.updateFrequencyAnalyzerCloneColors(gridColorHex);        // Update track info elements
        const trackBpm = document.getElementById('track-bpm');
        const trackNameVertical = document.getElementById('track-name-vertical');
        const trackTimeDisplay = document.getElementById('track-time-display');
        const trackFreqDisplay = document.getElementById('track-freq-display');
        const performanceFps = document.getElementById('performance-fps');
        const performanceQuality = document.getElementById('performance-quality');
        const performanceObjects = document.getElementById('performance-objects');
        
        if (trackBpm) trackBpm.style.color = gridColorHex;
        if (trackNameVertical) trackNameVertical.style.color = gridColorHex;
        if (trackTimeDisplay) trackTimeDisplay.style.color = gridColorHex;
        if (trackFreqDisplay) trackFreqDisplay.style.color = gridColorHex;
        if (performanceFps) performanceFps.style.color = gridColorHex;
        if (performanceQuality) performanceQuality.style.color = gridColorHex;
        if (performanceObjects) performanceObjects.style.color = gridColorHex;

        // Update debug panel and status message colors
        const debugPanel = document.getElementById('debug-info-panel');
        const statusMessage = document.getElementById('status-message');
        if (debugPanel) debugPanel.style.color = gridColorHex;
        if (statusMessage) statusMessage.style.color = gridColorHex;
    }async populateTrackSelector() {
        const trackSelectElement = document.getElementById('track-select');
        if (!trackSelectElement) {
            console.warn('Track select not found.');
            return;
        }

        // Clear existing options (except the default placeholder)
        while (trackSelectElement.options.length > 1) {
            trackSelectElement.remove(1);
        }

        try {
            // Fetch MP3 index
            const response = await fetch('mp3/index.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const indexData = await response.json();
            const mp3Files = indexData.files || [];
            
            console.log(`Loading ${mp3Files.length} MP3s from index`);

            mp3Files.forEach(fileName => {
                const option = document.createElement('option');
                option.value = fileName;
                
                // Create display name: remove .mp3 extension and replace underscores
                let displayName = fileName.replace(/\.mp3$/i, '').replace(/_/g, ' ');
                
                // Truncate long names with ellipsis (max 35 characters to fit nicely in dropdown)
                const maxLength = 35;
                if (displayName.length > maxLength) {
                    displayName = displayName.substring(0, maxLength - 3) + '...';
                }
                
                option.textContent = displayName;
                option.title = fileName.replace(/\.mp3$/i, '').replace(/_/g, ' '); // Full name in tooltip
                trackSelectElement.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error loading MP3 index:', error);
            // Fallback: Add a message option
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Error loading tracks';
            option.disabled = true;
            trackSelectElement.appendChild(option);
        }
    }

    async loadAndPlayTrack(fileName) {
        if (this.isPlaying) {
            this.stop(); // Stop current track if playing
        }
        
        // Use Electron-aware path resolution
        const relativePath = `mp3/${fileName}`;
        const filePath = this.resolveFilePath(relativePath);
        console.log(`Loading track: ${fileName} -> ${filePath}`);
        
        // Update the file name display immediately
        const fileNameDisplay = document.getElementById('file-name-display');
        if (fileNameDisplay) {
            fileNameDisplay.innerHTML = this.formatTrackName(fileName);
        }

        // Update track name display
        document.getElementById('track-name-vertical').textContent = fileName.replace(/\.[^/.]+$/, ""); // Remove extension

        try {
            // In Electron, check if file exists first. In browser, just try to load it
            if (this.isElectron && !this.checkFileExists(filePath)) {
                console.error(`File not found: ${filePath}`);
                this.updateStatusMessageWithText(`File not found: ${fileName}`);
                return;
            }

            await this.loadAudioFromURL(filePath); // This method should handle loading and preparing for play

            if (this.audioElement && !this.isPlaying) { // Ensure it plays after loading
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                await this.audioElement.play();
                this.isPlaying = true;
                document.getElementById('play-pause').textContent = '❚❚ PAUSE';
                document.getElementById('play-pause').classList.add('playing');
                if (!this.animationId) { // Start animation loop if not already running
                    this.animate();
                }
                this.updateStatusMessage();
            }
        } catch (error) {
            console.error(`Error loading track ${fileName}:`, error);
            this.updateStatusMessageWithText(`Error loading ${fileName}. Check console.`);
        }
    }
    
    // Audio input tab switching methods
    switchAudioInputTab(tabType) {
        console.log(`Switching to tab: ${tabType}, active source: ${this.activeAudioSource}`);
        
        try {
            // DON'T stop existing audio streams - just switch UI tabs
            
            // Update tabs (UI only)
            document.querySelectorAll('.input-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Activate selected tab
            document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');
            document.getElementById(`${tabType}-tab-content`).classList.add('active');
            
            // Update audio input source tracking (for UI purposes)
            this.audioInputSource = tabType;
            
            // Enumerate devices if switching to input tab
            if (tabType === 'input') {
                setTimeout(() => this.enumerateAudioDevices().catch(console.error), 100);
            }
            
            // Update tab indicators to show what's actually playing
            this.updateTabIndicators();
            
            this.updateStatusMessage();
            
        } catch (error) {
            console.error('Error switching audio input tab:', error);
            this.updateStatusMessage('Error switching audio input tab');
        }
    }
    
    updateTabIndicators() {
        // Remove playing class from all tabs
        document.querySelectorAll('.input-tab').forEach(tab => {
            tab.classList.remove('playing');
        });
        
        // Add playing class to active source tab
        if (this.activeAudioSource === 'file' && this.fileAudioActive) {
            document.querySelector('[data-tab="file"]').classList.add('playing');
        } else if (this.activeAudioSource === 'input' && this.inputAudioActive) {
            document.querySelector('[data-tab="input"]').classList.add('playing');
        }
        
        console.log(`Tab indicators updated. Active source: ${this.activeAudioSource}, File: ${this.fileAudioActive}, Input: ${this.inputAudioActive}`);
    }
    
    disconnectInputAudio() {
        // Stop ultra-fast audio polling
        this.stopUltraFastAudioPolling();
        
        if (this.microphoneStream) {
            this.microphoneStream.getTracks().forEach(track => track.stop());
            this.microphoneStream = null;
        }
        if (this.lineStream) {
            this.lineStream.getTracks().forEach(track => track.stop());
            this.lineStream = null;
        }
        
        // Disable audio monitoring
        this.audioMonitoringEnabled = false;
        const audioMonitoringCheckbox = document.getElementById('audio-monitoring');
        if (audioMonitoringCheckbox) {
            audioMonitoringCheckbox.checked = false;
        }
        this.updateAudioMonitoring();
        
        // Update button state
        const inputButton = document.getElementById('input-connect');
        if (inputButton) {
            inputButton.classList.remove('connected');
            inputButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Connect Audio Input
            `;
        }
        
        // Update status
        const inputStatus = document.getElementById('input-status');
        const inputStatusContainer = document.getElementById('input-status-container');
        if (inputStatus) {
            inputStatus.textContent = 'Ready to connect';
            inputStatusContainer.classList.remove('connected', 'error');
        }
        
        this.inputAudioActive = false;
        console.log('Input audio disconnected');
    }
    
    updateAudioMonitoring() {
        if (!this.audioContext || !this.audioSource) {
            return;
        }
        
        try {
            if (this.audioMonitoringEnabled) {
                // Create monitoring gain node if it doesn't exist
                if (!this.monitorGainNode) {
                    this.monitorGainNode = this.audioContext.createGain();
                    this.monitorGainNode.gain.setValueAtTime(this.monitorVolume, this.audioContext.currentTime);
                }
                
                // Connect audio through EQ chain to speakers for monitoring
                // Use highEQ as the output point so EQ affects monitoring
                if (this.highEQ) {
                    this.highEQ.connect(this.monitorGainNode);
                } else {
                    // Fallback to direct connection if EQ not set up
                    this.audioSource.connect(this.monitorGainNode);
                }
                this.monitorGainNode.connect(this.audioContext.destination);
                
                console.log('🔊 Audio monitoring enabled at volume:', this.monitorVolume, 'with EQ');
            } else {
                // Disconnect monitoring
                if (this.monitorGainNode) {
                    try {
                        if (this.highEQ) {
                            this.highEQ.disconnect(this.monitorGainNode);
                        } else {
                            this.audioSource.disconnect(this.monitorGainNode);
                        }
                        this.monitorGainNode.disconnect(this.audioContext.destination);
                    } catch (e) {
                        // Ignore disconnect errors
                    }
                }
                
                console.log('🔇 Audio monitoring disabled');
            }
        } catch (error) {
            console.error('Error updating audio monitoring:', error);
        }
    }
    
    async enumerateAudioDevices() {
        try {
            console.log('🎤 Enumerating audio devices...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
            
            console.log(`Found ${audioInputDevices.length} audio input devices:`, audioInputDevices);
            
            // Update unified input device dropdown
            const inputDeviceSelect = document.getElementById('input-device-select');
            
            if (inputDeviceSelect) {
                inputDeviceSelect.innerHTML = '<option value="">Default audio input</option>';
                audioInputDevices.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Audio Input ${index + 1}`;
                    inputDeviceSelect.appendChild(option);
                    console.log(`Added input device: ${option.textContent} (${device.deviceId})`);
                });
            }
            
            return audioInputDevices;
        } catch (error) {
            console.error('Error enumerating audio devices:', error);
            return [];
        }
    }
    
    async connectAudioInput() {
        try {
            const inputButton = document.getElementById('input-connect');
            const inputStatus = document.getElementById('input-status');
            const inputStatusContainer = document.getElementById('input-status-container');
            
            // If already connected, disconnect
            if (this.microphoneStream || this.lineStream) {
                this.disconnectInputAudio();
                
                // Update status
                this.activeAudioSource = null;
                this.inputAudioActive = false;
                this.updateTabIndicators();
                
                // Keep animation running for idle/anomaly visuals
                if (!this.animationId) {
                    this.animate();
                }
                return;
            }
            
            // Stop file audio if active (input overrides file)
            if (this.activeAudioSource === 'file' && this.audioElement) {
                this.audioElement.pause();
                this.audioElement.remove();
                this.audioElement = null;
                this.fileAudioActive = false;
                
                // Reset play/pause button to initial state since file is no longer playing
                this.isPlaying = false;
                document.getElementById('play-pause').textContent = '▶ PLAY';
                document.getElementById('play-pause').classList.remove('playing');
                
                console.log('File audio stopped - input audio taking over');
            }
            
            inputStatus.textContent = 'Requesting audio input access...';
            inputStatusContainer.classList.remove('error');
            
            // Get selected device ID
            const inputDeviceSelect = document.getElementById('input-device-select');
            const selectedDeviceId = inputDeviceSelect ? inputDeviceSelect.value : '';
            
            // Build audio constraints for ultra-low latency
            const audioConstraints = {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
                // Ultra-low latency optimizations
                latency: 0.001,  // Request 1ms latency (extremely low)
                sampleRate: 96000,  // Higher sample rate for better quality and potentially lower latency
                channelCount: 1,  // Mono to reduce processing overhead
                // Additional latency reduction constraints
                googAutoGainControl: false,
                googNoiseSuppression: false,
                googEchoCancellation: false,
                googDAEchoCancellation: false,
                googHighpassFilter: false,
                googAudioMirroring: false,
                googTypingNoiseDetection: false
            };
            
            // Add device ID if a specific device is selected
            if (selectedDeviceId) {
                audioConstraints.deviceId = { exact: selectedDeviceId };
            }
            
            // Request audio input access
            const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints
            });
            
            // Store as microphone stream for compatibility with existing code
            this.microphoneStream = audioStream;
            
            await this.setupStreamAudio(audioStream);
            
            // Update audio monitoring if enabled
            this.updateAudioMonitoring();
            
            inputButton.classList.add('connected');
            inputButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                Disconnect Audio Input
            `;
            inputStatus.textContent = 'Audio input connected';
            inputStatusContainer.classList.add('connected');
            
            // Update track display
            const selectedOption = inputDeviceSelect.options[inputDeviceSelect.selectedIndex];
            const deviceName = selectedOption.textContent || 'Audio Input';
            document.getElementById('track-name-vertical').textContent = deviceName;
            this.isPlaying = true;
            
            // Set active source to input
            this.activeAudioSource = 'input';
            this.inputAudioActive = true;
            this.fileAudioActive = false;
            
            // Update tab indicators
            this.updateTabIndicators();
            
            // Enable audio monitoring by default for mic/line input
            this.audioMonitoringEnabled = true;
            const audioMonitoringCheckbox = document.getElementById('audio-monitoring');
            if (audioMonitoringCheckbox) {
                audioMonitoringCheckbox.checked = true;
            }
            this.updateAudioMonitoring();
            
            console.log('Input audio active, file audio stopped, monitoring enabled');
            
            // Start animation
            if (!this.animationId) {
                this.animate();
            }
            
        } catch (error) {
            console.error('Error connecting audio input:', error);
            const inputStatus = document.getElementById('input-status');
            const inputStatusContainer = document.getElementById('input-status-container');
            inputStatus.textContent = 'Audio input access denied';
            inputStatusContainer.classList.add('error');
            
            // Keep animation running for idle/anomaly visuals even on error
            if (!this.animationId) {
                this.animate();
            }
        }
    }
    
    async setupStreamAudio(stream) {
        try {
            // Create audio context with ultra-low latency settings if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                    latencyHint: 'interactive',  // Optimize for lowest possible latency
                    sampleRate: 48000  // Request high sample rate for better precision
                });
                
                // Set smaller buffer sizes for lower latency (browser permitting)
                if (this.audioContext.audioWorklet) {
                    // Request smaller buffer size if supported
                    try {
                        const outputLatency = this.audioContext.outputLatency || 0.01;
                        const baseLatency = this.audioContext.baseLatency || 0.005;
                        console.log(`Audio latency: output=${outputLatency.toFixed(3)}s, base=${baseLatency.toFixed(3)}s`);
                    } catch (e) {
                        console.log('Latency info not available');
                    }
                }
            }
            
            // Resume if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Create audio source from stream
            this.audioSource = this.audioContext.createMediaStreamSource(stream);
            
            // Set up analyzer with ultra-optimized settings for lowest latency
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;  // Further reduced from 512 for even lower latency (50% less processing)
            this.analyser.smoothingTimeConstant = 0.1;  // Minimal smoothing for maximum responsiveness
            const clampedSmoothing = Math.max(0, Math.min(1, this.smoothing));
            this.analyser.smoothingTimeConstant = Math.min(clampedSmoothing, 0.3); // Cap smoothing for responsiveness
            
            // Create EQ filters
            this.bassEQ = this.audioContext.createBiquadFilter();
            this.bassEQ.type = 'lowshelf';
            this.bassEQ.frequency.value = 250;
            this.bassEQ.gain.value = 0;

            this.midEQ = this.audioContext.createBiquadFilter();
            this.midEQ.type = 'peaking';
            this.midEQ.frequency.value = 1000;
            this.midEQ.Q.value = 1;
            this.midEQ.gain.value = 0;

            this.highEQ = this.audioContext.createBiquadFilter();
            this.highEQ.type = 'highshelf';
            this.highEQ.frequency.value = 4000;
            this.highEQ.gain.value = 0;
            
            // Connect audio graph: source -> EQ -> analyzer (no destination for input streams)
            this.audioSource.connect(this.bassEQ);
            this.bassEQ.connect(this.midEQ);
            this.midEQ.connect(this.highEQ);
            this.highEQ.connect(this.analyser);
            
            // Set up data arrays
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.frequencyData = new Float32Array(this.bufferLength);
            
            // Start ultra-high frequency audio polling for minimum latency
            this.startUltraFastAudioPolling();
            
            // Initialize or recreate grid cell animator
            if (this.gridCellAnimator) {
                this.gridCellAnimator.dispose();
            }
            this.gridCellAnimator = new GridCellAnimator(this.gridSize, this.scene, this.analyser, this.gridColor, this.backgroundColor);
            
            // Update EQ controls
            this.setupEQControls();
            
            console.log('Stream audio setup complete');
            
        } catch (error) {
            console.error('Error setting up stream audio:', error);
            throw error;
        }
    }
    
    startUltraFastAudioPolling() {
        // Clear any existing ultra-fast polling
        if (this.ultraFastAudioTimer) {
            clearInterval(this.ultraFastAudioTimer);
        }
        
        // Set up ultra-high frequency audio analysis (120 FPS for sub-frame responsiveness)
        this.ultraFastAudioTimer = setInterval(() => {
            if (this.analyser && this.isPlaying && (this.audioInputSource === 'input' || this.audioInputSource === 'mic' || this.audioInputSource === 'line')) {
                // Quick analysis for input latency reduction
                this.analyser.getByteFrequencyData(this.dataArray);
                
                // Fast bass/mid/high calculation for immediate response
                const bassSum = this.dataArray.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
                const midSum = this.dataArray.slice(8, 32).reduce((a, b) => a + b, 0) / 24;
                const highSum = this.dataArray.slice(32, 64).reduce((a, b) => a + b, 0) / 32;
                
                // DIRECT intensity updates for immediate visual response (bypass main analysis completely)
                this.bassIntensity = (bassSum / 255) * this.sensitivity;
                this.midIntensity = (midSum / 255) * this.sensitivity;
                this.highIntensity = (highSum / 255) * this.sensitivity;
                
                // Mark that ultra-fast values are active to prevent main analysis override
                this.ultraFastValuesActive = true;
            }
        }, 1000 / 120); // 120 FPS = ~8.3ms intervals for ultra-low latency
    }
    
    stopUltraFastAudioPolling() {
        if (this.ultraFastAudioTimer) {
            clearInterval(this.ultraFastAudioTimer);
            this.ultraFastAudioTimer = null;
        }
        // Reset flag so main analysis can take over
        this.ultraFastValuesActive = false;
    }
    
    setupEQControls() {
        const eqBass = document.getElementById('eq-bass');
        const eqMid = document.getElementById('eq-mid');
        const eqHigh = document.getElementById('eq-high');
        const eqBassValue = document.getElementById('eq-bass-value');
        const eqMidValue = document.getElementById('eq-mid-value');
        const eqHighValue = document.getElementById('eq-high-value');
        
        if (eqBass && this.bassEQ) {
            // Set current EQ value from slider
            const currentBass = parseFloat(eqBass.value);
            this.bassEQ.gain.value = currentBass;
            if (eqBassValue) eqBassValue.textContent = `${currentBass} dB`;
            
            eqBass.addEventListener('input', e => {
                const gain = parseFloat(e.target.value);
                this.bassEQ.gain.value = gain;
                if (eqBassValue) eqBassValue.textContent = `${gain} dB`;
            });
        }
        
        if (eqMid && this.midEQ) {
            // Set current EQ value from slider
            const currentMid = parseFloat(eqMid.value);
            this.midEQ.gain.value = currentMid;
            if (eqMidValue) eqMidValue.textContent = `${currentMid} dB`;
            
            eqMid.addEventListener('input', e => {
                const gain = parseFloat(e.target.value);
                this.midEQ.gain.value = gain;
                if (eqMidValue) eqMidValue.textContent = `${gain} dB`;
            });
        }
        
        if (eqHigh && this.highEQ) {
            // Set current EQ value from slider
            const currentHigh = parseFloat(eqHigh.value);
            this.highEQ.gain.value = currentHigh;
            if (eqHighValue) eqHighValue.textContent = `${currentHigh} dB`;
            
            eqHigh.addEventListener('input', e => {
                const gain = parseFloat(e.target.value);
                this.highEQ.gain.value = gain;
                if (eqHighValue) eqHighValue.textContent = `${gain} dB`;
            });
        }
    }

    // ==========================================
    // COLLISION DETECTION OPTIMIZATION SYSTEM
    // ==========================================
  
    
    /**
     * Create spatial partitioning grid for efficient collision detection
     */
    updateSpatialGrid() {
        const now = performance.now();
        if (now - this.collisionOptimization.lastGridUpdate < this.collisionOptimization.gridUpdateInterval) {
            return; // Don't update too frequently
        }
        
        this.collisionOptimization.spatialGrid.clear();
        this.collisionOptimization.lastGridUpdate = now;
        
        // Add all floating blobs to spatial grid
        for (let i = 0; i < this.floatingBlobs.length; i++) {
            const blob = this.floatingBlobs[i];
            const position = blob.mesh.position;
            const radius = blob.baseSize * blob.currentScale;
            
            // Calculate which grid cells this blob occupies
            const minX = Math.floor((position.x - radius) / this.collisionOptimization.gridSize);
            const maxX = Math.floor((position.x + radius) / this.collisionOptimization.gridSize);
            const minY = Math.floor((position.y - radius) / this.collisionOptimization.gridSize);
            const maxY = Math.floor((position.y + radius) / this.collisionOptimization.gridSize);
            const minZ = Math.floor((position.z - radius) / this.collisionOptimization.gridSize);
            const maxZ = Math.floor((position.z + radius) / this.collisionOptimization.gridSize);
            
            // Add blob to all grid cells it occupies
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const cellKey = `${x},${y},${z}`;
                        if (!this.collisionOptimization.spatialGrid.has(cellKey)) {
                            this.collisionOptimization.spatialGrid.set(cellKey, []);
                        }
                        this.collisionOptimization.spatialGrid.get(cellKey).push(i);
                    }
                }
            }
        }
    }
      /**
     * Get potential collision pairs using spatial partitioning with enhanced optimizations
     */
    getPotentialCollisionPairs() {
        const pairs = new Set();
        const maxDistance = this.collisionOptimization.qualityLevels[this.collisionOptimization.currentQuality].maxDistance;
        const now = performance.now();
        
        // Enhanced broad-phase culling: Skip very small or nearly stationary blobs
        const activeBlobs = this.floatingBlobs.filter((blob, index) => {
            const size = blob.baseSize * blob.currentScale;
            const velocity = blob.velocity ? blob.velocity.length() : 0;
            
            // Skip very small blobs (< 0.3 size) or nearly stationary blobs (< 0.1 velocity)
            if (size < 0.3 || velocity < 0.1) {
                this.collisionOptimization.stats.broadPhaseCulled++;
                return false;
            }
            return true;
        });
        
        // Iterate through each grid cell
        for (const [cellKey, blobIndices] of this.collisionOptimization.spatialGrid) {
            // Check all pairs within this cell
            for (let i = 0; i < blobIndices.length; i++) {
                for (let j = i + 1; j < blobIndices.length; j++) {
                    const idx1 = blobIndices[i];
                    const idx2 = blobIndices[j];
                    
                    // Skip if already processed
                    const pairKey = `${Math.min(idx1, idx2)}-${Math.max(idx1, idx2)}`;
                    if (pairs.has(pairKey)) continue;
                      // Temporal coherence optimization: Check collision cache
                    const cacheKey = pairKey;
                    const cachedResult = this.collisionOptimization.collisionCache.get(cacheKey);
                    if (cachedResult && (now - cachedResult.timestamp) < this.collisionOptimization.cacheTimeout) {
                        // Validate cache entry with position change
                        const blob1 = this.floatingBlobs[idx1];
                        const blob2 = this.floatingBlobs[idx2];
                        
                        // Safety check: ensure both blobs exist and have mesh
                        if (!blob1 || !blob2 || !blob1.mesh || !blob2.mesh) {
                            this.collisionOptimization.collisionCache.delete(cacheKey);
                            continue;
                        }
                        
                        const positionChange1 = blob1.mesh.position.distanceTo(cachedResult.pos1);
                        const positionChange2 = blob2.mesh.position.distanceTo(cachedResult.pos2);
                        
                        if (positionChange1 < 0.5 && positionChange2 < 0.5) {
                            // Use cached result
                            if (cachedResult.shouldCollide) {
                                pairs.add(pairKey);
                            }
                            this.collisionOptimization.stats.cacheHits++;
                            this.collisionOptimization.stats.temporalCoherenceSkips++;
                            continue;
                        }
                    }
                    
                    // Distance check for performance
                    const blob1 = this.floatingBlobs[idx1];
                    const blob2 = this.floatingBlobs[idx2];
                    
                    // Safety check: ensure both blobs exist and have mesh
                    if (!blob1 || !blob2 || !blob1.mesh || !blob2.mesh) {
                        continue;
                    }
                    
                    const distance = blob1.mesh.position.distanceTo(blob2.mesh.position);
                      const shouldCollide = distance <= maxDistance;
                    if (shouldCollide) {
                        pairs.add(pairKey);
                        this.collisionOptimization.stats.totalChecks++;
                    } else {
                        this.collisionOptimization.stats.spatialOptimizations++;
                    }
                    
                    // Cache the result for temporal coherence (with safety check)
                    if (blob1.mesh && blob2.mesh) {
                        this.collisionOptimization.collisionCache.set(cacheKey, {
                            shouldCollide: shouldCollide,
                            timestamp: now,
                            pos1: blob1.mesh.position.clone(),
                            pos2: blob2.mesh.position.clone()
                        });
                    }
                }
            }
        }
        
        // Periodic cache cleanup
        this.cleanupCollisionCache(now);
        
        return Array.from(pairs).map(pair => {
            const [idx1, idx2] = pair.split('-').map(Number);
            return [idx1, idx2];
        });
    }
    
    /**
     * Clean up old collision cache entries to prevent memory buildup
     */
    cleanupCollisionCache(currentTime) {
        const cleanupInterval = 5000; // Clean every 5 seconds
        if (!this.collisionOptimization.lastCacheCleanup) {
            this.collisionOptimization.lastCacheCleanup = currentTime;
            return;
        }
        
        if (currentTime - this.collisionOptimization.lastCacheCleanup > cleanupInterval) {
            let removedCount = 0;
            for (const [key, entry] of this.collisionOptimization.collisionCache) {
                if (currentTime - entry.timestamp > this.collisionOptimization.cacheTimeout * 2) {
                    this.collisionOptimization.collisionCache.delete(key);
                    removedCount++;
                }
            }
            this.collisionOptimization.stats.cacheCleanups += removedCount;
            this.collisionOptimization.lastCacheCleanup = currentTime;
        }
    }
    
    /**
     * Check if collision detection should be performed this frame
     */
    shouldPerformCollisionDetection() {
        const quality = this.collisionOptimization.qualityLevels[this.collisionOptimization.currentQuality];
        
        // Performance-based frame skipping
        if (quality.frameSkip > 0) {
            this.collisionOptimization.currentSkipCount++;
            if (this.collisionOptimization.currentSkipCount <= quality.frameSkip) {
                this.collisionOptimization.stats.frameSkips++;
                return false;
            }
            this.collisionOptimization.currentSkipCount = 0;
        }
        
        return true;
    }
    
    /**
     * Adjust collision detection quality based on performance
     */
    adjustCollisionQuality() {
        const now = performance.now();
        if (now - this.collisionOptimization.lastPerformanceCheck < this.collisionOptimization.performanceCheckInterval) {
            return;
        }
        
        this.collisionOptimization.lastPerformanceCheck = now;
        
        // Get performance metrics from performance monitor
        if (this.performanceMonitor && this.performanceMonitor.frameRates.length > 30) {
            const avgFPS = this.performanceMonitor.frameRates.reduce((sum, fps) => sum + fps, 0) / this.performanceMonitor.frameRates.length;
            const currentQuality = this.collisionOptimization.currentQuality;
            const qualityLevels = ['high', 'medium', 'low'];
            const currentIndex = qualityLevels.indexOf(currentQuality);
            
            // Decrease quality if performance is poor
            if (avgFPS < 45 && currentIndex < qualityLevels.length - 1) {
                this.collisionOptimization.currentQuality = qualityLevels[currentIndex + 1];
                console.log(`🔧 Quality↓: ${this.collisionOptimization.currentQuality} (FPS: ${avgFPS.toFixed(1)})`);
            }
            // Increase quality if performance is good
            else if (avgFPS > 55 && currentIndex > 0) {
                this.collisionOptimization.currentQuality = qualityLevels[currentIndex - 1];
                console.log(`⚡ Quality↑: ${this.collisionOptimization.currentQuality} (FPS: ${avgFPS.toFixed(1)})`);
            }
        }
    }
    
    async loadAudioFile(file) {
        if (!file) return;
        
        try {
            // Stop ultra-fast audio polling when switching to file audio
            this.stopUltraFastAudioPolling();
            
            // Set audio input source to file
            this.audioInputSource = 'file';
            
            // Stop input audio if active (file overrides input)
            if (this.activeAudioSource === 'input') {
                this.disconnectInputAudio();
                this.inputAudioActive = false;
                console.log('Input audio stopped - file audio taking over');
            }
            
            // Create audio context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Create audio element
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement.remove();
            }
              this.audioElement = new Audio();
            this.audioElement.src = URL.createObjectURL(file);
            this.audioElement.crossOrigin = 'anonymous';            this.audioElement.loop = this.isLooping; // Set loop property based on current state
            
            // Setup audio analysis
            this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            // Clamp smoothingTimeConstant to valid range [0,1] for Web Audio API
            const clampedSmoothing = Math.max(0, Math.min(1, this.smoothing));
            this.analyser.smoothingTimeConstant = clampedSmoothing;
            
            // Create EQ filters: bass (lowshelf), mid (peaking), high (highshelf)
            this.bassEQ = this.audioContext.createBiquadFilter();
            this.bassEQ.type = 'lowshelf';
            this.bassEQ.frequency.value = 250;
            this.bassEQ.gain.value = 0;

            this.midEQ = this.audioContext.createBiquadFilter();
            this.midEQ.type = 'peaking';
            this.midEQ.frequency.value = 1000;
            this.midEQ.Q.value = 1;
            this.midEQ.gain.value = 0;

            this.highEQ = this.audioContext.createBiquadFilter();
            this.highEQ.type = 'highshelf';
            this.highEQ.frequency.value = 4000;
            this.highEQ.gain.value = 0;

            // Connect audio graph: source -> bass -> mid -> high -> analyser -> destination
            this.audioSource.connect(this.bassEQ);
            this.bassEQ.connect(this.midEQ);
            this.midEQ.connect(this.highEQ);
            this.highEQ.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            // Setup EQ slider controls
            const eqBass = document.getElementById('eq-bass');
            const eqMid = document.getElementById('eq-mid');
            const eqHigh = document.getElementById('eq-high');
            const eqBassValue = document.getElementById('eq-bass-value');
            const eqMidValue = document.getElementById('eq-mid-value');
            const eqHighValue = document.getElementById('eq-high-value');
            
            eqBass.addEventListener('input', e => {
                const gain = parseFloat(e.target.value);
                this.bassEQ.gain.value = gain;
                eqBassValue.textContent = `${gain} dB`;
            });
            eqMid.addEventListener('input', e => {
                const gain = parseFloat(e.target.value);
                this.midEQ.gain.value = gain;
                eqMidValue.textContent = `${gain} dB`;
            });
            eqHigh.addEventListener('input', e => {
                const gain = parseFloat(e.target.value);
                this.highEQ.gain.value = gain;
                eqHighValue.textContent = `${gain} dB`;
            });            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.frequencyData = new Float32Array(this.bufferLength);
              // Initialize or recreate grid cell animator now that we have an analyzer
            if (this.gridCellAnimator) {
                this.gridCellAnimator.dispose();
            }
            this.gridCellAnimator = new GridCellAnimator(this.gridSize, this.scene, this.analyser, this.gridColor, this.backgroundColor);
            
            // Update new vertical track display
            document.getElementById('track-name-vertical').textContent = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            document.getElementById('play-pause').disabled = false;
            
            // Update custom file input display to show loaded filename
            const fileNameDisplay = document.getElementById('file-name-display');
            if (fileNameDisplay) {
                const maxLength = 20;
                const displayName = file.name.length > maxLength ? 
                    file.name.substring(0, maxLength) + '...' : file.name;
                fileNameDisplay.textContent = displayName;
            }
              // Reset BPM detector (but don't reset display to allow detection to work)
            this.bpmDetector.peaks = [];
            this.bpmDetector.bpm = 0;
            // Note: We don't reset the display here to prevent interfering with BPM detection
              // Update time display
            this.audioElement.addEventListener('timeupdate', () => {
                this.updateTimeDisplay();
            });

            // Handle track ending
            this.audioElement.addEventListener('ended', () => {
                if (this.isLooping) {
                    // Restart the track if looping is enabled
                    this.audioElement.currentTime = 0;
                    this.audioElement.play().catch(error => {
                        console.error('Error restarting loop:', error);
                    });
                } else {
                    // Reset to play state when track ends naturally
                    this.isPlaying = false;
                    document.getElementById('play-pause').textContent = '▶ PLAY';
                    document.getElementById('play-pause').classList.remove('playing');
                    this.updateStatusMessage();
                }
            });
              // Auto-play new file regardless of current state
            try {
                // Resume AudioContext if suspended (this is triggered by user file selection)
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                    console.log('AudioCtx resumed');
                }
                
                // Always attempt to start playback when loading a new file
                await this.audioElement.play();
                this.isPlaying = true;
                document.getElementById('play-pause').textContent = '⏸ PAUSE';
                document.getElementById('play-pause').classList.add('playing');
                console.log('Audio loaded, auto-started');
                
            } catch (error) {
                console.log('Auto-play blocked - user action needed:', error.message);
                this.isPlaying = false;
                document.getElementById('play-pause').textContent = '▶ PLAY';
                document.getElementById('play-pause').classList.remove('playing');
            }
            
            // Set file audio as active and update tab indicators
            this.activeAudioSource = 'file';
            this.fileAudioActive = true;
            this.updateTabIndicators();
            console.log('File audio active, tab indicators updated');
            
            // Update status message after loading audio file
            this.updateStatusMessage();
              } catch (error) {
            console.error('Error loading audio file:', error);
        }
    }      async loadAudioFromURL(url) {
        try {
            console.log(`Loading audio: ${url}`);
            
            // Check if we're running from file:// protocol
            if (window.location.protocol === 'file:') {
                console.log('file:// mode - using direct element');
                
                // For local files, create audio element directly
                if (this.audioElement) {
                    this.audioElement.pause();
                    this.audioElement.remove();
                }
                
                // Create audio context if needed
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                this.audioElement = new Audio();
                this.audioElement.src = url;
                this.audioElement.crossOrigin = 'anonymous';
                this.audioElement.loop = this.isLooping;
                  // Setup audio analysis
                this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 1024;
                // Clamp smoothingTimeConstant to valid range [0,1] for Web Audio API
                const clampedSmoothing = Math.max(0, Math.min(1, this.smoothing));
                this.analyser.smoothingTimeConstant = clampedSmoothing;
                
                // Create EQ filters
                this.bassEQ = this.audioContext.createBiquadFilter();
                this.bassEQ.type = 'lowshelf';
                this.bassEQ.frequency.value = 250;
                this.bassEQ.gain.value = 0;

                this.midEQ = this.audioContext.createBiquadFilter();
                this.midEQ.type = 'peaking';
                this.midEQ.frequency.value = 1000;
                this.midEQ.Q.value = 1;
                this.midEQ.gain.value = 0;

                this.highEQ = this.audioContext.createBiquadFilter();
                this.highEQ.type = 'highshelf';
                this.highEQ.frequency.value = 4000;
                this.highEQ.gain.value = 0;

                // Connect audio graph
                this.audioSource.connect(this.bassEQ);
                this.bassEQ.connect(this.midEQ);
                this.midEQ.connect(this.highEQ);
                this.highEQ.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                this.bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(this.bufferLength);
                this.frequencyData = new Float32Array(this.bufferLength);
                
                // Initialize or recreate grid cell animator
                if (this.gridCellAnimator) {
                    this.gridCellAnimator.dispose();
                }
                this.gridCellAnimator = new GridCellAnimator(this.gridSize, this.scene, this.analyser, this.gridColor, this.backgroundColor);
                
                // Enable play button
                document.getElementById('play-pause').disabled = false;
                
                // Handle track ending
                this.audioElement.addEventListener('ended', () => {
                    if (this.isLooping) {
                        this.audioElement.currentTime = 0;
                        this.audioElement.play().catch(error => {
                            console.error('Error restarting loop:', error);
                        });
                    } else {
                        this.isPlaying = false;
                        document.getElementById('play-pause').textContent = '▶ PLAY';
                        document.getElementById('play-pause').classList.remove('playing');
                        this.updateStatusMessage();
                    }
                });
                
                console.log(`Audio loaded (local): ${url}`);
                return;
            }
            
            // For HTTP/HTTPS protocols, use fetch approach
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio file: ${response.status}`);
            }
            
            // Convert to blob and then to File object
            const blob = await response.blob();
            const filename = url.split('/').pop() || 'default.mp3';
            const file = new File([blob], filename, { type: blob.type || 'audio/mpeg' });
            
            // Use the existing loadAudioFile method
            await this.loadAudioFile(file);
            console.log(`Audio loaded: ${url}`);
        } catch (error) {
            console.error('Error loading audio from URL:', error);
            // Don't throw the error - just log it so the app continues to work
        }
    }
    
    async loadDefaultAudio() {
        const defaultFileName = 'bogdan-rosu-yfflon.mp3';
        const relativePath = `mp3/${defaultFileName}`;
        const resolvedPath = this.resolveFilePath(relativePath);
        console.log('Loading default audio:', resolvedPath);
        
        // Update track name display
        document.getElementById('track-name-vertical').textContent = defaultFileName.replace(/\.[^/.]+$/, "");
        
        try {
            // In Electron, check if file exists first. In browser, just try to load it
            if (this.isElectron && !this.checkFileExists(resolvedPath)) {
                console.error(`Default audio file not found: ${resolvedPath}`);
                return;
            }
            
            await this.loadAudioFromURL(resolvedPath);
        } catch (error) {
            console.error('Error loading default audio:', error);
        }
    }
    
    formatTrackName(filename) {
        // If filename is short enough, return as is
        if (filename.length <= 30) {
            return filename;
        }
        
        // Extract file extension
        const lastDotIndex = filename.lastIndexOf('.');
        const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
        const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
        
        // Try to break at natural points (spaces, hyphens, underscores)
        const breakChars = [' ', '-', '_', '.'];
        let bestBreakPoint = -1;
        
        // Look for a good break point around the middle
        const targetLength = Math.floor(name.length / 2);
        const searchRange = Math.min(10, Math.floor(name.length / 4));
        
        for (let i = targetLength - searchRange; i <= targetLength + searchRange; i++) {
            if (i > 0 && i < name.length && breakChars.includes(name[i])) {
                bestBreakPoint = i;
                break;
            }
        }
        
        // If no natural break point found, break at a reasonable length
        if (bestBreakPoint === -1) {
            bestBreakPoint = Math.min(25, Math.floor(name.length * 0.6));
        }
        
        const firstLine = name.substring(0, bestBreakPoint).trim();
        const secondLine = name.substring(bestBreakPoint).trim() + extension;
        
        return `${firstLine}<br>${secondLine}`;
    }    async togglePlayPause() {
        // Handle streaming audio sources (mic/line) - these are always live when connected
        if (this.audioInputSource === 'mic' || this.audioInputSource === 'line') {
            // For streaming sources, there's no play/pause - they're live when connected
            console.log('Streaming audio sources are always live when connected');
            return;
        }
        
        // Handle file audio (existing logic)
        if (!this.audioElement) {
            // If no audio element, try loading default or selected track
            const trackSelect = document.getElementById('track-select');
            if (trackSelect && trackSelect.value) {
                await this.loadAndPlayTrack(trackSelect.value);
                return; // loadAndPlayTrack will handle playback
            } else {
                await this.loadDefaultAudio();
                // After loading default, try to play if we now have an audio element
                if (this.audioElement && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                if (this.audioElement && !this.isPlaying) {
                    try {
                        await this.audioElement.play();
                        this.isPlaying = true;
                        document.getElementById('play-pause').textContent = '❚❚ PAUSE';
                        document.getElementById('play-pause').classList.add('playing');
                        if (!this.animationId) {
                            this.animate();
                        }
                    } catch (error) {
                        console.error("Error playing audio:", error);
                    }
                }
                this.updateStatusMessage();
                return;
            }
        }
        
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
            document.getElementById('play-pause').textContent = '▶ PLAY';
            document.getElementById('play-pause').classList.remove('playing');
        } else {
            try {
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                    console.log('AudioCtx resumed OK');
                }
                await this.audioElement.play();
                this.isPlaying = true;
                document.getElementById('play-pause').textContent = '❚❚ PAUSE';
                document.getElementById('play-pause').classList.add('playing');
                if (!this.animationId) {
                    this.animate();
                }
                console.log('Playback started');
            } catch (error) {
                console.error('Error starting playback:', error);
                // Keep UI in play state to allow user to try again
                this.isPlaying = false;
                document.getElementById('play-pause').textContent = '▶ PLAY';
                document.getElementById('play-pause').classList.remove('playing');
            }
        }
        
        // Update status message after play/pause state change
        this.updateStatusMessage();
    }
      stop() {
        // Handle streaming audio sources - these don't have a stop, only disconnect
        if (this.audioInputSource === 'mic' || this.audioInputSource === 'line') {
            console.log('Streaming audio sources can only be disconnected, not stopped');
            return;
        }
        
        // Handle file audio
        if (!this.audioElement) return;
        
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        document.getElementById('play-pause').textContent = '▶ PLAY';
        document.getElementById('play-pause').classList.remove('playing');
          // Reset visualization
        this.bassIntensity = 0;
        this.midIntensity = 0;
        this.highIntensity = 0;
        
        // Clean up grid cell animator
        if (this.gridCellAnimator) {
            this.gridCellAnimator.dispose();
        }
          // Update status message after stop
        this.updateStatusMessage();
    }    toggleLoop() {
        this.isLooping = !this.isLooping;
        
        // Update loop button appearance
        const loopButton = document.getElementById('loop');
        if (this.isLooping) {
            loopButton.classList.add('active');
        } else {
            loopButton.classList.remove('active');
        }
        
        // Also update the audio element's loop property if it exists
        if (this.audioElement) {
            this.audioElement.loop = this.isLooping;
        }
        
        console.log(`Loop ${this.isLooping ? 'enabled' : 'disabled'}`);
    }

    updatePerformanceDisplay() {
        if (!this.performanceMonitor) return;
        
        const stats = this.performanceMonitor.getStats();
        
        // Update FPS display (keep FPS label)
        document.getElementById('performance-fps').textContent = 
            `${Math.round(stats.avgFPS)}`;
        
        // Update quality level display - use abbreviated form
        const qualityDisplayNames = {
            'high': 'H',
            'medium': 'M', 
            'low': 'L'
        };
        document.getElementById('performance-quality').textContent = 
            `${qualityDisplayNames[stats.currentQuality] || stats.currentQuality}`;
          // Update object count display - use abbreviated form
        const totalObjects = Object.values(stats.objectCounts).reduce((sum, count) => sum + count, 0);
        document.getElementById('performance-objects').textContent = 
            `${totalObjects}`;
    }// Status message update methods
    updateStatusMessage() {
        const statusElement = document.getElementById('status-message');
        if (!statusElement) return;
        
        // Handle MIC/Line tabs
        if (this.audioInputSource === 'mic') {
            if (this.microphoneStream) {
                statusElement.textContent = 'Microphone connected - live visualization';
            } else {
                statusElement.textContent = 'Click connect to start microphone input';
            }
            return;
        }
        
        if (this.audioInputSource === 'line') {
            if (this.lineStream) {
                statusElement.textContent = 'Line input connected - live visualization';
            } else {
                statusElement.textContent = 'Click connect to start line input';
            }
            return;
        }
        
        // Handle File tab
        if (!this.audioElement) {
            statusElement.textContent = 'Push space [_] to start visualization';
        } else if (this.isPlaying) {
            statusElement.textContent = 'Push space [_] to pause';
        } else {
            statusElement.textContent = 'Visualisation on pause push [_] to resume';
        }
    }

    // Track Progress Bar Methods
    initializeTrackProgressBar() {
        const progressContainer = document.getElementById('track-progress-bar');
        if (!progressContainer) return;

        // Clear any existing segments
        progressContainer.innerHTML = '';

        // Create 24 segments (increased from 15 for finer granularity)
        this.progressSegments = [];
        for (let i = 0; i < 24; i++) {
            const segment = document.createElement('div');
            segment.className = 'progress-segment';
            segment.dataset.index = i;
            
            // Add click handler for seeking
            segment.addEventListener('click', (e) => {
                this.seekToSegment(i);
            });
            
            // Add hover handlers for tooltip
            segment.addEventListener('mouseenter', (e) => {
                this.showSegmentTooltip(e, i);
            });
            
            segment.addEventListener('mouseleave', () => {
                this.hideSegmentTooltip();
            });
            
            progressContainer.appendChild(segment);
            this.progressSegments.push(segment);
        }
        
        // Apply initial grid color
        const gridColorHex = '#' + this.gridColor.toString(16).padStart(6, '0');
        const gridColorRgb = this.hexToRgb(gridColorHex);
        const progressBarContainer = document.getElementById('track-progress-container');
        if (progressBarContainer && gridColorRgb) {
            const glowColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.3)`;
            const bgColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.1)`;
            const borderColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.3)`;
            const hoverBgColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.2)`;
            const hoverBorderColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.5)`;
            
            progressBarContainer.style.setProperty('--grid-color', gridColorHex);
            progressBarContainer.style.setProperty('--grid-color-glow', glowColor);
            progressBarContainer.style.setProperty('--grid-color-bg', bgColor);
            progressBarContainer.style.setProperty('--grid-color-border', borderColor);
            progressBarContainer.style.setProperty('--grid-color-hover', hoverBgColor);
            progressBarContainer.style.setProperty('--grid-color-border-hover', hoverBorderColor);
        }
    }

    updateTrackProgress() {
        if (!this.audioElement || !this.progressSegments) return;

        const currentTime = this.audioElement.currentTime;
        const duration = this.audioElement.duration;
        
        if (!duration || duration === 0) return;

        const progress = currentTime / duration;
        const segmentCount = this.progressSegments.length;
        const currentSegment = Math.floor(progress * segmentCount);

        // Update segment states
        this.progressSegments.forEach((segment, index) => {
            segment.classList.remove('filled', 'current');
            
            if (index < currentSegment) {
                segment.classList.add('filled');
            } else if (index === currentSegment) {
                segment.classList.add('current');
            }
        });
    }

    seekToSegment(segmentIndex) {
        if (!this.audioElement || !this.audioElement.duration) return;

        const segmentCount = this.progressSegments.length;
        const targetProgress = segmentIndex / segmentCount;
        const targetTime = targetProgress * this.audioElement.duration;
        
        this.audioElement.currentTime = targetTime;
        this.updateTrackProgress();
    }

    showSegmentTooltip(event, segmentIndex) {
        if (!this.audioElement || !this.audioElement.duration) return;

        const tooltip = document.getElementById('segment-tooltip');
        if (!tooltip) return;

        const segmentCount = this.progressSegments.length;
        const segmentProgress = segmentIndex / segmentCount;
        const segmentTime = segmentProgress * this.audioElement.duration;
        
        // Format time as MM:SS
        const minutes = Math.floor(segmentTime / 60);
        const seconds = Math.floor(segmentTime % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        tooltip.textContent = timeString;
        tooltip.style.display = 'block';
        
        // Position tooltip above the segment
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    }

    hideSegmentTooltip() {
        const tooltip = document.getElementById('segment-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    updateTimeDisplay() {
        if (!this.audioElement) return;

        const currentTime = this.audioElement.currentTime || 0;
        const duration = this.audioElement.duration || 0;
        
        // Format time as MM:SS
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Update time display elements if they exist
        const timeDisplay = document.getElementById('track-time-display');
        if (timeDisplay) {
            timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        }

        // Update progress bar
        this.updateTrackProgress();
    }

    // Idle Anomaly System Methods
    scheduleNextAnomaly() {
        const now = performance.now();
        const interval = this.anomalySystem.minInterval + 
                        Math.random() * (this.anomalySystem.maxInterval - this.anomalySystem.minInterval);
        this.anomalySystem.nextTriggerTime = now + interval;
        this.anomalySystem.lastTriggerTime = now;
    }

    triggerAnomaly() {
        const now = performance.now();
        
        // Set anomaly state
        this.anomalySystem.isActive = true;
        this.anomalySystem.windingDown = false;
        this.anomalySystem.duration = this.anomalySystem.minDuration + 
                                      Math.random() * (this.anomalySystem.maxDuration - this.anomalySystem.minDuration);
        this.anomalySystem.intensity = 0.5 + Math.random() * 0.5; // 0.5 to 1.0 intensity
        this.anomalySystem.peakIntensity = this.anomalySystem.intensity; // Store peak for wind-down
        this.anomalySystem.spawnBlobCount = 0;

        // Display random anomaly message in console
        const message = this.anomalySystem.messages[Math.floor(Math.random() * this.anomalySystem.messages.length)];
        console.log(`/////////////////////////////////////////////////////////`);
        console.log(`${message.padStart(25)} `);
        console.log(`                                                            `);
        console.log(`  ▲▲▲ ARTEFACT STABILITY COMPROMISED ▲▲▲ `);
        console.log(`  System attempting auto-correction...`);
        console.log(`/////////////////////////////////////////////////////////`);

        // Schedule the wind-down phase (not immediate end)
        setTimeout(() => {
            this.startAnomalyWindDown();
        }, this.anomalySystem.duration);
    }

    startAnomalyWindDown() {
        this.anomalySystem.windingDown = true;
        this.anomalySystem.windDownStartTime = performance.now();
        
        console.log(`/////////////////////////////////////////////////////////`);
        console.log(`ARTEFACT STABILIZATION INITIATED`);
        console.log(`Gently returning to baseline state...`);
        console.log(`/////////////////////////////////////////////////////////`);
    }

    endAnomaly() {
        this.anomalySystem.isActive = false;
        this.anomalySystem.windingDown = false;
        this.anomalySystem.intensity = 0;
        this.anomalySystem.spawnBlobCount = 0;
        
        console.log(`/////////////////////////////////////////////////////////`);
        console.log(`ANOMALY STABILIZED`);
        console.log(`System integrity restored. Idle state resumed...`);
        console.log(`/////////////////////////////////////////////////////////`);

        // Schedule next anomaly
        this.scheduleNextAnomaly();
    }

    updateAnomalySystem() {
        // Only trigger anomalies when not playing music
        if (this.isPlaying) {
            return;
        }

        const now = performance.now();

        // Check if it's time to trigger an anomaly
        if (!this.anomalySystem.isActive && now >= this.anomalySystem.nextTriggerTime) {
            this.triggerAnomaly();
        }

        // Handle wind-down phase
        if (this.anomalySystem.windingDown) {
            const windDownElapsed = now - this.anomalySystem.windDownStartTime;
            const windDownProgress = Math.min(windDownElapsed / this.anomalySystem.windDownDuration, 1.0);
            
            // Create smooth wind-down curve (ease-out)
            const easeOutProgress = 1 - Math.pow(1 - windDownProgress, 3);
            
            // Gradually reduce intensity with some gentle wobble
            const wobbleFrequency = 2.0; // Gentle wobble frequency
            const wobbleAmplitude = 0.1 * (1 - windDownProgress); // Wobble fades as we approach end
            const wobble = Math.sin(windDownElapsed * 0.001 * wobbleFrequency * Math.PI * 2) * wobbleAmplitude;
            
            this.anomalySystem.intensity = this.anomalySystem.peakIntensity * (1 - easeOutProgress) + wobble;
            
            // End the anomaly when wind-down is complete
            if (windDownProgress >= 1.0) {
                this.endAnomaly();
            }
        }

        // Handle anomaly blob spawning during active anomaly (but not during wind-down)
        if (this.anomalySystem.isActive && !this.anomalySystem.windingDown && 
            this.anomalySystem.spawnBlobCount < this.anomalySystem.maxSpawnBlobs) {
            // Random chance to spawn blob during anomaly (more frequent spawning)
            if (Math.random() < 0.1) { // 10% chance per frame
                this.spawnAnomalyBlob();
                this.anomalySystem.spawnBlobCount++;
            }
        }
    }

    spawnAnomalyBlob() {
        // Create blob at random position around the ferrofluid
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI;
        const distance = 4 + Math.random() * 2; // 4-6 units from center
        
        const spawnPosition = new THREE.Vector3(
            Math.sin(angle2) * Math.cos(angle1) * distance,
            Math.cos(angle2) * distance,
            Math.sin(angle2) * Math.sin(angle1) * distance
        );

        // Create blob with higher intensity during anomaly
        const intensity = 0.3 + Math.random() * 0.4; // 0.3 to 0.7 intensity
        const blob = this.createFloatingBlob(spawnPosition, intensity, 'anomaly');
        
        console.log(`Anomaly artefact at ${spawnPosition.x.toFixed(1)}, ${spawnPosition.y.toFixed(1)}, ${spawnPosition.z.toFixed(1)}`);
    }
    analyzeAudio() {
        if (!this.analyser || !this.isPlaying) {
            // When paused, gradually return to initial state
            const returnSpeed = 0.02; // How fast to return to neutral state
            this.bassIntensity = Math.max(0, this.bassIntensity - returnSpeed);
            this.midIntensity = Math.max(0, this.midIntensity - returnSpeed);
            this.highIntensity = Math.max(0, this.highIntensity - returnSpeed);
            return;
        }
        
        // For input audio with ultra-fast polling, completely skip analysis to prevent override
        if ((this.audioInputSource === 'input' || this.audioInputSource === 'mic' || this.audioInputSource === 'line') && this.ultraFastValuesActive) {
            // Ultra-fast polling is handling values - just update frequency data for display
            this.analyser.getByteFrequencyData(this.dataArray);
            return;
        }
        
        this.analyser.getByteFrequencyData(this.dataArray);
        this.analyser.getFloatFrequencyData(this.frequencyData);
        
        // Calculate the frequency resolution (Hz per bin)
        const sampleRate = this.audioContext.sampleRate;
        const fftSize = this.analyser.fftSize;
        const frequencyBinWidth = sampleRate / fftSize;
        
        // Define REAL musical frequency ranges (in Hz)
        const bassFreqRange = { min: 20, max: 250 };      // Sub-bass + bass fundamentals
        const midFreqRange = { min: 250, max: 4000 };     // Vocals, most instruments
        const highFreqRange = { min: 4000, max: 20000 };  // Cymbals, harmonics, air
        
        // Convert frequency ranges to FFT bin indices
        const bassBinStart = Math.floor(bassFreqRange.min / frequencyBinWidth);
        const bassBinEnd = Math.floor(bassFreqRange.max / frequencyBinWidth);
        const midBinStart = Math.floor(midFreqRange.min / frequencyBinWidth);
        const midBinEnd = Math.floor(midFreqRange.max / frequencyBinWidth);
        const highBinStart = Math.floor(highFreqRange.min / frequencyBinWidth);
        const highBinEnd = Math.min(Math.floor(highFreqRange.max / frequencyBinWidth), this.bufferLength - 1);
        
        let bassSum = 0, midSum = 0, highSum = 0;
        let bassCount = 0, midCount = 0, highCount = 0;
        
        // BASS: Analyze actual bass frequencies (20-250 Hz)
        for (let i = bassBinStart; i <= bassBinEnd; i++) {
            if (i < this.bufferLength) {
                bassSum += this.dataArray[i];
                bassCount++;
            }
        }
        
        // MIDS: Analyze actual mid frequencies (250-4000 Hz)
        for (let i = midBinStart; i <= midBinEnd; i++) {
            if (i < this.bufferLength) {
                midSum += this.dataArray[i];
                midCount++;
            }
        }
        
        // HIGHS: Analyze actual high frequencies (4000-20000 Hz)
        for (let i = highBinStart; i <= highBinEnd; i++) {
            if (i < this.bufferLength) {
                highSum += this.dataArray[i];
                highCount++;
            }
        }
        
        // Normalize by count and apply sensitivity (prevent division by zero)
        this.bassIntensity = bassCount > 0 ? (bassSum / bassCount / 255) * this.sensitivity : 0;
        this.midIntensity = midCount > 0 ? (midSum / midCount / 255) * this.sensitivity : 0;
        this.highIntensity = highCount > 0 ? (highSum / highCount / 255) * this.sensitivity : 0;        // Apply frequency-specific weighting for better musical response
        this.bassIntensity *= 0.8;  // Increased bass sensitivity for stronger influence
        this.midIntensity *= 1.2;   // Slight mid boost
        this.highIntensity *= 1.1;  // Boost high sensitivity for more dramatic spikes
        
        // Update frequency level indicators in UI
        this.updateFrequencyIndicators();
        
        // Find dominant frequency for display
        let maxIndex = 0;
        let maxValue = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }          const dominantFrequency = maxIndex * frequencyBinWidth;
        document.getElementById('track-freq-display').textContent = `${Math.round(dominantFrequency)} Hz`;
          // BPM Detection
        this.detectBPM();        
        // Debug info (can be removed later)
        if (Math.random() < 0.01) { // Log occasionally to avoid spam
            console.log(`Sample: ${sampleRate}Hz, Bin: ${frequencyBinWidth.toFixed(1)}Hz`);
            console.log(`Bass: ${bassBinStart}-${bassBinEnd} (${bassFreqRange.min}-${bassFreqRange.max}Hz)`);
            console.log(`Mid: ${midBinStart}-${midBinEnd} (${midFreqRange.min}-${midFreqRange.max}Hz)`);
            console.log(`High: ${highBinStart}-${highBinEnd} (${highFreqRange.min}-${highFreqRange.max}Hz)`);
            console.log(`Audio - Bass: ${this.bassIntensity.toFixed(3)}, Mid: ${this.midIntensity.toFixed(3)}, High: ${this.highIntensity.toFixed(3)}`);
        }
    }
      // Simple 3D noise function for organic movement
    noise3D(x, y, z) {
        // Simple pseudo-noise using sine waves
        return (
            Math.sin(x * 0.1) * Math.cos(y * 0.1) * Math.sin(z * 0.1) +
            Math.sin(x * 0.2 + 1.3) * Math.cos(y * 0.2 + 2.1) * Math.sin(z * 0.2 + 3.7) * 0.5 +
            Math.sin(x * 0.4 + 2.7) * Math.cos(y * 0.4 + 1.9) * Math.sin(z * 0.4 + 4.2) * 0.25
        ) / 1.75;    }
    
    updateFerrofluid() {
        if (!this.ferrofluid) return;
        
        const geometry = this.ferrofluid.geometry;
        const positions = geometry.attributes.position.array;
        
        // Frame rate-independent timing for smooth animation
        const now = performance.now() * 0.001; // Convert to seconds
        const deltaTime = now - (this.lastTime || now);
        this.lastTime = now;
        this.fluidTime += deltaTime * 0.5; // Smoother time progression
        
        // Calculate audio influence (default to subtle movement when no music)
        const audioInfluence = Math.max(0.15, this.bassIntensity + this.midIntensity + this.highIntensity);
        const time = this.fluidTime;
        
        // Create dynamic blob centers that move around the surface
        const blobCenters = this.generateDynamicBlobCenters(time);
        
        // Apply organic ferrofluid deformations
        for (let i = 0; i < positions.length; i += 3) {
            const vertexIndex = i / 3;
            const x = this.originalPositions[i];
            const y = this.originalPositions[i + 1];
            const z = this.originalPositions[i + 2];
            
            // Current vertex position in 3D space
            const vertexPos = new THREE.Vector3(x, y, z);
            const distance = vertexPos.length();
            
            // Base organic movement using noise
            const noiseOffset = this.noiseOffsets[vertexIndex];
            const noiseX = x + time * noiseOffset.speed;
            const noiseY = y + time * noiseOffset.speed * 0.8;
            const noiseZ = z + time * noiseOffset.speed * 1.2;
            const baseNoise = this.noise3D(noiseX, noiseY, noiseZ) * 0.5; // Increased from 0.3 for more visible ripples
              // Calculate influence from each dynamic blob center (optimized)
            let totalBlobInfluence = 0;
            
            // Pre-calculate squared distances for efficiency
            blobCenters.forEach(blob => {
                // Distance from vertex to blob center
                const dx = vertexPos.x - blob.position.x;
                const dy = vertexPos.y - blob.position.y;
                const dz = vertexPos.z - blob.position.z;
                const distanceSquared = dx * dx + dy * dy + dz * dz;
                const radiusSquared = blob.radius * blob.radius;
                
                // Only calculate influence if within reasonable range (optimization)
                if (distanceSquared < radiusSquared * 4) {
                    const distance = Math.sqrt(distanceSquared);
                    const influence = Math.exp(-Math.pow(distance / blob.radius, 2));
                    const blobDeformation = influence * blob.intensity * blob.strength;
                    totalBlobInfluence += blobDeformation;
                }
            });
              // Combine base noise with blob influences
            const totalDeformation = baseNoise + totalBlobInfluence;
            
            // Apply deformation along surface normal
            const normal = vertexPos.clone().normalize();
            
            // Add flowing movement for liquid-like behavior
            const flowDirection = new THREE.Vector3(
                this.noise3D(x * 0.1 + time * 0.3, y * 0.1, z * 0.1),
                this.noise3D(x * 0.1, y * 0.1 + time * 0.2, z * 0.1),
                this.noise3D(x * 0.1, y * 0.1, z * 0.1 + time * 0.4)
            ).normalize().multiplyScalar(0.08 * audioInfluence);
              const finalNormal = normal.clone().add(flowDirection).normalize();
              // === ANOMALY DEFORMATION EFFECTS ===
            let anomalyDeformation = 0;
            if (this.anomalySystem.isActive && !this.isPlaying) {
                const anomalyIntensity = this.anomalySystem.intensity;
                
                // Shifting effect - random wave-like deformations
                const shiftTime = time * 3.5;
                const shiftWave = Math.sin(shiftTime + vertexPos.x * 0.8 + vertexPos.z * 0.6) * 
                                 Math.cos(shiftTime * 0.7 + vertexPos.y * 0.5) * anomalyIntensity * 0.4;
                
                // Rippling effect - concentric waves from random centers
                const rippleTime = time * 4.2;
                const rippleCenter1 = new THREE.Vector3(Math.sin(rippleTime * 0.3) * 2, Math.cos(rippleTime * 0.4) * 2, Math.sin(rippleTime * 0.5) * 2);
                const rippleCenter2 = new THREE.Vector3(Math.cos(rippleTime * 0.2) * 1.5, Math.sin(rippleTime * 0.3) * 1.5, Math.cos(rippleTime * 0.6) * 1.5);
                
                const dist1 = vertexPos.distanceTo(rippleCenter1);
                const dist2 = vertexPos.distanceTo(rippleCenter2);
                
                const ripple1 = Math.sin(rippleTime * 2 - dist1 * 1.5) * Math.exp(-dist1 * 0.3) * anomalyIntensity * 0.3;
                const ripple2 = Math.cos(rippleTime * 1.7 - dist2 * 1.2) * Math.exp(-dist2 * 0.4) * anomalyIntensity * 0.25;
                
                // Spike generation - random sharp protrusions
                const spikeNoise = this.noise3D(vertexPos.x * 8 + time * 6, vertexPos.y * 8 + time * 5, vertexPos.z * 8 + time * 7);
                const spikeThreshold = 0.7 - anomalyIntensity * 0.4; // Lower threshold = more spikes during intense anomalies
                const spike = spikeNoise > spikeThreshold ? (spikeNoise - spikeThreshold) * anomalyIntensity * 2.0 : 0;
                
                anomalyDeformation = shiftWave + ripple1 + ripple2 + spike;
            }            
            // === MOUSE RIPPLE WAVE EFFECTS - ENHANCED FOR LIQUID BEHAVIOR ===
            let mouseRippleDeformation = 0;
            if (this.mouseInteraction.waves.length > 0) {
                // Process all active mouse ripple waves
                for (const wave of this.mouseInteraction.waves) {
                    const waveAge = now - wave.startTime;
                      // Skip expired waves (will be cleaned up later) - much longer lifetime for ultra-slow liquid persistence
                    if (waveAge > 8.0) continue; // Increased from 5.0 for even longer lasting waves
                    
                    // Calculate distance from vertex to wave center
                    const distance = vertexPos.distanceTo(wave.center);
                    
                    // Calculate wave propagation with ultra-slow, more liquid-like expansion
                    const waveRadius = waveAge * this.mouseInteraction.waveSpeed;
                    const waveThickness = 1.5; // Further increased from 1.2 for even thicker, more viscous waves
                    
                    // Check if vertex is within the wave ring
                    if (Math.abs(distance - waveRadius) < waveThickness) {
                        // Enhanced wave intensity calculation for more forceful liquid behavior
                        const timeDecay = Math.exp(-waveAge * this.mouseInteraction.waveDecay);
                        const distanceFromWaveEdge = Math.abs(distance - waveRadius);
                        const edgeDecay = Math.exp(-Math.pow(distanceFromWaveEdge / waveThickness, 1.5)); // Softer edge falloff
                        
                        // Generate concentric wave pattern with ultra-slow liquid-like oscillation
                        const wavePhase = distance * this.mouseInteraction.waveFrequency - waveAge * this.mouseInteraction.waveSpeed * 2; // Further reduced multiplier for much slower phase movement
                        
                        // Enhanced wave intensity with multiple harmonics for complex liquid motion
                        const primaryWave = Math.sin(wavePhase) * this.mouseInteraction.waveAmplitude;
                        const secondaryWave = Math.sin(wavePhase * 1.7 + wave.phase) * this.mouseInteraction.waveAmplitude * 0.3;
                        const tertiaryWave = Math.cos(wavePhase * 0.6 + wave.phase * 2) * this.mouseInteraction.waveAmplitude * 0.15;
                        
                        const complexWaveIntensity = (primaryWave + secondaryWave + tertiaryWave) * timeDecay * edgeDecay;
                        
                        mouseRippleDeformation += complexWaveIntensity;
                    }
                }
            }// Calculate target positions
            if (this.isPlaying && audioInfluence > 0.15) {
                // Normal audio-reactive behavior with mouse ripples
                const combinedDeformation = totalDeformation + mouseRippleDeformation;
                this.targetPositions[i] = x + finalNormal.x * combinedDeformation;
                this.targetPositions[i + 1] = y + finalNormal.y * combinedDeformation;
                this.targetPositions[i + 2] = z + finalNormal.z * combinedDeformation;
            } else if (this.anomalySystem.isActive && !this.isPlaying) {
                // Anomaly effects when not playing music with mouse ripples
                const combinedDeformation = baseNoise * 0.8 + anomalyDeformation + mouseRippleDeformation; // Increased from 0.3
                this.targetPositions[i] = x + finalNormal.x * combinedDeformation;
                this.targetPositions[i + 1] = y + finalNormal.y * combinedDeformation;
                this.targetPositions[i + 2] = z + finalNormal.z * combinedDeformation;            } else {
                // When paused or no audio, target the original sphere shape with mouse ripples
                const combinedDeformation = baseNoise * 0.8 + mouseRippleDeformation; // Increased from 0.3 for more visible ripples
                this.targetPositions[i] = x + finalNormal.x * combinedDeformation;
                this.targetPositions[i + 1] = y + finalNormal.y * combinedDeformation;
                this.targetPositions[i + 2] = z + finalNormal.z * combinedDeformation;
            }
        }
        
        // Apply mouse interaction forces during idle mode
        this.applyMouseForceToMainBlob();
        
        // Apply smoothing to all vertices after all forces are calculated
        for (let i = 0; i < positions.length; i += 3) {
            // Adaptive damping: faster return to original shape when paused
            let dampingFactor;
            if (this.isPlaying && audioInfluence > 0.15) {
                dampingFactor = 0.12 + audioInfluence * 0.08; // Responsive when music is playing
            } else {
                dampingFactor = 0.06; // Slower, smoother return to original shape when paused
            }
            
            this.currentPositions[i] += (this.targetPositions[i] - this.currentPositions[i]) * dampingFactor;
            this.currentPositions[i + 1] += (this.targetPositions[i + 1] - this.currentPositions[i + 1]) * dampingFactor;
            this.currentPositions[i + 2] += (this.targetPositions[i + 2] - this.currentPositions[i + 2]) * dampingFactor;
            
            // Apply the smoothed positions
            positions[i] = this.currentPositions[i];
            positions[i + 1] = this.currentPositions[i + 1];
            positions[i + 2] = this.currentPositions[i + 2];
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        this.baseRotation.y += 0.005 + audioInfluence * 0.02;
        this.ferrofluid.rotation.y = this.baseRotation.y;
          // Add reactive rotation based on frequency content
        this.ferrofluid.rotation.x = Math.sin(time * 0.3) * 0.1 + this.bassIntensity * 0.08; // Reduced bass rotation effect
        this.ferrofluid.rotation.z = Math.cos(time * 0.2) * 0.05 + this.highIntensity * 0.1;
        
        // Enhanced floating movement with audio reactivity
        const floatIntensity = 0.3 + audioInfluence * 0.5;
        this.ferrofluid.position.y = Math.sin(time * 0.4) * floatIntensity;
        this.ferrofluid.position.x = Math.cos(time * 0.35) * (floatIntensity * 0.7);
        this.ferrofluid.position.z = Math.sin(time * 0.45) * (floatIntensity * 0.5);        // Synchronize inner sphere position and rotation with the main ferrofluid
        if (this.ferrofluidInner) {
            this.ferrofluidInner.position.copy(this.ferrofluid.position);
            this.ferrofluidInner.rotation.copy(this.ferrofluid.rotation);
        }        // Clean up expired mouse ripple waves (much longer lifetime for ultra-slow liquid persistence)
        if (this.mouseInteraction.waves.length > 0) {
            this.mouseInteraction.waves = this.mouseInteraction.waves.filter(wave => {
                const waveAge = now - wave.startTime;
                return waveAge < 8.0; // Increased from 5.0 for much longer lasting ultra-slow liquid-like waves
            });
        }
    }
      generateDynamicBlobCenters(time) {
        const blobCenters = [];
        
        // Different time scales for each frequency band to prevent competition
        const bassTime = time * 0.2; // Much slower for bass - very wobbly
        const midTime = time * 0.5;  // Medium speed for mids - moderate wobble
        const highTime = time * 1.0; // Normal speed for highs - keep responsive        // === BASS DEFORMATIONS: Very wide, very shallow surface undulations ===
        if (this.bassIntensity > 0.05) { // Very low threshold so bass can always work with other frequencies
            const numBassBlobs = Math.floor(1 + this.bassIntensity * 0.8); // Even fewer bass areas
            for (let i = 0; i < numBassBlobs; i++) {
                // Add randomness to prevent symmetric patterns (similar to mid-frequency)
                const randomAngleOffset1 = (Math.random() - 0.5) * 1.8; // ±0.9 radian variation
                const randomAngleOffset2 = (Math.random() - 0.5) * 1.2; // ±0.6 radian variation  
                const randomSpeedVariation = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x speed (slower than mids)
                
                const angle1 = bassTime * 0.08 * randomSpeedVariation + i * Math.PI * 2 / numBassBlobs + randomAngleOffset1; // Ultra-slow bass timing
                const angle2 = Math.sin(bassTime * 0.12 + i) * 0.5 + randomAngleOffset2;
                
                const position = new THREE.Vector3(
                    Math.cos(angle1) * Math.cos(angle2) * 3.35,
                    Math.sin(angle2) * 3.35,
                    Math.sin(angle1) * Math.cos(angle2) * 3.35
                );
                
                // Add randomness to bass blob size (wide range for varied surface waves)
                const randomSizeFactor = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x variation
                const randomStrengthFactor = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x variation
                
                blobCenters.push({
                    position: position,
                    radius: (2.8 + this.bassIntensity * 1.5) * randomSizeFactor, // Varied radius
                    intensity: Math.pow(this.bassIntensity, 1.0), // Even steeper power curve
                    strength: (0.15 + this.bassIntensity * 0.3) * randomStrengthFactor, // Varied height
                    type: 'bass',
                    animationSpeed: 0.2 // Ultra-slow animation for very wobbly bass
                });
            }
        }
          // === MID PROTRUSIONS: Moderate height, medium width ===
        if (this.midIntensity > 0.04) { // Very low threshold for better layering with other frequencies
            const numMidBlobs = Math.floor(2 + this.midIntensity * 4);
            for (let i = 0; i < numMidBlobs; i++) {
                // Add randomness to prevent symmetric patterns
                const randomAngleOffset1 = (Math.random() - 0.5) * 2.5; // ±1.25 radian variation
                const randomAngleOffset2 = (Math.random() - 0.5) * 1.8; // ±0.9 radian variation
                const randomSpeedVariation = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x speed
                
                const angle1 = midTime * 0.8 * randomSpeedVariation + i * Math.PI * 1.2 + randomAngleOffset1; // Mid-speed timing
                const angle2 = Math.cos(midTime * 0.6 + i * 1.4) * 1.1 + randomAngleOffset2;
                
                const position = new THREE.Vector3(
                    Math.cos(angle1) * Math.cos(angle2) * 3.2,
                    Math.sin(angle2) * 3.2,
                    Math.sin(angle1) * Math.cos(angle2) * 3.2
                );
                
                // Add randomness to mid blob size (increased variation for more organic feel)
                const randomSizeFactor = 0.6 + Math.random() * 0.8; // 0.6x to 1.4x variation (increased from 0.75-1.25)
                const randomStrengthFactor = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x variation (increased from 0.85-1.15)
                
                blobCenters.push({
                    position: position,
                    radius: (0.8 + this.midIntensity * 0.6) * randomSizeFactor, // REDUCED: Much smaller radius for mid-range protrusions
                    intensity: Math.pow(this.midIntensity, 1.1), // Slightly steeper curve
                    strength: (2.2 + this.midIntensity * 2.5) * randomStrengthFactor, // Varied height
                    type: 'mid',
                    animationSpeed: 0.5 // Medium animation speed
                });
            }
        }        // === HIGH SPIKES: ULTRA-TALL, razor-sharp needle-like protrusions ===
        if (this.highIntensity > 0.02) { // Keep low threshold for high responsiveness
            const numHighBlobs = Math.floor(8 + this.highIntensity * 20); // More spikes possible
            for (let i = 0; i < numHighBlobs; i++) {
                // Create truly uniform distribution across sphere surface
                // Use proper spherical coordinates for uniform distribution
                const u = Math.random(); // Random value 0-1
                const v = Math.random(); // Random value 0-1
                
                // Add time-based movement for animation using high-frequency timing
                const timeOffset = highTime * 2.8 + i * Math.PI * 0.4; // Fast high-frequency timing
                const uAnimated = (u + Math.sin(timeOffset) * 0.1) % 1.0;
                const vAnimated = (v + Math.cos(timeOffset * 1.3) * 0.1) % 1.0;
                
                // Convert to spherical coordinates for uniform distribution
                const theta = 2 * Math.PI * uAnimated; // Azimuthal angle (0 to 2π)
                const phi = Math.acos(2 * vAnimated - 1); // Polar angle (0 to π)
                
                const position = new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta) * 3.002, // Uniform X
                    Math.cos(phi) * 3.002, // Uniform Y (no bias!)
                    Math.sin(phi) * Math.sin(theta) * 3.002  // Uniform Z
                );
                  // Add spike variety - different thickness types including original long spikes
                const spikeType = Math.random();
                let baseRadius, radiusVariation, strengthMultiplier;
                
                if (spikeType < 0.25) {
                    // Ultra-thin needles (25% of spikes)
                    baseRadius = 0.06 + this.highIntensity * 0.1;
                    radiusVariation = 0.5 + Math.random() * 0.3; // 0.5x to 0.8x
                    strengthMultiplier = 1.2 + Math.random() * 0.6; // Extra tall
                } else if (spikeType < 0.5) {
                    // Thin spikes (25% of spikes)
                    baseRadius = 0.12 + this.highIntensity * 0.15;
                    radiusVariation = 0.7 + Math.random() * 0.4; // 0.7x to 1.1x
                    strengthMultiplier = 1.0 + Math.random() * 0.4; // Normal height
                } else if (spikeType < 0.75) {
                    // Medium thickness spikes (25% of spikes)
                    baseRadius = 0.18 + this.highIntensity * 0.25;
                    radiusVariation = 0.8 + Math.random() * 0.6; // 0.8x to 1.4x
                    strengthMultiplier = 0.8 + Math.random() * 0.4; // Slightly shorter
                } else {
                    // Original long extending spikes (25% of spikes) - the ones you liked before
                    baseRadius = 0.12 + this.highIntensity * 0.2;
                    radiusVariation = 0.6 + Math.random() * 0.8; // 0.6x to 1.4x (original variation)
                    strengthMultiplier = 1.4 + Math.random() * 0.8; // Much taller - these extend more!
                }
                
                const randomStrengthFactor = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x variation
                  blobCenters.push({
                    position: position,
                    radius: baseRadius * radiusVariation, // Varied thickness based on spike type
                    intensity: Math.pow(this.highIntensity, 3.2), // More aggressive power curve
                    strength: (10.0 + this.highIntensity * 22.0) * strengthMultiplier * randomStrengthFactor, // Increased height range for taller high frequency spikes
                    type: 'high',
                    animationSpeed: 1.0 // Normal speed for responsive highs
                });
            }
    }
        
    return blobCenters;
}
      
// Floating blob system methods
createFloatingBlob(spawnPosition, intensity, type) {
        console.log(`Creating artefact at:`, spawnPosition, `intensity: ${intensity.toFixed(3)}, type: ${type}`);
        console.log(this.getRandomSpawnEmoji());
        
        // Enhanced blob size variation with different "personalities"
        const blobPersonality = Math.random();
        let baseSize, growthPotential, growthRate;        if (blobPersonality < 0.6) {
            // Small, agile blobs (60%) - minimal growth to prevent performance issues
            baseSize = 0.08 + Math.random() * 0.08; // 0.08-0.16
            growthPotential = 1.01 + Math.random() * 0.04; // Can grow 1.01x-1.05x (very limited)
            growthRate = 0.5 + Math.random() * 0.3; // Moderate growth speed
        } else if (blobPersonality < 0.8) {
            // Medium blobs (20%) - limited growth
            baseSize = 0.12 + Math.random() * 0.10; // 0.12-0.22
            growthPotential = 1.03 + Math.random() * 0.07; // Can grow 1.03x-1.10x (reduced)
            growthRate = 0.3 + Math.random() * 0.4; // Slower growth speed
        } else if (blobPersonality < 0.95) {
            // Large, slow blobs (15%) - moderate growth
            baseSize = 0.16 + Math.random() * 0.12; // 0.16-0.28
            growthPotential = 1.05 + Math.random() * 0.15; // Can grow 1.05x-1.20x (much reduced)
            growthRate = 0.25 + Math.random() * 0.35; // Slower growth
        } else {
            // Rare giant blobs (5%) - controlled growth
            baseSize = 0.20 + Math.random() * 0.18; // 0.20-0.38
            growthPotential = 1.1 + Math.random() * 0.2; // Can grow 1.1x-1.3x (significantly reduced)
            growthRate = 0.2 + Math.random() * 0.3; // Slow growth
        }
        
        const geometry = new THREE.SphereGeometry(baseSize, 32, 32); // Higher detail for smooth deformation
        
        // Store original positions for morphing (like main ferrofluid)
        const originalPositions = geometry.attributes.position.array.slice();
        const targetPositions = new Float32Array(originalPositions.length);
        const currentPositions = new Float32Array(originalPositions.length);
        
        // Copy original to current initially
        for (let i = 0; i < originalPositions.length; i++) {
            currentPositions[i] = originalPositions[i];
        }
        
        // Initialize noise offsets for organic movement
        const noiseOffsets = [];
        for (let i = 0; i < originalPositions.length / 3; i++) {
            noiseOffsets.push({
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                z: Math.random() * 1000,
                speed: 0.5 + Math.random() * 0.5
            });
        }
          const blob = new THREE.Mesh(geometry, this.floatingBlobMaterial.clone());
        blob.position.copy(spawnPosition);
        blob.castShadow = true;
        blob.receiveShadow = true;        // Create inner core to hide seams (like main ferrofluid)
        const innerGeometry = new THREE.SphereGeometry(baseSize * 0.70, 16, 16); // Much smaller core to prevent visibility during extreme deformation
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Pure black
            side: THREE.BackSide // Only render the inside faces
        });
        const innerCore = new THREE.Mesh(innerGeometry, innerMaterial);
        innerCore.position.copy(spawnPosition);
        
        console.log(`Artefact size: ${baseSize.toFixed(3)}, growth: ${growthPotential.toFixed(2)}x, pos:`, blob.position);
          // Enhanced physics properties and deformation data with growth system
        const blobData = {
            mesh: blob,
            innerCore: innerCore, // Add inner core reference
            geometry: geometry,
            originalPositions: originalPositions,
            targetPositions: targetPositions,
            currentPositions: currentPositions,
            noiseOffsets: noiseOffsets,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2, // Random horizontal velocity
                1 + Math.random() * 2,     // Upward velocity with randomness
                (Math.random() - 0.5) * 2  // Random depth velocity
            ),
            acceleration: new THREE.Vector3(0, -0.8, 0), // Gravity
            life: 1.0, // Life starts at 1.0, decreases over time
            maxLife: 8 + Math.random() * 4, // Live for 8-12 seconds
            intensity: intensity,
            type: type,            rotationVelocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1, // Increased variation in rotation speed
                (Math.random() - 0.5) * 0.1, // Increased variation in rotation speed  
                (Math.random() - 0.5) * 0.1  // Increased variation in rotation speed
            ),            musicResponse: 0.5 + Math.random() * 0.5, // How much it responds to music
            floatiness: 0.3 + Math.random() * 0.4, // How much it floats upward
            baseSize: baseSize, // Original spawn size
            currentScale: 1.0, // Current scale multiplier
            targetScale: 1.0, // Target scale for smooth interpolation
            growthPotential: growthPotential, // Maximum scale multiplier
            growthRate: growthRate, // How fast it grows
            growthPhase: Math.random() * Math.PI * 2, // Unique growth timing
            morphIntensity: 0.2 + Math.random() * 0.15, // More controlled morph strength
            phaseOffset: Math.random() * Math.PI * 2, // Unique phase for varied deformation
            personalityType: blobPersonality < 0.3 ? 'small' : 
                           blobPersonality < 0.6 ? 'medium' : 
                           blobPersonality < 0.85 ? 'large' : 'giant',
            // Enhanced independence properties with much more randomization
            timeOffset: Math.random() * 2000 + (Math.random() - 0.5) * 1000, // Larger time offset spread: -500 to 2500
            rotationPhase: new THREE.Vector3(
                Math.random() * Math.PI * 4, // Doubled rotation phase range for more variation
                Math.random() * Math.PI * 4,
                Math.random() * Math.PI * 4
            ),
            movementPattern: Math.random(), // Different movement personalities
            independentTimer: Math.random() * 10, // Start with different timer values (0-10 seconds)
            maxDeformation: 0, // Track maximum deformation for core sizing
            // NEW: Individual speed multipliers for different aspects
            deformationSpeed: 0.6 + Math.random() * 0.8, // 0.6x to 1.4x deformation speed
            movementSpeed: 0.7 + Math.random() * 0.6, // 0.7x to 1.3x movement speed  
            rotationSpeed: 0.5 + Math.random() * 1.0, // 0.5x to 1.5x rotation speed
            musicResponseDelay: Math.random() * 0.5, // 0-0.5 second delay in music response
            // Additional phase offsets for different frequency responses
            bassPhaseOffset: Math.random() * Math.PI * 2,
            midPhaseOffset: Math.random() * Math.PI * 2, 
            highPhaseOffset: Math.random() * Math.PI * 2,
            // Individual timing multipliers for each frequency band
            bassTimingMultiplier: 0.8 + Math.random() * 0.4, //  0.8x to 1.2x
            midTimingMultiplier: 0.7 + Math.random() * 0.6, // 0.7x to 1.3x  
  
            highTimingMultiplier: 0.6 + Math.random() * 0.8 // 0.6x to 1.4x
        };this.scene.add(blob);
        this.scene.add(innerCore); // Add inner core to scene
        this.floatingBlobs.push(blobData);
        console.log(`Artefact added to scene. Total: ${this.floatingBlobs.length}`);
        console.log(this.getRandomSpawnEmoji());
    }    spawnFloatingBlobs() {
        const now = performance.now();
        
        // Calculate total intensity first (needed for various checks)
        const totalIntensity = this.bassIntensity + this.midIntensity + this.highIntensity;
        
        // Debug: Log intensity values when music is playing
        if (this.isPlaying && Math.random() < 0.05) { // 5% chance to log (more frequent)
            console.log(`Signal - B: ${this.bassIntensity.toFixed(3)}, M: ${this.midIntensity.toFixed(3)}, H: ${this.highIntensity.toFixed(3)}, T: ${totalIntensity.toFixed(3)}`);
            console.log(`Spawn: threshold ${this.blobSpawnThreshold}, cooldown ${this.spawnCooldown}ms, last ${(now - this.lastSpawnTime).toFixed(0)}ms ago`);
            console.log(`Playing: ${this.isPlaying}, Audio: ${!!this.audioElement}`);
        }
        
        // Check cooldown
        if (now - this.lastSpawnTime < this.spawnCooldown) {
            if (Math.random() < 0.01) console.log(`Spawn blocked: cooldown ${(now - this.lastSpawnTime).toFixed(0)}ms < ${this.spawnCooldown}ms`);
            return;
        }
        
        // Check if we have space for more blobs (reduce during intense music)
        const maxBlobsCurrently = totalIntensity > 0.7 ? Math.floor(this.maxFloatingBlobs * 0.6) : this.maxFloatingBlobs;
        if (this.floatingBlobs.length >= maxBlobsCurrently) {
            if (Math.random() < 0.01) console.log(`Spawn block: max artefacts (${this.floatingBlobs.length}/${maxBlobsCurrently})`);
            return;
        }
        
        // Enhanced debug logging
        if (Math.random() < 0.05) { // More frequent logging
            console.log(`Signal - Bass: ${this.bassIntensity.toFixed(3)}, Mid: ${this.midIntensity.toFixed(3)}, High: ${this.highIntensity.toFixed(3)}`);
            console.log(`Spawns - Tot: ${totalIntensity.toFixed(3)}, Thrh: ${this.blobSpawnThreshold}, Art: ${this.floatingBlobs.length}`);
            console.log(`Timing - Now: ${now.toFixed(0)}, Last: ${this.lastSpawnTime.toFixed(0)}, CD: ${this.spawnCooldown}ms`);
        }
        
        // Only spawn during intense moments OR during anomaly sequences
        const isAnomalyActive = this.anomalySystem && this.anomalySystem.isActive;
        const effectiveIntensity = isAnomalyActive ? 
            Math.max(totalIntensity, this.anomalySystem.intensity || 0.6) : 
            totalIntensity;
            
        if (!isAnomalyActive && effectiveIntensity < this.blobSpawnThreshold) {
            if (this.isPlaying && Math.random() < 0.05) { // Log when music is playing but intensity too low
                console.log(`Spawn block: low intensity (${effectiveIntensity.toFixed(3)} < ${this.blobSpawnThreshold}) - Music: ${this.isPlaying}`);
            }
            return;
        }        // Higher chance of spawning with higher intensity (or during anomalies)
        const spawnChance = isAnomalyActive ? 
            0.3 + (this.anomalySystem.intensity || 0.6) * 0.5 : // 30-80% chance during anomalies
            Math.min((effectiveIntensity - this.blobSpawnThreshold) * 2, 0.4); // Reduced multiplier and max chance
            
        if (Math.random() < 0.05) { // Debug logging
            console.log(`Spawn chance: ${(spawnChance * 100).toFixed(1)}% (intensity: ${effectiveIntensity.toFixed(3)}, anomaly: ${isAnomalyActive})`);
        }        if (Math.random() > spawnChance) {
            console.log(`Spawn failed random check`);
            console.log(this.getRandomSpawnEmoji());
            return;
        }
        
        console.log(`Spawn OK! Finding spike locations...`);
        console.log(this.getRandomSpawnEmoji());        // Find high spike locations for spawning
        const blobCenters = this.generateDynamicBlobCenters(this.fluidTime);
        console.log(`Generated ${blobCenters.length} artefact centers`);
        console.log(this.getRandomSpawnEmoji());
        
        const highSpikes = blobCenters.filter(blob => 
            blob.type === 'high' && blob.intensity > 0.4 // Higher threshold for more selective spawning
        );
        
        console.log(`Found ${highSpikes.length} high spikes (threshold: 0.4)`);
        console.log(this.getRandomSpawnEmoji());
        
        if (highSpikes.length === 0) {
            // If no high spikes, try mid spikes as backup
            const midSpikes = blobCenters.filter(blob => 
                blob.type === 'mid' && blob.intensity > 0.5 // Keep mid spike threshold higher
            );
            console.log(`No high spikes, found ${midSpikes.length} mid (thresh: 0.5)`);
            
            if (midSpikes.length === 0) {
                // If no mid spikes either, try bass spikes (only during very intense bass)
                const bassSpikes = blobCenters.filter(blob => 
                    blob.type === 'bass' && blob.intensity > 0.6 // Higher bass threshold
                );
                console.log(`No mid spikes, found ${bassSpikes.length} bass (thresh: 0.6)`);
                
                if (bassSpikes.length > 0) {
                    const spawnBlob = bassSpikes[Math.floor(Math.random() * bassSpikes.length)];
                    const spawnDirection = spawnBlob.position.clone().normalize();
                    const spawnDistance = 3.5 + spawnBlob.strength * 0.8;
                    const spawnPosition = spawnDirection.multiplyScalar(spawnDistance);
                    this.createFloatingBlob(spawnPosition, spawnBlob.intensity, spawnBlob.type);
                    this.lastSpawnTime = now;
                    console.log('Artefact from bass spike:', spawnPosition);
                    console.log(this.getRandomSpawnEmoji());
                    return;
                }
            }
            
            if (midSpikes.length > 0) {
                const spawnBlob = midSpikes[Math.floor(Math.random() * midSpikes.length)];
                const spawnDirection = spawnBlob.position.clone().normalize();
                const spawnDistance = 3.5 + spawnBlob.strength * 0.8;
                const spawnPosition = spawnDirection.multiplyScalar(spawnDistance);                
                this.createFloatingBlob(spawnPosition, spawnBlob.intensity, spawnBlob.type);
                this.lastSpawnTime = now;
                console.log('Artefact from mid spike:', spawnPosition);
                console.log(this.getRandomSpawnEmoji());
            } else {
                console.log('No suitable spikes for spawning');
                console.log(this.getRandomSpawnEmoji());
            }
            return;
        }        
        // Choose a random high spike location
        const spawnBlob = highSpikes[Math.floor(Math.random() * highSpikes.length)];
        
        // Spawn position slightly beyond the spike tip
        const spawnDirection = spawnBlob.position.clone().normalize();
        const spawnDistance = 3.5 + spawnBlob.strength * 0.8; // Beyond the main blob surface
        const spawnPosition = spawnDirection.multiplyScalar(spawnDistance);        // Create the floating blob
        this.createFloatingBlob(spawnPosition, spawnBlob.intensity, spawnBlob.type);
        
        this.lastSpawnTime = now;
        console.log('Artefact from high spike:', spawnPosition);
        console.log(this.getRandomSpawnEmoji());
    }      updateFloatingBlobs(deltaTime) {
        // Always try to spawn new blobs first, regardless of performance optimizations
        this.spawnFloatingBlobs();
        
        // Early exit if no blobs to process
        if (this.floatingBlobs.length === 0) return;
        
        // Performance optimization: Throttle updates during heavy audio activity
        const totalMusicInfluence = this.bassIntensity + this.midIntensity + this.highIntensity;
        if (totalMusicInfluence > 0.8) {
            // Skip every other frame during intense music to prevent freezing
            this.skipFloatingBlobUpdate = !this.skipFloatingBlobUpdate;
            if (this.skipFloatingBlobUpdate) return;
        }
        
        // Update existing floating blobs
        for (let i = this.floatingBlobs.length - 1; i >= 0; i--) {
            const blobData = this.floatingBlobs[i];
            const blob = blobData.mesh;
            const geometry = blobData.geometry;
            const positions = geometry.attributes.position.array;
            
            // Update individual blob timer for independence
            blobData.independentTimer += deltaTime;
            const blobTime = blobData.independentTimer + blobData.timeOffset;
              // === DEFORMATION LOGIC (enhanced for different blob sizes) ===
            // Calculate individual frequency influences first
            const bassInfluence = this.bassIntensity * blobData.musicResponse;
            const midInfluence = this.midIntensity * blobData.musicResponse;
            const highInfluence = this.highIntensity * blobData.musicResponse;
            const totalMusicInfluence = bassInfluence + midInfluence + highInfluence;
            
            // Performance optimization: reduce deformation complexity during intense music
            const simplifyDeformation = totalMusicInfluence > 0.8;
            
            // Determine deformation method based on blob size - larger blobs get main ferrofluid behavior
            const effectiveSize = blobData.baseSize * blobData.currentScale;
            const useFerrofluidDeformation = effectiveSize > 0.3; // Medium-large and giant blobs
            
            let blobCenters = [];            if (useFerrofluidDeformation) {
                // For larger blobs, use main ferrofluid's blob center system (scaled down)
                blobCenters = this.generateDynamicBlobCenters(blobTime);
                // Scale blob centers to fit this smaller floating blob
                const scaleToBlob = (blobData.baseSize * blobData.currentScale) / 3.0; // Main ferrofluid radius is 3.0
                blobCenters = blobCenters.map(center => ({
                    ...center,
                    position: center.position.clone().multiplyScalar(scaleToBlob),
                    radius: center.radius * scaleToBlob,
                    strength: center.strength * scaleToBlob * 1.0 // Increased from 0.7 to maintain spike strength
                }));
            }

            // Apply deformation to each vertex (with performance optimization)
            let maxDeformation = 0; // Track the maximum deformation this frame
            const vertexStep = simplifyDeformation ? 2 : 1; // Skip vertices during intense music
            
            for (let j = 0; j < positions.length; j += 3 * vertexStep) {
                const vertexIndex = j / 3;
                
                // Skip if vertex doesn't exist (safety check for vertex stepping)
                if (vertexIndex >= blobData.originalPositions.length / 3) continue;
                const x = blobData.originalPositions[j];
                const y = blobData.originalPositions[j + 1];
                const z = blobData.originalPositions[j + 2];
                
                const vertexPos = new THREE.Vector3(x, y, z);
                  // Base organic movement using noise with individual timing
                const noiseOffset = blobData.noiseOffsets[vertexIndex];
                const noiseX = x + blobTime * noiseOffset.speed + blobData.phaseOffset;
                const noiseY = y + blobTime * noiseOffset.speed * 0.8 + blobData.phaseOffset;
                const noiseZ = z + blobTime * noiseOffset.speed * 1.2 + blobData.phaseOffset;
                const baseNoise = this.noise3D(noiseX, noiseY, noiseZ) * 0.15; // Reduced base noise
                
                let musicDeformation = 0;
                      if (useFerrofluidDeformation) {
                // === LARGE BLOB: Use main ferrofluid blob center system WITH proper spiking ===
                // Calculate influence from each dynamic blob center (like main ferrofluid)
                let totalBlobInfluence = 0;
                
                blobCenters.forEach(center => {
                    // Distance from vertex to blob center
                    const dx = vertexPos.x - center.position.x;
                    const dy = vertexPos.y - center.position.y;
                    const dz = vertexPos.z - center.position.z;
                    const distanceSquared = dx * dx + dy * dy + dz * dz;
                    const radiusSquared = center.radius * center.radius;
                    
                    // Only calculate influence if within reasonable range
                    if (distanceSquared < radiusSquared * 4) {
                        const distance = Math.sqrt(distanceSquared);
                        const influence = Math.exp(-Math.pow(distance / center.radius, 2));
                        const blobDeformation = influence * center.intensity * center.strength;
                        totalBlobInfluence += blobDeformation;
                    }
                });
                
                // Scale the deformation properly for floating blobs to ensure dramatic spikes
                const spikeMultiplier = 1.2 + highInfluence * 0.8; // Boost spiking for large floating blobs
                musicDeformation = totalBlobInfluence * spikeMultiplier;
                      } else {
                    // === SMALL BLOB: Use original fast spike system WITH individual timing ===
                    // Bass creates smooth, wave-like deformations with individual timing and phase
                    if (bassInfluence > 0.08) {
                        const bassTime = blobTime * 2 * blobData.bassTimingMultiplier * blobData.deformationSpeed;
                        const bassWave = Math.sin(bassTime + vertexPos.length() * 0.5 + blobData.bassPhaseOffset) * bassInfluence * 0.3;
                        musicDeformation += bassWave;
                    }
                      // Mid frequencies create medium-scale bumps with individual timing and phase
                    if (midInfluence > 0.04) {
                        const midTime = blobTime * 4 * blobData.midTimingMultiplier * blobData.deformationSpeed;
                        const midBump = Math.cos(midTime + vertexPos.x * 2 + vertexPos.z * 2 + blobData.midPhaseOffset) * midInfluence * 0.25;
                        musicDeformation += midBump;
                    }                      // High frequencies create DRAMATIC spikes with individual timing and phase
                    if (highInfluence > 0.02) {
                        // Multiple spike patterns with individual timing multipliers and phases
                        const highTime1 = blobTime * 12 * blobData.highTimingMultiplier * blobData.deformationSpeed;
                        const highTime2 = blobTime * 8 * blobData.highTimingMultiplier * blobData.deformationSpeed;
                        const highTime3 = blobTime * 15 * blobData.highTimingMultiplier * blobData.deformationSpeed;
                        
                        const highSpike1 = Math.sin(highTime1 + vertexPos.length() * 10 + blobData.highPhaseOffset) * highInfluence * 0.4;
                        const highSpike2 = Math.cos(highTime2 + vertexPos.x * 6 + vertexPos.z * 6 + blobData.highPhaseOffset * 0.7) * highInfluence * 0.3;
                        const highSpike3 = Math.sin(highTime3 + vertexPos.y * 8 + blobData.highPhaseOffset * 1.3) * highInfluence * 0.2;
                        musicDeformation += highSpike1 + highSpike2 + highSpike3;

                        // Additional spikes for small blobs that have grown beyond scale threshold (now with reduced threshold)
                        if (blobData.baseSize < 0.2 && blobData.currentScale > 1.2) { // Reduced from 1.5 to 1.2
                            const extraTime1 = blobTime * 16 * blobData.highTimingMultiplier * blobData.deformationSpeed;
                            const extraTime2 = blobTime * 12 * blobData.highTimingMultiplier * blobData.deformationSpeed;
                            
                            const extraSpike1 = Math.sin(extraTime1 + vertexPos.length() * 12 + blobData.highPhaseOffset * 1.7) * highInfluence * 0.6;
                            const extraSpike2 = Math.cos(extraTime2 + vertexPos.x * 10 + vertexPos.z * 10 + blobData.highPhaseOffset * 2.1) * highInfluence * 0.5;
                            musicDeformation += extraSpike1 + extraSpike2;
                        }
                    }
                }
                
                // Combine deformations with controlled intensity multiplier
                const intensityMultiplier = blobData.morphIntensity * (0.8 + totalMusicInfluence * 1.2);
                const totalDeformation = (baseNoise + musicDeformation) * intensityMultiplier;
                
                // Track maximum deformation for core sizing
                maxDeformation = Math.max(maxDeformation, Math.abs(totalDeformation));
                
                // Apply deformation along surface normal
                const normal = vertexPos.clone().normalize();
                
                // Calculate target positions
                blobData.targetPositions[j] = x + normal.x * totalDeformation;
                blobData.targetPositions[j + 1] = y + normal.y * totalDeformation;
                blobData.targetPositions[j + 2] = z + normal.z * totalDeformation;
                  // Smooth interpolation to target with adaptive damping
                // Faster response for high frequencies to show spikes better
                const baseDamping = 0.15;
                const highBoost = Math.min(highInfluence * 3, 0.2); // Up to 0.2 extra damping for highs
                const dampingFactor = baseDamping + highBoost;
                
                blobData.currentPositions[j] += (blobData.targetPositions[j] - blobData.currentPositions[j]) * dampingFactor;
                blobData.currentPositions[j + 1] += (blobData.targetPositions[j + 1] - blobData.currentPositions[j + 1]) * dampingFactor;
                blobData.currentPositions[j + 2] += (blobData.targetPositions[j + 2] - blobData.currentPositions[j + 2]) * dampingFactor;
                
                // Apply to geometry
                positions[j] = blobData.currentPositions[j];
                positions[j + 1] = blobData.currentPositions[j + 1];
                positions[j + 2] = blobData.currentPositions[j + 2];
            }
              // Store maximum deformation for inner core adjustment
            blobData.maxDeformation = maxDeformation;
            
            // Apply mouse interaction forces during idle mode
            if (this.mouseInteraction.intersectedBlob && 
                this.mouseInteraction.intersectedBlob.blobData === blobData) {
                this.applyMouseForceToFloatingBlobs();
            }
            
            // Update geometry
            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
            
            // === PHYSICS AND MOVEMENT ===
              // Music-responsive forces with individual timing
            if (totalMusicInfluence > 0.1) {
                // Bass: heavy upward thrust
                blobData.velocity.y += bassInfluence * 1.5 * deltaTime;
                
                // Mid: rhythmic movement with individual timing and unique phase
                blobData.velocity.x += Math.sin(blobTime * 3 + blobData.phaseOffset) * midInfluence * deltaTime;
                blobData.velocity.z += Math.cos(blobTime * 3 + blobData.phaseOffset) * midInfluence * deltaTime;
                
                // High: jittery movement
                blobData.velocity.x += (Math.random() - 0.5) * highInfluence * 2 * deltaTime;
                blobData.velocity.z += (Math.random() - 0.5) * highInfluence * 2 * deltaTime;
            }
            
            // Apply physics
            blobData.velocity.add(blobData.acceleration.clone().multiplyScalar(deltaTime));
            
            // Upward floating force (counteracts gravity)
            blobData.velocity.y += 0.5 * deltaTime;
            
            // Apply air resistance
            blobData.velocity.multiplyScalar(0.98);
              // Update position
            blob.position.add(blobData.velocity.clone().multiplyScalar(deltaTime));
              
            // === DYNAMIC GROWTH SYSTEM ===
            // Calculate growth based on music, life stage, and blob personality
            const lifeStage = 1.0 - blobData.life; // 0.0 = newborn, 1.0 = about to die
              // Growth curve: fast growth early, then slower, with music influence
            let growthTarget = 1.0;
            
            if (lifeStage < 0.4) {
                // Early growth phase (0-40% of life)
                const growthProgress = lifeStage / 0.4;
                const musicBoost = 1.0 + (totalMusicInfluence * 0.8); // Music makes them grow bigger
                growthTarget = 1.0 + (Math.sin(growthProgress * Math.PI * 0.5) * (blobData.growthPotential - 1.0) * musicBoost);
            } else if (lifeStage < 0.7) {
                // Mature phase (40-70% of life) - maintain size with music responsiveness
                const musicPulse = 1.0 + Math.sin(blobTime * 2 + blobData.growthPhase) * totalMusicInfluence * 0.3;
                growthTarget = blobData.growthPotential * musicPulse;
            } else {
                // Aging phase (70-100% of life) - gradual shrinkage before final collapse
                const ageingFactor = Math.max(0.7, 1.0 - (lifeStage - 0.7) / 0.3 * 0.3);
                growthTarget = blobData.growthPotential * ageingFactor;
            }
              // Apply movement patterns based on blob size - larger blobs have simpler, more stable movement
            if (useFerrofluidDeformation) {
                // === LARGE BLOBS: Simplified movement like main ferrofluid ===
                // Only gentle floating upward with minimal lateral movement (like main ferrofluid)
                // Add very subtle music-reactive drift
                const gentleDrift = 0.03; // Much smaller than small blob movements
                if (totalMusicInfluence > 0.1) {
                    // Very gentle lateral music response (bass/mid driven)
                    blobData.velocity.x += Math.sin(blobTime * 0.5 + blobData.phaseOffset) * bassInfluence * gentleDrift * deltaTime;
                    blobData.velocity.z += Math.cos(blobTime * 0.5 + blobData.phaseOffset) * midInfluence * gentleDrift * deltaTime;
                    
                    // Gentle high-frequency jitter (much reduced)
                    if (highInfluence > 0.05) {
                        blobData.velocity.x += (Math.random() - 0.5) * highInfluence * 0.2 * deltaTime;
                        blobData.velocity.z += (Math.random() - 0.5) * highInfluence * 0.2 * deltaTime;
                    }
                }
            } else {
                // === SMALL BLOBS: Keep complex movement patterns WITH individual speed multipliers ===
                if (blobData.movementPattern < 0.25) {
                    // Spiral pattern (25% of blobs)
                    const spiralRadius = 1.5;
                    const spiralSpeed = blobTime * 0.8 * blobData.movementSpeed; // Apply individual movement speed
                    blobData.velocity.x += Math.cos(spiralSpeed) * spiralRadius * deltaTime * 0.1 * blobData.movementSpeed;
                    blobData.velocity.z += Math.sin(spiralSpeed) * spiralRadius * deltaTime * 0.1 * blobData.movementSpeed;
                    blobData.velocity.y += Math.sin(spiralSpeed * 2) * deltaTime * 0.05 * blobData.movementSpeed; // Vertical spiral component
                } else if (blobData.movementPattern < 0.5) {
                    // Figure-8 pattern (25% of blobs)
                    const figure8Speed = blobTime * 0.6 * blobData.movementSpeed; // Apply individual movement speed
                    blobData.velocity.x += Math.sin(figure8Speed) * deltaTime * 0.15 * blobData.movementSpeed;
                    blobData.velocity.z += Math.sin(figure8Speed * 2) * deltaTime * 0.1 * blobData.movementSpeed;
                } else if (blobData.movementPattern < 0.75) {
                    // Orbiting pattern (25% of blobs)
                    const orbitSpeed = blobTime * 1.2 * blobData.movementSpeed; // Apply individual movement speed
                    const orbitRadius = 2.0;
                    blobData.velocity.x += Math.cos(orbitSpeed) * orbitRadius * deltaTime * 0.08 * blobData.movementSpeed;
                    blobData.velocity.z += Math.sin(orbitSpeed) * orbitRadius * deltaTime * 0.08 * blobData.movementSpeed;
                }
                // Remaining 25% use simple floating (no additional pattern)
            }
            
            // Smooth interpolation to target scale
            blobData.targetScale = growthTarget;
            blobData.currentScale += (blobData.targetScale - blobData.currentScale) * blobData.growthRate * deltaTime;
              // Apply scale only if not in collapse phase
            if (blobData.life >= 0.3) {
                blob.scale.setScalar(blobData.currentScale);
            }
            
            // Update rotation based on blob size - larger blobs rotate much less like main ferrofluid
            if (useFerrofluidDeformation) {
                // === LARGE BLOBS: Gentle rotation like main ferrofluid ===
                // Add gentle base rotation (like main ferrofluid's baseRotation.y)
                if (!blobData.baseRotationY) blobData.baseRotationY = 0; // Initialize if not exists
                blobData.baseRotationY += (0.003 + totalMusicInfluence * 0.015) * deltaTime * 60 * blobData.rotationSpeed; // Apply individual rotation speed
                
                // Add reactive rotation based on frequency content (like main ferrofluid)
                const reactiveRotationX = Math.sin(blobTime * 0.3 * blobData.rotationSpeed) * 0.05 + bassInfluence * 0.04; // Apply rotation speed
                const reactiveRotationZ = Math.cos(blobTime * 0.2 * blobData.rotationSpeed) * 0.025 + highInfluence * 0.05; // Apply rotation speed
                
                // Apply gentle ferrofluid-style rotation
                blob.rotation.x = reactiveRotationX;
                blob.rotation.y = blobData.baseRotationY;
                blob.rotation.z = reactiveRotationZ;
            } else {
                // === SMALL BLOBS: Keep normal rotation WITH individual speed multipliers ===
                const rotationMultiplier = (1 + totalMusicInfluence * 1.5) * blobData.rotationSpeed; // Apply individual rotation speed
                blob.rotation.x += (blobData.rotationVelocity.x + Math.sin(blobTime + blobData.rotationPhase.x) * 0.02) * rotationMultiplier;
                blob.rotation.y += (blobData.rotationVelocity.y + Math.cos(blobTime + blobData.rotationPhase.y) * 0.02) * rotationMultiplier;                blob.rotation.z += (blobData.rotationVelocity.z + Math.sin(blobTime + blobData.rotationPhase.z) * 0.02) * rotationMultiplier;
            }
            
            // Synchronize inner core position, rotation, and scale with the main blob
            if (blobData.innerCore) {
                blobData.innerCore.position.copy(blob.position);
                blobData.innerCore.rotation.copy(blob.rotation);
                
                // Calculate core size based on actual maximum deformation this frame
                // Core needs to be smaller than the original surface minus the maximum outward deformation
                const baseRadius = blobData.baseSize * blobData.currentScale;
                const maxOutwardDeformation = Math.max(0, blobData.maxDeformation || 0);
                
                // Ensure core radius is at least 60% smaller than the deformed surface
                const safetyMargin = 0.6; // 60% safety margin
                const requiredCoreRadius = Math.max(
                    baseRadius * 0.3, // Never smaller than 30% of base
                    (baseRadius - maxOutwardDeformation) * safetyMargin
                );
                
                const coreScale = requiredCoreRadius / blobData.baseSize;
                blobData.innerCore.scale.setScalar(coreScale);
            }
            
            // Update life
            blobData.life -= deltaTime / blobData.maxLife;
              // === COLLAPSE INSTEAD OF FADE ===
            // As life decreases, make the blob collapse (shrink) instead of fading
            if (blobData.life < 0.3) {
                const collapseScale = (blobData.life / 0.3) * blobData.currentScale; // Scale from current size to 0.0
                blob.scale.setScalar(collapseScale);                // Synchronize inner core scale during collapse with deformation awareness
                if (blobData.innerCore) {
                    const baseRadius = blobData.baseSize * collapseScale;
                    const maxOutwardDeformation = Math.max(0, blobData.maxDeformation || 0);
                    const safetyMargin = 0.6;
                    const requiredCoreRadius = Math.max(
                        baseRadius * 0.3,
                        (baseRadius - maxOutwardDeformation) * safetyMargin
                    );
                    const coreScale = requiredCoreRadius / blobData.baseSize;
                    blobData.innerCore.scale.setScalar(coreScale);
                }
                
                // Also reduce morph intensity as it collapses
                blobData.morphIntensity *=  0.98;
            }
            
            // Remove blob only when fully collapsed or too far away
            const fullyCollapsed = blobData.life <= 0;
            const tooFar = blob.position.length() > 100;
              if (fullyCollapsed || tooFar) {
                this.scene.remove(blob);
                blob.geometry.dispose();
                blob.material.dispose();
                
                // Clean up inner core
                if (blobData.innerCore) {
                    this.scene.remove(blobData.innerCore);
                    blobData.innerCore.geometry.dispose();
                    blobData.innerCore.material.dispose();
                }
                
                this.floatingBlobs.splice(i, 1);
            }
        }
          // ==========================================
        // OPTIMIZED COLLISION DETECTION SYSTEM
        // ==========================================
        
        // Adjust collision quality based on performance
        this.adjustCollisionQuality();
        
        // Enhanced collision detection & response between blobs with spatial optimization
        const qualitySettings = this.collisionOptimization.qualityLevels[this.collisionOptimization.currentQuality];
        const blobs = this.floatingBlobs;
        
        // Only perform blob-to-blob collisions if quality allows and frame skipping permits
        if (qualitySettings.blobToBlob && this.shouldPerformCollisionDetection() && blobs.length > 1) {
            // During intense music, use simplified collision detection to prevent freezing
            if (totalMusicInfluence > 0.7) {
                // Simplified collision detection for performance
                for (let i = 0; i < blobs.length; i++) {
                    for (let j = i + 1; j < Math.min(blobs.length, i + 5); j++) { // Limit pairs checked
                        const bd1 = blobs[i];
                        const bd2 = blobs[j];
                        
                        if (!bd1 || !bd2 || !bd1.mesh || !bd2.mesh) continue;
                        
                        const p1 = bd1.mesh.position;
                        const p2 = bd2.mesh.position;
                        const delta = new THREE.Vector3().subVectors(p2, p1);
                        const dist = delta.length();
                        const r1 = bd1.baseSize * bd1.currentScale;
                        const r2 = bd2.baseSize * bd2.currentScale;
                        const minDist = r1 + r2;
                        
                        if (dist > 0 && dist < minDist) {
                            const overlap = minDist - dist;
                            const normal = delta.clone().normalize();
                            
                            // Simple separation
                            const separation = overlap * 0.5;
                            bd1.mesh.position.addScaledVector(normal, -separation);
                            bd2.mesh.position.addScaledVector(normal, separation);
                        }
                    }
                }
            } else {
                // Full collision detection during normal music levels
                // Update spatial grid for efficient collision detection
                this.updateSpatialGrid();
                
                // Get optimized collision pairs using spatial partitioning
                const collisionPairs = this.getPotentialCollisionPairs();
            
                // Process collision pairs with optimized algorithm
                for (const [a, b] of collisionPairs) {
                    const bd1 = blobs[a];
                    const bd2 = blobs[b];
                    
                    // Skip if blobs don't exist (safety check)
                    if (!bd1 || !bd2) continue;
                    
                    const p1 = bd1.mesh.position;
                    const p2 = bd2.mesh.position;
                    const delta = new THREE.Vector3().subVectors(p2, p1);
                    const dist = delta.length();
                    const r1 = bd1.baseSize * bd1.currentScale;
                    const r2 = bd2.baseSize * bd2.currentScale;
                    const minDist = r1 + r2;
                    
                    if (dist > 0 && dist < minDist) {
                        const overlap = minDist - dist;
                        const normal = delta.clone().normalize();
                        
                        // Calculate masses based on volume (radius cubed)
                        const mass1 = r1 * r1 * r1;
                        const mass2 = r2 * r2 * r2;
                        const totalMass = mass1 + mass2;
                        
                        // Apply quality-based update frequency
                        const updateIntensity = qualitySettings.updateFrequency;
                        
                        // Distribute separation based on inverse mass ratio
                        const separation1 = (mass2 / totalMass) * (overlap + 0.02) * updateIntensity;
                        const separation2 = (mass1 / totalMass) * (overlap + 0.02) * updateIntensity;
                        
                        // Move both blobs to resolve overlap
                        bd1.mesh.position.addScaledVector(normal, -separation1);
                        bd2.mesh.position.addScaledVector(normal, separation2);
                        
                        // Apply velocity responses based on mass and overlap
                        const velocityResponse = overlap * 0.4 * updateIntensity; // Quality-scaled response
                        bd1.velocity.addScaledVector(normal, -velocityResponse * (mass2 / totalMass));
                        bd2.velocity.addScaledVector(normal, velocityResponse * (mass1 / totalMass));
                        
                        // Add slight bounce effect for more realistic collision
                        const bounceEffect = 0.1 * updateIntensity;
                        bd1.velocity.multiplyScalar(1 + bounceEffect);
                        bd2.velocity.multiplyScalar(1 + bounceEffect);
                    }
                }
            }
              // Enhanced performance statistics logging
            if (Math.random() < 0.001) { // 0.1% chance per frame
                const stats = this.collisionOptimization.stats;
                console.log(`Collision Stats - Quality: ${this.collisionOptimization.currentQuality}`);
                console.log(`   • Checks: ${stats.totalChecks}, Spatial: ${stats.spatialOptimizations}`);
                console.log(`   • Culled: ${stats.broadPhaseCulled}, Cache: ${stats.cacheHits}`);
                console.log(`   • Skips: ${stats.frameSkips}, Temporal: ${stats.temporalCoherenceSkips}`);
                console.log(`   • Cleanups: ${stats.cacheCleanups}, Size: ${this.collisionOptimization.collisionCache.size}`);
            }
        }

// Dynamic spike-aware ferrofluid collision detection & response
if (this.ferrofluid) {
    const mainBlobPosition = this.ferrofluid.position;
    
    for (const bd of blobs) {
        const floatingBlobPosition = bd.mesh.position;
        const floatingBlobRadius = bd.baseSize * bd.currentScale;
        
        // Calculate direction from main ferrofluid to floating blob
        const delta = new THREE.Vector3().subVectors(floatingBlobPosition, mainBlobPosition);
        const distance = delta.length();
        
        if (distance > 0) {
            const direction = delta.clone().normalize();
            
            // Calculate dynamic ferrofluid radius in this direction by checking for spike extensions
            const baseRadius = 3.0;
            let maxExtension = baseRadius;
            
            // Check current spike data for extensions in this direction
            if (this.currentBlobCenters) {
                for (const blob of this.currentBlobCenters) {
                    // Calculate how aligned this spike is with the direction to the floating blob
                    const spikeDirection = blob.position.clone().normalize();
                    const alignment = spikeDirection.dot(direction);
                    
                    // Only consider spikes pointing somewhat toward the floating blob
                    if (alignment > 0.3) { // 30% alignment threshold
                        // Calculate spike extension based on type and strength
                        let spikeExtension = baseRadius;
                        
                        if (blob.type === 'high') {
                            // High frequency spikes extend the most
                            spikeExtension = baseRadius + blob.strength * alignment;
                        } else if (blob.type === 'mid') {
                            // Mid frequency spikes have moderate extension
                            spikeExtension = baseRadius + blob.strength * 0.8 * alignment;
                        } else if (blob.type === 'bass') {
                            // Bass waves have minimal extension but wide influence
                            spikeExtension = baseRadius + blob.strength * 0.5 * alignment;
                        }
                        
                        // Track the maximum extension in this direction
                        maxExtension = Math.max(maxExtension, spikeExtension);
                    }
                }
            }
            
            // Add small safety margin to account for deformation interpolation
            const dynamicRadius = maxExtension + 0.5;
            const minDistance = dynamicRadius + floatingBlobRadius;
            
            // Check for collision with dynamic radius
            if (distance < minDistance) {
                const overlap = minDistance - distance;
                const normal = direction;
                
                // Push floating blob away from main ferrofluid
                bd.mesh.position.addScaledVector(normal, overlap + 0.1);
                
                // Add velocity to push blob away (stronger for spike collisions)
                const pushForce = overlap * 1.2; // Increased force for spike collisions
                bd.velocity.addScaledVector(normal, pushForce);
                
                // Add slight upward component and random variation for more dynamic separation
                bd.velocity.y += Math.abs(pushForce) * 0.4;
                
                // Add small random perpendicular component to prevent sticking
                const perpendicular = new THREE.Vector3(-normal.z, 0, normal.x).normalize();
                bd.velocity.addScaledVector(perpendicular, (Math.random() - 0.5) * pushForce * 0.3);
            }
        }
    }
}

// Wall collisions: bounce off side walls smoothly
const limit = this.gridSize;
const bounceFactor = 0.2;
for (const bd of blobs) {
    const p = bd.mesh.position;
    const r = bd.baseSize * bd.currentScale;
    if (p.x - r < -limit) { p.x = -limit + r; bd.velocity.x *= -bounceFactor; }
    else if (p.x + r > limit) { p.x = limit - r; bd.velocity.x *= -bounceFactor; }
    if (p.z - r < -limit) { p.z = -limit + r; bd.velocity.z *= -bounceFactor; }
    else if (p.z + r > limit) { p.z = limit - r; bd.velocity.z *= -bounceFactor; }
}
    }
    
    updateLighting() {
        if (!this.colorLights) return;
        

        
        const time = this.fluidTime;
        
        // Base intensities for when there's no music
        const baseIntensity = 0.5;
        const currentBass = Math.max(baseIntensity, this.bassIntensity * 3);
        const currentMid = Math.max(baseIntensity, this.midIntensity * 3);
        const currentHigh = Math.max(baseIntensity, this.highIntensity * 3);
          // Update colored lights based on frequency ranges using user-selected colors
        this.colorLights[0].color.setHex(this.lightBassColor);
        this.colorLights[0].intensity = currentBass * 2;
        
        this.colorLights[1].color.setHex(this.lightMidColor);
        this.colorLights[1].intensity = currentMid * 2;
        
        this.colorLights[2].color.setHex(this.lightHighColor);
        this.colorLights[2].intensity = currentHigh * 2;
        
        // More dynamic light movement
        this.colorLights.forEach((light, index) => {
            const baseAngle = index * Math.PI * 2 / 3;
            const speed = 0.3 + (this.bassIntensity + this.midIntensity + this.highIntensity) * 0.5;
            const angle = time * speed + baseAngle;
            
            // Create more complex orbital patterns
            const radius = 12 + Math.sin(time * 0.7 + index) * 3;
            const height = 6 + Math.cos(time * 0.5 + index * 1.5) * 4;
            
            light.position.x = Math.cos(angle) * radius;
            light.position.z = Math.sin(angle) * radius;
            light.position.y = height;
        });
          // Pulse the main lights based on overall audio activity
        const totalActivity = this.bassIntensity + this.midIntensity + this.highIntensity;
        if (this.lightGroup.children[0]) { // Main light
            this.lightGroup.children[0].intensity = 2.0 + totalActivity * 0.5;
        }
    }
      updateLightingFromBackground() {
        if (!this.lightGroup) return;
        
        // Extract RGB components from background color
        const backgroundColorObj = new THREE.Color(this.backgroundColor);
        const r = backgroundColorObj.r;
        const g = backgroundColorObj.g;
        const b = backgroundColorObj.b;
        
        // Calculate average brightness to determine if background is light or dark
        const brightness = (r + g + b) / 3;
        
        // Subtle influence on ambient light color (very gentle)
        const ambientLight = this.lightGroup.children[3]; // Ambient light is 4th child
        if (ambientLight && ambientLight.type === 'AmbientLight') {
            // Mix background color with original ambient color (only 15% influence)
            const originalAmbient = new THREE.Color(0x334466);
            const mixedColor = originalAmbient.clone().lerp(backgroundColorObj, 0.15);
            ambientLight.color.copy(mixedColor);
            
            // Adjust intensity slightly based on background brightness
            const intensityAdjustment = brightness * 0.1; // Very subtle adjustment
            ambientLight.intensity = 0.4 + intensityAdjustment;
        }
        
        // Very subtle influence on fill and rim lights
        const fillLight = this.lightGroup.children[1]; // Secondary directional light
        const rimLight = this.lightGroup.children[2]; // Rim light
        
        if (fillLight && fillLight.type === 'DirectionalLight') {
            const originalFill = new THREE.Color(0x8888ff);
            const mixedFill = originalFill.clone().lerp(backgroundColorObj, 0.08);
            fillLight.color.copy(mixedFill);
        }
        
        if (rimLight && rimLight.type === 'DirectionalLight') {
            const originalRim = new THREE.Color(0x4488ff);
            const mixedRim = originalRim.clone().lerp(backgroundColorObj, 0.05);
            rimLight.color.copy(mixedRim);
        }
    }    updateShadowTransparency() {
        // Cap maximum opacity at 0.8 to prevent completely black shadows
        // Set minimum opacity to 0.01 to prevent rendering issues at exactly 0
        const maxShadowOpacity = 0.8;
        const minShadowOpacity = 0.01;
        const actualOpacity = this.shadowTransparency === 0 ? 0 : 
                            Math.max(minShadowOpacity, this.shadowTransparency * maxShadowOpacity);
        
        // Update grid shadow materials (ShadowMaterial instances)
        if (this.gridGroup) {
            this.gridGroup.children.forEach(mesh => {
                if (mesh.material && mesh.material.type === 'ShadowMaterial') {
                    // This is one of our shadow materials
                    // ShadowMaterial should always stay transparent
                    mesh.material.transparent = true;
                    mesh.material.opacity = actualOpacity; // Scale to realistic range (0 to 0.8)
                    mesh.material.visible = this.shadowTransparency > 0; // Hide completely when slider is at 0
                }
            });
        }
        
        // Update permanent floor shadow material
        if (this.permanentFloorMaterial) {
            // ShadowMaterial should always stay transparent
            this.permanentFloorMaterial.transparent = true;
            this.permanentFloorMaterial.opacity = actualOpacity; // Scale to realistic range (0 to 0.8)
            this.permanentFloorMaterial.visible = this.shadowTransparency > 0; // Hide completely when slider is at 0
        }
    }updateShadowColors() {
    // Determine which color to use: shadow color picker when not linked, otherwise this.shadowColor
    let colorToUse = this.shadowColor;
    if (!this.linkShadowColor) {
        // When not linked, get the color from the shadow color picker
        const shadowColorPicker = document.getElementById('shadow-color');
        if (shadowColorPicker && shadowColorPicker.value) {
            colorToUse = parseInt(shadowColorPicker.value.replace('#', ''), 16);
        }
    }
    
    // Ensure shadow color is applied independently of grid color
    if (this.lightGroup && this.lightGroup.children.length > 7) {
        // The spotlight is at index 7 (after main, fill, rim, ambient, and 3 color lights)
        const spotlight = this.lightGroup.children[7];
        if (spotlight && spotlight.type === 'SpotLight') {
            // Set spotlight color to match the determined color
            spotlight.color.setHex(colorToUse);
            spotlight.castShadow = true; // Ensure the spotlight casts shadows

            // Update shadow map settings for better quality
            spotlight.shadow.mapSize.width = 2048;
            spotlight.shadow.mapSize.height = 2048;
            spotlight.shadow.camera.near = 1;
            spotlight.shadow.camera.far = 50;
        }
    }    // Update shadow material color if applicable
    if (this.gridGroup) {
        this.gridGroup.children.forEach(mesh => {
            if (mesh.material && mesh.material.type === 'ShadowMaterial') {
                mesh.material.color.setHex(colorToUse);
            }
        });
    }
      // Also update permanent floor shadow material when grid is disabled
    if (this.permanentFloorMaterial && this.permanentFloorMaterial.type === 'ShadowMaterial') {
        this.permanentFloorMaterial.color.setHex(colorToUse);
    }
}

    updateUIOpacity() {        // Apply opacity to all onscreen UI elements
        const uiElements = [
            // Status message and debug panel
            document.getElementById('status-message'),
            document.getElementById('debug-info-panel'),
            
            // Track information display (includes performance monitor now)
            document.getElementById('track-info-display'),
            document.getElementById('track-bpm'),
            document.getElementById('track-name-vertical'),
            document.getElementById('track-time-display'),
            document.getElementById('track-freq-display'),
            document.getElementById('performance-fps'),
            document.getElementById('performance-quality'),
            document.getElementById('performance-objects'),
            
            // Frequency analyzer
            document.getElementById('frequency-analyzer-clone'),
            
            // SVG logos container
            document.getElementById('svg-logos-container'),
            
            // Track progress bar
            document.getElementById('track-progress-container')
        ];

        // Apply opacity to each element, hide completely if opacity is 0
        uiElements.forEach(element => {
            if (element) {
                if (this.uiOpacity === 0) {
                    element.style.display = 'none';
                } else {
                    element.style.display = '';
                    element.style.opacity = this.uiOpacity.toString();
                }
            }
        });
        
        // Keep UI panel and hover area always functional and visible
        const uiPanel = document.getElementById('ui');
        const uiHoverArea = document.getElementById('ui-hover-area');
        
        // UI panel should NOT be affected by the Info Opacity slider
        // The Info Opacity slider only controls on-screen information elements
        if (uiPanel) {
            // Remove any opacity styling from the UI panel itself
            uiPanel.style.opacity = '';
            // Remove the ui-hidden class as it's not needed for opacity control
            uiPanel.classList.remove('ui-hidden');
        }
        
        // Always keep the hover area functional regardless of opacity setting
        if (uiHoverArea) {
            uiHoverArea.style.display = '';
            uiHoverArea.style.pointerEvents = 'auto';
        }

        console.log(`UI opacity: ${this.uiOpacity}`);
    }

    updateFrequencyIndicators() {
        // Update the visual frequency bars in the UI
        const bassBar = document.getElementById('bass-level');
        const midBar = document.getElementById('mid-level');
        const highBar = document.getElementById('high-level');
        
        // Update the clone frequency bars in bottom right
        const bassBarClone = document.getElementById('bass-level-clone');
        const midBarClone = document.getElementById('mid-level-clone');
        const highBarClone = document.getElementById('high-level-clone');
        
        if (bassBar) {
            const bassPercentage = Math.min(100, this.bassIntensity * 100);
            bassBar.style.width = `${bassPercentage}%`;
        }
        
        if (midBar) {
            const midPercentage = Math.min(100, this.midIntensity * 100);
            midBar.style.width = `${midPercentage}%`;
        }
        
        if (highBar) {
            const highPercentage = Math.min(100, this.highIntensity * 100);
            highBar.style.width = `${highPercentage}%`;
        }
        
        // Update clone bars (vertical, so use height instead of width)
        if (bassBarClone) {
            const bassPercentage = Math.min(100, this.bassIntensity * 100);
            bassBarClone.style.height = `${bassPercentage}%`;
        }
        
        if (midBarClone) {
            const midPercentage = Math.min(100, this.midIntensity * 100);
            midBarClone.style.height = `${midPercentage}%`;
        }
        
        if (highBarClone) {
            const highPercentage = Math.min(100, this.highIntensity * 100);
            highBarClone.style.height = `${highPercentage}%`;
        }
    }    updateFrequencyAnalyzerCloneColors(gridColorHex) {
        // Update all elements in the frequency analyzer clone to match grid color
        const labels = document.querySelectorAll('.freq-label-vertical');
        const hzLabels = document.querySelectorAll('.freq-hz-vertical');
        const bars = document.querySelectorAll('.freq-bar-vertical');
        const levels = document.querySelectorAll('.freq-level-vertical');
        
        labels.forEach(label => {
            label.style.color = gridColorHex;
        });
        
        hzLabels.forEach(hz => {
            hz.style.color = gridColorHex;
        });
        
        levels.forEach(level => {
            level.style.backgroundColor = gridColorHex;
        });
          // Update bar backgrounds and borders with reduced opacity
        const gridColorRgb = this.hexToRgb(gridColorHex);
        if (gridColorRgb) {
            const barBackground = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.1)`;
            const barBorder = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.3)`;
            bars.forEach(bar => {
                bar.style.backgroundColor = barBackground;
                bar.style.borderColor = barBorder;
            });
        }          // Update SVG logo colors to match grid color
        const svgLogoPaths = document.querySelectorAll('.svg-logo-path');
        svgLogoPaths.forEach(path => {
            path.style.fill = gridColorHex;
        });
        
        // Update track progress bar colors using CSS custom properties
        const progressContainer = document.getElementById('track-progress-container');
        if (progressContainer && gridColorRgb) {
            const glowColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.3)`;
            const bgColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.1)`;
            const borderColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.3)`;
            const hoverBgColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.2)`;
            const hoverBorderColor = `rgba(${gridColorRgb.r}, ${gridColorRgb.g}, ${gridColorRgb.b}, 0.5)`;
            
            progressContainer.style.setProperty('--grid-color', gridColorHex);
            progressContainer.style.setProperty('--grid-color-glow', glowColor);
            progressContainer.style.setProperty('--grid-color-bg', bgColor);
            progressContainer.style.setProperty('--grid-color-border', borderColor);
            progressContainer.style.setProperty('--grid-color-hover', hoverBgColor);
            progressContainer.style.setProperty('--grid-color-border-hover', hoverBorderColor);
        }
    }
      hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    rgbToHue(r, g, b) {
        // Convert RGB to HSL to get hue value for CSS filter
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let hue = 0;
        
        if (diff !== 0) {
            if (max === r) {
                hue = ((g - b) / diff) % 6;
            } else if (max === g) {
                hue = (b - r) / diff + 2;
            } else {
                hue = (r - g) / diff + 4;
            }
        }
        
        hue = Math.round(hue * 60);
        if (hue < 0) hue += 360;
        
        return hue;
    }
      rgbToSaturation(r, g, b) {
        // Convert RGB to HSL to get saturation value
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        if (max === 0) return 0;
        return diff / max;
    }    getColorFilter(r, g, b) {
        // Simple and reliable method for single-color SVGs
        // Since SVGs start as #BBBBBB (187, 187, 187), we need to transform to target color
        
        // For exact color matching, use a direct approach
        // Convert target color to filter values
        const targetR = r / 255;
        const targetG = g / 255;
        const targetB = b / 255;
        
        // Calculate the transformation needed from gray (#BBBBBB = 187,187,187) to target color
        const baseGray = 187 / 255; // Original SVG color normalized
        
        // For grayscale targets, use simple brightness
        if (Math.abs(r - g) < 5 && Math.abs(g - b) < 5 && Math.abs(r - b) < 5) {
            const brightness = (targetR + targetG + targetB) / 3;
            const brightnessPercent = (brightness / baseGray) * 100;
            return `brightness(${brightnessPercent}%)`;
        }
        
        // For colored targets, use invert + hue-rotate approach
        // This is much simpler and more reliable than the complex chain
        return `brightness(0) saturate(100%) invert(1) hue-rotate(${this.rgbToHue(r, g, b)}deg) saturate(${this.rgbToSaturation(r, g, b) * 100}%) brightness(${(targetR + targetG + targetB) / 3 * 100}%)`;
    }    updateSvgColor(imgElement, hexColor) {
        // Direct approach: fetch SVG content and modify fill color
        if (!imgElement.src) return;
        
        // Skip if this is already a blob URL (to avoid refetching modified SVGs)
        if (imgElement.src.startsWith('blob:')) {
            // Use the original source for modifications
            const originalSrc = imgElement.dataset.originalSrc;
            if (originalSrc) {
                this.fetchAndUpdateSvg(originalSrc, imgElement, hexColor);
            }
            return;
        }
        
        this.fetchAndUpdateSvg(imgElement.src, imgElement, hexColor);
    }
      fetchAndUpdateSvg(svgUrl, imgElement, hexColor) {
        // Check for file:// protocol which would cause CORS issues
        if (window.location.protocol === 'file:') {
            console.warn('SVG color mod unavailable from file:// due to CORS.');
            console.warn('Use local HTTP server for full functionality.');
            // Fallback to CSS filter approach
            const gridColorRgb = this.hexToRgb(hexColor);
            if (gridColorRgb) {
                const filter = this.getColorFilter(gridColorRgb.r, gridColorRgb.g, gridColorRgb.b);
                imgElement.style.filter = filter;
            }
            return;
        }

        fetch(svgUrl)
            .then(response => response.text())
            .then(svgText => {
                // Replace both #BBBBBB and #bbbbbb (case insensitive)
                const modifiedSvg = svgText.replace(/#BBBBBB/gi, hexColor);
                
                // Convert to data URL and update the image source
                const blob = new Blob([modifiedSvg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                
                // Store original src if not already stored
                if (!imgElement.dataset.originalSrc) {
                    imgElement.dataset.originalSrc = imgElement.src;
                }
                
                imgElement.src = url;
                
                // Clean up previous blob URL to prevent memory leaks
                if (imgElement.dataset.currentBlobUrl) {
                    URL.revokeObjectURL(imgElement.dataset.currentBlobUrl);
                }
                imgElement.dataset.currentBlobUrl = url;
            })
            .catch(error => {
                console.warn('SVG color update failed:', error);
                // Fallback to CSS filter approach
                const gridColorRgb = this.hexToRgb(hexColor);
                if (gridColorRgb) {
                    const filter = this.getColorFilter(gridColorRgb.r, gridColorRgb.g, gridColorRgb.b);
                    imgElement.style.filter = filter;
                }
            });
    }    // Enhanced mouse camera controls
    initMouseControls() {
        this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
        this.mousePressed = false;
        
        // Mouse interaction setup for blob collision (raycaster components)
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        // Note: this.mouseInteraction is already initialized in constructor
        
        this.cameraControls = {
            distance: this.getBaseDistance(),    // Start at grid-appropriate optimal viewing distance
            azimuth: 0,
            elevation: 15,   // Start at better side viewing angle
            targetX: 0,
            targetY: 0,
            targetZ: 0,
            minDistance: this.getMinDistance(), // Use dynamic calculation
            maxDistance: this.getMaxDistance(), // Use dynamic calculation
            minElevation: -25,  // Allow some under views but not extreme
            maxElevation: 60,   // Allow moderate top views, not extreme
            damping: 0.1,
            // Grid bounds for camera constraints (more restrictive to stay inside)
            minX: -this.gridSize + 3,  // Keep 3 units away from walls
            maxX: this.gridSize - 3,
            minY: -8,                  // Don't go too low (floor level)
            maxY: this.gridSize * 1.5, // Don't go too high above grid
            minZ: -this.gridSize + 3,
            maxZ: this.gridSize - 3,            // Automatic camera movement properties
            autoMovement: {
                enabled: true,
                baseAzimuth: 0,
                baseElevation: 15,  // Lower starting elevation for better side viewing                baseDistance: this.getBaseDistance(), // Base distance (calculated based on grid size)
            rotationSpeed: 0.8, // Increased for more noticeable orbital movement
            zoomIntensity: 2,   // Reduced zoom intensity for less jarring movement
            elevationIntensity: 5, // Reduced elevation changes for more stable viewing
                lastBeatTime: 0,
                beatThreshold: 0.15, // bass intensity needed to register a beat
                rotationPhase: 0,
                manualOverride: false,
                overrideTimeout: 0,
                overrideDuration: 3000, // ms before resuming auto movement after manual input
                lastTargetUpdate: 0, // Track when we last updated the target position
                
                // Enhanced fly-around system
                flyAround: {
                    isActive: false,
                    startTime: 0,
                    duration: 0,
                    lastIntensityPeak: 0,
                    peakThreshold: 0.75, // Higher threshold for more selective triggering
                    minDuration: 2000, // Shorter 2 second bursts
                    maxDuration: 4000, // Maximum 4 seconds
                    cooldownTime: 0,
                    cooldownDuration: 3000, // 3 second cooldown
                    speedMultiplier: 2.5 // Moderate speed increase
                }
            }
        };
          // Mouse event listeners
        document.addEventListener('mousedown', (e) => {
            this.mousePressed = true;
            this.mouse.prevX = e.clientX;
            this.mouse.prevY = e.clientY;
            document.body.style.cursor = 'grabbing';
            
            // Trigger manual override for automatic camera movement
            this.cameraControls.autoMovement.manualOverride = true;
            this.cameraControls.autoMovement.overrideTimeout = performance.now();
        });
        
        document.addEventListener('mouseup', () => {
            this.mousePressed = false;
            document.body.style.cursor = 'default';
        });
        
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            if (this.mousePressed) {
                const deltaX = this.mouse.x - this.mouse.prevX;
                const deltaY = this.mouse.y - this.mouse.prevY;
                
                // Rotate camera around the target
                this.cameraControls.azimuth -= deltaX * 0.5;
                this.cameraControls.elevation += deltaY * 0.5;
                
                // Clamp elevation
                this.cameraControls.elevation = Math.max(
                    this.cameraControls.minElevation,
                    Math.min(this.cameraControls.maxElevation, this.cameraControls.elevation)
                );
                
                this.mouse.prevX = this.mouse.x;
                this.mouse.prevY = this.mouse.y;
            }
        });        // Mouse wheel for zoom
        document.addEventListener('wheel', (e) => {
            // Check if mouse is over UI panel or UI hover area
            const uiPanel = document.getElementById('ui');
            const uiHoverArea = document.getElementById('ui-hover-area');
            
            // Get element under cursor
            const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
            
            // Check if the mouse is over the UI panel or any of its children
            const isOverUI = uiPanel && (uiPanel.contains(elementUnderMouse) || elementUnderMouse === uiPanel);
            const isOverHoverArea = uiHoverArea && (uiHoverArea.contains(elementUnderMouse) || elementUnderMouse === uiHoverArea);
            
            // If mouse is over UI elements, let the browser handle scrolling normally
            if (isOverUI || isOverHoverArea) {
                // Don't prevent default - let the UI panel scroll naturally
                return;
            }
            
            // Otherwise, prevent default and use for camera zoom
            e.preventDefault();
            const zoomSpeed = 0.1;
            this.cameraControls.distance += e.deltaY * zoomSpeed;
            this.cameraControls.distance = Math.max(
                this.cameraControls.minDistance,
                Math.min(this.cameraControls.maxDistance, this.cameraControls.distance)
            );
            
            // Trigger manual override for automatic camera movement
            this.cameraControls.autoMovement.manualOverride = true;
            this.cameraControls.autoMovement.overrideTimeout = performance.now();
        }, { passive: false });        // Double-click to reset camera
        document.addEventListener('dblclick', () => {
            this.cameraControls.distance = this.getBaseDistance();  // Reset to grid-appropriate optimal distance
            this.cameraControls.azimuth = 0;
            this.cameraControls.elevation = 15; // Reset to optimal viewing angle
            this.cameraControls.targetX = 0;
            this.cameraControls.targetY = 0;
            this.cameraControls.targetZ = 0;
            // Ensure reset position is within bounds
            this.clampCameraTarget();
        });
          // Right-click to pan (disable context menu)
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
          document.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button for rotation
                this.mousePressed = true;
                this.mouse.prevX = e.clientX;
                this.mouse.prevY = e.clientY;
                document.body.style.cursor = 'grabbing';
                
                // Trigger manual override for automatic camera movement
                this.cameraControls.autoMovement.manualOverride = true;
                this.cameraControls.autoMovement.overrideTimeout = performance.now();
            } else if (e.button === 2) { // Right mouse button for panning
                this.panMode = true;
                this.mouse.prevX = e.clientX;
                this.mouse.prevY = e.clientY;
                document.body.style.cursor = 'move';
                
                // Trigger manual override for automatic camera movement
                this.cameraControls.autoMovement.manualOverride = true;
                this.cameraControls.autoMovement.overrideTimeout = performance.now();
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mousePressed = false;
                document.body.style.cursor = 'default';
            } else if (e.button === 2) {
                this.panMode = false;
                document.body.style.cursor = 'default';
            }
        });
          document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Update mouse interaction raycasting during idle mode
            this.updateMouseInteraction(e);
            
            if (this.mousePressed) {
                const deltaX = this.mouse.x - this.mouse.prevX;
                const deltaY = this.mouse.y - this.mouse.prevY;
                
                // Rotate camera around the target
                this.cameraControls.azimuth -= deltaX * 0.5;
                this.cameraControls.elevation += deltaY * 0.5;
                
                // Clamp elevation
                this.cameraControls.elevation = Math.max(
                    this.cameraControls.minElevation,
                    Math.min(this.cameraControls.maxElevation, this.cameraControls.elevation)
                );
                
                this.mouse.prevX = this.mouse.x;
                this.mouse.prevY = this.mouse.y;
            } else if (this.panMode) {
                const deltaX = e.clientX - this.mouse.prevX;
                const deltaY = e.clientY - this.mouse.prevY;
                  // Pan the camera target
                const panSpeed = 0.01;
                this.cameraControls.targetX -= deltaX * panSpeed;
                this.cameraControls.targetY += deltaY * panSpeed;
                
                // Clamp camera target within grid bounds
                this.clampCameraTarget();
                  this.mouse.prevX = e.clientX;
                this.mouse.prevY = e.clientY;
            }
        });
    }    // Mouse interaction for blob collision and deformation
    updateMouseInteraction(event) {
        // Only enable mouse interaction during idle mode (no music playing or low intensity)
        const isIdleMode = !this.isPlaying || (this.bassIntensity + this.midIntensity + this.highIntensity) < 0.3;
        
        if (!this.mouseInteraction.enabled || !isIdleMode || !this.camera) {
            this.mouseInteraction.intersectedBlob = null;
            this.mouseInteraction.mainBlobIntersection = null;
            // Reset cursor when not in idle mode
            document.body.style.cursor = 'default';
            return;
        }

        // Update mouse vector for raycasting
        this.mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouseVector, this.camera);

        // Check intersection with main ferrofluid blob
        if (this.ferrofluid) {
            const mainIntersects = this.raycaster.intersectObject(this.ferrofluid);
            if (mainIntersects.length > 0) {
                this.mouseInteraction.mainBlobIntersection = {
                    point: mainIntersects[0].point.clone(),
                    face: mainIntersects[0].face,
                    distance: mainIntersects[0].distance
                };
                // Change cursor to indicate interaction
                document.body.style.cursor = 'crosshair';
            } else {
                this.mouseInteraction.mainBlobIntersection = null;
            }
        }

        // Check intersection with floating blobs
        this.mouseInteraction.intersectedBlob = null;
        let closestDistance = Infinity;
        
        for (const blobData of this.floatingBlobs) {
            const intersects = this.raycaster.intersectObject(blobData.mesh);
            if (intersects.length > 0 && intersects[0].distance < closestDistance) {
                closestDistance = intersects[0].distance;
                this.mouseInteraction.intersectedBlob = {
                    blobData: blobData,
                    intersection: intersects[0]
                };
                // Change cursor to indicate interaction
                document.body.style.cursor = 'pointer';
            }
        }

        // Reset cursor if no intersection
        if (!this.mouseInteraction.mainBlobIntersection && !this.mouseInteraction.intersectedBlob) {
            document.body.style.cursor = 'default';
        }

        // Store mouse world position for force calculations
        if (this.mouseInteraction.mainBlobIntersection || this.mouseInteraction.intersectedBlob) {
            // Calculate mouse position in 3D space
            const mouseRay = this.raycaster.ray;
            const distance = this.mouseInteraction.mainBlobIntersection ? 
                this.mouseInteraction.mainBlobIntersection.distance : 
                (this.mouseInteraction.intersectedBlob ? this.mouseInteraction.intersectedBlob.intersection.distance : 15);
            
            this.mouseInteraction.mouseWorldPosition.copy(mouseRay.origin).add(
                mouseRay.direction.multiplyScalar(distance)
            );
        }

        this.mouseInteraction.lastMouseUpdate = performance.now();
    }    // Apply mouse forces to main ferrofluid blob
    applyMouseForceToMainBlob() {
        if (!this.mouseInteraction.mainBlobIntersection || !this.ferrofluid) return;

        const intersection = this.mouseInteraction.mainBlobIntersection;
        const forcePoint = intersection.point;
        const forceStrength = this.mouseInteraction.forceStrength;
        const forceRadius = this.mouseInteraction.forceRadius;

        // Create ripple wave at contact point
        this.createMouseRipple(forcePoint);

        // Get current geometry positions
        const geometry = this.ferrofluid.geometry;
        const positions = geometry.attributes.position.array;

        // Apply forces to vertices near the intersection point
        for (let i = 0; i < positions.length; i += 3) {
            const x = this.originalPositions[i];
            const y = this.originalPositions[i + 1];
            const z = this.originalPositions[i + 2];
            
            const vertexPos = new THREE.Vector3(x, y, z);
            // Transform to world space
            vertexPos.applyMatrix4(this.ferrofluid.matrixWorld);
            
            const distance = vertexPos.distanceTo(forcePoint);
            
            if (distance < forceRadius) {
                // Calculate force falloff (stronger closer to mouse)
                const influence = Math.exp(-Math.pow(distance / forceRadius, 2));
                
                // Calculate force direction (push away from mouse)
                const forceDirection = new THREE.Vector3()
                    .subVectors(vertexPos, forcePoint)
                    .normalize();                // Apply force to target positions
                const forceAmount = forceStrength * influence * 0.15;
                this.targetPositions[i] += forceDirection.x * forceAmount;
                this.targetPositions[i + 1] += forceDirection.y * forceAmount;
                this.targetPositions[i + 2] += forceDirection.z * forceAmount;
            }
        }
    }

    // Create ripple wave at mouse contact point
    createMouseRipple(contactPoint) {
        const now = performance.now() * 0.001; // Convert to seconds
          // Limit frequency of ripple creation (prevent spam but allow more dynamic interaction)
        if (this.mouseInteraction.waves.length > 0) {
            const lastWave = this.mouseInteraction.waves[this.mouseInteraction.waves.length - 1];
            if (now - lastWave.startTime < 0.05) return; // Reduced from 100ms to 50ms for more responsive liquid interaction
        }

        // Remove old waves if at max capacity
        if (this.mouseInteraction.waves.length >= this.mouseInteraction.maxWaves) {
            this.mouseInteraction.waves.shift(); // Remove oldest wave
        }

        // Convert world space contact point to ferrofluid local space
        const localContactPoint = new THREE.Vector3().copy(contactPoint);
        const invertedMatrix = this.ferrofluid.matrixWorld.clone().invert();
        localContactPoint.applyMatrix4(invertedMatrix);
        
        // Create new ripple wave
        const wave = {
            center: localContactPoint.clone(),
            startTime: now,
            amplitude: this.mouseInteraction.waveAmplitude,
            frequency: this.mouseInteraction.waveFrequency,
            decay: this.mouseInteraction.waveDecay,
            speed: this.mouseInteraction.waveSpeed,
            phase: Math.random() * Math.PI * 2 // Random phase for variety
        };

        this.mouseInteraction.waves.push(wave);
        
        console.log(`// Artefact ripple at:`, localContactPoint, ` // Waves: ${this.mouseInteraction.waves.length}`);
    }

    // Apply mouse forces to floating blobs
    applyMouseForceToFloatingBlobs() {
        if (!this.mouseInteraction.intersectedBlob) return;

        const intersectedBlob = this.mouseInteraction.intersectedBlob;
        const blobData = intersectedBlob.blobData;
        const intersection = intersectedBlob.intersection;
        
        // Apply push force away from mouse
        const pushDirection = new THREE.Vector3()
            .subVectors(blobData.mesh.position, intersection.point)
            .normalize();
        
        const pushForce = this.mouseInteraction.pushForce;
        blobData.velocity.add(pushDirection.multiplyScalar(pushForce * 0.1));
        
        // Add some upward component to make it more dynamic
        blobData.velocity.y += pushForce * 0.05;
        
        // Apply deformation to the intersected blob
        const forcePoint = intersection.point;
        const localForcePoint = new THREE.Vector3().copy(forcePoint);
        localForcePoint.sub(blobData.mesh.position); // Convert to local space
        
        const forceRadius = this.mouseInteraction.forceRadius * 0.7; // Smaller radius for floating blobs
        const forceStrength = this.mouseInteraction.forceStrength * 1.5; // Stronger force for more visible effect
        
        // Apply deformation to vertices
        const positions = blobData.geometry.attributes.position.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = blobData.originalPositions[i];
            const y = blobData.originalPositions[i + 1];
            const z = blobData.originalPositions[i + 2];
            
            const vertexPos = new THREE.Vector3(x, y, z);
            const distance = vertexPos.distanceTo(localForcePoint);
            
            if (distance < forceRadius) {
                const influence = Math.exp(-Math.pow(distance / forceRadius, 2));
                
                // Push vertices away from force point
                const forceDirection = new THREE.Vector3()
                    .subVectors(vertexPos, localForcePoint)
                    .normalize();
                
                const forceAmount = forceStrength * influence * 0.3;
                blobData.targetPositions[i] += forceDirection.x * forceAmount;
                blobData.targetPositions[i + 1] += forceDirection.y * forceAmount;
                blobData.targetPositions[i + 2] += forceDirection.z * forceAmount;
            }
        }
    }
    
    // Helper methods for improved camera distance calculations
    getBaseDistance() {
        if (this.gridSize <= 15) {
            return 13 + (this.gridSize - 10) * 0.6; // Range: 13 to 16 (centered in new 7-23 range)
        } else {
            // For grid sizes above 15, keep the same distance as grid size 15
            return 16; // Centered in the 7-23 range for all larger grids
        }
    }
    
    getMinDistance() {
        if (this.gridSize <= 15) {
            return 8 + (this.gridSize - 10) * 0.2; // Range: 8 to 9 (increased by 2 points)
        } else {
            // For grid sizes above 15, keep similar bounds as grid size 15
            return 9; // Fixed at grid size 15 level (increased by 2 points)
        }
    }
    
    getMaxDistance() {
        if (this.gridSize <= 15) {
            return 20 + (this.gridSize - 10) * 0.6; // Range: 20 to 23 (reduced from 25-30)
        } else {
            // For grid sizes above 15, keep similar bounds as grid size 15
            return 23; // Reduced from 30 to spend more time at mid-range
        }
    }
    
    // Update camera scaling based on grid size
    updateCameraScaling() {
        // Update camera control limits using improved scaling
        this.cameraControls.minDistance = this.getMinDistance();
        this.cameraControls.maxDistance = this.getMaxDistance();
        
        // Update automatic movement base distance
        this.cameraControls.autoMovement.baseDistance = this.getBaseDistance();
        
        // Update current camera distance to match the new grid size
        this.cameraControls.distance = this.getBaseDistance();
    }
    
    // New method to update only the camera scaling without resetting distance
    updateCameraLimitsOnly() {
        // Update camera control limits using improved scaling
        this.cameraControls.minDistance = this.getMinDistance();
        this.cameraControls.maxDistance = this.getMaxDistance();
        
        // Update automatic movement base distance
        this.cameraControls.autoMovement.baseDistance = this.getBaseDistance();
        
        // Don't reset the camera distance - let it stay where it is
    }
      // Update automatic camera movement based on music
    updateAutomaticCameraMovement(deltaTime) {
        if (!this.cameraControls.autoMovement.enabled) return;
        
        const autoMove = this.cameraControls.autoMovement;
        const flyAround = autoMove.flyAround;
        const currentTime = performance.now();
        
        // Check if manual override is active
        if (autoMove.manualOverride) {
            if (currentTime - autoMove.overrideTimeout > autoMove.overrideDuration) {
                // Resume automatic movement
                autoMove.manualOverride = false;
            } else {
                return; // Skip automatic movement while manual override is active
            }
        }
        
        // Set camera target to follow the main ferrofluid blob (smoothly)
        if (this.ferrofluid) {
            const smoothingFactor = 0.05; // Smooth tracking
            this.cameraControls.targetX += (this.ferrofluid.position.x - this.cameraControls.targetX) * smoothingFactor;
            this.cameraControls.targetY += (this.ferrofluid.position.y - this.cameraControls.targetY) * smoothingFactor;
            this.cameraControls.targetZ += (this.ferrofluid.position.z - this.cameraControls.targetZ) * smoothingFactor;
        }
        
        // Calculate music intensity for fly-around triggering
        const totalIntensity = (this.bassIntensity + this.midIntensity + this.highIntensity) / 3;
        
        // Enhanced fly-around system logic
        this.updateFlyAroundSystem(totalIntensity, currentTime, deltaTime);
        
        // Calculate movement based on fly-around state
        if (flyAround.isActive) {
            this.updateFlyAroundMovement(deltaTime, currentTime);
        } else {
            this.updateNormalCameraMovement(deltaTime, 1.0, currentTime);
        }
    }
    
    updateFlyAroundSystem(totalIntensity, currentTime, deltaTime) {
        const flyAround = this.cameraControls.autoMovement.flyAround;
        
        // Check if we're in cooldown
        if (flyAround.cooldownTime > 0) {
            flyAround.cooldownTime -= deltaTime * 1000;
            return;
        }
        
        // Detect intensity peaks for triggering fly-around
        if (totalIntensity > flyAround.peakThreshold && totalIntensity > flyAround.lastIntensityPeak + 0.15) {
            if (!flyAround.isActive) {
                // Start fly-around sequence
                flyAround.isActive = true;
                flyAround.startTime = currentTime;
                flyAround.duration = flyAround.minDuration + Math.random() * (flyAround.maxDuration - flyAround.minDuration);
                
                console.log(`🎥 Fly-around activated for ${(flyAround.duration/1000).toFixed(1)}s`);
            }
        }
        
        flyAround.lastIntensityPeak = totalIntensity;
        
        // Check if fly-around should end
        if (flyAround.isActive && (currentTime - flyAround.startTime) > flyAround.duration) {
            flyAround.isActive = false;
            flyAround.cooldownTime = flyAround.cooldownDuration;
            console.log('🎥 Fly-around ended, returning to normal movement');
        }
    }
    
    updateFlyAroundMovement(deltaTime, currentTime) {
        // This is just sped-up normal movement - no complex patterns
        this.updateNormalCameraMovement(deltaTime, this.cameraControls.autoMovement.flyAround.speedMultiplier, currentTime);
    }
    
    updateNormalCameraMovement(deltaTime, speedMultiplier, currentTime) {
        const totalIntensity = (this.bassIntensity + this.midIntensity + this.highIntensity) / 3;
        const speedMult = speedMultiplier || 1.0;
        
        // Enhanced horizontal rotation - continuous orbital movement with music bursts
        const baseRotationSpeed = 1.2 * speedMult; // Apply speed multiplier to base speed
        const musicRotationBoost = totalIntensity * 8 * speedMult; // Apply multiplier to music boost too
        const rotationSpeed = baseRotationSpeed + musicRotationBoost;
        
        // Add occasional direction changes and speed variations
        const timePhase = currentTime * 0.0002;
        const directionVariation = Math.sin(timePhase * 0.3) * totalIntensity * 3;
        
        // Continuously rotate with dynamic speed
        this.cameraControls.azimuth += (rotationSpeed + directionVariation) * deltaTime;
        
        // Much more dramatic elevation changes - focus on side and moderate top views
        const elevationTimePhase = currentTime * 0.0003;
        const musicElevationInfluence = totalIntensity * 20; // Reduced from 25 for less extreme movement
        
        // Create sweeping elevation movements that favor side views
        const baseElevationSweep = Math.sin(elevationTimePhase) * 25 + 10; // Sweep from -15 to +45 (more side-focused)
        const musicElevationSweep = Math.sin(elevationTimePhase * 1.5) * musicElevationInfluence * 0.6; // Reduced amplitude
        const bassElevationPulse = this.bassIntensity * Math.sin(elevationTimePhase * 3) * 15; // Reduced from 20
        
        this.cameraControls.elevation = baseElevationSweep + musicElevationSweep + bassElevationPulse;
        
        // Enhanced distance changes for dramatic zoom effects
        const distanceTimePhase = currentTime * 0.0004;
        
        // Improved scaling logic for camera distance based on grid size
        let gridSizeScale;
        if (this.gridSize <= 15) {
            gridSizeScale = 0.8 + (this.gridSize - 10) * 0.04; // Range: 0.8 to 1.0
        } else {
            gridSizeScale = 1.0; // Fixed at grid size 15 level
        }
        
        const scaledBaseDistance = 16 * gridSizeScale; // Updated to use new centered base distance
        
        // Scale effects consistently - don't increase for larger grids
        const effectScale = gridSizeScale;
        const musicZoomRange = totalIntensity * 0 * effectScale; // Disabled music zoom to prevent too much close-up
        const breathingEffect = Math.sin(distanceTimePhase) * 3 * effectScale;
        const bassZoomPulse = this.bassIntensity * Math.sin(distanceTimePhase * 4) * 2 * effectScale; // Reduced from 5 to 2
        
        this.cameraControls.distance = scaledBaseDistance + breathingEffect + musicZoomRange + bassZoomPulse;
        
        // Clamp values within side-view focused limits, with grid-size appropriate scaling
        this.cameraControls.elevation = Math.max(-20, Math.min(50, this.cameraControls.elevation));
        
        // Improved distance limits based on grid size
        let minDistance, maxDistance;
        if (this.gridSize <= 15) {
            // Small grids: allow very close camera, reduced max distance for more mid-range time
            minDistance = 6 + (this.gridSize - 10) * 0.2; // Range: 6 to 7
            maxDistance = 20 + (this.gridSize - 10) * 0.6; // Range: 20 to 23 (reduced from 25-30)
        } else {
            // Large grids: use the same bounds as grid size 15 to prevent zooming too far out
            minDistance = 7; // Same as grid size 15
            maxDistance = 23; // Reduced from 30 to spend more time at mid-range
        }
        
        this.cameraControls.distance = Math.max(minDistance, Math.min(maxDistance, this.cameraControls.distance));
    }
    
    // Clamp camera target within grid bounds
    clampCameraTarget() {
        const controls = this.cameraControls;
        
        // Update bounds based on current grid size
        controls.minX = -this.gridSize;
        controls.maxX = this.gridSize;
        controls.minY = -10;
        controls.maxY = this.gridSize * 2 - 10;
        controls.minZ = -this.gridSize;
        controls.maxZ = this.gridSize;
        
        // Clamp target position within bounds
        controls.targetX = Math.max(controls.minX, Math.min(controls.maxX, controls.targetX));
        controls.targetY = Math.max(controls.minY, Math.min(controls.maxY, controls.targetY));
        controls.targetZ = Math.max(controls.minZ, Math.min(controls.maxZ, controls.targetZ));
    }
      // Update camera position based on controls
    updateCameraPosition() {
        const controls = this.cameraControls;
        
        // Convert spherical coordinates to cartesian
        const phi = THREE.MathUtils.degToRad(90 - controls.elevation);
        const theta = THREE.MathUtils.degToRad(controls.azimuth);
        
        const x = controls.distance * Math.sin(phi) * Math.cos(theta);
        const y = controls.distance * Math.cos(phi);
        const z = controls.distance * Math.sin(phi) * Math.sin(theta);
        
        // Calculate target camera position
        const targetPos = new THREE.Vector3(
            controls.targetX + x,
            controls.targetY + y,
            controls.targetZ + z
        );
        
        // More flexible grid bounds checking - allow camera to explore more space
        // while ensuring it stays within the room created by the grid walls
        const margin = 1.5; // Reduced margin for more freedom
        
        // Check if the camera would be outside the grid bounds and adjust if needed
        if (targetPos.x < controls.minX + margin || targetPos.x > controls.maxX - margin ||
            targetPos.y < controls.minY + margin || targetPos.y > controls.maxY - margin ||
            targetPos.z < controls.minZ + margin || targetPos.z > controls.maxZ - margin) {
            
            // If camera would go outside bounds, adjust the distance to keep it inside
            // while preserving the desired viewing angle
            const centerPos = new THREE.Vector3(controls.targetX, controls.targetY, controls.targetZ);
            const direction = new THREE.Vector3(x, y, z).normalize();
            
            // Calculate maximum safe distance in this direction
            const maxSafeDistance = this.calculateMaxSafeDistance(centerPos, direction, controls);
            
            // Use the safe distance if it's smaller than desired distance
            if (maxSafeDistance < controls.distance) {
                const safeX = maxSafeDistance * Math.sin(phi) * Math.cos(theta);
                const safeY = maxSafeDistance * Math.cos(phi);
                const safeZ = maxSafeDistance * Math.sin(phi) * Math.sin(theta);
                
                targetPos.set(
                    controls.targetX + safeX,
                    controls.targetY + safeY,
                    controls.targetZ + safeZ
                );
            }
        }
        
        // Apply smoothing
        const currentPos = this.camera.position;
        currentPos.lerp(targetPos, controls.damping);
        
        // Look at target
        this.camera.lookAt(controls.targetX, controls.targetY, controls.targetZ);
    }
    
    // Helper function to calculate maximum safe distance in a given direction
    calculateMaxSafeDistance(center, direction, controls) {
        const margin = 1.5;
        let maxDistance = controls.maxDistance;
        
        // Check intersection with each boundary plane
        if (direction.x !== 0) {
            const distToMaxX = (controls.maxX - margin - center.x) / direction.x;
            const distToMinX = (controls.minX + margin - center.x) / direction.x;
            if (distToMaxX > 0) maxDistance = Math.min(maxDistance, distToMaxX);
            if (distToMinX > 0) maxDistance = Math.min(maxDistance, distToMinX);
        }
        
        if (direction.y !== 0) {
            const distToMaxY = (controls.maxY - margin - center.y) / direction.y;
            const distToMinY = (controls.minY + margin - center.y) / direction.y;
            if (distToMaxY > 0) maxDistance = Math.min(maxDistance, distToMaxY);
            if (distToMinY > 0) maxDistance = Math.min(maxDistance, distToMinY);
        }
        
        if (direction.z !== 0) {
            const distToMaxZ = (controls.maxZ - margin - center.z) / direction.z;
            const distToMinZ = (controls.minZ + margin - center.z) / direction.z;
            if (distToMaxZ > 0) maxDistance = Math.min(maxDistance, distToMaxZ);
            if (distToMinZ > 0) maxDistance = Math.min(maxDistance, distToMinZ);
        }
        
        return Math.max(controls.minDistance, maxDistance);
    }
      animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Calculate delta time for frame-rate independent animation
        const now = performance.now() * 0.001;
        const deltaTime = now - (this.lastAnimationTime || now);
        this.lastAnimationTime = now;        
        // DEBUG: Rotate test cube to verify animation is running
        if (this.testCube) {
            this.testCube.rotation.y += 0.01;
        }
        
        // High-frequency audio analysis for ultra-low latency response
        this.analyzeAudio();
        
        this.updateAnomalySystem(); // Update anomaly system for idle effects
        this.updateFerrofluid();
        this.updateFloatingBlobs(deltaTime);
          // Update orbital blob system
        if (this.orbitalBlobSystem) {
            this.orbitalBlobSystem.update(deltaTime);
        }
          // Update shockwave system
        if (this.shockwaveSystem) {
            this.shockwaveSystem.update(deltaTime);
        }

        // Update GPU particle shader system (temporarily disabled)
        if (this.gpuParticleSystem) {
            this.gpuParticleSystem.update(deltaTime);
        }          // Update grid cell animation
        if (this.gridCellAnimator) {
            this.gridCellAnimator.update(
                now,
                deltaTime,
                this.bassIntensity,
                this.midIntensity,
                this.highIntensity,
                this.gridVisible && this.gridCellsActivityEnabled, // Only animate if both grid and activity are enabled
                this.gridOpacity
            );
        }
        
        this.updateLighting();
        this.updateAutomaticCameraMovement(deltaTime);
        this.updateCameraPosition();        // Update performance monitor and apply quality adjustments
        if (this.performanceMonitor) {
            this.performanceMonitor.update();
            
            // Update performance display in UI
            this.updatePerformanceDisplay();
        }
        
        // Update time display and track progress
        this.updateTimeDisplay();
        
        // Render with filmic tone system or fallback to regular rendering
        if (this.filmicToneSystem) {
            this.filmicToneSystem.render(deltaTime);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        
        if (this.renderer) {
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
        
        // Update filmic tone system for new size
        if (this.filmicToneSystem) {
            this.filmicToneSystem.onWindowResize(width, height);
        }
    }
      destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.remove();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }        // Clean up floating blobs
        if (this.floatingBlobs) {
            this.floatingBlobs.forEach(blobData => {
                this.scene.remove(blobData.mesh);
                blobData.mesh.geometry.dispose();
                blobData.mesh.material.dispose();
            });
            this.floatingBlobs = [];
        }        // Clean up orbital blob system
        if (this.orbitalBlobSystem) {
            this.orbitalBlobSystem.clearAll();
        }

        // Clean up GPU particle shader system
        if (this.gpuParticleSystem) {
            this.gpuParticleSystem.dispose();
        }

        // Clean up inner ferrofluid sphere
        if (this.ferrofluidInner) {
            this.scene.remove(this.ferrofluidInner);
            this.ferrofluidInner.geometry.dispose();
            this.ferrofluidInner.material.dispose();
        }
        
        this.renderer.dispose();
    }    // Enhanced BPM Detection method
    detectBPM() {
        const now = performance.now();
        
        // Calculate spectral energy across frequency bands
        const bassEnergy = this.bassIntensity;
        const midEnergy = this.midIntensity;
        const highEnergy = this.highIntensity;
        
        // Weight different frequency bands for beat detection
        // Bass and low-mids are most important for beat detection
        const totalEnergy = (bassEnergy * 2.0) + (midEnergy * 1.5) + (highEnergy * 0.8);
        
        // Store energy in history for onset detection
        this.bpmDetector.energyHistory.push(totalEnergy);
        if (this.bpmDetector.energyHistory.length > this.bpmDetector.energyHistorySize) {
            this.bpmDetector.energyHistory.shift();
        }
        
        // Calculate spectral flux (energy change) for onset detection
        if (this.bpmDetector.energyHistory.length >= 2) {
            const currentEnergy = totalEnergy;
            const previousEnergy = this.bpmDetector.energyHistory[this.bpmDetector.energyHistory.length - 2];
            const spectralFlux = Math.max(0, currentEnergy - previousEnergy); // Only positive changes
            
            this.bpmDetector.spectralFluxHistory.push(spectralFlux);
            if (this.bpmDetector.spectralFluxHistory.length > this.bpmDetector.energyHistorySize) {
                this.bpmDetector.spectralFluxHistory.shift();
            }
            
            // Calculate adaptive threshold based on recent spectral flux history
            if (this.bpmDetector.spectralFluxHistory.length >= 10) {
                const recentFlux = this.bpmDetector.spectralFluxHistory.slice(-20); // Last 20 frames
                const meanFlux = recentFlux.reduce((sum, val) => sum + val, 0) / recentFlux.length;
                const variance = recentFlux.reduce((sum, val) => sum + Math.pow(val - meanFlux, 2), 0) / recentFlux.length;
                const stdDev = Math.sqrt(variance);
                
                // Adaptive threshold: mean + (multiplier * standard deviation)
                this.bpmDetector.adaptiveThreshold = meanFlux + (this.bpmDetector.thresholdMultiplier * stdDev);
                
                // Detect onset when spectral flux exceeds adaptive threshold
                if (spectralFlux > this.bpmDetector.adaptiveThreshold) {
                    const timeSinceLastBeat = now - this.bpmDetector.lastBeatTime;
                    
                    // Enforce minimum interval between beats
                    if (timeSinceLastBeat > this.bpmDetector.minimumBeatInterval) {
                        // Additional validation: ensure this is a significant energy increase
                        const energyIncrease = currentEnergy / Math.max(previousEnergy, 0.01);
                        
                        if (energyIncrease > 1.1) { // At least 10% energy increase
                            this.bpmDetector.peaks.push(now);
                            this.bpmDetector.lastBeatTime = now;
                            
                            // Debug: Log beat detection occasionally
                            if (Math.random() < 0.1) {
                                console.log(`Beat! Flux: ${spectralFlux.toFixed(3)}, Thresh: ${this.bpmDetector.adaptiveThreshold.toFixed(3)}, Energy+: ${(energyIncrease * 100 - 100).toFixed(1)}%`);
                            }
                            
                            // Remove old peaks outside of analysis window
                            const windowStart = now - this.bpmDetector.analysisWindow;
                            this.bpmDetector.peaks = this.bpmDetector.peaks.filter(peak => peak > windowStart);
                            
                            // Calculate BPM if we have enough peaks
                            if (this.bpmDetector.peaks.length >= 6) { // Require more peaks for accuracy
                                this.calculateBPM();
                            }
                        }
                    }
                }
            }
        }
        
        // Debug logging occasionally
        if (Math.random() < 0.01) {
            console.log(`BPM Debug - Energy: ${totalEnergy.toFixed(3)}, Thresh: ${this.bpmDetector.adaptiveThreshold.toFixed(3)}, Peaks: ${this.bpmDetector.peaks.length}`);
        }
    }    calculateBPM() {
        if (this.bpmDetector.peaks.length < 6) {
            console.log(`BPM: Need more peaks (${this.bpmDetector.peaks.length}/6)`);
            return;
        }
        
        // Calculate intervals between consecutive beats
        const intervals = [];
        for (let i = 1; i < this.bpmDetector.peaks.length; i++) {
            intervals.push(this.bpmDetector.peaks[i] - this.bpmDetector.peaks[i - 1]);
        }
        
        // Enhanced statistical analysis
        intervals.sort((a, b) => a - b);
        
        // Calculate quartiles for better outlier detection
        const q1Index = Math.floor(intervals.length * 0.25);
        const q3Index = Math.floor(intervals.length * 0.75);
        const medianIndex = Math.floor(intervals.length * 0.5);
        
        const q1 = intervals[q1Index];
        const q3 = intervals[q3Index];
        const median = intervals[medianIndex];
        const iqr = q3 - q1;
        
        // Use interquartile range for more robust outlier detection
        const lowerBound = q1 - (1.5 * iqr);
        const upperBound = q3 + (1.5 * iqr);
        
        const filteredIntervals = intervals.filter(interval => 
            interval >= lowerBound && interval <= upperBound
        );
        
        console.log(`BPM: Raw ${intervals.length}, Filtered ${filteredIntervals.length}, Median: ${Math.round(median)}ms`);
        
        if (filteredIntervals.length < 3) {
            console.log(`BPM: Need more filtered intervals (${filteredIntervals.length}/3)`);
            return;
        }
        
        // Calculate weighted average (give more weight to intervals closer to median)
        let weightedSum = 0;
        let totalWeight = 0;
        
        filteredIntervals.forEach(interval => {
            const distanceFromMedian = Math.abs(interval - median);
            const weight = 1 / (1 + distanceFromMedian / median); // Weight inversely proportional to distance from median
            weightedSum += interval * weight;
            totalWeight += weight;
        });
        
        const avgInterval = weightedSum / totalWeight;
        
        // Convert to BPM with rounding to nearest integer
        let calculatedBPM = Math.round(60000 / avgInterval);
        
        // Apply harmonic analysis to detect potential half-time or double-time issues
        const halfTimeBPM = Math.round(calculatedBPM / 2);
        const doubleTimeBPM = Math.round(calculatedBPM * 2);
        
        // Check if half-time or double-time makes more sense based on typical BPM ranges
        if (calculatedBPM > 160 && halfTimeBPM >= 70) {
            // Likely detecting double-time, use half-time instead
            console.log(`BPM: Double-time detected (${calculatedBPM}), using half: ${halfTimeBPM}`);
            calculatedBPM = halfTimeBPM;
        } else if (calculatedBPM < 80 && doubleTimeBPM <= 180) {
            // Likely detecting half-time, use double-time instead
            console.log(`BPM: Half-time detected (${calculatedBPM}), using double: ${doubleTimeBPM}`);
            calculatedBPM = doubleTimeBPM;
        }
        
        // Calculate confidence based on interval consistency
        const intervalVariance = filteredIntervals.reduce((sum, interval) => 
            sum + Math.pow(interval - avgInterval, 2), 0) / filteredIntervals.length;
        const intervalStdDev = Math.sqrt(intervalVariance);
        const coefficientOfVariation = intervalStdDev / avgInterval;
        const confidence = Math.max(0, 1 - coefficientOfVariation * 2); // Lower CV = higher confidence
        
        // Store confidence for this BPM calculation
        this.bpmDetector.confidenceWindow.push(confidence);
        if (this.bpmDetector.confidenceWindow.length > this.bpmDetector.confidenceWindowSize) {
            this.bpmDetector.confidenceWindow.shift();
        }
        
        // Calculate average confidence over recent calculations
        const avgConfidence = this.bpmDetector.confidenceWindow.reduce((sum, c) => sum + c, 0) / this.bpmDetector.confidenceWindow.length;
        
        console.log(`BPM: ${calculatedBPM}, Conf: ${(confidence * 100).toFixed(1)}%, Avg: ${(avgConfidence * 100).toFixed(1)}%`);
        
        // Only update BPM if confidence is high enough and BPM is in valid range
        if (calculatedBPM >= this.bpmDetector.minBpm && 
            calculatedBPM <= this.bpmDetector.maxBpm && 
            avgConfidence >= this.bpmDetector.minConfidence) {
            
            this.bpmDetector.bpm = calculatedBPM;
            const bpmElement = document.getElementById('track-bpm');
            if (bpmElement) {
                bpmElement.textContent = calculatedBPM.toString();
                console.log(`Artefact BPM updated to: ${calculatedBPM} (confidence: ${(avgConfidence * 100).toFixed(1)}%)`);
            }
        } else {
            const reason = calculatedBPM < this.bpmDetector.minBpm || calculatedBPM > this.bpmDetector.maxBpm 
                ? `outside valid range ${this.bpmDetector.minBpm}-${this.bpmDetector.maxBpm}` 
                : `low confidence ${(avgConfidence * 100).toFixed(1)}% < ${(this.bpmDetector.minConfidence * 100)}%`;
            console.log(`BPM ${calculatedBPM} rejected (${reason})`);
        }
    }// Settings Methods
    getUISettings() {
        return {
            // Audio settings
            sensitivity: this.sensitivity,
            smoothing: this.smoothing,
            eqBass: 0, // These would need to be implemented if you have EQ controls
            eqMid: 0,
            eqHigh: 0,
            
            // Grid settings
            gridVisible: this.gridVisible,
            gridSize: this.gridSize,
            gridOpacity: this.gridOpacity,
            gridColor: this.gridColor,
            gridCellsActivityEnabled: this.gridCellsActivityEnabled, // Persist toggle
            
            // Shadow settings
            shadowTransparency: this.shadowTransparency,
            shadowColor: this.shadowColor,
            linkShadowColor: this.linkShadowColor,
            
            // Background settings
            backgroundColor: this.backgroundColor,
            
            // Light colors
            lightBassColor: this.lightBassColor,
            lightMidColor: this.lightMidColor,
            lightHighColor: this.lightHighColor,
              // Environment settings
            envSphereColor: this.envSphereColor,
            envSphereSize: this.envSphereSize,            envVisibility: this.envVisibility,
            
            // Onscreen info settings
            uiOpacity: this.uiOpacity,

            // Filmic Tone System settings
            filmicTones: this.filmicToneSystem ? this.filmicToneSystem.getSettings() : {
                enabled: false,
                toneMapping: 'linear',
                exposure: 1.0,
                contrast: 1.0,
                saturation: 1.0,
                vibrance: 0.0,
                gamma: 1.0,
                lift: { r: 0.0, g: 0.0, b: 0.0 },
                gammaRGB: { r: 1.0, g: 1.0, b: 1.0 },
                gain: { r: 1.0, g: 1.0, b: 1.0 },
                filmGrainIntensity: 0.0,
                vignetteStrength: 0.0,
                chromaticAberration: 0.0,
                lensDistortion: 0.0,
                
                // Advanced Cinematic Effects
                filmHalation: 0.0,
                filmScratches: 0.0,
                colorFringing: 0.0,
                scanlines: 0.0,
                
                colorTemperature: 6500,
                tint: 0.0,
                bloom: {
                    enabled: false,
                    strength: 0.3,
                    radius: 0.4,
                    threshold: 0.85
                }
            },

            // Mouse interaction settings
            mouseInteractionEnabled: this.mouseInteraction ? this.mouseInteraction.enabled : true,
            mouseForceStrength: this.mouseInteraction ? this.mouseInteraction.forceStrength : 0.5,
            mouseForceRadius: this.mouseInteraction ? this.mouseInteraction.forceRadius : 0.2,
            mousePushForce: this.mouseInteraction ? this.mouseInteraction.pushForce : 2,            // Shockwave system settings (simplified - only configurable settings)
            shockwaveEnabled: this.shockwaveSystem ? this.shockwaveSystem.enabled : true,
            shockwaveIntensity: this.shockwaveSystem ? this.shockwaveSystem.config.intensity : 1.0,
            shockwaveLifetime: this.shockwaveSystem ? this.shockwaveSystem.config.lifetime : 3.0,
            shockwaveOpacity: this.shockwaveSystem ? this.shockwaveSystem.config.opacity : 0.8,            
            // Debug settings
            debugEncodingEnabled: window.debugEncodingSettings ? window.debugEncodingSettings.enabled : false,
            debugConsoleVisible: document.getElementById('debug-console-toggle') ? 
                document.getElementById('debug-console-toggle').checked : true,
            
            // Metadata
            settingsVersion: "1.0",
            exportDate: new Date().toISOString()
        };
    }

    applyUISettings(settings) {
        try {
            // Audio settings
            if (settings.sensitivity !== undefined) {
                this.sensitivity = settings.sensitivity;
                const sensitivitySlider = document.getElementById('sensitivity');
                const sensitivityValue = document.getElementById('sensitivity-value');
                if (sensitivitySlider) sensitivitySlider.value = this.sensitivity;
                if (sensitivityValue) sensitivityValue.textContent = this.sensitivity.toFixed(2);
            }
              if (settings.smoothing !== undefined) {
                this.smoothing = settings.smoothing;
                const smoothingSlider = document.getElementById('smoothing');
                const smoothingValue = document.getElementById('smoothing-value');
                if (smoothingSlider) smoothingSlider.value = this.smoothing;
                if (smoothingValue) smoothingValue.textContent = this.smoothing.toFixed(1);
                if (this.analyser) {
                    // Clamp smoothingTimeConstant to valid range [0,1] for Web Audio API
                    const clampedSmoothing = Math.max(0, Math.min(1, this.smoothing));
                    this.analyser.smoothingTimeConstant = clampedSmoothing;
                }
            }
              // Grid settings
            if (settings.gridVisible !== undefined) {
                this.gridVisible = settings.gridVisible;
                const gridToggle = document.getElementById('grid-toggle');
                if (gridToggle) gridToggle.checked = this.gridVisible;
                if (this.gridGroup) {
                    this.gridGroup.visible = this.gridVisible;
                }
                // Show permanent floor only when grid is disabled to avoid double shadows
                if (this.permanentFloor) {
                    this.permanentFloor.visible = !this.gridVisible;
                }
            }
            
            if (settings.gridSize !== undefined) {
                const previousGridSize = this.gridSize;
                this.gridSize = settings.gridSize;
                
                // Only update camera scaling if grid size actually changed
                if (previousGridSize !== this.gridSize) {
                    this.updateCameraScaling(); // Update camera scaling for loaded grid size
                    this.createGrid(); // Recreate grid with new size
                    if (this.cameraControls) {
                        this.clampCameraTarget();
                    }
                    // Recreate grid cell animator with new size
                    if (this.gridCellAnimator) {
                        this.gridCellAnimator.dispose();
                        this.gridCellAnimator = new GridCellAnimator(this.gridSize, this.scene, this.analyser, this.gridColor, this.backgroundColor);
                    }
                }
                
                const gridSizeSlider = document.getElementById('grid-size');
                const gridSizeValue = document.getElementById('grid-size-value');
                if (gridSizeSlider) gridSizeSlider.value = this.gridSize;
                if (gridSizeValue) gridSizeValue.textContent = this.gridSize;
            }
            
            if (settings.gridOpacity !== undefined) {
                this.gridOpacity = settings.gridOpacity;
                const gridOpacitySlider = document.getElementById('grid-opacity');
                const gridOpacityValue = document.getElementById('grid-opacity-value');
                if (gridOpacitySlider) gridOpacitySlider.value = this.gridOpacity;
                if (gridOpacityValue) gridOpacityValue.textContent = this.gridOpacity.toFixed(1);
                if (this.gridGroup) {
                    this.gridGroup.children.forEach(mesh => {
                        if (mesh.material && mesh.material.type !== 'ShadowMaterial') {
                            mesh.material.opacity = this.gridOpacity;
                        }
                    });
                }
            }
            
            if (settings.gridColor !== undefined) {
                this.gridColor = settings.gridColor;
                const gridColorInput = document.getElementById('grid-color');
                if (gridColorInput) {
                    gridColorInput.value = '#' + this.gridColor.toString(16).padStart(6, '0');
                }
                if (this.gridGroup) {
                    this.gridGroup.children.forEach(mesh => {
                        if (mesh.material && mesh.material.type !== 'ShadowMaterial') {
                            if (mesh.material.color) {
                                mesh.material.color.setHex(this.gridColor);
                            }
                        }
                    });
                }                // Update frequency analyzer colors
                const gridColorHex = '#' + this.gridColor.toString(16).padStart(6, '0');
                this.updateFrequencyAnalyzerCloneColors(gridColorHex);
                  // Update track info elements
                const trackBpm = document.getElementById('track-bpm');
                const trackNameVertical = document.getElementById('track-name-vertical');
                const trackTimeDisplay = document.getElementById('track-time-display');
                const trackFreqDisplay = document.getElementById('track-freq-display');
                const performanceFps = document.getElementById('performance-fps');
                const performanceQuality = document.getElementById('performance-quality');
                const performanceObjects = document.getElementById('performance-objects');
                if (trackBpm) trackBpm.style.color = gridColorHex;
                if (trackNameVertical) trackNameVertical.style.color = gridColorHex;
                if (trackTimeDisplay) trackTimeDisplay.style.color = gridColorHex;
                if (trackFreqDisplay) trackFreqDisplay.style.color = gridColorHex;
                if (performanceFps) performanceFps.style.color = gridColorHex;
                if (performanceQuality) performanceQuality.style.color = gridColorHex;
                if (performanceObjects) performanceObjects.style.color = gridColorHex;
                  // Update debug panel and status message colors
                const debugPanel = document.getElementById('debug-info-panel');
                const statusMessage = document.getElementById('status-message');
                if (debugPanel) debugPanel.style.color = gridColorHex;
                if (statusMessage) statusMessage.style.color = gridColorHex;
                
                // Update grid cell animator colors
                if (this.gridCellAnimator) {
                    this.gridCellAnimator.updateColors(this.gridColor, this.backgroundColor);
                }
            }
            
            // Shadow settings
            if (settings.shadowTransparency !== undefined) {
                this.shadowTransparency = settings.shadowTransparency;
                const shadowSlider = document.getElementById('shadow-transparency');
                const shadowValue = document.getElementById('shadow-transparency-value');
                if (shadowSlider) shadowSlider.value = this.shadowTransparency;
                if (shadowValue) shadowValue.textContent = this.shadowTransparency.toFixed(1);
                this.updateShadowTransparency();
            }
            
            if (settings.shadowColor !== undefined) {
                this.shadowColor = settings.shadowColor;
                const shadowColorInput = document.getElementById('shadow-color');
                if (shadowColorInput) {
                    shadowColorInput.value = '#' + this.shadowColor.toString(16).padStart(6, '0');
                }
            }
            
            if (settings.linkShadowColor !== undefined) {
                this.linkShadowColor = settings.linkShadowColor;
                const linkToggle = document.getElementById('link-shadow-color');
                if (linkToggle) linkToggle.checked = this.linkShadowColor;
                const shadowColorInput = document.getElementById('shadow-color');
                if (shadowColorInput) {
                    shadowColorInput.disabled = this.linkShadowColor;
                }
            }
              // Background settings
            if (settings.backgroundColor !== undefined) {
                this.backgroundColor = settings.backgroundColor;
                const backgroundColorInput = document.getElementById('background-color');
                if (backgroundColorInput) {
                    backgroundColorInput.value = '#' + this.backgroundColor.toString(16).padStart(6, '0');
                }
                if (this.scene) {
                    this.scene.background.setHex(this.backgroundColor);
                    if (this.scene.fog) {
                        this.scene.fog.color.setHex(this.backgroundColor);
                    }
                }
                this.updateLightingFromBackground();
                
                // Update grid cell animator colors
                if (this.gridCellAnimator) {
                    this.gridCellAnimator.updateColors(this.gridColor, this.backgroundColor);
                }
            }
            
            // Light colors
            if (settings.lightBassColor !== undefined) {
                this.lightBassColor = settings.lightBassColor;
                const bassColorInput = document.getElementById('light-bass-color');
                if (bassColorInput) {
                    bassColorInput.value = '#' + this.lightBassColor.toString(16).padStart(6, '0');
                }
            }
            
            if (settings.lightMidColor !== undefined) {
                this.lightMidColor = settings.lightMidColor;
                const midColorInput = document.getElementById('light-mid-color');
                if (midColorInput) {
                    midColorInput.value = '#' + this.lightMidColor.toString(16).padStart(6, '0');
                }
            }
            
            if (settings.lightHighColor !== undefined) {
                this.lightHighColor = settings.lightHighColor;
                const highColorInput = document.getElementById('light-high-color');
                if (highColorInput) {
                    highColorInput.value = '#' + this.lightHighColor.toString(16).padStart(6, '0');
                }
            }
            
            // Environment settings
            if (settings.envSphereColor !== undefined) {
                this.envSphereColor = settings.envSphereColor;
                const envColorInput = document.getElementById('env-sphere-color');
                if (envColorInput) {
                    envColorInput.value = '#' + this.envSphereColor.toString(16).padStart(6, '0');
                }
                if (this.envMaterial) {
                    this.envMaterial.color.setHex(this.envSphereColor);
                }
            }
            
            if (settings.envSphereSize !== undefined) {
                this.envSphereSize = settings.envSphereSize;
                const envSizeSlider = document.getElementById('env-size');
                const envSizeValue = document.getElementById('env-size-value');
                if (envSizeSlider) envSizeSlider.value = this.envSphereSize;
                if (envSizeValue) envSizeValue.textContent = this.envSphereSize;
                this.updateEnvironment();
            }            if (settings.envVisibility !== undefined) {
                this.envVisibility = settings.envVisibility;
                const envToggle = document.getElementById('env-visibility');
                if (envToggle) envToggle.checked = this.envVisibility > 0;
                this.updateEnvironment();
            }
              // UI opacity settings - default to 1.0 for backward compatibility
            this.uiOpacity = settings.uiOpacity !== undefined ? settings.uiOpacity : 1.0;
            const uiOpacitySlider = document.getElementById('ui-opacity');
            const uiOpacityValue = document.getElementById('ui-opacity-value');
            if (uiOpacitySlider) uiOpacitySlider.value = this.uiOpacity;
            if (uiOpacityValue) uiOpacityValue.textContent = this.uiOpacity.toFixed(1);
            this.updateUIOpacity();

            // Mouse interaction settings (internal only - no UI controls)
            // Mouse interaction is always enabled during idle mode
              // Grid Cells Activity setting - default to false if not present
            const gridCellsActivityEnabled = settings.gridCellsActivityEnabled !== undefined ? settings.gridCellsActivityEnabled : false;
            this.gridCellsActivityEnabled = gridCellsActivityEnabled;
            const gridCellsActivityToggle = document.getElementById('grid-cells-activity-toggle');
            if (gridCellsActivityToggle) gridCellsActivityToggle.checked = gridCellsActivityEnabled;
              // Debug settings - default to false if not present
            const debugEncodingEnabled = settings.debugEncodingEnabled !== undefined ? settings.debugEncodingEnabled : false;
            if (window.debugEncodingControls) {
                window.debugEncodingControls.setEnabled(debugEncodingEnabled);
                const debugToggle = document.getElementById('debug-encoding-toggle');            
                if (debugToggle) debugToggle.checked = debugEncodingEnabled;
            }            // Debug console settings
            const debugPanel = document.getElementById('debug-info-panel');
            const debugConsoleToggle = document.getElementById('debug-console-toggle');
            if (debugPanel && debugConsoleToggle) {
                // Set to the loaded value if present, otherwise default to true
                const debugConsoleVisible = settings.debugConsoleVisible !== undefined ? settings.debugConsoleVisible : true;
                debugPanel.style.display = debugConsoleVisible ? 'block' : 'none';
                debugConsoleToggle.checked = debugConsoleVisible;
            }
              // Shockwave settings - apply defaults if not present
            const shockwaveEnabledToggle = document.getElementById('shockwave-enabled');
            if (shockwaveEnabledToggle) {
                // Default to false (disabled) if not specified
                const shockwaveEnabled = settings.shockwaveEnabled !== undefined ? settings.shockwaveEnabled : false;
                shockwaveEnabledToggle.checked = shockwaveEnabled;
                if (this.shockwaveSystem) {
                    this.shockwaveSystem.setEnabled(shockwaveEnabled);
                }
            }
            
            // Apply default values for other shockwave settings if not present
            const shockwaveIntensity = settings.shockwaveIntensity !== undefined ? settings.shockwaveIntensity : 1.0;
            const shockwaveIntensitySlider = document.getElementById('shockwave-intensity');
            const shockwaveIntensityValue = document.getElementById('shockwave-intensity-value');
            if (shockwaveIntensitySlider) shockwaveIntensitySlider.value = shockwaveIntensity;
            if (shockwaveIntensityValue) shockwaveIntensityValue.textContent = shockwaveIntensity.toFixed(1);
            if (this.shockwaveSystem) {
                this.shockwaveSystem.config.intensity = shockwaveIntensity;
            }
            
            const shockwaveLineCount = settings.shockwaveLineCount !== undefined ? settings.shockwaveLineCount : 8;
            const shockwaveCountSlider = document.getElementById('shockwave-count');
            const shockwaveCountValue = document.getElementById('shockwave-count-value');
            if (shockwaveCountSlider) shockwaveCountSlider.value = shockwaveLineCount;
            if (shockwaveCountValue) shockwaveCountValue.textContent = shockwaveLineCount;
            if (this.shockwaveSystem) {
                this.shockwaveSystem.config.maxLines = shockwaveLineCount;
                this.shockwaveSystem.maxShockwaves = Math.min(shockwaveLineCount, 12);
            }
            
            const shockwaveExpansionSpeed = settings.shockwaveExpansionSpeed !== undefined ? settings.shockwaveExpansionSpeed : 3.0;
            const shockwaveSpeedSlider = document.getElementById('shockwave-speed');
            const shockwaveSpeedValue = document.getElementById('shockwave-speed-value');
            if (shockwaveSpeedSlider) shockwaveSpeedSlider.value = shockwaveExpansionSpeed;
            if (shockwaveSpeedValue) shockwaveSpeedValue.textContent = shockwaveExpansionSpeed.toFixed(1);
            if (this.shockwaveSystem) {
                this.shockwaveSystem.config.expansionSpeed = shockwaveExpansionSpeed;
            }
            
            const shockwaveLifetime = settings.shockwaveLifetime !== undefined ? settings.shockwaveLifetime : 3.0;
            const shockwaveLifetimeSlider = document.getElementById('shockwave-lifetime');
            const shockwaveLifetimeValue = document.getElementById('shockwave-lifetime-value');
            if (shockwaveLifetimeSlider) shockwaveLifetimeSlider.value = shockwaveLifetime;
            if (shockwaveLifetimeValue) shockwaveLifetimeValue.textContent = shockwaveLifetime.toFixed(1);
            if (this.shockwaveSystem) {
                this.shockwaveSystem.config.lifetime = shockwaveLifetime;
            }
            
            const shockwaveOpacity = settings.shockwaveOpacity !== undefined ? settings.shockwaveOpacity : 0.8;
            const shockwaveOpacitySlider = document.getElementById('shockwave-opacity');
            const shockwaveOpacityValue = document.getElementById('shockwave-opacity-value');
            if (shockwaveOpacitySlider) shockwaveOpacitySlider.value = shockwaveOpacity;
            if (shockwaveOpacityValue) shockwaveOpacityValue.textContent = shockwaveOpacity.toFixed(1);
            if (this.shockwaveSystem) {
                this.shockwaveSystem.config.opacity = shockwaveOpacity;
                // Update material opacities immediately
                Object.values(this.shockwaveSystem.materials).forEach(material => {
                    material.opacity = shockwaveOpacity;
                });
            }

            // Migrate old filmic noise settings to new Film Grain system
            if (settings.filmicNoiseIntensity !== undefined && this.filmicToneSystem) {
                console.log('Migrating old filmicNoiseIntensity to new Film Grain system');
                if (!settings.filmicTones) {
                    settings.filmicTones = this.filmicToneSystem.getSettings();
                }
                // Map old noise intensity to new film grain intensity
                settings.filmicTones.filmGrainIntensity = settings.filmicNoiseIntensity * 0.3; // Scale down
                delete settings.filmicNoiseIntensity; // Remove old setting
            }

            // Apply Filmic Tone System settings
            if (this.filmicToneSystem) {
                if (settings.filmicTones) {
                    // Apply provided filmic settings
                    this.filmicToneSystem.setSettings(settings.filmicTones);
                } else {
                    // Reset to defaults if no filmic settings provided in preset
                    this.filmicToneSystem.resetToDefaults();
                }
                
                // Update UI controls based on current settings
                const currentFilmicSettings = this.filmicToneSystem.getSettings();
                const filmicEnabledToggle = document.getElementById('filmic-enabled');
                if (filmicEnabledToggle) filmicEnabledToggle.checked = currentFilmicSettings.enabled;
                
                const toneMappingSelect = document.getElementById('tone-mapping');
                if (toneMappingSelect) toneMappingSelect.value = currentFilmicSettings.toneMapping;
                
                const exposureSlider = document.getElementById('filmic-exposure');
                const exposureValue = document.getElementById('filmic-exposure-value');
                if (exposureSlider) exposureSlider.value = currentFilmicSettings.exposure;
                if (exposureValue) exposureValue.textContent = currentFilmicSettings.exposure.toFixed(1);
                
                const contrastSlider = document.getElementById('filmic-contrast');
                const contrastValue = document.getElementById('filmic-contrast-value');
                if (contrastSlider) contrastSlider.value = currentFilmicSettings.contrast;
                if (contrastValue) contrastValue.textContent = currentFilmicSettings.contrast.toFixed(1);
                
                const saturationSlider = document.getElementById('filmic-saturation');
                const saturationValue = document.getElementById('filmic-saturation-value');
                if (saturationSlider) saturationSlider.value = currentFilmicSettings.saturation;
                if (saturationValue) saturationValue.textContent = currentFilmicSettings.saturation.toFixed(1);
                
                const vibranceSlider = document.getElementById('filmic-vibrance');
                const vibranceValue = document.getElementById('filmic-vibrance-value');
                if (vibranceSlider) vibranceSlider.value = currentFilmicSettings.vibrance;
                if (vibranceValue) vibranceValue.textContent = currentFilmicSettings.vibrance.toFixed(1);
                
                const gammaSlider = document.getElementById('filmic-gamma');
                const gammaValue = document.getElementById('filmic-gamma-value');
                if (gammaSlider) gammaSlider.value = currentFilmicSettings.gamma;
                if (gammaValue) gammaValue.textContent = currentFilmicSettings.gamma.toFixed(1);
                
                const filmGrainIntensitySlider = document.getElementById('film-grain-intensity');
                const filmGrainIntensityValue = document.getElementById('film-grain-intensity-value');
                if (filmGrainIntensitySlider) filmGrainIntensitySlider.value = currentFilmicSettings.filmGrainIntensity;
                if (filmGrainIntensityValue) filmGrainIntensityValue.textContent = currentFilmicSettings.filmGrainIntensity.toFixed(2);
                
                const vignetteStrengthSlider = document.getElementById('vignette-strength');
                const vignetteStrengthValue = document.getElementById('vignette-strength-value');
                if (vignetteStrengthSlider) vignetteStrengthSlider.value = currentFilmicSettings.vignetteStrength;
                if (vignetteStrengthValue) vignetteStrengthValue.textContent = currentFilmicSettings.vignetteStrength.toFixed(2);
                
                const chromaticAberrationSlider = document.getElementById('chromatic-aberration');
                const chromaticAberrationValue = document.getElementById('chromatic-aberration-value');
                if (chromaticAberrationSlider) chromaticAberrationSlider.value = currentFilmicSettings.chromaticAberration;
                if (chromaticAberrationValue) chromaticAberrationValue.textContent = currentFilmicSettings.chromaticAberration.toFixed(1);
                
                const lensDistortionSlider = document.getElementById('lens-distortion');
                const lensDistortionValue = document.getElementById('lens-distortion-value');
                if (lensDistortionSlider) lensDistortionSlider.value = currentFilmicSettings.lensDistortion;
                if (lensDistortionValue) lensDistortionValue.textContent = currentFilmicSettings.lensDistortion.toFixed(2);
                
                const colorTemperatureSlider = document.getElementById('color-temperature');
                const colorTemperatureValue = document.getElementById('color-temperature-value');
                if (colorTemperatureSlider) colorTemperatureSlider.value = currentFilmicSettings.colorTemperature;
                if (colorTemperatureValue) colorTemperatureValue.textContent = currentFilmicSettings.colorTemperature;
                
                const colorTintSlider = document.getElementById('color-tint');
                const colorTintValue = document.getElementById('color-tint-value');
                if (colorTintSlider) colorTintSlider.value = currentFilmicSettings.tint;
                if (colorTintValue) colorTintValue.textContent = currentFilmicSettings.tint.toFixed(1);
                
                // Advanced Cinematic Effects
                const filmHalationSlider = document.getElementById('film-halation');
                const filmHalationValue = document.getElementById('film-halation-value');
                if (filmHalationSlider) filmHalationSlider.value = currentFilmicSettings.filmHalation;
                if (filmHalationValue) filmHalationValue.textContent = currentFilmicSettings.filmHalation.toFixed(2);
                
                const filmScratchesSlider = document.getElementById('film-scratches');
                const filmScratchesValue = document.getElementById('film-scratches-value');
                if (filmScratchesSlider) filmScratchesSlider.value = currentFilmicSettings.filmScratches;
                if (filmScratchesValue) filmScratchesValue.textContent = currentFilmicSettings.filmScratches.toFixed(2);
                
                const colorFringingSlider = document.getElementById('color-fringing');
                const colorFringingValue = document.getElementById('color-fringing-value');
                if (colorFringingSlider) colorFringingSlider.value = currentFilmicSettings.colorFringing;
                if (colorFringingValue) colorFringingValue.textContent = currentFilmicSettings.colorFringing.toFixed(2);
                
                const scanlinesSlider = document.getElementById('scanlines');
                const scanlinesValue = document.getElementById('scanlines-value');
                if (scanlinesSlider) scanlinesSlider.value = currentFilmicSettings.scanlines;
                if (scanlinesValue) scanlinesValue.textContent = currentFilmicSettings.scanlines.toFixed(2);
            }
              // Update shadow colors after all settings are applied
            this.updateShadowColors();
            
            // Mark that settings have been loaded to prevent initializeUIValues from overwriting
            this.settingsLoaded = true;
            
            console.log('Settings applied OK');
            return true;
        } catch (error) {
            console.error('Error applying settings:', error);
            return false;
        }
    }

    // Helper function to add cache-busting timestamp parameter to URLs
    addCacheBusting(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_t=${Date.now()}`;
    }

    async refreshSettingsDropdown() {
        const dropdown = document.getElementById('settings-dropdown');
        if (!dropdown) {
            console.warn('Settings dropdown not found');
            return;
        }
        
        try {
            // Clear existing options except the first placeholder
            dropdown.innerHTML = '<option value="">Select a preset...</option>';
            
            let loadedCount = 0;
              // First, try to fetch a settings index file that lists all available presets
            try {
                const indexResponse = await fetch(this.addCacheBusting('settings/index.json'));
                if (indexResponse.ok) {
                    const indexData = await indexResponse.json();
                    if (indexData.presets && Array.isArray(indexData.presets)) {
                        console.log('Loading presets from index.json');                        
                        for (const preset of indexData.presets) {
                            const filename = preset.file || preset;
                            const displayName = preset.name || filename.replace('.json', '').replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            
                            try {
                                const response = await fetch(this.addCacheBusting(`settings/${filename}`));
                                if (response.ok) {
                                    const option = document.createElement('option');
                                    option.value = `settings/${filename}`;
                                    option.textContent = displayName;
                                    dropdown.appendChild(option);
                                    loadedCount++;
                                }
                            } catch (error) {
                                console.warn(`Could not load preset ${filename}:`, error);
                            }
                        }
                        
                        console.log(`Dropdown refreshed from index: ${loadedCount} presets`);
                        return;
                    }
                }
            } catch (error) {
                console.log('No settings index found, using discovery method');
            }
            
            // Fallback: Try to discover JSON files by attempting common patterns
            // This is a compromise solution for static web apps
            const discoveryAttempts = [];
              // Try to fetch the settings directory listing (works on some servers)
            try {
                const dirResponse = await fetch(this.addCacheBusting('settings/'));
                if (dirResponse.ok) {
                    const dirText = await dirResponse.text();
                    // Look for .json files in directory listing HTML
                    const jsonMatches = dirText.match(/href="([^"]*\.json)"/g);
                    if (jsonMatches) {
                        for (const match of jsonMatches) {
                            const filename = match.match(/href="([^"]*)"/)[1];
                            if (filename.endsWith('.json')) {
                                discoveryAttempts.push(filename);
                            }
                        }
                    }
                }
            } catch (error) {
                console.log('Directory listing not available, using known presets');
            }
            
            // If no files discovered, fall back to known presets
            if (discoveryAttempts.length === 0) {
                discoveryAttempts.push(
                    'default.json', 
                    'dark-mode.json', 
                    'neon-vibes.json', 
                    'minimal.json', 
                    'high-contrast.json',
                    'soviet-red.json'
                );
            }
              // Load discovered/known files
            for (const filename of discoveryAttempts) {
                try {
                    const response = await fetch(this.addCacheBusting(`settings/${filename}`));
                    if (response.ok) {
                        const option = document.createElement('option');
                        option.value = `settings/${filename}`;
                        option.textContent = filename
                            .replace('.json', '')
                            .replace(/[-_]/g, ' ')
                            .replace(/\b\w/g, l => l.toUpperCase());
                        dropdown.appendChild(option);
                        loadedCount++;
                    }
                } catch (error) {
                    // Silently ignore missing files
                }
            }
            
            console.log(`Dropdown refreshed: ${loadedCount} presets`);
        } catch (error) {
            console.error('Error refreshing dropdown:', error);
        }
    }

    async loadSelectedSettings() {
        const dropdown = document.getElementById('settings-dropdown');
        if (!dropdown || !dropdown.value) {
            console.warn('No preset selected');
            return;
        }
          try {
            const response = await fetch(this.addCacheBusting(dropdown.value));
            if (!response.ok) {
                throw new Error(`Failed to load preset: ${response.status}`);
            }
            
            const settings = await response.json();
            const success = this.applyUISettings(settings);
            
            if (success) {
                console.log(`Preset loaded: ${dropdown.options[dropdown.selectedIndex].textContent}`);
            } else {
                console.error('Failed to apply settings');
            }
        } catch (error) {
            console.error('Error loading selected settings:', error);
        }
    }

    exportSettings() {
        try {
            const settings = this.getUISettings();
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `artef4kt-settings-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Settings exported OK');
        } catch (error) {
            console.error('Error exporting settings:', error);
        }
    }

    importSettings() {
        const fileInput = document.getElementById('settings-file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleSettingsFileImport(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                const success = this.applyUISettings(settings);
                
                if (success) {
                    console.log(`Settings imported: ${file.name}`);
                } else {
                    console.error('Failed to apply imported settings');
                }
            } catch (error) {
                console.error('Error parsing settings:', error);
            }
        };
        
        reader.readAsText(file);
    }
}

// --- Enhanced Debug Info Panel with Text Decoding Animation ---
(function() {
    const debugPanel = document.getElementById('debug-info-panel');
    if (!debugPanel) return;
    const MAX_LINES = 40;    let debugBuffer = [];
    let decodingLines = []; // Track lines that are currently decoding
    let reencodingLines = []; // Track lines that are currently re-encoding before removal
    let animationFrame = null;
      // Full character set for encoding/scrambling - simplified without distracting block/geometric chars
    const ENCODING_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~`"\'\/\\';
    
    const DECODE_SPEED = 25; // Standard decode speed
    const CHARS_PER_STEP = 3; // Characters to decode per step
    const REENCODE_SPEED = 20; // Re-encode speed
    const REENCODE_CHARS_PER_STEP = 4; // Characters to re-encode per step

    function stripEmoji(str) {
        // Only remove actual emoji characters, preserve all numbers, letters, punctuation
        // Use a more specific emoji regex that won't affect numbers or normal text
       return String(str).replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    }
    
    function isTextLine(line) {
        // Only filter out truly empty or whitespace-only lines
        const trimmed = line.trim();
        return trimmed.length > 0;
    }
    
    function formatArg(arg) {
        // Preserve all data including numbers - minimal processing
        if (typeof arg === 'number') {
            return String(arg); // Direct number conversion
        }
        if (typeof arg === 'string') {
            return stripEmoji(arg);
        }
        if (typeof arg === 'object' && arg !== null) {
            // Try to use toString for special objects (like THREE.Vector3)
            if (typeof arg.toString === 'function' && arg.toString !== Object.prototype.toString) {
                return stripEmoji(arg.toString());
            }
            try {
                return stripEmoji(JSON.stringify(arg, null, 2));
            } catch (e) {
                return stripEmoji(String(arg));
            }
        }
        return stripEmoji(String(arg));
    }
    
    function encodeText(text) {
        // Replace each character (except spaces and some punctuation) with random chars
        return text.split('').map(char => {
            if (char === ' ' || char === '\n' || char === '\t' || char === ':' || char === '.' || char === ',') {
                return char; // Keep spaces and basic punctuation for readability
            }
            return ENCODING_CHARS[Math.floor(Math.random() * ENCODING_CHARS.length)];
        }).join('');
    }
      function createDecodingLine(originalText, index) {
        return {
            original: originalText,
            current: encodeText(originalText),
            index: index,
            decodedChars: 0,
            lastDecodeTime: Date.now(),
            isDecoding: true,
            isReencoding: false
        };
    }
    
    function createReencodingLine(originalText, index) {
        return {
            original: originalText,
            current: originalText, // Start with fully decoded text
            index: index,
            reencodedChars: 0,
            lastReencodeTime: Date.now(),
            isReencoding: true,
            isDecoding: false
        };
    }
      function decodeStep(line) {
        const now = Date.now();
        
        if (now - line.lastDecodeTime < DECODE_SPEED) {
            return false; // Not time to decode yet
        }
        
        if (line.decodedChars >= line.original.length) {
            line.isDecoding = false;
            line.current = line.original; // Ensure it's fully decoded
            return true; // Finished decoding
        }
        
        // Decode CHARS_PER_STEP characters
        const currentArray = line.current.split('');
        const originalArray = line.original.split('');
        
        let decoded = 0;
        for (let i = line.decodedChars; i < line.original.length && decoded < CHARS_PER_STEP; i++) {
            // Skip spaces and punctuation that should stay the same
            if (originalArray[i] === ' ' || originalArray[i] === '\n' || 
                originalArray[i] === '\t' || originalArray[i] === ':' || 
                originalArray[i] === '.' || originalArray[i] === ',') {
                line.decodedChars++;
                decoded++;
                continue;
            }
            
            currentArray[i] = originalArray[i];
            line.decodedChars++;
            decoded++;
        }
        
        line.current = currentArray.join('');
        line.lastDecodeTime = now;
        return false; // Still decoding
    }
    
    function reencodeStep(line) {
        const now = Date.now();
        
        if (now - line.lastReencodeTime < REENCODE_SPEED) {
            return false; // Not time to re-encode yet
        }
        
        if (line.reencodedChars >= line.original.length) {
            line.isReencoding = false;
            return true; // Finished re-encoding
        }
        
        // Re-encode REENCODE_CHARS_PER_STEP characters from the end backwards
        const currentArray = line.current.split('');
        const originalArray = line.original.split('');
        
        let reencoded = 0;
        for (let i = line.original.length - 1 - line.reencodedChars; i >= 0 && reencoded < REENCODE_CHARS_PER_STEP; i--) {
            // Skip spaces and punctuation that should stay the same
            if (originalArray[i] === ' ' || originalArray[i] === '\n' || 
                originalArray[i] === '\t' || originalArray[i] === ':' || 
                originalArray[i] === '.' || originalArray[i] === ',') {
                line.reencodedChars++;
                continue;
            }
            
            // Replace with random character
            currentArray[i] = ENCODING_CHARS[Math.floor(Math.random() * ENCODING_CHARS.length)];
            line.reencodedChars++;
            reencoded++;
        }
        
        line.current = currentArray.join('');
        line.lastReencodeTime = now;
        
        return false; // Still re-encoding
    }
      function animateDecoding() {
        let anyDecoding = false;
        let anyReencoding = false;
        
        // Process decoding lines
        decodingLines.forEach(line => {
            if (line.isDecoding) {
                decodeStep(line);
                if (line.isDecoding) {
                    anyDecoding = true;
                }
            }
        });
        
        // Process re-encoding lines
        reencodingLines.forEach((line, index) => {
            if (line.isReencoding) {
                reencodeStep(line);
                if (line.isReencoding) {
                    anyReencoding = true;
                }
            }
        });
        
        // Remove finished re-encoding lines
        reencodingLines = reencodingLines.filter(line => line.isReencoding);
        
        // Update display with current state of all lines
        updateDecodedDisplay();
        
        if (anyDecoding || anyReencoding) {
            animationFrame = setTimeout(animateDecoding, 16); // ~60fps for smooth animation
        } else {
            animationFrame = null;
        }
    }
      function updateDecodedDisplay() {
        // Combine both decoding and re-encoding lines for display
        const allLines = [...decodingLines, ...reencodingLines];
        const displayLines = allLines
            .sort((a, b) => a.index - b.index) // Maintain order by index
            .map(line => line.current);
        const filtered = displayLines.filter(line => isTextLine(line));
        debugPanel.textContent = filtered.length ? filtered.join('\n') : 'Initializing info panel...';
    }      function addEncodedLine(text) {
        // Check if decoding is enabled
        if (!window.debugEncodingSettings || !window.debugEncodingSettings.enabled) {
            // Add directly without encoding when disabled
            debugBuffer.push(text);
            if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
            updateDebugPanel();
            return;
        }
        
        // Check if we need to re-encode lines that will be removed
        if (decodingLines.length >= MAX_LINES) {
            // Find lines that need to be re-encoded (oldest lines)
            const linesToReencode = decodingLines.slice(0, decodingLines.length - MAX_LINES + 1);
            
            // Start re-encoding animation for these lines
            linesToReencode.forEach(line => {
                if (!line.isDecoding) { // Only re-encode fully decoded lines
                    const reencodingLine = createReencodingLine(line.current, line.index);
                    reencodingLines.push(reencodingLine);
                }
            });
            
            // Remove the lines that are being re-encoded from decodingLines
            decodingLines = decodingLines.slice(linesToReencode.length);
        }
        
        // Add new line with decoding animation
        const decodingLine = createDecodingLine(text, Date.now()); // Use timestamp as unique index
        decodingLines.push(decodingLine);
        
        // Start animation if not already running
        if (!animationFrame) {
            animateDecoding();
        }
    }
    
    function updateDebugPanel() {
        // This function is now mainly for immediate display without encoding
        const filtered = debugBuffer.filter(isTextLine);
        debugPanel.textContent = filtered.length ? filtered.join('\n') : 'Initializing info panel...';
    }      // Patch console.log to use the decoding animation
    const origLog = console.log;
    console.log = function(...args) {
        const cleanArgs = args.map(formatArg);
        const text = cleanArgs.join(' ');
          // Check if encoding is enabled to avoid duplication
        if (window.debugEncodingSettings && window.debugEncodingSettings.enabled) {
            // When encoding enabled, let addEncodedLine handle everything
            addEncodedLine(text);
        } else {
            // When encoding disabled, add directly to buffer
            debugBuffer.push(text);
            if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
            updateDebugPanel();
        }
        
        // Suppress console.log from real browser console (only show in debug panel)
        // origLog.apply(console, args); // Commented out to mute real console
    };
    
    // Also patch console.warn and console.error for completeness
    const origWarn = console.warn;
    console.warn = function(...args) {
        const cleanArgs = args.map(formatArg);
        const text = '[WARN] ' + cleanArgs.join(' ');
          // Check if encoding is enabled to avoid duplication
        if (window.debugEncodingSettings && window.debugEncodingSettings.enabled) {
            // When encoding enabled, let addEncodedLine handle everything
            addEncodedLine(text);
        } else {
            // When encoding disabled, add directly to buffer
            debugBuffer.push(text);
            if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
            updateDebugPanel();
        }
        
        // Suppress console.warn from real browser console (only show in debug panel)
        // origWarn.apply(console, args); // Commented out to mute real console
    };
    
    const origErr = console.error;
    console.error = function(...args) {
        const cleanArgs = args.map(formatArg);
        const text = '[ERROR] ' + cleanArgs.join(' ');
        
        // Check if encoding is enabled to avoid duplication
        if (window.debugEncodingSettings && window.debugEncodingSettings.enabled) {
            // When encoding enabled, let addEncodedLine handle everything
            addEncodedLine(text);
        } else {
            // When encoding disabled, add directly to buffer
            debugBuffer.push(text);
            if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
            updateDebugPanel();        }
        
        // Keep console.error in real browser console for debugging purposes
        origErr.apply(console, args);
    };
      // Configuration for decoding effect
    window.debugEncodingSettings = {
        enabled: true,
        scrollDecodeMode: false // Future feature: decode based on scroll
    };
    
    // Expose controls globally
    window.debugEncodingControls = {
        toggle: function() {
            window.debugEncodingSettings.enabled = !window.debugEncodingSettings.enabled;
            
            // Show immediate feedback
            const toggleMessage = window.debugEncodingSettings.enabled ? 
                'Decode animation: ON' : 
                'Decode animation: OFF';
            
            if (window.debugEncodingSettings.enabled) {
                addEncodedLine(toggleMessage);
            } else {
                // Add without encoding when disabled
                debugBuffer.push(toggleMessage);
                if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
                updateDebugPanel();
            }
        },        clear: function() {
            // Clear and restart all decoding and re-encoding
            decodingLines = [];
            reencodingLines = [];
            debugBuffer = [];
            addEncodedLine('Console cleared');
        },
        setEnabled: function(enabled) {
            window.debugEncodingSettings.enabled = enabled;
        }
    };
    
    // Add keyboard controls for decoding effect
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'd') {
            event.preventDefault();
            window.debugEncodingControls.toggle();
        }
        

        
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            window.debugEncodingControls.clear();
        }
    });
    
    // Enhanced addEncodedLine to respect settings
    function addEncodedLineConditional(text) {
        if (window.debugEncodingSettings.enabled) {
            addEncodedLine(text);
        } else {
            // Add directly without encoding
            debugBuffer.push(text);
            if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
            updateDebugPanel();
        }
    }
    // Dynamically update debug panel and status message color to match grid color
    const gridColorInput = document.getElementById('grid-color');
    if (gridColorInput) {
        function updatePanelColor() {
            const statusMessage = document.getElementById('status-message');
            debugPanel.style.color = gridColorInput.value;
            if (statusMessage) {
                statusMessage.style.color = gridColorInput.value;
            }
        }
        gridColorInput.addEventListener('input', updatePanelColor);
        updatePanelColor();
    }
    // Show a placeholder if no logs yet
    updateDebugPanel();
})();

// --- Mobile UI Panel Controls ---
(() => {
    let uiPanelOpen = false;
    const uiPanel = document.getElementById('ui');
    const uiHoverArea = document.getElementById('ui-hover-area');
    
    // Function to open UI panel
    function openUIPanel() {
        if (!uiPanelOpen) {
            // Remove any inline right positioning to let CSS take control
            uiPanel.style.right = '0';
            uiPanelOpen = true;
        }
    }
    
    // Function to close UI panel
    function closeUIPanel() {
        if (uiPanelOpen) {
            // Remove inline positioning to let CSS :hover and :focus-within work
            uiPanel.style.right = '';
            uiPanelOpen = false;
        }
    }
    
    // Function to toggle UI panel
    function toggleUIPanel() {
        if (uiPanelOpen) {
            closeUIPanel();
        } else {
            openUIPanel();
        }
    }
      // Tab indicator click handler (::before pseudo-element click simulation)
    function handleTabClick(event) {
        // Check if click is in the tab area (left side of UI panel)
        const rect = uiPanel.getBoundingClientRect();
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        // Get responsive tab dimensions based on screen size
        const screenWidth = window.innerWidth;
        let tabWidth, tabHeight, tabLeft, tabTop;
        
        if (screenWidth <= 480) {
            // Very small screens
            tabWidth = 32;
            tabHeight = 64;
            tabLeft = rect.left - 32;
        } else if (screenWidth <= 768) {
            // Mobile screens
            tabWidth = 40;
            tabHeight = 80;
            tabLeft = rect.left - 40;
        } else {
            // Desktop screens
            tabWidth = 48;
            tabHeight = 100;
            tabLeft = rect.left - 48;
        }
        
        const tabRight = rect.left;
        tabTop = rect.top + 20;
        const tabBottom = rect.top + 20 + tabHeight;
        
        if (clickX >= tabLeft && clickX <= tabRight && clickY >= tabTop && clickY <= tabBottom) {
            event.preventDefault();
            event.stopPropagation();
            toggleUIPanel();
            return true;
        }
        return false;
    }
    
    // Close button click handler (::after pseudo-element click simulation)
    function handleCloseClick(event) {
        // Check if click is in the close button area (top-right of UI panel)
        const rect = uiPanel.getBoundingClientRect();
        const clickX = event.clientX;
        const clickY = event.clientY;
        
        // Close button area dimensions based on CSS: top: 15px, right: 15px, width: 32px, height: 32px
        const closeLeft = rect.right - 47; // 15px margin + 32px width
        const closeRight = rect.right - 15;
        const closeTop = rect.top + 15;
        const closeBottom = rect.top + 47; // 15px margin + 32px height
        
        if (clickX >= closeLeft && clickX <= closeRight && clickY >= closeTop && clickY <= closeBottom) {
            event.preventDefault();
            event.stopPropagation();
            closeUIPanel();
            return true;
        }
        return false;
    }
      // Add click event listeners
    document.addEventListener('click', (event) => {
        // Check if the click is on or inside the SVG logos container
        const svgLogosContainer = document.getElementById('svg-logos-container');
        if (svgLogosContainer && (event.target === svgLogosContainer || svgLogosContainer.contains(event.target))) {
            // Allow SVG logo clicks to proceed normally without interfering with UI panel logic
            return;
        }

        // Handle tab click first (only when panel is closed)
        if (!uiPanelOpen) {
            if (handleTabClick(event)) {
                return;
            }
        }
        
        // Handle close button click (only when panel is open)
        if (uiPanelOpen) {
            if (handleCloseClick(event)) {
                return;
            }
            
            // Close panel if clicking outside of it
            const rect = uiPanel.getBoundingClientRect();
            const clickX = event.clientX;
            const clickY = event.clientY;
            
            if (clickX < rect.left || clickX > rect.right || clickY < rect.top || clickY > rect.bottom) {
                closeUIPanel();
            }
        }
    });
      // Add touch event listeners for mobile devices
    document.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            
            // Check if the touch is on or inside the SVG logos container
            const svgLogosContainer = document.getElementById('svg-logos-container');
            const touchTarget = document.elementFromPoint(touch.clientX, touch.clientY);
            if (svgLogosContainer && touchTarget && (touchTarget === svgLogosContainer || svgLogosContainer.contains(touchTarget))) {
                // Allow SVG logo touches to proceed normally without interfering with UI panel logic
                return;
            }
            
            const mockEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => event.preventDefault(),
                stopPropagation: () => event.stopPropagation()
            };
            
            // Handle tab touch
            if (!uiPanelOpen) {
                if (handleTabClick(mockEvent)) {
                    return;
                }
            }
            
            // Handle close button touch
            if (uiPanelOpen) {
                if (handleCloseClick(mockEvent)) {
                    return;
                }
                
                // Close panel if touching outside of it
                const rect = uiPanel.getBoundingClientRect();
                const touchX = touch.clientX;
                const touchY = touch.clientY;
                
                if (touchX < rect.left || touchX > rect.right || touchY < rect.top || touchY > rect.bottom) {
                    closeUIPanel();
                }
            }
        }
    });
    
    // Keyboard shortcut for UI panel (Escape to close, Tab to toggle)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            
            // Close UI panel if it's open (either via JavaScript state or CSS focus)
            const uiPanel = document.getElementById('ui');
            if (uiPanel) {
                // Check if panel is currently visible (either via uiPanelOpen state or CSS focus/hover)
                const computedStyle = window.getComputedStyle(uiPanel);
                const isVisible = computedStyle.right === '0px' || 
                                 uiPanel.matches(':focus-within') || 
                                 uiPanel.matches(':hover') ||
                                 uiPanelOpen;
                
                if (isVisible) {
                    // Force close the panel by removing focus and setting state
                    closeUIPanel();
                    
                    // Also remove focus from any focused element within the panel
                    const focusedElement = uiPanel.querySelector(':focus');
                    if (focusedElement) {
                        focusedElement.blur();
                    }
                    
                    // Remove focus from the panel itself
                    if (document.activeElement && uiPanel.contains(document.activeElement)) {
                        document.activeElement.blur();
                    }
                }
            }
        } else if (event.key === 'Tab' && event.ctrlKey) {
            event.preventDefault();
            toggleUIPanel();
        }
    });
    
    // Update panel state on window resize to handle responsive breakpoints
    function updatePanelState() {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile && uiPanelOpen) {
            // Reset to CSS hover behavior on desktop
            uiPanel.style.right = '';
            uiPanelOpen = false;
        }
    }
    
    window.addEventListener('resize', updatePanelState);
    
    // Initialize panel state
    updatePanelState();
})();

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure loading screen is visible
    setTimeout(() => {
        window.visualizer = new FerrofluidVisualizer();
        
        // Complete loading and hide loading screen
        setTimeout(() => {
            window.loadingManager.hide();
        }, 500); // Small delay to show final loading state
    }, 100);
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.visualizer) {
        window.visualizer.destroy();
    }
});

// --- UI Initialization for Environment Controls ---
// This functionality is now handled by the initializeUIValues method in the FerrofluidVisualizer class
