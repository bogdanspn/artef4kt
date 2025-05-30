class FerrofluidVisualizer {
    constructor() {
        this.canvas = document.getElementById('visualizer');
        this.audioContext = null;
        this.audioSource = null;
        this.analyser = null;
        this.audioElement = null;
        this.isPlaying = false;
        this.animationId = null;
          // ASCII emoji collection for spawning logs
        this.spawnEmojis = [
            '(╯°□°）╯︵ ┻━┻',
            'ദ്ദി( • ᴗ - ) ✧',
            '⸜(｡ ˃ ᵕ ˂ )⸝♡',
            'ᕕ(⌐■_■)ᕗ ♪♬',
            '(-(-_-(-_(-_(-_-)_-)-_-)_-)_-)_-)-)',
            '(っ^з^)♪♬',
            '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
            '｡◕‿◕｡',
            '(∩▂∩)',
            'ヾ(⌐■_■)ノ♪',
            '(｡♥‿♥｡)',
            '(╯✧▽✧)╯',
            '└(★ω★)┘',
            '♪┏(・o･)┛♪',
            '(☆▽☆)',
            '✧*｡٩(ˊᗜˋ*)و✧*｡',
            '(＾◡＾)',
            '( ͡° ͜ʖ ͡°)',
            '༼ つ ◕_◕ ༽つ',
            '(つ°ヮ°)つ',
            '＼(^o^)／',
            '(╮°-°)╮┳━━┳ (╯°□°)╯┻━━┻',
            'ᕕ( ᐛ )ᕗ',
            '(☞ﾟヮﾟ)☞',
            '✨(ﾉ◕ヮ◕)ﾉ✨',
            'ಠ_ಠ',
            '¯\\_(ツ)_/¯',
            '(づ｡◕‿‿◕｡)づ',
            '(ง ͠° ͟ل͜ ͡°)ง',
            '♪(┌・。・)┌'
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
        this.gridOpacity = 0.3;        this.gridColor = 0xbbbbbb;
        this.shadowTransparency = 0.4; // 0 = fully transparent, 1 = fully opaque (no transparency)
        this.shadowColor = 0x333333; // Default shadow color set to a dark grey
        this.linkShadowColor = false; // Whether shadow color should sync with grid color

        // Background color
        this.backgroundColor = 0x888888;        // Environment sphere color
        this.envSphereColor = 0x999999;
        this.envSphereSize = 80;
        this.envVisibility = 1.0;
        
        // Light colors for music reactivity
        this.lightBassColor = 0xff3366;  // Red
        this.lightMidColor = 0x33ff66;   // Green
        this.lightHighColor = 0x3366ff;  // Blue
        
        // Three.js setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.ferrofluid = null;
        this.lightGroup = null;        // Floating blob system
        this.floatingBlobs = [];
        this.maxFloatingBlobs = 25;
        this.blobSpawnThreshold = 0.1; // Even lower threshold for easier spawning
        this.lastSpawnTime = 0;
        this.spawnCooldown = 100; // Even faster cooldown
        
        // BPM Detection
        this.bpmDetector = {
            peaks: [],
            bpm: 0,
            lastBeatTime: 0,
            beatThreshold: 0.3,
            minBpm: 60,
            maxBpm: 200,
            analysisWindow: 10000 // 10 seconds
        };        this.init();
        this.loadDefaultAudio(); // Automatically load the default audio file
        this.updateStatusMessage(); // Initialize status message
        this.setupEventListeners();
        this.initializeUIValues(); // Initialize UI values after properties are set
        this.animate();
    }    // Helper method to get random spawn emoji
    getRandomSpawnEmoji() {
        return this.spawnEmojis[Math.floor(Math.random() * this.spawnEmojis.length)];
    }    init() {
        this.setupThreeJS();
        this.createFerrofluid();
        this.createLighting();
        this.updateShadowColors(); // Initialize shadow colors after lighting is created
        this.createEnvironment();
        this.updateLightingFromBackground(); // Apply initial background color influence
          
        // Initialize UI values to match property values
        this.initializeUIValues();
          
        // Initialize frequency analyzer clone colors to match default grid color
        this.updateFrequencyAnalyzerCloneColors('#bbbbbb');
        
        // Ensure SVG colors are set after images load with proper image loading detection
        this.initializeSvgColors();
        
        this.resize();
    }
    
    initializeSvgColors() {
        const svgLogos = document.querySelectorAll('.svg-logo img');
        let loadedCount = 0;
        const totalLogos = svgLogos.length;
        
        if (totalLogos === 0) {
            // If no SVG logos found, try again after a delay
            setTimeout(() => this.initializeSvgColors(), 100);
            return;
        }
        
        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount >= totalLogos) {
                // All images loaded, now set their colors
                this.updateFrequencyAnalyzerCloneColors('#bbbbbb');
            }
        };
        
        svgLogos.forEach(img => {
            if (img.complete) {
                checkAllLoaded();
            } else {
                img.addEventListener('load', checkAllLoaded);
                img.addEventListener('error', checkAllLoaded); // Also handle errors
            }
        });
          // Fallback timeout to ensure colors are set even if load events don't fire
        setTimeout(() => {
            this.updateFrequencyAnalyzerCloneColors('#bbbbbb');
        }, 500);
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
        }
        
        console.log('UI values initialized');
    }setupThreeJS() {
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
        this.camera.position.set(0, 5, 15);
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
        const innerGeometry = new THREE.SphereGeometry(2.85, 64, 64); // Slightly smaller than outer sphere
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000, // Pure black
            side: THREE.BackSide // Only render the inside faces
        });
        
        this.ferrofluidInner = new THREE.Mesh(innerGeometry, innerMaterial);
        this.ferrofluidInner.position.set(0, 0, 0);
        this.scene.add(this.ferrofluidInner);

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
    }    updateEnvironment() {
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
        
        console.log(`Environment updated: Size=${this.envSphereSize}, Visibility=${this.envVisibility > 0 ? 'On' : 'Off'}`);
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
        
        // Sensitivity slider
        const sensitivitySlider = document.getElementById('sensitivity');
        sensitivitySlider.addEventListener('input', (e) => {
            this.sensitivity = parseFloat(e.target.value);
            document.getElementById('sensitivity-value').textContent = this.sensitivity.toFixed(1);
        });
          // Smoothing slider
        const smoothingSlider = document.getElementById('smoothing');
        smoothingSlider.addEventListener('input', (e) => {
            this.smoothing = parseFloat(e.target.value);
            document.getElementById('smoothing-value').textContent = this.smoothing.toFixed(1);
            if (this.analyser) {
                this.analyser.smoothingTimeConstant = this.smoothing;
            }
        });        // Grid controls
        document.getElementById('grid-toggle').addEventListener('change', (e) => {
            this.gridVisible = e.target.checked;
            if (this.gridGroup) {
                this.gridGroup.visible = this.gridVisible;
            }
            // Show permanent floor only when grid is disabled to avoid double shadows
            if (this.permanentFloor) {
                this.permanentFloor.visible = !this.gridVisible;
            }
        });

        // Debug Encoding toggle control
        document.getElementById('debug-encoding-toggle').addEventListener('change', (e) => {
            if (window.debugEncodingControls) {
                window.debugEncodingControls.setEnabled(e.target.checked);
                
                // Show immediate feedback
                const toggleMessage = e.target.checked ? 
                    'Decoding animation: ENABLED via UI' : 
                    'Decoding animation: DISABLED via UI';
                console.log(toggleMessage);
            }
        });        document.getElementById('grid-size').addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value);
            document.getElementById('grid-size-value').textContent = this.gridSize;
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
            }
              // Update shadow colors to match current grid color only if linking is enabled
            if (this.linkShadowColor) {
                this.updateShadowColors();
            }
            
            // Update shadow transparency to match current setting
            this.updateShadowTransparency();
            
            // Update camera bounds when grid size changes
            if (this.cameraControls) {
                this.clampCameraTarget();
            }
        });        document.getElementById('grid-opacity').addEventListener('input', (e) => {
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
        });

        // Background color control
        document.getElementById('background-color').addEventListener('input', (e) => {
            this.backgroundColor = parseInt(e.target.value.replace('#', ''), 16);
            this.scene.background.setHex(this.backgroundColor);
            
            // Note: Permanent floor uses ShadowMaterial (invisible) so no color update needed
            
            // Also update fog color to match background
            this.scene.fog.color.setHex(this.backgroundColor);
            // Subtle lighting influence from background color
            this.updateLightingFromBackground();
        });        // Environment sphere color control
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
        });
          // Environment visibility control (checkbox)
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
            }

            if (this.gridGroup) {
                this.gridGroup.children.forEach(mesh => {
                    if (mesh.material && mesh.material.type !== 'ShadowMaterial') {
                        if (mesh.material.color) { // Check if color property exists
                            mesh.material.color.setHex(this.gridColor);
                        }
                    }
                });
            }

            this.updateFrequencyAnalyzerCloneColors(gridColorHex);
            const trackBpm = document.getElementById('track-bpm');
            const trackNameVertical = document.getElementById('track-name-vertical');
            const trackTimeDisplay = document.getElementById('track-time-display');
            const trackFreqDisplay = document.getElementById('track-freq-display');
            if (trackBpm) trackBpm.style.color = gridColorHex;
            if (trackNameVertical) trackNameVertical.style.color = gridColorHex;
            if (trackTimeDisplay) trackTimeDisplay.style.color = gridColorHex;
            if (trackFreqDisplay) trackFreqDisplay.style.color = gridColorHex;
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
                this.shadowColor = parseInt(shadowColorInput.value.replace('#', ''), 16);
                this.updateShadowColors();
            }
        });

        // Window resize
        window.addEventListener('resize', () => this.resize());
        
        // Enhanced mouse camera controls
        this.initMouseControls();
          // Spacebar for play/pause functionality
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayPause();
            }
        });
    }
    
    // Test function to manually spawn a blob
    testSpawnBlob() {
        const testPosition = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            2 + Math.random() * 4,
            (Math.random() - 0.5) * 8
        );        this.createFloatingBlob(testPosition, 0.8, 'test');
        console.log('Test blob spawned at:', testPosition);
        console.log(this.getRandomSpawnEmoji());
    }
    
    async loadAudioFile(file) {
        if (!file) return;
        
        try {
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
            this.audioElement.crossOrigin = 'anonymous';
            
            // Setup audio analysis
            this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = this.smoothing;
            
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
            });
              this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.frequencyData = new Float32Array(this.bufferLength);            // Update new vertical track display
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
            
            // Reset BPM detector
            this.bpmDetector.peaks = [];
            this.bpmDetector.bpm = 0;
            document.getElementById('track-bpm').textContent = '--';
            
            // Update time display
            this.audioElement.addEventListener('timeupdate', () => {
                this.updateTimeDisplay();
            });
              // Auto-play new file regardless of current state
            try {
                // Resume AudioContext if suspended (this is triggered by user file selection)
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                    console.log('AudioContext resumed for new file');
                }
                
                // Always attempt to start playback when loading a new file
                await this.audioElement.play();
                this.isPlaying = true;
                document.getElementById('play-pause').textContent = '⏸ PAUSE';
                document.getElementById('play-pause').classList.add('playing');
                console.log('New audio file loaded and auto-started');
                
            } catch (error) {
                console.log('Auto-play blocked by browser - user interaction required:', error.message);
                this.isPlaying = false;
                document.getElementById('play-pause').textContent = '▶ PLAY';
                document.getElementById('play-pause').classList.remove('playing');
            }
            
            // Update status message after loading audio file
            this.updateStatusMessage();
              } catch (error) {
            console.error('Error loading audio file:', error);
        }
    }
      async loadAudioFromURL(url) {
        try {
            console.log(`Attempting to load audio from URL: ${url}`);
            
            // Check if we're running from file:// protocol
            if (window.location.protocol === 'file:') {
                console.warn('Running from file:// protocol - cannot load external audio files due to CORS restrictions');
                console.log('Please serve this application from a local web server to enable audio loading');
                return; // Exit gracefully without throwing an error
            }
            
            // Fetch the file
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
            console.log(`Successfully loaded audio from URL: ${url}`);
        } catch (error) {
            console.error('Error loading audio from URL:', error);
            // Don't throw the error - just log it so the app continues to work
        }
    }
    
    async loadDefaultAudio() {
        const defaultAudioPath = 'mp3/bogdan-rosu-yfflon.mp3';
        console.log('Loading default audio file...');
        await this.loadAudioFromURL(defaultAudioPath);
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
        if (!this.audioElement) return;
        
        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
            document.getElementById('play-pause').textContent = '▶ PLAY';
            document.getElementById('play-pause').classList.remove('playing');
        } else {
            try {
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                    console.log('AudioContext resumed successfully');
                }
                await this.audioElement.play();
                this.isPlaying = true;
                document.getElementById('play-pause').textContent = '⏸ PAUSE';
                document.getElementById('play-pause').classList.add('playing');
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
        
        // Update status message after stop
        this.updateStatusMessage();
    }
      updateTimeDisplay() {
        if (!this.audioElement) return;
        
        const current = this.audioElement.currentTime;
        const duration = this.audioElement.duration || 0;
        
        const formatTime = (time) => {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };
        
        document.getElementById('track-time-display').textContent = 
            `${formatTime(current)} / ${formatTime(duration)}`;
    }

    // Status message update methods
    updateStatusMessage() {
        const statusElement = document.getElementById('status-message');
        if (!statusElement) return;
        
        if (!this.audioElement) {
            statusElement.textContent = 'Push space [_] to start visualization';
        } else if (this.isPlaying) {
            statusElement.textContent = 'Push space [_] to pause';
        } else {
            statusElement.textContent = 'Visualisation on pause push [_] to resume';
        }
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
            console.log(`Sample Rate: ${sampleRate}Hz, Bin Width: ${frequencyBinWidth.toFixed(1)}Hz`);
            console.log(`Bass bins: ${bassBinStart}-${bassBinEnd} (${bassFreqRange.min}-${bassFreqRange.max}Hz)`);
            console.log(`Mid bins: ${midBinStart}-${midBinEnd} (${midFreqRange.min}-${midFreqRange.max}Hz)`);
            console.log(`High bins: ${highBinStart}-${highBinEnd} (${highFreqRange.min}-${highFreqRange.max}Hz)`);
            console.log(`Intensities - Bass: ${this.bassIntensity.toFixed(3)}, Mid: ${this.midIntensity.toFixed(3)}, High: ${this.highIntensity.toFixed(3)}`);
        }
    }
      // Simple 3D noise function for organic movement
    noise3D(x, y, z) {
        // Simple pseudo-noise using sine waves
        return (
            Math.sin(x * 0.1) * Math.cos(y * 0.1) * Math.sin(z * 0.1) +
            Math.sin(x * 0.2 + 1.3) * Math.cos(y * 0.2 + 2.1) * Math.sin(z * 0.2 + 3.7) * 0.5 +
            Math.sin(x * 0.4 + 2.7) * Math.cos(y * 0.4 + 1.9) * Math.sin(z * 0.4 + 4.2) * 0.25
        ) / 1.75;
    }    updateFerrofluid() {
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
            const baseNoise = this.noise3D(noiseX, noiseY, noiseZ) * 0.3;
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
              // Calculate target positions
            if (this.isPlaying && audioInfluence > 0.15) {
                // Normal audio-reactive behavior
                this.targetPositions[i] = x + finalNormal.x * totalDeformation;
                this.targetPositions[i + 1] = y + finalNormal.y * totalDeformation;
                this.targetPositions[i + 2] = z + finalNormal.z * totalDeformation;
            } else {
                // When paused or no audio, target the original sphere shape
                this.targetPositions[i] = x + finalNormal.x * (baseNoise * 0.3);
                this.targetPositions[i + 1] = y + finalNormal.y * (baseNoise * 0.3);
                this.targetPositions[i + 2] = z + finalNormal.z * (baseNoise * 0.3);
            }
            
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
        this.ferrofluid.position.z = Math.sin(time * 0.45) * (floatIntensity * 0.5);

        // Synchronize inner sphere position and rotation with the main ferrofluid
        if (this.ferrofluidInner) {
            this.ferrofluidInner.position.copy(this.ferrofluid.position);
            this.ferrofluidInner.rotation.copy(this.ferrofluid.rotation);
        }
    }
      generateDynamicBlobCenters(time) {
        const blobCenters = [];        // === BASS DEFORMATIONS: Very wide, very shallow surface undulations ===
        if (this.bassIntensity > 0.2) { // Even higher threshold - bass needs to be very strong to trigger
            const numBassBlobs = Math.floor(1 + this.bassIntensity * 0.8); // Even fewer bass areas
            for (let i = 0; i < numBassBlobs; i++) {
                // Add randomness to prevent symmetric patterns (similar to mid-frequency)
                const randomAngleOffset1 = (Math.random() - 0.5) * 1.8; // ±0.9 radian variation
                const randomAngleOffset2 = (Math.random() - 0.5) * 1.2; // ±0.6 radian variation  
                const randomSpeedVariation = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x speed (slower than mids)
                
                const angle1 = time * 0.15 * randomSpeedVariation + i * Math.PI * 2 / numBassBlobs + randomAngleOffset1; // Even slower movement with randomness
                const angle2 = Math.sin(time * 0.25 + i) * 0.5 + randomAngleOffset2;
                
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
                    type: 'bass'
                });
            }
        }
          // === MID PROTRUSIONS: Moderate height, medium width ===
        if (this.midIntensity > 0.08) {
            const numMidBlobs = Math.floor(2 + this.midIntensity * 4);
            for (let i = 0; i < numMidBlobs; i++) {
                // Add randomness to prevent symmetric patterns
                const randomAngleOffset1 = (Math.random() - 0.5) * 2.5; // ±1.25 radian variation
                const randomAngleOffset2 = (Math.random() - 0.5) * 1.8; // ±0.9 radian variation
                const randomSpeedVariation = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x speed
                
                const angle1 = time * 0.8 * randomSpeedVariation + i * Math.PI * 1.2 + randomAngleOffset1;
                const angle2 = Math.cos(time * 0.6 + i * 1.4) * 1.1 + randomAngleOffset2;
                
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
                    type: 'mid'
                });
            }
        }        // === HIGH SPIKES: ULTRA-TALL, razor-sharp needle-like protrusions ===
        if (this.highIntensity > 0.03) { // Lower threshold for even more responsiveness
            const numHighBlobs = Math.floor(8 + this.highIntensity * 20); // More spikes possible
            for (let i = 0; i < numHighBlobs; i++) {
                // Create truly uniform distribution across sphere surface
                // Use proper spherical coordinates for uniform distribution
                const u = Math.random(); // Random value 0-1
                const v = Math.random(); // Random value 0-1
                
                // Add time-based movement for animation
                const timeOffset = time * 2.8 + i * Math.PI * 0.4;
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
                    type: 'high'
                });
            }
    }
        
    return blobCenters;
}
      
// Floating blob system methods
createFloatingBlob(spawnPosition, intensity, type) {
        console.log(`Creating deformable floating blob at position:`, spawnPosition, `intensity: ${intensity.toFixed(3)}, type: ${type}`);
        console.log(this.getRandomSpawnEmoji());
        
        // Enhanced blob size variation with different "personalities"
        const blobPersonality = Math.random();
        let baseSize, growthPotential, growthRate;        if (blobPersonality < 0.4) {
            // Small, agile blobs (40%) - EXTREMELY limited growth to prevent overgrowth
            baseSize = 0.06 + Math.random() * 0.08; // 0.06-0.14 (smaller)
            growthPotential = 1.02 + Math.random() * 0.08; // Can grow 1.02x-1.10x (much more restricted)
            growthRate = 0.5 + Math.random() * 0.3; // Moderate growth speed
        } else if (blobPersonality < 0.65) {
            // Medium blobs (25%) - very limited growth
            baseSize = 0.12 + Math.random() * 0.12; // 0.12-0.24 (smaller)
            growthPotential = 1.08 + Math.random() * 0.17; // Can grow 1.08x-1.25x (reduced)
            growthRate = 0.3 + Math.random() * 0.4; // Slower growth speed
        } else if (blobPersonality < 0.85) {
            // Large, slow blobs (20%) - moderate growth
            baseSize = 0.18 + Math.random() * 0.15; // 0.18-0.33 (slightly smaller)
            growthPotential = 1.3 + Math.random() * 0.4; // Can grow 1.3x-1.7x (reduced)
            growthRate = 0.25 + Math.random() * 0.35; // Slower growth
        } else {
            // Rare giant blobs (15%) - these can grow more as they use ferrofluid behavior
            baseSize = 0.22 + Math.random() * 0.23; // 0.22-0.45
            growthPotential = 1.5 + Math.random() * 0.5; // Can grow 1.5x-2.0x (reduced from before)
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
        
        console.log(`Deformable blob created with size: ${baseSize.toFixed(3)}, growth potential: ${growthPotential.toFixed(2)}x, position:`, blob.position);
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
        console.log(`Deformable blob added to scene and array. Total floating blobs: ${this.floatingBlobs.length}`);
        console.log(this.getRandomSpawnEmoji());
    }spawnFloatingBlobs() {
        const now = performance.now();
        
        // Check cooldown
        if (now - this.lastSpawnTime < this.spawnCooldown) {
            if (Math.random() < 0.01) console.log(`Spawn blocked by cooldown: ${(now - this.lastSpawnTime).toFixed(0)}ms < ${this.spawnCooldown}ms`);
            return;
        }
        
        // Check if we have space for more blobs
        if (this.floatingBlobs.length >= this.maxFloatingBlobs) {
            if (Math.random() < 0.01) console.log(`Spawn blocked: max blobs reached (${this.floatingBlobs.length}/${this.maxFloatingBlobs})`);
            return;
        }
        
        // Calculate total intensity
        const totalIntensity = this.bassIntensity + this.midIntensity + this.highIntensity;
        
        // Enhanced debug logging
        if (Math.random() < 0.05) { // More frequent logging
            console.log(`Audio - Bass: ${this.bassIntensity.toFixed(3)}, Mid: ${this.midIntensity.toFixed(3)}, High: ${this.highIntensity.toFixed(3)}`);
            console.log(`Spawn Check - Total: ${totalIntensity.toFixed(3)}, Threshold: ${this.blobSpawnThreshold}, Blobs: ${this.floatingBlobs.length}`);
            console.log(`Timing - Now: ${now.toFixed(0)}, Last: ${this.lastSpawnTime.toFixed(0)}, Cooldown: ${this.spawnCooldown}ms`);
        }
        
        // Only spawn during intense moments
        if (totalIntensity < this.blobSpawnThreshold) {
            if (Math.random() < 0.01) console.log(`Spawn blocked: intensity too low (${totalIntensity.toFixed(3)} < ${this.blobSpawnThreshold})`);
            return;
        }        // Higher chance of spawning with higher intensity
        const spawnChance = Math.min((totalIntensity - this.blobSpawnThreshold) * 5, 0.9); // Increased multiplier
        console.log(`Spawn chance: ${(spawnChance * 100).toFixed(1)}% (intensity: ${totalIntensity.toFixed(3)})`);
        console.log(this.getRandomSpawnEmoji());        if (Math.random() > spawnChance) {
            console.log(`Spawn failed random check`);
            console.log(this.getRandomSpawnEmoji());
            return;
        }
        
        console.log(`Spawn conditions met! Looking for spike locations...`);
        console.log(this.getRandomSpawnEmoji());        // Find high spike locations for spawning
        const blobCenters = this.generateDynamicBlobCenters(this.fluidTime);
        console.log(`Generated ${blobCenters.length} blob centers`);
        console.log(this.getRandomSpawnEmoji());
        
        const highSpikes = blobCenters.filter(blob => 
            blob.type === 'high' && blob.intensity > 0.3 // Lowered spike intensity threshold
        );
        
        console.log(`Found ${highSpikes.length} high spikes`);
        console.log(this.getRandomSpawnEmoji());
        
        if (highSpikes.length === 0) {
            // If no high spikes, try mid spikes as backup
            const midSpikes = blobCenters.filter(blob => 
                blob.type === 'mid' && blob.intensity > 0.5
            );
            console.log(`No high spikes, found ${midSpikes.length} mid spikes`);
            
            if (midSpikes.length > 0) {
                const spawnBlob = midSpikes[Math.floor(Math.random() * midSpikes.length)];
                const spawnDirection = spawnBlob.position.clone().normalize();
                const spawnDistance = 3.5 + spawnBlob.strength * 0.8;
                const spawnPosition = spawnDirection.multiplyScalar(spawnDistance);                this.createFloatingBlob(spawnPosition, spawnBlob.intensity, spawnBlob.type);
                this.lastSpawnTime = now;
                console.log('Spawned blob from mid spike at:', spawnPosition);
                console.log(this.getRandomSpawnEmoji());
            } else {
                console.log('No suitable spikes found for spawning');
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
        console.log('Spawned blob from high spike at:', spawnPosition);
        console.log(this.getRandomSpawnEmoji());
    }      updateFloatingBlobs(deltaTime) {
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
            
            // Calculate individual frequency influences
            const bassInfluence = this.bassIntensity * blobData.musicResponse;
            const midInfluence = this.midIntensity * blobData.musicResponse;
            const highInfluence = this.highIntensity * blobData.musicResponse;
            const totalMusicInfluence = bassInfluence + midInfluence + highInfluence;
            
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

            // Apply deformation to each vertex
            let maxDeformation = 0; // Track the maximum deformation this frame
            for (let j = 0; j < positions.length; j += 3) {
                const vertexIndex = j / 3;
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
        
        // Smooth collision detection & response between blobs
const blobs = this.floatingBlobs;
for (let a = 0; a < blobs.length; a++) {
    for (let b = a + 1; b < blobs.length; b++) {
        const bd1 = blobs[a];
        const bd2 = blobs[b];
        const p1 = bd1.mesh.position;
        const p2 = bd2.mesh.position;
        const delta = new THREE.Vector3().subVectors(p2, p1);
        const dist = delta.length();
        const r1 = bd1.baseSize * bd1.currentScale;
        const r2 = bd2.baseSize * bd2.currentScale;
        const minDist = r1 + r2;
        if (dist > 0 && dist < minDist) {
            const overlap = minDist - dist;
            const normal = delta.clone().divideScalar(dist);
            // Resolve overlap: move smaller blob out fully
            if (r1 > r2) {
                bd2.mesh.position.addScaledVector(normal, overlap + 0.001);
                bd2.velocity.addScaledVector(normal, overlap * 0.2);
            } else {
                bd1.mesh.position.addScaledVector(normal, -overlap - 0.001);
                bd1.velocity.addScaledVector(normal, -overlap * 0.2);
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

// Spawn new blobs
this.spawnFloatingBlobs();
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
    }

    // Update shadow material color if applicable
    if (this.gridGroup) {
        this.gridGroup.children.forEach(mesh => {
            if (mesh.material && mesh.material.type === 'ShadowMaterial') {
                mesh.material.color.setHex(colorToUse);
            }
        });
    }
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
        const svgLogos = document.querySelectorAll('.svg-logo img');
        svgLogos.forEach(logo => {
            if (gridColorRgb) {
                // Direct approach: modify SVG content to change fill color
                this.updateSvgColor(logo, gridColorHex);
            }
        });
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
            console.warn('SVG color modification not available when serving from file:// protocol due to CORS restrictions.');
            console.warn('For full functionality, serve the application from a local HTTP server.');
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
                console.warn('Failed to update SVG color:', error);
                // Fallback to CSS filter approach
                const gridColorRgb = this.hexToRgb(hexColor);
                if (gridColorRgb) {
                    const filter = this.getColorFilter(gridColorRgb.r, gridColorRgb.g, gridColorRgb.b);
                    imgElement.style.filter = filter;
                }
            });
    }
      // Enhanced mouse camera controls
    initMouseControls() {
        this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
        this.mousePressed = false;        this.cameraControls = {
            distance: 18,    // Start at optimal viewing distance
            azimuth: 0,
            elevation: 15,   // Start at better side viewing angle
            targetX: 0,
            targetY: 0,
            targetZ: 0,
            minDistance: 5,
            maxDistance: 50,
            minElevation: -80,
            maxElevation: 80,
            damping: 0.1,
            // Grid bounds for camera constraints
            minX: -this.gridSize,
            maxX: this.gridSize,
            minY: -10,
            maxY: this.gridSize * 2 - 10,
            minZ: -this.gridSize,
            maxZ: this.gridSize,            // Automatic camera movement properties
            autoMovement: {
                enabled: true,
                baseAzimuth: 0,
                baseElevation: 15,  // Lower starting elevation for better side viewing
                baseDistance: 18,   // Slightly further back for better scene overview
                rotationSpeed: 0.8, // Increased for more noticeable orbital movement
                zoomIntensity: 2,   // Reduced zoom intensity for less jarring movement
                elevationIntensity: 5, // Reduced elevation changes for more stable viewing
                lastBeatTime: 0,
                beatThreshold: 0.15, // bass intensity needed to register a beat
                rotationPhase: 0,
                manualOverride: false,
                overrideTimeout: 0,
                overrideDuration: 3000, // ms before resuming auto movement after manual input
                lastTargetUpdate: 0 // Track when we last updated the target position
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
        });
          // Mouse wheel for zoom
        document.addEventListener('wheel', (e) => {
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
            this.cameraControls.distance = 18;  // Reset to optimal distance
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
    }    // Update automatic camera movement based on music
    updateAutomaticCameraMovement(deltaTime) {
        if (!this.cameraControls.autoMovement.enabled) return;
        
        const autoMove = this.cameraControls.autoMovement;
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
        
        // Calculate music-reactive rotation speed
        const totalIntensity = (this.bassIntensity + this.midIntensity + this.highIntensity) / 3;
        const baseRotationSpeed = 0.3; // Slow base rotation speed (degrees per second)
        const musicMultiplier = 1 + totalIntensity * 2; // Speed up with music intensity
        const rotationSpeed = baseRotationSpeed * musicMultiplier;
        
        // Continuously rotate around the blob
        this.cameraControls.azimuth += rotationSpeed * deltaTime;
        
        // Gentle elevation changes based on music
        const baseElevation = 15; // Good viewing angle
        const elevationVariation = Math.sin(currentTime * 0.0005) * 8 + // Slow sine wave
                                  this.midIntensity * 10; // React to mid frequencies
        this.cameraControls.elevation = baseElevation + elevationVariation;
        
        // Gentle distance changes for breathing effect
        const baseDistance = 18;
        const distanceVariation = Math.sin(currentTime * 0.0008) * 2 + // Slow breathing
                                 this.bassIntensity * 3; // Zoom in on bass
        this.cameraControls.distance = baseDistance + distanceVariation;
        
        // Clamp values within safe viewing limits
        this.cameraControls.elevation = Math.max(5, Math.min(35, this.cameraControls.elevation));
        this.cameraControls.distance = Math.max(12, Math.min(25, this.cameraControls.distance));
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
        
        // Clamp camera position within grid bounds (with some margin for the walls)
        const margin = 2; // Keep camera a bit away from walls
        targetPos.x = Math.max(controls.minX + margin, Math.min(controls.maxX - margin, targetPos.x));
        targetPos.y = Math.max(controls.minY + margin, Math.min(controls.maxY - margin, targetPos.y));
        targetPos.z = Math.max(controls.minZ + margin, Math.min(controls.maxZ - margin, targetPos.z));
        
        // Apply smoothing
        const currentPos = this.camera.position;
        currentPos.lerp(targetPos, controls.damping);
        
        // Look at target
        this.camera.lookAt(controls.targetX, controls.targetY, controls.targetZ);
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Calculate delta time for frame-rate independent animation
        const now = performance.now() * 0.001;
        const deltaTime = now - (this.lastAnimationTime || now);
        this.lastAnimationTime = now;
          this.analyzeAudio();
        this.updateFerrofluid();
        this.updateFloatingBlobs(deltaTime);
        this.updateLighting();
        this.updateAutomaticCameraMovement(deltaTime);
        this.updateCameraPosition();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
        }
          // Clean up floating blobs
        if (this.floatingBlobs) {
            this.floatingBlobs.forEach(blobData => {
                this.scene.remove(blobData.mesh);
                blobData.mesh.geometry.dispose();
                blobData.mesh.material.dispose();
            });
            this.floatingBlobs = [];
        }

        // Clean up inner ferrofluid sphere
        if (this.ferrofluidInner) {
            this.scene.remove(this.ferrofluidInner);
            this.ferrofluidInner.geometry.dispose();
            this.ferrofluidInner.material.dispose();
        }
        
        this.renderer.dispose();
    }
    
    // BPM Detection method
    detectBPM() {
        const now = performance.now();
        const totalIntensity = this.bassIntensity + this.midIntensity + this.highIntensity;
        
        // Detect beat based on bass intensity threshold
        if (this.bassIntensity > this.bpmDetector.beatThreshold) {
            const timeSinceLastBeat = now - this.bpmDetector.lastBeatTime;
            
            // Avoid detecting multiple beats too close together (minimum 300ms between beats = 200 BPM max)
            if (timeSinceLastBeat > 300) {
                this.bpmDetector.peaks.push(now);
                this.bpmDetector.lastBeatTime = now;
                
                // Remove old peaks outside analysis window
                const windowStart = now - this.bpmDetector.analysisWindow;
                this.bpmDetector.peaks = this.bpmDetector.peaks.filter(peak => peak > windowStart);
                
                // Calculate BPM if we have enough peaks
                if (this.bpmDetector.peaks.length >= 4) {
                    this.calculateBPM();
                }
            }
        }
    }

    calculateBPM() {
        if (this.bpmDetector.peaks.length < 4) return;
        
        // Calculate intervals between consecutive beats
        const intervals = [];
        for (let i = 1; i < this.bpmDetector.peaks.length; i++) {
            intervals.push(this.bpmDetector.peaks[i] - this.bpmDetector.peaks[i - 1]);
        }
        
        // Remove outliers (intervals that are too different from the median)
        intervals.sort((a, b) => a - b);
        const median = intervals[Math.floor(intervals.length / 2)];
        const filteredIntervals = intervals.filter(interval => 
            Math.abs(interval - median) < median * 0.3 // Within 30% of median
        );
        
        if (filteredIntervals.length < 2) return;
        
        // Calculate average interval
        const avgInterval = filteredIntervals.reduce((sum, interval) => sum + interval, 0) / filteredIntervals.length;
        
        // Convert to BPM (60000 ms = 1 minute)
        const calculatedBPM = Math.round(60000 / avgInterval);
          // Validate BPM range
        if (calculatedBPM >= this.bpmDetector.minBpm && calculatedBPM <= this.bpmDetector.maxBpm) {
            this.bpmDetector.bpm = calculatedBPM;
            document.getElementById('track-bpm').textContent = calculatedBPM.toString();
        }
    }
}

// --- Enhanced Debug Info Panel with Text Decoding Animation ---
(function() {
    const debugPanel = document.getElementById('debug-info-panel');
    if (!debugPanel) return;
    const MAX_LINES = 40;
    let debugBuffer = [];
    let decodingLines = []; // Track lines that are currently decoding
    let animationFrame = null;
      // Characters used for encoding/scrambling
    const ENCODING_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?~`';
    const DECODE_SPEED = 25; // milliseconds between decode steps (faster: was 50)
    const CHARS_PER_STEP = 4; // how many characters to decode per step (faster: was 2)

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
            isDecoding: true
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
    
    function animateDecoding() {
        let anyDecoding = false;
        
        decodingLines.forEach(line => {
            if (line.isDecoding) {
                decodeStep(line);
                if (line.isDecoding) {
                    anyDecoding = true;
                }
            }
        });
        
        // Update display with current state of all lines
        updateDecodedDisplay();
        
        if (anyDecoding) {
            animationFrame = setTimeout(animateDecoding, 16); // ~60fps for smooth animation
        } else {
            animationFrame = null;
        }
    }
    
    function updateDecodedDisplay() {
        const displayLines = decodingLines.map(line => line.current);
        const filtered = displayLines.filter(line => isTextLine(line));
        debugPanel.textContent = filtered.length ? filtered.join('\n') : 'Initializing info panel...';
    }
      function addEncodedLine(text) {
        // Check if decoding is enabled
        if (!window.debugEncodingSettings || !window.debugEncodingSettings.enabled) {
            // Add directly without encoding when disabled
            debugBuffer.push(text);
            if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
            updateDebugPanel();
            return;
        }
        
        const decodingLine = createDecodingLine(text, decodingLines.length);
        decodingLines.push(decodingLine);
        
        // Keep only MAX_LINES
        if (decodingLines.length > MAX_LINES) {
            decodingLines = decodingLines.slice(-MAX_LINES);
        }
        
        // Start animation if not already running
        if (!animationFrame) {
            animateDecoding();
        }
    }
    
    function updateDebugPanel() {
        // This function is now mainly for immediate display without encoding
        const filtered = debugBuffer.filter(isTextLine);
        debugPanel.textContent = filtered.length ? filtered.join('\n') : 'Initializing info panel...';
    }    
    // Patch console.log to use the decoding animation
    const origLog = console.log;
    console.log = function(...args) {
        const cleanArgs = args.map(formatArg);
        const text = cleanArgs.join(' ');
        
        // Add to both buffers for fallback
        debugBuffer.push(text);
        if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
        
        // Add encoded line that will decode over time
        addEncodedLine(text);
        
        origLog.apply(console, args);
    };
    
    // Also patch console.warn and console.error for completeness
    const origWarn = console.warn;
    console.warn = function(...args) {
        const cleanArgs = args.map(formatArg);
        const text = '[WARN] ' + cleanArgs.join(' ');
        
        debugBuffer.push(text);
        if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
        
        addEncodedLine(text);
        
        origWarn.apply(console, args);
    };
    
    const origErr = console.error;
    console.error = function(...args) {
        const cleanArgs = args.map(formatArg);
        const text = '[ERROR] ' + cleanArgs.join(' ');
        
        debugBuffer.push(text);
        if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
          addEncodedLine(text);
        
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
                'Decoding animation: ENABLED' : 
                'Decoding animation: DISABLED';
            
            if (window.debugEncodingSettings.enabled) {
                addEncodedLine(toggleMessage);
            } else {
                // Add without encoding when disabled
                debugBuffer.push(toggleMessage);
                if (debugBuffer.length > MAX_LINES) debugBuffer = debugBuffer.slice(-MAX_LINES);
                updateDebugPanel();
            }
        },
        clear: function() {
            // Clear and restart all decoding
            decodingLines = [];
            debugBuffer = [];
            addEncodedLine('Console cleared and reset');
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

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FerrofluidVisualizer();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.visualizer) {
        window.visualizer.destroy();
    }
});

// --- UI Initialization for Environment Controls ---
// This functionality is now handled by the initializeUIValues method in the FerrofluidVisualizer class
